import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Link, ArrowRight, MessageSquare, Languages, GraduationCap, User, X } from 'lucide-react';
import { Language } from '../types';
import { translateText } from '../services/translationService';

interface HomeProps {
  onCreate: () => void;
  onJoin: (code?: string) => Promise<boolean>;
  onReset: () => void;
  myLang: Language;
}

export default function Home({ onCreate, onJoin, onReset, myLang }: HomeProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoinSubmitting, setIsJoinSubmitting] = useState(false);

  // UI Translations
  const [translations, setTranslations] = useState({
    title: 'Bilingual',
    question: 'WHAT WOULD YOU LIKE TO DO?',
    startNew: 'START NEW',
    enterRoom: 'ENTER ROOM',
    enterCode: 'ENTER CODE',
    joinSession: 'JOIN SESSION',
    create: 'Create',
    join: 'Join'
  });

  useEffect(() => {
    async function fetchTranslations() {
      if (myLang.code === 'en') return;

      try {
        const [title, question, startNew, enterRoom, enterCode, joinSession, create, join] = await Promise.all([
          translateText('Bilingual', 'en', myLang.code),
          translateText('What would you like to do?', 'en', myLang.code),
          translateText('Start New', 'en', myLang.code),
          translateText('Enter Room', 'en', myLang.code),
          translateText('Enter Code', 'en', myLang.code),
          translateText('Join Session', 'en', myLang.code),
          translateText('Create', 'en', myLang.code),
          translateText('Join', 'en', myLang.code)
        ]);

        setTranslations({
          title,
          question: question.toUpperCase(),
          startNew: startNew.toUpperCase(),
          enterRoom: enterRoom.toUpperCase(),
          enterCode: enterCode.toUpperCase(),
          joinSession: joinSession.toUpperCase(),
          create,
          join
        });
      } catch (e) {
        console.warn("Failed to fetch UI translations", e);
      }
    }
    fetchTranslations();
  }, [myLang]);

  const handleCreateClick = async () => {
    setIsCreating(true);
    try {
      await onCreate();
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length === 6) {
      setIsJoinSubmitting(true);
      setJoinError(null);
      const success = await onJoin(joinCode.toUpperCase());
      if (!success) {
        setJoinError("Conversation not found. Check the code!");
        setIsJoinSubmitting(false);
      }
    }
  };

  return (
    <div id="home-screen" className="flex flex-col min-h-screen bg-bg-base pb-24">
      {/* Top Bar */}
      <header id="app-header" className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div id="app-logo" className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">
            B
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-accent">Bilingual {myLang.code !== 'en' && <>| <span className="font-normal opacity-70 italic">{translations.title}</span></>}</h1>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div id="session-status" className="flex items-center gap-2 bg-[#F2F0E9] px-4 py-2 rounded-full hidden sm:flex">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Live Session</span>
          </div>
          <button id="user-profile-btn" className="w-10 h-10 rounded-full border border-border p-1">
            <div className="w-full h-full bg-[#E5E2D9] rounded-full"></div>
          </button>
        </div>
      </header>

      <main id="main-content" className="p-6 max-w-xl mx-auto w-full space-y-6 pt-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-accent uppercase leading-tight">
            WHAT WOULD YOU LIKE TO DO?
          </h2>
          {myLang.code !== 'en' && (
            <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.1em] italic">{translations.question}</p>
          )}
        </div>

        <div className="grid gap-6">
          {/* Create Card */}
          <motion.div 
            id="create-session-card"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateClick}
            className={`bg-accent relative overflow-hidden rounded-3xl p-6 cursor-pointer border border-white/5 natural-shadow group transition-opacity ${isCreating ? 'opacity-70 pointer-events-none' : ''}`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                <Plus className="text-white" size={24} />
              </div>
              <MessageSquare className="absolute -right-8 -top-8 w-48 h-48 opacity-5 text-white transform -rotate-12" />
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-white mb-2">
                {myLang.code === 'en' ? 'Create' : translations.create}
              </h3>
              <p className="text-white/60 text-xs font-medium mb-6 max-w-[240px]">Generate a unique room code and share your session link.</p>
              <button id="start-new-btn" className="bg-primary text-white px-6 py-2.5 rounded-full flex items-center gap-2 font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-opacity-90 transition-all">
                {isCreating ? 'CREATING...' : (myLang.code === 'en' ? 'START NEW' : `START NEW / ${translations.startNew}`)}
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>

          {/* Join Card */}
          <div id="join-session-section" className="relative">
            <AnimatePresence mode="wait">
              {!isJoining ? (
                <motion.div 
                  id="join-prompt-card"
                  key="join-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsJoining(true)}
                  className="bg-secondary relative overflow-hidden rounded-3xl p-6 cursor-pointer border border-white/5 natural-shadow group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 text-white">
                      <Link size={24} />
                    </div>
                    <Link className="absolute -right-8 -top-8 w-48 h-48 opacity-10 text-white transform rotate-12" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-3xl font-bold text-white mb-2">
                        {myLang.code === 'en' ? 'Join' : translations.join}
                    </h3>
                    <p className="text-white/70 text-xs font-medium mb-6 max-w-[240px]">Entering a 6-character room code or scanning a friend's QR.</p>
                    <button id="join-room-trigger" className="bg-white text-secondary px-6 py-2.5 rounded-full flex items-center gap-2 font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-opacity-90 transition-all">
                      {myLang.code === 'en' ? 'ENTER ROOM' : `ENTER ROOM / ${translations.enterRoom}`}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  id="join-form-container"
                  key="join-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-white rounded-3xl p-6 border border-border natural-shadow"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-accent">Enter Code</h3>
                      {myLang.code !== 'en' && (
                        <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest italic leading-none">{translations.enterCode}</p>
                      )}
                    </div>
                    <button id="cancel-join-btn" onClick={() => setIsJoining(false)} className="text-text-muted hover:text-accent p-1">
                      <X size={20} />
                    </button>
                  </div>
                  <form id="join-room-form" onSubmit={handleJoinSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <input 
                        id="join-code-input"
                        autoFocus
                        type="text"
                        maxLength={6}
                        value={joinCode}
                        onChange={(e) => {
                          setJoinCode(e.target.value.toUpperCase());
                          setJoinError(null);
                        }}
                        placeholder="e.g. ABC123"
                        className={`w-full text-center text-3xl font-bold tracking-[0.2em] py-3 border-b-2 outline-none placeholder:text-gray-100 placeholder:tracking-normal transition-colors ${
                          joinError ? 'border-red-400 text-red-500' : 'border-accent focus:border-primary'
                        }`}
                      />
                      {joinError && (
                        <p className="text-center text-red-500 text-[10px] font-bold uppercase tracking-widest animate-shake">
                          {joinError}
                        </p>
                      )}
                    </div>
                    <button 
                      id="submit-join-btn"
                      type="submit"
                      disabled={joinCode.length !== 6 || isJoinSubmitting}
                      className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all ${
                        joinCode.length === 6 && !isJoinSubmitting ? 'bg-accent text-white hover:bg-black' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isJoinSubmitting ? 'JOINING...' : (myLang.code === 'en' ? 'JOIN SESSION' : `JOIN SESSION / ${translations.joinSession}`)}
                      <ArrowRight size={16} />
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tip Card */}
          <div className="bg-white rounded-3xl p-5 border border-border flex items-center justify-between natural-shadow">
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-primary uppercase tracking-[0.2em] mb-1">System Status</span>
              <p className="text-xs font-semibold text-text-muted">High-accuracy translation engine active.</p>
            </div>
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-white bg-[#E5E2D9] animate-pulse"></div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-primary flex items-center justify-center font-bold text-[8px] text-white">ON</div>
            </div>
          </div>
        </div>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center h-20 bg-white border-t border-border z-50 px-4">
        <button className="flex flex-col items-center gap-1 bg-accent text-white px-6 py-2.5 rounded-xl hover:bg-[#2D2824] transition-all transform hover:scale-105">
          <MessageSquare size={18} />
          <span className="text-[8px] font-bold uppercase tracking-widest">Chats</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-text-muted hover:text-accent transition-colors">
          <Languages size={18} />
          <span className="text-[8px] font-bold uppercase tracking-widest">Translate</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-text-muted hover:text-accent transition-colors">
          <GraduationCap size={18} />
          <span className="text-[8px] font-bold uppercase tracking-widest">Learn</span>
        </button>
        <button 
          onClick={onReset}
          className="flex flex-col items-center gap-1 text-text-muted hover:text-accent transition-colors"
        >
          <User size={18} />
          <span className="text-[8px] font-bold uppercase tracking-widest">Profile</span>
        </button>
      </nav>
    </div>
  );
}
