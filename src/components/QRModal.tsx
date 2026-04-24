import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Link as LinkIcon, Loader2, CheckCircle } from 'lucide-react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  convId: string;
}

export default function QRModal({ isOpen, onClose, convId }: QRModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const joinUrl = `${window.location.origin}?join=${convId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("Failed to copy: " + joinUrl);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-accent/30 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white w-full max-w-sm rounded-[3rem] p-8 border border-border shadow-2xl relative"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-bg-base text-text-muted hover:text-accent transition-colors"
          >
            <X size={20} />
          </button>

          <header className="mb-8 text-center">
            <h2 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-2">Invite Partner</h2>
            <p className="text-text-muted text-xs uppercase tracking-widest font-medium">Scan to join the conversation</p>
          </header>

          <div className="flex flex-col items-center gap-8">
            <div className="p-6 bg-bg-base rounded-[2rem] border border-border natural-shadow relative group">
              <div className="bg-white p-4 rounded-2xl border-2 border-accent">
                <QRCodeSVG 
                  value={joinUrl} 
                  size={180}
                  level="H"
                  fgColor="#4A3F35"
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-accent px-4 py-1.5 rounded-full border border-white shadow-xl">
                 <span className="font-mono text-white text-xs font-bold tracking-widest">{convId}</span>
              </div>
            </div>

            <div className="w-full space-y-3">
              <button 
                onClick={copyToClipboard}
                className={`w-full py-4 border rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${
                  copied ? 'bg-secondary text-white border-transparent' : 'bg-white border-border text-accent hover:bg-bg-base'
                }`}
              >
                {copied ? <CheckCircle size={14} /> : <LinkIcon size={14} />}
                {copied ? 'Copied!' : 'Copy Session Link'}
              </button>
            </div>

            <div className="flex items-center gap-3 py-3 px-6 bg-[#F2F0E9] rounded-full border border-border">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none">Waiting for partner...</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
