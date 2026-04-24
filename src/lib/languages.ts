import { Language } from '../types';

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', color: '#FFFFFF' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', color: '#7B5CF5' },
  { code: 'fr', name: 'French', flag: '🇫🇷', color: '#F5C842' },
  { code: 'de', name: 'German', flag: '🇩🇪', color: '#1A1A1A' },
  { code: 'it', name: 'Italian', flag: '🇮🇹', color: '#4CAF50' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', color: '#7B5CF5' },
  { code: 'zh', name: 'Mandarin', flag: '🇨🇳', color: '#FF4B4B' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', color: '#FFFFFF' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', color: '#1A1A1A' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', color: '#7B5CF5' },
];

export const getLanguageByCode = (code: string) => LANGUAGES.find(l => l.code === code);
