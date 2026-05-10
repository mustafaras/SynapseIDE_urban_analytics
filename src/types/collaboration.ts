


export type UserRole =
  | 'analyst'
  | 'reviewer'
  | 'co-analyst'
  | 'observer'
  | 'admin';

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  isOnline: boolean;
  lastSeen: Date;
  color: string;
  colorToken?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'info' | 'textSecondary';
}

export interface UserPresence {
  userId: string;
  sessionId: string;
  cursor?: {
    x: number;
    y: number;
    element?: string;
  };
  activeSection?: string;
  lastActivity: Date;
}


export type CoAnalysisRole = 'lead' | 'support' | 'observer';

export interface CoAnalysisSession {
  id: string;
  sessionId: string;
  participants: Array<{
    userId: string;
    role: CoAnalysisRole;
    joinedAt: Date;
    permissions: CoAnalysisPermissions;
  }>;
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface CoAnalysisPermissions {
  canEditNotes: boolean;
  canControlTimer: boolean;
  canExportData: boolean;
  canInviteOthers: boolean;
  canEndSession: boolean;
}


export type TemplateVisibility = 'private' | 'team' | 'organization';
export type TemplateCategory = 
  | 'note' 
  | 'intervention' 
  | 'assessment' 
  | 'report'
  | 'methodology'
  | 'review';

export interface SharedTemplate {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  content: string;
  visibility: TemplateVisibility;
  tags: string[];


  ownerId: string;
  ownerName: string;
  teamId?: string;
  organizationId?: string;


  version: number;
  versionHistory: TemplateVersion[];


  usageCount: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;


  sharedWith: Array<{
    userId: string;
    permissions: TemplatePermissions;
  }>;
}

export interface TemplateVersion {
  version: number;
  content: string;
  changedBy: string;
  changeDescription?: string;
  timestamp: Date;
}

export interface TemplatePermissions {
  canView: boolean;
  canEdit: boolean;
  canShare: boolean;
  canDelete: boolean;
}


export type WorkflowStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';
export type WorkflowType = 'review' | 'consultation' | 'peer_review' | 'approval';

export interface WorkflowRequest {
  id: string;
  type: WorkflowType;
  status: WorkflowStatus;


  requesterId: string;
  requesterName: string;
  assignedTo: string;
  assignedToName: string;


  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';


  sessionId?: string;
  noteId?: string;
  templateId?: string;


  dueDate?: Date;
  completedAt?: Date;
  comments: WorkflowComment[];


  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
}


export type ActivityType =
  | 'session_shared'
  | 'session_joined'
  | 'session_left'
  | 'note_edited'
  | 'template_created'
  | 'template_shared'
  | 'template_applied'
  | 'template_updated'
  | 'template_deleted'
  | 'workflow_created'
  | 'workflow_updated'
  | 'workflow_approved'
  | 'workflow_rejected'
  | 'user_invited'
  | 'user_updated'
  | 'comment_added'
  | 'permission_changed';

export interface ActivityLogEntry {
  id: string;
  type: ActivityType;
  userId: string;
  userName: string;
  targetId?: string;
  targetType?: 'session' | 'template' | 'workflow' | 'user';
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}


export interface SyncStatus {
  isConnected: boolean;
  lastSyncTime?: Date;
  pendingChanges: number;
  conflictCount: number;
  syncError?: string;
}

export interface CollaborationState {

  currentUser: CollaborationUser | null;


  coAnalysisSession: CoAnalysisSession | null;
  participants: CollaborationUser[];
  presenceData: Record<string, UserPresence>;


  sharedTemplates: SharedTemplate[];


  workflows: WorkflowRequest[];
  unreadWorkflows: number;


  recentActivity: ActivityLogEntry[];


  syncStatus: SyncStatus;
}
