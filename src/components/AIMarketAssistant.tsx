import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MarketSummary, TopStocks, MarketIndex } from '../lib/nepseApi';
import { Portfolio } from '../lib/tradingApi';
import { Brain, X, Loader2, Send, Sparkles } from 'lucide-react';

interface AIMarketAssistantProps {
  summary: MarketSummary | null;
  topStocks: TopStocks | null;
  indices: MarketIndex[];
  marketOpen: boolean | null;
  portfolio?: Portfolio | null;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function AIMarketAssistant({
  summary,
  topStocks,
  indices,
  marketOpen,
  portfolio
}: AIMarketAssistantProps) {
  const GREETING = `Hi! I'm Arthneeti AI, your market intelligence assistant. \n\n**Disclaimer**: I am an AI, and my responses are for educational purposes only. I do not provide financial advice, and you should not make buy or sell decisions based solely on my analysis. \n\nHow can I help you analyze the market today?`;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiKeyRef = useRef<string | null>(null);

  // Initialize Gemini API
  useEffect(() => {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (geminiKey && geminiKey.length > 10) {
      apiKeyRef.current = geminiKey;
    } else {
      setError(`No API key available. Set VITE_GEMINI_API_KEY in your .env file.`);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isTyping, isOpen]);

  const buildSystemPrompt = () => {
    let prompt = `You are "Arthneeti AI", an expert financial analyst and market intelligence assistant specializing in the Nepal Stock Exchange (NEPSE).\n\n`;
    
    prompt += `IMPORTANT RULES:\n`;
    prompt += `- NEVER provide direct financial advice to buy or sell a specific stock.\n`;
    prompt += `- ALWAYS remind the user that you are an AI and they should do their own research if they ask for investment recommendations.\n`;
    prompt += `- Answer concisely. Format your answers clearly using markdown.\n\n`;

    if (portfolio) {
      prompt += `USER PORTFOLIO (Virtual Trading League):\n`;
      prompt += `- Cash Balance: Rs. ${portfolio.cash.toLocaleString()}\n`;
      prompt += `- Starting Capital: Rs. ${portfolio.startingCapital.toLocaleString()}\n`;
      prompt += `- Current Holdings:\n`;
      const holdingsEntries = Object.entries(portfolio.holdings);
      if (holdingsEntries.length === 0) {
        prompt += `  * No active holdings yet.\n`;
      } else {
        holdingsEntries.forEach(([sym, pos]) => {
          prompt += `  * ${sym}: ${pos.qty} shares (Avg Cost: Rs. ${pos.avgCost.toFixed(2)})\n`;
        });
      }
      prompt += `Note: reference their holdings and stats if they ask questions about what stocks they own or how their portfolio is doing.\n\n`;
    }

    prompt += `CURRENT LIVE MARKET CONTEXT:\n`;
    prompt += `Market Status: ${marketOpen ? 'OPEN' : 'CLOSED'}\n`;
    
    if (summary) {
      prompt += `Total Turnover: Rs. ${summary.total_turnover.toLocaleString()}\n`;
      prompt += `Total Transactions: ${summary.total_transactions.toLocaleString()}\n`;
    }
    
    if (indices && indices.length > 0) {
      const nepse = indices.find(i => i.index.toUpperCase() === 'NEPSE');
      if (nepse) {
        prompt += `NEPSE Index: ${nepse.close} (Change: ${nepse.change}, ${nepse.percentChange}%)\n`;
      }
      prompt += `Sector Indices:\n`;
      indices.slice(1, 6).forEach(i => {
        prompt += `- ${i.index}: ${i.close} (${i.percentChange}%)\n`;
      });
    }

    if (topStocks) {
      prompt += `\nTop Gainers:\n`;
      topStocks.top_gainers.slice(0, 3).forEach(s => prompt += `- ${s.symbol}: Rs ${s.ltp} (+${s.percentChange}%)\n`);
      
      prompt += `\nTop Losers:\n`;
      topStocks.top_losers.slice(0, 3).forEach(s => prompt += `- ${s.symbol}: Rs ${s.ltp} (${s.percentChange}%)\n`);
      
      prompt += `\nTop Turnover:\n`;
      topStocks.top_turnover.slice(0, 3).forEach(s => prompt += `- ${s.symbol}: Rs ${s.turnover.toLocaleString()}\n`);
    }

    prompt += `\nUse this live context to answer the user's questions about today's market.`;
    return prompt;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !apiKeyRef.current) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    const systemPrompt = buildSystemPrompt();
    
    const history = messages.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.content
    }));

    const callGemini = async (): Promise<string> => {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeyRef.current}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              ...history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
              })),
              { role: 'user', parts: [{ text: userMsg }] }
            ],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2048
            }
          })
        }
      );
      if (!res.ok) {
        const errData = await res.json() as any;
        throw new Error(errData.error?.message || "Gemini API failed");
      }
      const data = await res.json() as any;
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    };

    try {
      const responseText = await callGemini();
      setMessages(prev => [...prev, { role: 'model', content: responseText }]);
      if (!isOpen) setHasNewMessage(true);
    } catch (err) {
      console.error("AI Assistant Error:", err);
      const raw = err instanceof Error ? err.message : String(err);
      setMessages(prev => [...prev, { role: 'model', content: `⚠️ Error: ${raw}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Widget */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
        
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white/95 backdrop-blur-xl border border-blush-mist rounded-2xl shadow-2xl w-[350px] md:w-[400px] h-[500px] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-blush-mist flex justify-between items-center bg-white/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-emerald flex items-center justify-center">
                    <Brain size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-brandwood font-bold font-sans text-sm">Market Intelligence</h3>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Powered by Gemini AI</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-brand-emerald transition-colors">
                  <X size={24} />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-brand-emerald p-3 text-xs font-sans border-b border-red-100">
                  {error}
                </div>
              )}

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {/* Greeting */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl p-3 font-sans text-[13px] leading-relaxed shadow-sm bg-white/30 text-brandwood rounded-bl-sm border border-blush-mist">
                    <div dangerouslySetInnerHTML={{ __html: GREETING.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                  </div>
                </div>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 font-sans text-[13px] leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-brandwood text-white rounded-br-sm' 
                        : 'bg-white/30 text-brandwood rounded-bl-sm border border-blush-mist'
                    }`}>
                      <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/30 text-brandwood rounded-2xl p-3 rounded-bl-sm border border-blush-mist text-xs flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Analyzing data...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-blush-mist bg-white">
                <div className="relative">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about NEPSE..." 
                    className="w-full bg-white/20 border border-blush-mist rounded-xl px-4 py-2.5 pr-12 text-brandwood font-sans text-sm focus:outline-none focus:border-brand-emerald transition-colors placeholder:text-text-muted/60"
                    disabled={!apiKeyRef.current || isTyping}
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim() || !apiKeyRef.current || isTyping}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-brand-emerald text-white flex items-center justify-center hover:bg-brand-emerald/90 transition-colors disabled:opacity-50"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trigger Button - using Arthneeti text as requested */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group bg-white border border-blush-mist px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:border-brand-emerald/30 transition-all duration-300 flex items-center gap-2"
        >
          {hasNewMessage && !isOpen && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-emerald rounded-full animate-ping" />
          )}
          {hasNewMessage && !isOpen && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-emerald rounded-full" />
          )}
          <Sparkles size={24} className="text-brand-emerald group-hover:rotate-12 transition-transform" />
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-black text-brandwood tracking-widest transition-colors group-hover:text-brand-emerald">ARTHNEETI</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-emerald-light bg-brand-emerald-light/10 px-2 py-0.5 rounded-full">AI</span>
          </div>
        </button>

      </div>
    </>
  );
}
