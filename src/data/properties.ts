import type { Property } from '../types';

export const propertiesData: Property[] = [
  {
    id: 'prop-local-1',
    title: 'Modern Dormitory near NDDU',
    location: 'Lagao, General Santos City',
    area: 'Lagao',
    description: 'A premium, modern boarding house perfect for students. Features high-speed fiber internet, fully air-conditioned rooms, and 24/7 security. Just a 5-minute walk to Notre Dame of Dadiangas University.',
    price: 3500,
    period: 'month',
    amenities: ['Wi-Fi', 'Air Conditioning', 'Private Bathroom', 'Submeter Electricity'],
    features: [
      { name: 'Internet', description: 'Up to 200 Mbps Fiber' },
      { name: 'Security', description: 'CCTV equipped and biometric gate' }
    ],
    quickStats: [
      { value: '5 Mins', label: 'Walking Distance' },
      { value: 'Free WiFi', label: 'High-Speed Access' },
      { value: '24/7', label: 'CCTV Security' },
      { value: 'READY', label: 'To Move-In' }
    ],
    hasCurfew: false,
    roomCapacity: 4,
    availableBeds: 2,
    badges: ['Boarding House', 'Top Rated'],
    isVerified: true,
    verificationStatus: 'approved',
    latitude: 6.1264,
    longitude: 125.1764,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1de2d9d000?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=800'
    ],
    landlordId: {
      fullName: 'Maria Santos',
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'
    }
  },
  {
    id: 'prop-local-2',
    title: 'Cozy Studio Apartment',
    location: 'Dadiangas South, General Santos City',
    area: 'Dadiangas',
    description: 'Peaceful and cozy studio-type apartment ideal for solo renters or couples. Comes with an en-suite bathroom, mini kitchen area, and free water. Highly accessible to main transport routes and malls.',
    price: 5000,
    period: 'month',
    amenities: ['Private Bathroom', 'Cooking Allowed', 'Water Filter'],
    features: [
      { name: 'Kitchen', description: 'Built-in cabinets and sink' },
      { name: 'Water', description: 'Free water supply' }
    ],
    quickStats: [
      { value: 'Cozy', label: 'Studio Type' },
      { value: 'Free', label: 'Water Supply' },
      { value: 'Quiet', label: 'Neighborhood' },
      { value: '1 Bed', label: 'Available Now' }
    ],
    hasCurfew: true,
    roomCapacity: 2,
    availableBeds: 1,
    badges: ['Apartment', 'New'],
    isVerified: true,
    verificationStatus: 'approved',
    latitude: 6.1147,
    longitude: 125.1716,
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=800'
    ],
    landlordId: {
      fullName: 'Jose Reyes',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'
    }
  }
];
