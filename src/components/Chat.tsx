import React, { useState, useEffect, useRef } from 'react';
import * as DB from '../services/dbService';
import { Message, Conversation, Language } from '../types';
import { translateText } from '../services/translationService';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Languages, MoreVertical, Send, Plus, Smile, CheckCircle, Languages as LangIcon, Loader2, X } from 'lucide-react';
import { getLanguageByCode } from '../lib/languages';

function showFormattedError(error: any) {
  console.error("Chat Error:", error);
  // Using alert as a temporary fallback for user visibility if toast is not available
  if (typeof window !== 'undefined') {
    // alert(error.message || "An unexpected error occurred.");
  }
}

interface ChatProps {
  convId: string;
  role: 'creator' | 'joiner';
  myLang: Language;
  onBack: () => void;
  openQR: () => void;
}

export default function Chat({ convId, role, myLang, onBack, openQR }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [partnerLang, setPartnerLang] = useState<Language | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [roomExists, setRoomExists] = useState<boolean | 'checking'>('checking');
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      // 1. Get messages
      const msgs = await DB.getMessagesForConversation(convId);
      setMessages(msgs);

      // 2. Get conversation for partner lang and verification
      const data = await DB.getConversation(convId);
      if (data) {
        setRoomExists(true);

        // CRITICAL: If I am the joiner and my language isn't on the server yet, announce it
        if (role === 'joiner' && !data.joinerLang) {
          await DB.updateConversation(convId, { joinerLang: myLang.code });
        }

        const partnerCode = role === 'creator' ? data.joinerLang : data.creatorLang;
        if (partnerCode && partnerCode !== partnerLang?.code) {
          const lang = getLanguageByCode(partnerCode);
          if (lang) {
             setPartnerLang(lang);
          }
        }
      } else {
        // If we are the creator and it's missing, it's a critical error (shouldn't happen locally)
        // If we are joiner and it's missing, room doesn't exist yet in this DB
        setRoomExists(false);
      }
    } catch (err) {
      console.error("fetchData error:", err);
    }
  };

  useEffect(() => {
    fetchData();
    // Subscribe to local changes
    const unsubscribe = DB.subscribeToDB(() => fetchData());
    
    // Polling for multi-device sync (server is source of truth)
    const pollInterval = setInterval(() => {
      fetchData();
    }, 3000);

    return () => {
        unsubscribe();
        clearInterval(pollInterval);
    };
  }, [convId, role]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isTranslating) return;

    const text = inputText.trim();
    
    // Check if we still don't have a partner, try to get it from server
    let currentPartnerCode = partnerLang?.code;
    
    // Force a fresh check for partner if none found yet or if we're in the creator role
    // This ensures that as soon as a joiner enters, the next message sent by creator will be translated
    if (!currentPartnerCode || role === 'creator') {
        const data = await DB.getConversation(convId);
        if (data) {
            const freshPartnerCode = role === 'creator' ? data.joinerLang : data.creatorLang;
            if (freshPartnerCode && freshPartnerCode !== currentPartnerCode) {
                currentPartnerCode = freshPartnerCode;
                const lang = getLanguageByCode(freshPartnerCode);
                if (lang) setPartnerLang(lang);
            }
        }
    }

    const destLangCode = currentPartnerCode || myLang.code;
    console.log(`Sending message: role=${role}, from=${myLang.code}, to=${destLangCode}, partnerCode=${currentPartnerCode}`);
    
    setInputText('');
    setIsTranslating(true);

    try {
      // If we don't have a partner yet, translateText will return original since dest === myLang
      const translated = await translateText(text, myLang.code, destLangCode);

      await DB.addLocalMessage({
        convId,
        senderRole: role,
        original: text,
        translated: translated,
        fromLang: myLang.code,
        toLang: destLangCode
      });
      
      DB.broadcastChange(); // Alert other tabs
    } catch (error: any) {
      showFormattedError(error);
    } finally {
      setIsTranslating(false);
    }
  };

  const formatTime = (date: any) => {
    if (!date) return 'Sending...';
    try {
      const d = date instanceof Date ? date : new Date(date);
      // Fallback for Firebase Timestamps if any remnants exist (though they shouldn't)
      if ((date as any).toDate) return (date as any).toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (roomExists === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-bg-base">
        <Loader2 className="animate-spin text-primary mb-4" size={32} />
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Validating Session...</p>
      </div>
    );
  }

  if (roomExists === false) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-bg-base p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <X className="text-red-500" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-accent mb-2 uppercase">Room not found</h2>
        <p className="text-text-muted text-sm mb-8 max-w-xs">
          Sorry, did you type the right code? This session doesn't seem to exist on this device.
        </p>
        <button 
          onClick={onBack}
          className="bg-accent text-white px-8 py-3 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-black transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div id="chat-screen" className="flex flex-col h-screen bg-bg-base overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-bg-base transition-all active:scale-90">
            <ArrowLeft size={18} className="text-accent" />
          </button>
          <div className="flex flex-col">
            <h1 className="font-bold text-sm tracking-tight text-accent">Live Session</h1>
            <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest">{convId}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openQR} className="w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-bg-base transition-all">
            <Languages size={18} className="text-text-muted" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-bg-base transition-all">
            <MoreVertical size={18} className="text-text-muted" />
          </button>
        </div>
      </header>

      {/* Banner */}
      <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col items-center">
              <span className="text-xl">{myLang.flag}</span>
              <span className="text-[8px] font-bold text-text-muted uppercase">You</span>
            </div>
            <ArrowLeft className="text-border rotate-180" size={14} />
            <div className="flex flex-col items-center">
              <span className="text-xl">{partnerLang?.flag || '❓'}</span>
              <span className="text-[8px] font-bold text-text-muted uppercase">Partner</span>
            </div>
          </div>
          <div className="h-6 w-[1px] bg-border hidden sm:block"></div>
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-text-muted uppercase tracking-[0.2em] mb-0.5">
              {partnerLang ? 'Translation Active' : 'Waiting for Partner'}
            </span>
            <span className="text-accent font-bold text-[10px]">
                {partnerLang ? `${myLang.name} ↔ ${partnerLang.name}` : `You are ${myLang.name}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#F2F0E9] px-3 py-1.5 rounded-full border border-border">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
          <span className="text-text-muted text-[8px] font-bold uppercase tracking-widest">LibreTranslate</span>
        </div>
      </div>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-28">
        <div className="flex justify-center">
            <div className="bg-[#F2F0E9] border border-border px-4 py-1.5 rounded-full">
                <p className="text-text-muted font-bold text-[8px] uppercase tracking-[0.3em]">AI Engine Verified</p>
            </div>
        </div>

        {messages.map((msg, i) => {
          const isMe = msg.senderRole === role;
          
          // Determine if we need to show a special "auto-translated" state
          // if someone joins late and sees old messages in the wrong language
          const displayTranslated = msg.toLang === myLang.code ? msg.translated : msg.original;

          return (
            <motion.div 
              key={msg.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col gap-1.5 ${isMe ? 'items-end ml-auto' : 'items-start mr-auto'} max-w-[85%]`}
            >
              <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`flex flex-col natural-shadow border transition-all overflow-hidden ${
                  isMe ? 'bg-secondary text-white border-transparent rounded-2xl rounded-tr-none' : 'bg-bg-surface text-text-main border-border rounded-2xl rounded-tl-none'
                }`}>
                  <div className="px-3.5 py-2.5">
                    <p className="font-medium text-[13px] leading-snug">
                        {isMe ? msg.original : displayTranslated}
                    </p>
                  </div>

                  {/* Secondary/Original Language Label & Text - Only show if different */}
                  {msg.original !== displayTranslated && (
                  <div className={`px-3.5 py-2.5 border-t flex flex-col gap-1.5 ${isMe ? 'bg-black/10 border-white/10' : 'bg-bg-base/30 border-border/50'}`}>
                    <div className="flex items-center gap-2">
                       <span className={`text-[8px] font-black uppercase px-1 py-0.5 rounded leading-none ${isMe ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                          {isMe ? (partnerLang?.code || msg.toLang) : (getLanguageByCode(msg.fromLang)?.code || msg.fromLang)}
                       </span>
                       <div className={`h-[1px] flex-1 ${isMe ? 'bg-white/10' : 'bg-border/20'}`} />
                    </div>
                    <p className={`text-[11px] italic leading-snug ${isMe ? 'text-white/80' : 'text-text-muted'}`}>
                      {isMe ? msg.translated : msg.original}
                    </p>
                  </div>
                  )}
                </div>
                <div className="flex items-center gap-2 px-2">
                  <span className="text-[10px] font-medium text-text-muted">
                      {formatTime(msg.createdAt)}
                  </span>
                  {isMe && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={scrollRef} />
      </main>

      <div id="chat-input-container" className="fixed bottom-0 left-0 w-full bg-bg-base/80 backdrop-blur-md border-t border-border p-4 pb-8 z-50">
        <form onSubmit={handleSend} className="max-w-2xl mx-auto flex items-center gap-3">
          <button id="chat-attach-btn" type="button" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-border text-text-muted hover:bg-gray-50 transition-colors active:scale-95 shadow-sm shrink-0">
            <Plus size={20} />
          </button>
          <div className="relative flex-1">
            <input 
              id="message-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-12 bg-white border border-border rounded-xl px-5 font-medium text-sm text-accent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted/40 natural-shadow"
              placeholder={partnerLang ? "Type a message..." : "Waiting for partner..."}
              type="text"
            />
            {!partnerLang && (
              <div className="absolute top-0 right-0 h-full flex items-center pr-3">
                <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
              </div>
            )}
          </div>
          <button 
            id="send-message-btn"
            type="submit"
            disabled={!inputText.trim() || isTranslating}
            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all active:scale-90 shadow-md shrink-0 ${
              inputText.trim() && !isTranslating ? 'bg-accent text-white hover:bg-black' : 'bg-gray-200 text-gray-400 shadow-none'
            }`}
          >
            <Send size={18} className={inputText.trim() && !isTranslating ? "translate-x-0.5 -translate-y-0.5" : ""} />
          </button>
        </form>
        {!partnerLang && (
           <p className="text-[10px] text-center mt-3 text-secondary font-bold uppercase tracking-[0.2em] animate-pulse">Share code {convId} to start chatting</p>
        )}
        <p className="text-[9px] text-center mt-2 text-text-muted font-bold uppercase tracking-[0.3em]">AI-Powered Real-time Translation</p>
      </div>
    </div>
  );
}
