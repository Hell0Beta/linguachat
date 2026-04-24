/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import * as DB from './services/dbService';
import { AppState, Language, Conversation } from './types';
import LanguageSelector from './components/LanguageSelector';
import Home from './components/Home';
import Chat from './components/Chat';
import QRModal from './components/QRModal';

function showFormattedError(error: any) {
  console.error("App Error:", error);
  // alert(error.message || "An unexpected error occurred.");
}

// Generate a random 6-character code
function generateConvId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function App() {
  const [state, setState] = useState<AppState>('language_selection');
  const [myLang, setMyLang] = useState<Language | null>(null);
  const [convId, setConvId] = useState<string | null>(null);
  const [role, setRole] = useState<'creator' | 'joiner'>('creator');
  const [isQRModalOpen, setQRModalOpen] = useState(false);

  // Restore language and active session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lingua_lang');
    if (saved) {
      const lang = JSON.parse(saved) as Language;
      setMyLang(lang);
      
      const activeConv = localStorage.getItem('active_conv_id');
      const activeRole = localStorage.getItem('active_role') as 'creator' | 'joiner';
      if (activeConv && activeRole) {
        setConvId(activeConv);
        setRole(activeRole);
        setState('chat');
      } else {
        setState('home');
      }
    }

    // Check for auto-join in URL
    const urlParams = new URLSearchParams(window.location.search);
    const joinId = urlParams.get('join');
    if (joinId) {
      handleJoin(joinId);
    }
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    setMyLang(lang);
    localStorage.setItem('lingua_lang', JSON.stringify(lang));
    setState('home');
  };

  const handleBackToHome = () => {
    setState('home');
    setConvId(null);
    localStorage.removeItem('active_conv_id');
    localStorage.removeItem('active_role');
  };

  const handleCreate = async () => {
    if (!myLang) return;
    const newId = generateConvId();
    
    try {
      await DB.saveConversation({
        id: newId,
        creatorLang: myLang.code,
        createdAt: new Date() as any
      });
      
      setConvId(newId);
      setRole('creator');
      setState('chat');
      setQRModalOpen(true);
      
      // Persist session
      localStorage.setItem('active_conv_id', newId);
      localStorage.setItem('active_role', 'creator');
    } catch (error) {
      showFormattedError(error);
    }
  };

  const handleJoin = async (targetId?: string): Promise<boolean> => {
    if (!myLang) {
       if (targetId) localStorage.setItem('pending_join', targetId);
       return false;
    }

    const id = targetId;
    if (!id) return false;

    // Blind join: We go to the chat screen regardless.
    // Chat.tsx will handle the verification.
    setConvId(id);
    setRole('joiner');
    setState('chat');
    
    // Persist session
    localStorage.setItem('active_conv_id', id);
    localStorage.setItem('active_role', 'joiner');

    // Clear join intent
    localStorage.removeItem('pending_join');
    return true;
  };

  // If we have a pending join and just selected language
  useEffect(() => {
    if (myLang && state === 'home') {
       const pending = localStorage.getItem('pending_join');
       if (pending) {
          handleJoin(pending);
       }
    }
  }, [myLang, state]);

  if (state === 'language_selection') {
    return <LanguageSelector onSelect={handleLanguageSelect} />;
  }

  if (state === 'home' && myLang) {
    return (
      <Home 
        onCreate={handleCreate} 
        onJoin={(code) => handleJoin(code)} 
        onReset={() => setState('language_selection')} 
        myLang={myLang} 
      />
    );
  }

  if (state === 'chat' && convId && myLang) {
    return (
      <>
        <Chat 
           convId={convId} 
           role={role} 
           myLang={myLang} 
           onBack={handleBackToHome} 
           openQR={() => setQRModalOpen(true)}
        />
        <QRModal 
           isOpen={isQRModalOpen} 
           onClose={() => setQRModalOpen(false)} 
           convId={convId} 
        />
      </>
    );
  }

  return <div className="flex items-center justify-center min-h-screen bg-[#f9fbea] font-black uppercase">Loading...</div>;
}
