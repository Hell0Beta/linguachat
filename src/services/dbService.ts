import { Conversation, Message } from '../types';

const listeners: Set<() => void> = new Set();

export function subscribeToDB(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners() {
  listeners.forEach(cb => cb());
}

// Conversation Ops
export async function saveConversation(conv: Conversation) {
  const res = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(conv)
  });
  notifyListeners();
  return res.json();
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  const res = await fetch(`/api/conversations/${id}`);
  if (!res.ok) return undefined;
  return res.json();
}

export async function updateConversation(id: string, updates: Partial<Conversation>) {
  const res = await fetch(`/api/conversations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  notifyListeners();
  return res.json();
}

// Message Ops
export async function addLocalMessage(msg: Omit<Message, 'id' | 'createdAt'>) {
  const res = await fetch(`/api/conversations/${msg.convId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(msg)
  });
  notifyListeners();
  return res.json();
}

export async function getMessagesForConversation(convId: string): Promise<Message[]> {
  const res = await fetch(`/api/conversations/${convId}/messages`);
  if (!res.ok) return [];
  const msgs = await res.json();
  return msgs.sort((a: any, b: any) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

// Notify other listeners (local only, multi-device will use polling)
export function broadcastChange() {
  notifyListeners();
}
