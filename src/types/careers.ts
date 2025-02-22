export interface CvFormData {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedIn: string;
  industry: string;
  professionalWeb: string;
  otherLinks: string;
  cvUrl: string;
  filePath: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  dateSubmitted: Date;
  status: 'pending' | 'reviewed' | 'contacted' | 'rejected';
}