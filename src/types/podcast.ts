import { Timestamp } from 'firebase/firestore';

export interface CvFormData {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedIn: string;
  industry: string;
  professionalWeb?: string;
  otherLinks?: string;
  cvUrl: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  dateSubmitted: Timestamp;
  status: 'pending' | 'reviewed' | 'contacted' | 'rejected';
}

export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  guestName: string;
  guestTitle: string;
  audioUrl: string;
  imageUrl: string;
  youtubeUrl?: string;
  duration: number;
  publishDate: Timestamp;
  tags: string[];
  featured: boolean;
}

export interface PodcastSeries {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  episodes: string[]; // Array of episode IDs
  active: boolean;
} 