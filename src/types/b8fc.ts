import { Timestamp } from 'firebase/firestore';

export interface TeamMember {
  uid: string;
  role: 'captain' | 'player';
  joinedAt: Timestamp;
  name: string;
  position?: string;
}

export interface Team {
  id: string;
  name: string;
  captain: string; // UID of captain
  members: TeamMember[];
  createdAt: Timestamp;
  isPreset: boolean;
}

export interface Match {
  id: string;
  homeTeam: string; // Team ID
  awayTeam: string; // Team ID
  date: Timestamp;
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  score?: {
    home: number;
    away: number;
  };
}

export interface MatchFormData {
  homeTeam: string;
  awayTeam: string;
  date: Date;
  location: string;
} 