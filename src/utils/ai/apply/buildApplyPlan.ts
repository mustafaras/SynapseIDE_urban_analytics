
import { normalizeAssistantMessage } from '../lang/normalizeOutput';
import { getLangSpec } from '../lang/languageMap';
import { dedupeName, safeJoin } from '../lang/filename';
import { warnIfRiskyOutput } from '@/utils/safety/guard';
import type { ApplyAction, ApplyConflict, ApplyPlan, RiskAnalysis, RiskLevel } from './types';
import { getActiveTraceId, spanEnd, spanStart } from '@/utils/obs/instrument';

export interface BuildPlanInput {
  rawAssistantText: string;
  selectedLanguageId: string;
  mode: 'beginner' | 'pro';
  defaultDir?: string;
  existingPaths: Set<string>;
  sourcePrompt?: string;
  readFile?: (path: string) => string | null;
}

/** Simple diff hunk extractor for visual preview. */
function generateHunks(before: string, after: string, path: string) {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  if (beforeLines.length === afterLines.length && before === after) return [];

  return [{
    path,
    hunkIndex: 0,
    before,
    after,
    lineStart: 1,
    lineCount: Math.max(beforeLines.length, afterLines.length),
  }];
}

/** Detect conflicts before apply: dirty files, parse errors, etc. */
function detectConflicts(
  path: string,
  action: ApplyAction,
  exists: boolean,
  currentContent: string | null,
  proposedContent: string
): ApplyConflict[] {
  const conflicts: ApplyConflict[] = [];

  if (action === 'replace' && exists && currentContent) {
    if (currentContent !== proposedContent && currentContent.trim() !== '') {
      conflicts.push({
        path,
        reason: 'dirty_file',
        message: `File "${path}" exists and differs from proposed content. Review before applying.`,
        currentContent,
        proposedContent,
      });
    }
  }

  if (action === 'replace' && !exists) {
    conflicts.push({
      path,
      reason: 'missing_file',
      message: `Cannot replace "${path}" — file does not exist. Will create instead.`,
    });
  }

  return conflicts;
}

export function buildApplyPlan(input: BuildPlanInput): ApplyPlan {
  let span: string | null = null;
  const tid = getActiveTraceId();
  if (tid) { try { span = spanStart(tid, 'apply', 'build apply plan'); } catch {} }

  const spec = getLangSpec(input.selectedLanguageId);
  if (!spec) throw new Error(`Unsupported language: ${input.selectedLanguageId}`);

  const { files, warnings } = normalizeAssistantMessage(input.rawAssistantText, {
    selectedLang: spec,
    mode: input.mode,
    defaultDir: input.defaultDir || '',
  });

  try { warnIfRiskyOutput(input.rawAssistantText, 'safety:warn:apply'); } catch {}

  const conflicts: ApplyConflict[] = [];
  const items = files.map(f => {
    const baseDir = input.defaultDir || '';
    const safePath = safeJoin(baseDir, f.path);
    const exists = input.existingPaths.has(safePath);
    let action: ApplyAction;

    if (input.mode === 'beginner') {
      action = exists ? 'replace' : 'create';
    } else {
      action = 'create';
    }

    const currentContent = exists && input.readFile ? input.readFile(safePath) : null;
    const proposedContent = f.code;
    const itemConflicts = detectConflicts(safePath, action, exists, currentContent, proposedContent);
    conflicts.push(...itemConflicts);

    const hunks = exists && currentContent ? generateHunks(currentContent, proposedContent, safePath) : undefined;
    return {
      path: safePath,
      action,
      code: proposedContent,
      monaco: f.monaco,
      ext: f.ext,
      exists,
      ...(hunks ? { hunks } : {}),
      ...(currentContent ? { originalContent: currentContent } : {}),
    };
  });

  if (input.mode === 'pro') {
    const used = new Set<string>();
    for (const it of items) {
      const finalPath = used.has(it.path) || it.exists ? dedupeName(used, it.path) : it.path;
      used.add(finalPath);
      it.path = finalPath;
    }
  }

  const destructiveCount = items.filter(i => i.action === 'replace').length;
  const hasConflicts = conflicts.length > 0;
  let riskLevel: RiskLevel = 'low';
  if (hasConflicts) {
    riskLevel = 'high';
  } else if (destructiveCount > 0 || items.length > 3) {
    riskLevel = 'medium';
  }
  const riskWarnings: string[] = [];
  if (destructiveCount > 0) riskWarnings.push(`${destructiveCount} file(s) will be overwritten`);
  if (items.length > 3) riskWarnings.push(`${items.length} files will be modified`);
  const riskAnalysis: RiskAnalysis = { riskLevel, hasConflicts, destructiveCount, warnings: riskWarnings };

  const plan: ApplyPlan = {
    id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    mode: input.mode,
    items,
    warnings,
    ...(input.sourcePrompt ? { sourcePrompt: input.sourcePrompt } : {}),
    confidence: 85,
    createdAt: new Date().toISOString(),
    status: 'proposed',
    conflicts,
    riskAnalysis,
  };

  if (tid && span) {
    try {
      spanEnd(tid, span, {
        created: items.filter(i => i.action === 'create').length,
        replaced: items.filter(i => i.action === 'replace').length,
        conflicts: conflicts.length,
      });
    } catch {}
  }

  return plan;
}
