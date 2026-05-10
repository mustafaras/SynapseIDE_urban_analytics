



export type LangMap = { monaco: string; ext: string };

const TABLE: Record<string, LangMap> = {

  ts: { monaco: 'typescript', ext: 'ts' },
  tsx: { monaco: 'typescript', ext: 'tsx' },
  typescript: { monaco: 'typescript', ext: 'ts' },
  js: { monaco: 'javascript', ext: 'js' },
  jsx: { monaco: 'javascript', ext: 'jsx' },
  javascript: { monaco: 'javascript', ext: 'js' },
  json: { monaco: 'json', ext: 'json' },

  html: { monaco: 'html', ext: 'html' },
  css: { monaco: 'css', ext: 'css' },
  scss: { monaco: 'scss', ext: 'scss' },
  sass: { monaco: 'scss', ext: 'scss' },

  sh: { monaco: 'shell', ext: 'sh' },
  bash: { monaco: 'shell', ext: 'sh' },
  zsh: { monaco: 'shell', ext: 'sh' },
  ps1: { monaco: 'powershell', ext: 'ps1' },
  powershell: { monaco: 'powershell', ext: 'ps1' },

  py: { monaco: 'python', ext: 'py' },
  python: { monaco: 'python', ext: 'py' },
  java: { monaco: 'java', ext: 'java' },
  c: { monaco: 'c', ext: 'c' },
  cpp: { monaco: 'cpp', ext: 'cpp' },
  cc: { monaco: 'cpp', ext: 'cpp' },
  h: { monaco: 'c', ext: 'h' },
  hpp: { monaco: 'cpp', ext: 'hpp' },
  go: { monaco: 'go', ext: 'go' },
  rs: { monaco: 'rust', ext: 'rs' },
  rust: { monaco: 'rust', ext: 'rs' },
  php: { monaco: 'php', ext: 'php' },
  rb: { monaco: 'ruby', ext: 'rb' },
  ruby: { monaco: 'ruby', ext: 'rb' },
  kt: { monaco: 'kotlin', ext: 'kt' },
  kotlin: { monaco: 'kotlin', ext: 'kt' },
  scala: { monaco: 'scala', ext: 'scala' },
  r: { monaco: 'r', ext: 'r' },
  lua: { monaco: 'lua', ext: 'lua' },
  dart: { monaco: 'dart', ext: 'dart' },
  sql: { monaco: 'sql', ext: 'sql' },
  yaml: { monaco: 'yaml', ext: 'yaml' },
  yml: { monaco: 'yaml', ext: 'yml' },
  md: { monaco: 'markdown', ext: 'md' },
  markdown: { monaco: 'markdown', ext: 'md' },
  txt: { monaco: 'plaintext', ext: 'txt' },
};

export function mapFenceToLangAndExt(info?: string): LangMap {
  const raw = (info || '').trim().toLowerCase();
  if (!raw) return { monaco: 'plaintext', ext: 'txt' };
  const hit = TABLE[raw];
  if (hit) return hit;

  const cleaned = raw.replace(/\{.*\}$/g, '').replace(/^lang[:=]/, '');
  if (TABLE[cleaned]) return TABLE[cleaned];
  return { monaco: 'plaintext', ext: 'txt' };
}

export default mapFenceToLangAndExt;

// ── Language accent colors (aligned with GitHub / VS Code color conventions) ──
const LANG_COLORS: Record<string, string> = {
  typescript: '#3178C6', tsx: '#3178C6',
  javascript: '#F0C53F', jsx: '#F0C53F', js: '#F0C53F',
  python: '#3572A5',     py: '#3572A5',
  rust:   '#CE422B',     rs: '#CE422B',
  go:     '#00ADD8',
  css:    '#563D7C',     scss: '#CC6699', sass: '#CC6699',
  html:   '#E44D26',
  json:   '#6B8E23',
  markdown: '#4078C8',   md: '#4078C8',
  bash:   '#4EAA25',     shell: '#4EAA25', sh: '#4EAA25', zsh: '#4EAA25',
  powershell: '#5391FE', ps1: '#5391FE',
  sql:    '#BD9060',
  yaml:   '#CB171E',     yml: '#CB171E',
  diff:   '#F59E0B',
  c:      '#A8B9CC',     h: '#A8B9CC',
  cpp:    '#A8B9CC',     cc: '#A8B9CC', hpp: '#A8B9CC',
  java:   '#B07219',
  ruby:   '#CC342D',     rb: '#CC342D',
  php:    '#777BB4',
  kotlin: '#A97BFF',     kt: '#A97BFF',
  dart:   '#00B4AB',
  scala:  '#C22D40',
  r:      '#198CE7',
  lua:    '#000080',
};

const LANG_DISPLAY: Record<string, string> = {
  typescript: 'ts', tsx: 'tsx',
  javascript: 'js', jsx: 'jsx',
  python: 'py', py: 'py',
  rust: 'rs', rs: 'rs',
  markdown: 'md', md: 'md',
  bash: 'sh', shell: 'sh', sh: 'sh', zsh: 'zsh',
  powershell: 'ps1', ps1: 'ps1',
  yaml: 'yaml', yml: 'yaml',
  cpp: 'c++', cc: 'c++', hpp: 'c++',
};

export function getLangColor(info?: string): string {
  const raw = (info || '').trim().toLowerCase();
  return LANG_COLORS[raw] ?? '#6B7280';
}

export function getLangLabel(info?: string): string {
  const raw = (info || '').trim().toLowerCase();
  if (!raw || raw === 'plaintext') return 'text';
  return LANG_DISPLAY[raw] ?? raw;
}

