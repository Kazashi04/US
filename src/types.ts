export interface Property {
  id: string;
  title: string;
  location: string;
  area: string;
  description: string;
  price: number;
  period: string;
  amenities: string[];
  features?: { name: string; description: string }[];
  hasCurfew?: boolean;
  roomCapacity?: number;
  availableBeds?: number;
  badges: string[];
  isVerified: boolean;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
  landlordId?: string | { id?: string; fullName?: string; email?: string; phoneNumber?: string } | null;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'sent' | 'received';
  timestamp: Date;
}

export interface Booking {
  id: string;
  propertyId: any;
  studentId: any;
  landlordId: any;
  status: 'payment_pending' | 'pending_landlord_approval' | 'approved' | 'rejected' | 'cancelled';
  moveInDate: string;
  durationMonths: number;
  message: string;
  totalPrice: number;
  createdAt: string;
}
