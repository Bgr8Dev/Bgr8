import { Timestamp } from 'firebase/firestore';

export interface BusinessStats {
  totalMembers: number;
  activeMembers: number;
  revenue: number;
  engagement: number;
}

export interface CarClubRequest {
  id: string;
  userId: string;
  userEmail: string;
  name: string;
  phone: string;
  carMakeModel: string;
  numberPlate: string;
  instagramHandle: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: Timestamp;
  notes: string;
  reviewedBy?: string;
  reviewDate?: Timestamp;
} 