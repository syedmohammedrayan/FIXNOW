'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, X, Send, MinusCircle, Mic, Sparkles, 
  Wrench, Shield, MessageSquare, Zap, 
  Settings, User, Terminal, List, CheckCircle2
} from 'lucide-react';
import axios from 'axios';
// @ts-ignore
import { API_BASE } from '@/lib/config';
import { cn } from '@/lib/utils';

type Message = {
  sender: 'bot' | 'user';
  text: string;
  action?: string;
  data?: any;
  timestamp: Date;
};

const StreamingText = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 15); // Faster typing
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayedText}</span>;
};

const RoleIcon = ({ role }: { role: string }) => {
  if (role === 'technician') return <Terminal className="w-4 h-4 text-cyan-400" />;
  return <Sparkles className="w-4 h-4 text-indigo-400" />;
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
  const [messages, setMessages] = useState<Message[]>([
    { 
      sender: 'bot', 
      text: role === 'customer' 
        ? "Systems online. I am your FIXNOW concierge. How can I facilitate your service request today?" 
        : "Operational Protocol Active. Senior Technical Assistant ready. Report your diagnostic query.",
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e?: React.FormEvent, manualText?: string) => {
    if (e) e.preventDefault();
    const textToSend = manualText || input;
    if (!textToSend.trim()) return;

    const newUserMsg: Message = { sender: 'user', text: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await axios.post(
        `${API_BASE}/api/ai/chat`,
        { message: textToSend, role, userId: userId || 'anonymous' },
        { timeout: 30000 }
      );

      setMessages(prev => [
        ...prev,
        { 
          sender: 'bot', 
          text: res.data.reply, 
          action: res.data.action, 
          data: res.data.data,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: 'System Link Failure. Latency detected in AI Core. Please re-initialize.', 
        timestamp: new Date() 
      }]);
    } finally {
      setIsTyping(false);
    }
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
        whileHover={{ scale: 1.1, boxShadow: "0 0 25px rgba(79, 70, 229, 0.6)" }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] cursor-pointer transition-all border-2 border-white/30 backdrop-blur-2xl pointer-events-auto",
          role === 'customer' ? "bg-indigo-600/90" : "bg-teal-600/90"
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
              "w-[calc(100vw-2rem)] sm:w-[380px] bg-slate-950/95 backdrop-blur-2xl rounded-[2rem] sm:rounded-[2.5rem] flex flex-col shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden border border-white/20 pointer-events-auto mb-2",
              isMinimized ? "h-16 sm:h-20" : "h-[70vh] sm:h-[600px]"
            )}
          >
            {/* Header */}
            <div 
              className={cn(
                "p-5 flex justify-between items-center cursor-pointer border-b border-white/5",
                role === 'customer' ? "bg-indigo-600/20" : "bg-teal-600/20"
              )}
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Bot className={cn("w-5 h-5", role === 'customer' ? "text-indigo-400" : "text-teal-400")} />
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
                <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
                  {messages.map((msg, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn("flex flex-col", msg.sender === 'user' ? 'items-end' : 'items-start')}
                    >
                      <div className={cn(
                        "max-w-[90%] p-4 rounded-3xl text-xs font-medium leading-relaxed shadow-lg",
                        msg.sender === 'user' 
                          ? "bg-indigo-600 text-white rounded-tr-none border border-white/10" 
                          : "bg-white/5 text-slate-200 rounded-tl-none border border-white/5 backdrop-blur-sm"
                      )}>
                        {msg.sender === 'bot' && i === messages.length - 1 ? (
                          <StreamingText text={msg.text} />
                        ) : (
                          msg.text
                        )}
                        
                        {msg.action && (
                          <div className="mt-3 p-3 bg-black/40 border border-white/10 rounded-2xl flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">{msg.action.replace(/_/g, ' ')}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1.5 px-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <div className="flex items-center gap-2 px-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
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
                      key={i}
                      onClick={() => handleSend(undefined, action.label)}
                      className="whitespace-nowrap flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                </div>

                {/* Input Area */}
                <form 
                  onSubmit={handleSend} 
                  className="p-6 bg-slate-950 border-t border-white/5 flex gap-3 items-center"
                >
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={input} 
                      onChange={(e) => setInput(e.target.value)} 
                      placeholder={role === 'customer' ? "Report an issue..." : "Diagnostic query..."}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
                    />
                    <button 
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-indigo-400 transition-colors"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit" 
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all",
                      role === 'customer' ? "bg-indigo-600 shadow-indigo-600/20" : "bg-teal-600 shadow-teal-600/20"
                    )}
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
