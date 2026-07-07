import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, X, Send, Loader2, Users } from 'lucide-react';

interface CommunityAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function CommunityAssistant({ isOpen, onClose }: CommunityAssistantProps) {
  const GREETING = `Hi! I'm your **Arthneeti Community Assistant**. I help with:

- **Discussing** financial topics and economic concepts
- **Answering** questions about Nepal's economy and markets
- **Explaining** investment terms and strategies
- **Guiding** you to relevant resources

What would you like to discuss today?`;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [manualKey, setManualKey] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiKeyRef = useRef<string | null>(null);
  const fallbackKeyRef = useRef<string | null>(null);
  const activeProviderRef = useRef<'cerebras' | 'nvidia'>('cerebras');

  // Initialize API keys with fallback logic
  useEffect(() => {
    const cerebrasKey = import.meta.env.VITE_CEREBRAS_API_KEY;
    const nvidiaKey = import.meta.env.VITE_NVIDIA_API_KEY;
    
    const hasCerebras = cerebrasKey && cerebrasKey.length > 10;
    const hasNvidia = nvidiaKey && nvidiaKey.length > 10;
    
    if (hasCerebras && hasNvidia) {
      // Both available - prefer Cerebras, NVIDIA as fallback
      apiKeyRef.current = cerebrasKey;
      fallbackKeyRef.current = nvidiaKey;
      activeProviderRef.current = 'cerebras';
      setError(null);
    } else if (hasCerebras) {
      // Only Cerebras available
      apiKeyRef.current = cerebrasKey;
      activeProviderRef.current = 'cerebras';
      setError(null);
    } else if (hasNvidia) {
      // Only NVIDIA available
      apiKeyRef.current = nvidiaKey;
      activeProviderRef.current = 'nvidia';
      setError(null);
    } else {
      // No keys available
      setError('No API key available. Add VITE_CEREBRAS_API_KEY or VITE_NVIDIA_API_KEY to your .env file.');
    }
  }, []);

  const handleManualKeySubmit = () => {
    if (manualKey.trim().length > 10) {
      apiKeyRef.current = manualKey.trim();
      setError(null);
      setShowKeyInput(false);
      // Detect if it's Cerebras or NVIDIA based on prefix
      if (manualKey.startsWith('csk-')) {
        activeProviderRef.current = 'cerebras';
      } else {
        activeProviderRef.current = 'nvidia';
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const buildSystemPrompt = () => {
    return `You are "Arthneeti Community Assistant", a friendly and knowledgeable AI helper for the Arthneeti financial literacy community in Nepal.

YOUR ROLE:
- Help users understand financial concepts, economic terms, and investment basics
- Discuss topics related to Nepal's economy, NEPSE stock market, and financial policies
- Answer questions about saving, budgeting, banking, and personal finance
- Guide users to relevant Arthneeti resources when appropriate

RULES:
- Be conversational, friendly, and encouraging
- Use simple language that students can understand
- When discussing investments, always remind users this is for educational purposes only
- If asked about specific stock recommendations, explain that you cannot provide financial advice
- Keep responses concise but informative
- Use markdown formatting for clarity (bold, bullet points, etc.)

ABOUT ARTHNEETI:
Arthneeti is a student-led initiative building financial literacy among Nepal's youth through workshops, curriculum, and digital resources.`;
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

    const tryCerebras = async (): Promise<string> => {
      const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKeyRef.current}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b",
          messages: [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: userMsg }
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      });
      if (!res.ok) {
        const errData = await res.json() as any;
        throw new Error(errData.error?.message || "Cerebras failed");
      }
      const data = await res.json() as any;
      return data.choices[0].message.content;
    };

    const tryNvidia = async (): Promise<string> => {
      const nvidiaKey = fallbackKeyRef.current;
      if (!nvidiaKey) throw new Error("No NVIDIA API key available as fallback");
      
      const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${nvidiaKey}`
        },
        body: JSON.stringify({
          model: "nvidia/llama-3.3-nemotron-super-49b-v1",
          messages: [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: userMsg }
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      });
      if (!res.ok) {
        const errData = await res.json() as any;
        throw new Error(errData.error?.message || "NVIDIA failed");
      }
      const data = await res.json() as any;
      return data.choices[0].message.content;
    };

    try {
      let responseText: string;
      
      if (activeProviderRef.current === 'cerebras') {
        try {
          responseText = await tryCerebras();
        } catch (cerebrasErr) {
          console.warn("Cerebras failed, trying NVIDIA fallback:", cerebrasErr);
          responseText = await tryNvidia();
        }
      } else {
        try {
          responseText = await tryNvidia();
        } catch (nvidiaErr) {
          console.warn("NVIDIA failed, trying Cerebras fallback:", nvidiaErr);
          responseText = await tryCerebras();
        }
      }

      setMessages(prev => [...prev, { role: 'model', content: responseText }]);
    } catch (err) {
      console.error("Community Assistant Error:", err);
      const raw = err instanceof Error ? err.message : String(err);
      setMessages(prev => [...prev, { role: 'model', content: `⚠️ Error: ${raw}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[600px] flex flex-col overflow-hidden border border-blush-mist"
      >
        {/* Header */}
        <div className="p-4 border-b border-blush-mist bg-sunset-fade/30 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1D9E75] to-[#0F6E56] flex items-center justify-center">
              <Users className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-brandwood font-sans">Community Assistant</h3>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                {activeProviderRef.current === 'cerebras' ? 'Powered by Cerebras' : 'Powered by NVIDIA'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-coral-flame transition-colors p-2">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-amber-50 text-amber-800 p-3 text-xs font-sans border-b border-amber-200">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 mt-0.5">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold mb-1">API Key Required</p>
                <p className="text-amber-700">{error}</p>
                {!showKeyInput ? (
                  <button 
                    onClick={() => setShowKeyInput(true)}
                    className="mt-2 text-amber-900 underline hover:text-amber-950 font-medium"
                  >
                    Enter API key manually
                  </button>
                ) : (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="password"
                      value={manualKey}
                      onChange={(e) => setManualKey(e.target.value)}
                      placeholder="Paste your API key (csk-... or nvapi-...)"
                      className="flex-1 px-2 py-1 border border-amber-300 rounded text-amber-900 text-xs"
                    />
                    <button 
                      onClick={handleManualKeySubmit}
                      className="px-2 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700"
                    >
                      Use
                    </button>
                  </div>
                )}
                <p className="mt-2 text-amber-600">
                  Or get a free key from: <a href="https://cloud.cerebras.ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-900">cloud.cerebras.ai</a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Greeting */}
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl p-4 font-sans text-[13px] leading-relaxed shadow-sm bg-sunset-fade/30 text-brandwood rounded-bl-sm border border-blush-mist">
              <div className="flex items-center gap-2 mb-2 text-[#1D9E75]">
                <MessageSquare size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Community Helper</span>
              </div>
              <div dangerouslySetInnerHTML={{ __html: GREETING.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
            </div>
          </div>

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 font-sans text-[13px] leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[#1D9E75] text-white rounded-br-sm' 
                  : 'bg-sunset-fade/30 text-brandwood rounded-bl-sm border border-blush-mist'
              }`}>
                {msg.role === 'model' && (
                  <div className="flex items-center gap-2 mb-2 text-[#1D9E75]">
                    <MessageSquare size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Community Helper</span>
                  </div>
                )}
                <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-sunset-fade/30 text-brandwood rounded-2xl p-4 rounded-bl-sm border border-blush-mist text-xs flex items-center gap-2">
                <Loader2 className="animate-spin text-[#1D9E75]" size={14} />
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-blush-mist bg-white">
          <div className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about finance, economy, or investing..." 
              className="w-full bg-sunset-fade/20 border border-blush-mist rounded-xl px-4 py-3 pr-12 text-brandwood font-sans text-sm focus:outline-none focus:border-[#1D9E75] transition-colors placeholder:text-text-muted/60"
              disabled={!apiKeyRef.current || isTyping}
            />
            <button 
              type="submit"
              disabled={!input.trim() || !apiKeyRef.current || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#1D9E75] text-white flex items-center justify-center hover:bg-[#0F6E56] transition-colors disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
