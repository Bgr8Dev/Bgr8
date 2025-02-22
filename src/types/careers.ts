export interface CvFormData {
  filePath: string | undefined;
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedIn: string;
  industry: string;
  professionalWeb: string;
  otherLinks: string;
  cvUrl: string;
  dateSubmitted: Date;
  status: 'pending' | 'reviewed' | 'contacted' | 'rejected';
} 