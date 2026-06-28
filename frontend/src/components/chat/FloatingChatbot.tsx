'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, X, Send, MinusCircle, Mic, Sparkles,
  Wrench, Shield, MessageSquare, Zap,
  Settings, User, Terminal, List, CheckCircle2,
  Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

const RoleIcon = ({ role }: { role: string }) => {
  if (role === 'technician') return <Terminal className="w-4 h-4 text-cyan-400" />;
  return <Sparkles className="w-4 h-4 text-white" />;
};

export default function FloatingChatbot({
  role = 'customer',
  userId
}: {
  role?: 'customer' | 'technician',
  userId?: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionId] = useState(() => uuidv4());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [localInput, setLocalInput] = useState('');

  const defaultWelcome = {
    id: 'welcome',
    role: 'assistant' as const,
    content: role === 'customer'
      ? "Systems online. I am your FIXNOW concierge. How can I facilitate your service request today?"
      : "Operational Protocol Active. Senior Technical Assistant ready. Report your diagnostic query."
  };

  const [messages, setMessages] = useState<any[]>([defaultWelcome]);
  const [isLoading, setIsLoading] = useState(false);

  // 2. Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`chat_history_${role}`);
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    } catch (e) { }
  }, [role, setMessages]);

  // 3. Save to localStorage when messages change
  useEffect(() => {
    if (messages.length > 1) { // Don't just save the default welcome
      localStorage.setItem(`chat_history_${role}`, JSON.stringify(messages));
    }
    scrollToBottom();
  }, [messages, role, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const submitMessage = async (text: string) => {
    try {
      setIsLoading(true);
      const userMsg = { id: uuidv4(), role: 'user', content: text };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          userId,
          sessionId,
          messages: updatedMessages,
        }),
      });

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: data.reply || "No response received.",
        },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (text: string) => {
    await submitMessage(text);
  };

  const quickActions = role === 'customer'
    ? [
      { label: 'Book Electrician', icon: <Zap className="w-3 h-3" /> },
      { label: 'Fix Leaking Pipe', icon: <Wrench className="w-3 h-3" /> },
      { label: 'Price Estimate', icon: <Shield className="w-3 h-3" /> }
    ]
    : [
      { label: 'AC Diagnostics', icon: <Terminal className="w-3 h-3" /> },
      { label: 'Safety Protocol', icon: <Shield className="w-3 h-3" /> },
      { label: 'Inventory Sync', icon: <List className="w-3 h-3" /> }
    ];

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[99999] flex flex-col-reverse items-end gap-4 pointer-events-none">
      <motion.button
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1, boxShadow: "0 0 25px rgba(255, 255, 255, 0.2)" }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl cursor-pointer transition-all border border-white/10 backdrop-blur-2xl pointer-events-auto",
          "bg-slate-900/95"
        )}
      >
        {isOpen ? (
          <X className="w-8 h-8 text-white" />
        ) : (
          <>
            <Bot className="w-8 h-8 text-white animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-bounce" />
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "w-[calc(100vw-2rem)] sm:w-[420px] bg-slate-900/95 backdrop-blur-3xl rounded-[2rem] sm:rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden border border-white/10 pointer-events-auto mb-2",
              isMinimized ? "h-16 sm:h-20" : "h-[70vh] sm:h-[650px]"
            )}
          >
            {/* Header */}
            <div
              className={cn(
                "p-5 flex justify-between items-center cursor-pointer border-b border-white/5 bg-white/5"
              )}
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                  <Bot className={cn("w-5 h-5", role === 'customer' ? "text-white" : "text-cyan-400")} />
                </div>
                <div>
                  <h3 className="font-black text-white text-[10px] uppercase tracking-[0.2em]">FIXNOW AI CORE</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Protocol {role === 'customer' ? 'Alpha' : 'Delta'} Active</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  <MinusCircle className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 p-6 overflow-y-auto space-y-6 chatbot-scrollbar">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn("flex flex-col", msg.role === 'user' ? 'items-end' : 'items-start')}
                    >
                      <div className={cn(
                        "max-w-[90%] p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-lg",
                        msg.role === 'user'
                          ? "bg-white text-slate-900 rounded-tr-none border border-white/10"
                          : "bg-white/5 text-slate-200 rounded-tl-none border border-white/5 backdrop-blur-sm prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-sm"
                      )}>
                        {msg.role === 'user' ? (
                          (msg as any).content || (msg as any).parts?.map((p: any) => p.text).join('')
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {(msg as any).content || (msg as any).parts?.map((p: any) => p.text).join('')}
                          </ReactMarkdown>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-2 px-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                      </div>
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Processing...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                <div className="px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar border-t border-white/5 bg-white/5">
                  {quickActions.map((action, i) => (
                    <button
                      key={`${action.label}-${i}`}
                      onClick={() => handleQuickAction(action.label)}
                      disabled={isLoading}
                      className="whitespace-nowrap flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                </div>

                {/* Input Area */}
                <form
                  ref={formRef}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!localInput.trim() || isLoading) return;

                    const text = localInput.trim();
                    setLocalInput(''); // Clear immediately
                    await submitMessage(text);
                  }}
                  className="p-6 bg-slate-950 border-t border-white/5 flex gap-3 items-center"
                >
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={localInput}
                      onChange={(e) => setLocalInput(e.target.value)}
                      disabled={isLoading}
                      placeholder={role === 'customer' ? "Report an issue..." : "Diagnostic query..."}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all font-medium disabled:opacity-50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (formRef.current) formRef.current.requestSubmit();
                        }
                      }}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: isLoading ? 1 : 1.05 }}
                    whileTap={{ scale: isLoading ? 1 : 0.95 }}
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      if (formRef.current) formRef.current.requestSubmit();
                    }}
                    type="button"
                    disabled={isLoading || !localInput.trim()}
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all",
                      isLoading || !localInput.trim()
                        ? "bg-white/10 text-white/30 cursor-not-allowed"
                        : "bg-white text-slate-900"
                    )}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </motion.button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
