export interface Property {
  id: string;
  title: string;
  location: string;
  area: string;
  description: string;
  price: number;
  period: string;
  amenities: string[];
  badges: string[];
  isVerified: boolean;
  images?: string[];
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'sent' | 'received';
  timestamp: Date;
}
