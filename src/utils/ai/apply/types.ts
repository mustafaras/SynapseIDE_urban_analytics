
/** Apply Plan types for AI-assisted patch preview and safe application. */

export type ApplyAction = 'create' | 'replace' | 'insert';
export type ApplyStatus =
  | 'proposed'
  | 'previewing'
  | 'partially_applied'
  | 'applied'
  | 'failed'
  | 'rejected'
  | 'reverted';
export type ConflictReason = 'dirty_file' | 'parse_error' | 'missing_file' | 'unknown';

/** A single hunk within a file diff. */
export interface DiffHunk {
  path: string;
  hunkIndex: number;
  before: string;
  after: string;
  lineStart: number;
  lineCount: number;
}

/** Conflict information for a file. */
export interface ApplyConflict {
  path: string;
  reason: ConflictReason;
  message: string;
  currentContent?: string;
  proposedContent?: string;
}

/** A file to be created, replaced, or modified. */
export interface ApplyItem {
  path: string;
  action: ApplyAction;
  code: string;
  monaco: string;
  ext: string;
  exists: boolean;
  hunks?: DiffHunk[];
  originalContent?: string;
  accepted?: boolean;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskAnalysis {
  riskLevel: RiskLevel;
  hasConflicts: boolean;
  destructiveCount: number;
  warnings: string[];
}

/** Complete apply plan with preview, conflicts, and metadata. */
export interface ApplyPlan {
  id: string;
  mode: 'beginner' | 'pro';
  items: ApplyItem[];
  warnings: string[];
  sourcePrompt?: string;
  confidence?: number;
  createdAt: string;
  status: ApplyStatus;
  conflicts: ApplyConflict[];
  riskAnalysis: RiskAnalysis;
}
