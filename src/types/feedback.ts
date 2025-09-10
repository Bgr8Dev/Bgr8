export type FeedbackStatus = 
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'duplicate';

export type FeedbackPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type FeedbackCategory = 
  | 'bug'
  | 'feature_request'
  | 'ui_issue'
  | 'performance'
  | 'security'
  | 'accessibility'
  | 'other';

export interface FeedbackTicket {
  id: string;
  sequentialId: number;
  title: string;
  description: string;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  tags: string[];
  attachments?: FeedbackAttachment[];
  comments: FeedbackComment[];
  votes: number;
  upvoters: string[];
  downvoters: string[];
  duplicateOf?: string;
  relatedTickets?: string[];
  // Testing-specific fields
  urlToPage?: string;
  browser?: string;
  browserVersion?: string;
  operatingSystem?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  screenResolution?: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  severity?: 'cosmetic' | 'minor' | 'major' | 'critical' | 'blocker';
  environment?: 'development' | 'staging' | 'production';
  testCaseId?: string;
  regression?: boolean;
  workaround?: string;
}

export interface FeedbackAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'document' | 'other';
  size: number;
  uploadedAt: Date;
}

export interface FeedbackComment {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isInternal: boolean;
  attachments?: FeedbackAttachment[];
}

export interface FeedbackStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  duplicate: number;
  byCategory: Record<FeedbackCategory, number>;
  byPriority: Record<FeedbackPriority, number>;
  byStatus: Record<FeedbackStatus, number>;
  averageResolutionTime: number; // in hours
  topReporters: Array<{
    reporterId: string;
    reporterName: string;
    count: number;
  }>;
}

export interface FeedbackFilters {
  status?: FeedbackStatus[];
  priority?: FeedbackPriority[];
  category?: FeedbackCategory[];
  assignedTo?: string[];
  reporterId?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
}

export interface CreateFeedbackTicketData {
  title: string;
  description: string;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  tags?: string[];
  attachments?: File[];
  // Testing-specific fields
  urlToPage?: string;
  browser?: string;
  browserVersion?: string;
  operatingSystem?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  screenResolution?: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  severity?: 'cosmetic' | 'minor' | 'major' | 'critical' | 'blocker';
  environment?: 'development' | 'staging' | 'production';
  testCaseId?: string;
  regression?: boolean;
  workaround?: string;
}

export interface UpdateFeedbackTicketData {
  title?: string;
  description?: string;
  category?: FeedbackCategory;
  priority?: FeedbackPriority;
  status?: FeedbackStatus;
  assignedTo?: string;
  tags?: string[];
  // Testing-specific fields
  urlToPage?: string;
  browser?: string;
  browserVersion?: string;
  operatingSystem?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  screenResolution?: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  severity?: 'cosmetic' | 'minor' | 'major' | 'critical' | 'blocker';
  environment?: 'development' | 'staging' | 'production';
  testCaseId?: string;
  regression?: boolean;
  workaround?: string;
}

export interface CreateFeedbackCommentData {
  content: string;
  isInternal?: boolean;
  attachments?: File[];
}
