import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, ArrowRight, Languages } from 'lucide-react';
import { LANGUAGES } from '../lib/languages';
import { Language } from '../types';

interface LanguageSelectorProps {
  onSelect: (lang: Language) => void;
}

export default function LanguageSelector({ onSelect }: LanguageSelectorProps) {
  const [selected, setSelected] = useState<Language | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-bg-base pb-44">
      {/* Top Navbar */}
      <nav className="sticky top-0 bg-white border-b border-border flex items-center justify-between px-6 py-4 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">
            B
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-accent">Bilingual</h1>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-[#F2F0E9] px-3 py-1.5 rounded-full hover:bg-border transition-colors group">
          <Languages size={16} className="text-text-muted group-hover:text-accent" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted group-hover:text-accent">Filter</span>
        </button>
      </nav>

      <main className="p-6 max-w-xl mx-auto w-full">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-accent mb-1 text-center uppercase">
            Select Language
          </h1>
        </header>

        <div className="grid gap-2.5">
          {LANGUAGES.map((lang) => {
            const isSelected = selected?.code === lang.code;
            return (
              <motion.button
                key={lang.code}
                whileActive={{ scale: 0.98 }}
                onClick={() => setSelected(lang)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isSelected 
                    ? 'bg-accent text-white border-accent natural-shadow' 
                    : 'bg-white text-text-main border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl grayscale-[0.2]">{lang.flag}</span>
                  <span className="text-lg font-bold">{lang.name}</span>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-bg-base text-text-muted'
                }`}>
                  {isSelected ? <Check size={18} /> : <ArrowRight size={18} />}
                </div>
              </motion.button>
            );
          })}
        </div>
      </main>

      {/* Sticky Bottom Panel */}
      <div className="fixed bottom-0 left-0 w-full p-4 z-[60]">
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="bg-white rounded-3xl border border-border p-6 natural-shadow flex flex-col gap-4 max-w-xl mx-auto"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-[0.15em] mb-0.5">Current Selection</p>
              <h3 className="text-lg font-bold text-accent flex items-center gap-2">
                {selected ? `${selected.name} ${selected.flag}` : 'None Selected'}
              </h3>
            </div>
          </div>
          <button 
            disabled={!selected}
            onClick={() => selected && onSelect(selected)}
            className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${
              selected ? 'bg-accent text-white hover:bg-[#2D2824] active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
