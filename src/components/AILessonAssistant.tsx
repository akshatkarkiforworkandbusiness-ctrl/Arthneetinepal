import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Brain, X, Sparkles, Loader2, Send } from 'lucide-react';

interface AILessonAssistantProps {
  lessonTitle: string;
  lessonSummary: string;
  lessonFaqs?: { question: string; answer: string }[];
  lessonQuizzes?: { question: string; options: string[]; correctIndex: number }[];
  isOpen: boolean;
  onClose: () => void;
  lessonTag?: string;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function AILessonAssistant({
  lessonTitle,
  lessonSummary,
  lessonFaqs,
  lessonQuizzes,
  isOpen,
  onClose,
  lessonTag
}: AILessonAssistantProps) {
  const GREETING = `Hi! I'm your AI Tutor for the lesson **"${lessonTitle}"**. I have read the summary, FAQs, and quizzes for this lesson. What would you like to know or discuss?`;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiKeyRef = useRef<string | null>(null);

  // Initialize Cerebras API
  useEffect(() => {
    const cerebrasKey = import.meta.env.VITE_CEREBRAS_API_KEY;
    
    if (cerebrasKey && cerebrasKey.length > 10) {
      apiKeyRef.current = cerebrasKey;
      console.log("[AI Tutor] Cerebras key loaded, length:", cerebrasKey.length);
    } else {
      console.warn("[AI Tutor] No Cerebras key found. VITE_CEREBRAS_API_KEY =", cerebrasKey);
      setError(`No API key available. Set VITE_CEREBRAS_API_KEY in your .env file.`);
    }
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Construct the "System Instruction" dynamically based on the lesson
  const buildSystemPrompt = () => {
    let prompt = `You are an expert AI tutor for Arthneeti, specifically helping a student understand the lesson: "${lessonTitle}".\n\n`;
    prompt += `LESSON SUMMARY:\n${lessonSummary}\n\n`;
    
    if (lessonFaqs && lessonFaqs.length > 0) {
      prompt += `FREQUENTLY ASKED QUESTIONS:\n`;
      lessonFaqs.forEach(faq => {
        prompt += `Q: ${faq.question}\nA: ${faq.answer}\n\n`;
      });
    }

    if (lessonQuizzes && lessonQuizzes.length > 0) {
      prompt += `LESSON QUIZZES (Use this to test the student if they ask for a quiz):\n`;
      lessonQuizzes.forEach(quiz => {
        const correctAnswer = quiz.options[quiz.correctIndex];
        prompt += `Q: ${quiz.question}\nA: ${correctAnswer}\n\n`;
      });
    }

    prompt += `INSTRUCTIONS:\n`;
    prompt += `- Answer the student's questions using ONLY the information provided above.\n`;
    prompt += `- If they ask something unrelated to finance, economics, or this lesson, politely guide them back to the topic.\n`;
    prompt += `- Be encouraging, clear, and act as a professional financial tutor.\n`;
    prompt += `- Do not reveal that you are reading from a prompt. Act natural.\n`;

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
    
    const historyOpenAI = messages.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.content
    }));

    const callCerebras = async (): Promise<string> => {
      const res = await fetch(
        `https://api.cerebras.ai/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKeyRef.current}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b",
            messages: [
              { role: "system", content: systemPrompt },
              ...historyOpenAI.map(msg => ({
                role: msg.role,
                content: msg.content
              })),
              { role: "user", content: userMsg }
            ],
            temperature: 0.2,
            max_tokens: 2048
          })
        }
      );
      if (!res.ok) {
        const errData = await res.json() as any;
        throw new Error(errData.error?.message || "Cerebras API failed");
      }
      const data = await res.json() as any;
      return data.choices?.[0]?.message?.content || "No response generated.";
    };

    try {
      const responseText = await callCerebras();
      setMessages(prev => [...prev, { role: 'model', content: responseText }]);
    } catch (err) {
      console.error("AI Assistant Error:", err);
      const raw = err instanceof Error ? err.message : String(err);
      setMessages(prev => [...prev, { role: 'model', content: `⚠️ Error: ${raw}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-full md:w-[400px] bg-[#0B0F19]/95 backdrop-blur-xl border-l border-brandwood/20 z-[100] shadow-2xl flex flex-col transform transition-transform duration-300">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#090a0b]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-emerald to-brandwood flex items-center justify-center">
            <Brain size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-display font-medium">Arthneeti AI Tutor</h3>
            <p className="text-xs text-[#5DCAA5]">Powered by Cerebras AI</p>
          </div>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/20 text-red-200 p-4 text-xs font-sans border-b border-red-500/30">
          {error}
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
        {/* Greeting */}
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl p-4 font-sans text-sm bg-white/5 text-white/90 rounded-bl-sm border border-white/10">
            <div className="flex items-center gap-2 mb-2 text-brandwood">
              <Sparkles size={14} className="text-brandwood" />
              <span className="text-[10px] font-bold uppercase tracking-widest">AI Tutor</span>
            </div>
            <div dangerouslySetInnerHTML={{ __html: GREETING.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
          </div>
        </div>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 font-sans text-sm ${
              msg.role === 'user' 
                ? 'bg-brandwood text-white rounded-br-sm' 
                : 'bg-white/5 text-white/90 rounded-bl-sm border border-white/10'
            }`}>
              {msg.role === 'model' && (
                <div className="flex items-center gap-2 mb-2 text-brandwood">
                  <Sparkles size={14} className="text-brandwood" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">AI Tutor</span>
                </div>
              )}
              {/* Basic markdown rendering */}
              <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/5 text-white/50 rounded-2xl p-4 rounded-bl-sm border border-white/10 text-xs flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Analyzing lesson...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* CTA Section */}
      {(lessonTag === 'Stock Market' || lessonTag === 'Technical Analysis') && (
        <div className="mx-4 mb-4 p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-white uppercase tracking-wider">Test it in real life!</p>
            <p className="text-[10px] text-[#9f9fa0] mt-0.5 leading-relaxed">Try virtual trading this in your paper portfolio.</p>
          </div>
          <Link 
            to="/trade-game" 
            onClick={onClose}
            className="px-4 py-2 bg-[#dc143c] hover:bg-[#b01030] text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors shrink-0"
          >
            Go to Trade
          </Link>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-[#090a0b]">
        <div className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this lesson..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white font-sans text-sm focus:outline-none focus:border-brandwood transition-colors placeholder:text-white/30"
            disabled={!apiKeyRef.current || isTyping}
          />
          <button 
            type="submit"
            disabled={!input.trim() || !apiKeyRef.current || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-brandwood text-white flex items-center justify-center hover:bg-brandwood/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
