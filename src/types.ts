
export type Language = {
  code: string;
  name: string;
  flag: string;
  color: string;
};

export type Conversation = {
  id: string;
  creatorLang: string;
  joinerLang?: string;
  createdAt: string;
};

export type Message = {
  id?: string | number;
  convId: string;
  senderRole: 'creator' | 'joiner';
  original: string;
  translated: string;
  fromLang: string;
  toLang: string;
  createdAt: string;
};

export type AppState = 'language_selection' | 'home' | 'chat';
