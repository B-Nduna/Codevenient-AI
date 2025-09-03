export interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  image?: string;
}