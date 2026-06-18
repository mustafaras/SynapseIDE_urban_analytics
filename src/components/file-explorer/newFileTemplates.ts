// Lightweight template metadata for NewFileModal (MFP-10).
// Statically imported by the modal; the heavy content map lives in
// newFileTemplateContent.ts and is lazy-imported on file creation.
import { BarChart3, BookOpen, Cpu, Database, FileText, Globe, Smartphone, Terminal } from 'lucide-react';

export const LANGUAGE_CATEGORIES = {
  web: {
    name: 'Web Development',
    icon: Globe,
    color: '#F59E0B',
    languages: [
      { id: 'html', name: 'HTML', extension: 'html', description: 'Markup language for web pages' },
      { id: 'css', name: 'CSS', extension: 'css', description: 'Styling for web applications' },
      {
        id: 'scss',
        name: 'SCSS/Sass',
        extension: 'scss',
        description: 'CSS preprocessor with variables',
      },
      {
        id: 'javascript',
        name: 'JavaScript',
        extension: 'js',
        description: 'Dynamic web programming',
      },
      {
        id: 'typescript',
        name: 'TypeScript',
        extension: 'ts',
        description: 'Type-safe JavaScript',
      },
      {
        id: 'react',
        name: 'React/JSX',
        extension: 'tsx',
        description: 'React components and hooks',
      },
      { id: 'vue', name: 'Vue.js', extension: 'vue', description: 'Progressive web framework' },
      { id: 'angular', name: 'Angular', extension: 'ts', description: 'Enterprise web framework' },
      { id: 'svelte', name: 'Svelte', extension: 'svelte', description: 'Compiled web framework' },
    ],
  },
  backend: {
    name: 'Backend Development',
    icon: Database,
    color: '#22C55E',
    languages: [
      { id: 'python', name: 'Python', extension: 'py', description: 'General-purpose programming' },
      { id: 'java', name: 'Java', extension: 'java', description: 'Enterprise applications' },
      { id: 'csharp', name: 'C#', extension: 'cs', description: '.NET development' },
      { id: 'cpp', name: 'C++', extension: 'cpp', description: 'System programming' },
      { id: 'c', name: 'C', extension: 'c', description: 'Low-level programming' },
      { id: 'go', name: 'Go', extension: 'go', description: 'Cloud-native development' },
      { id: 'rust', name: 'Rust', extension: 'rs', description: 'Memory-safe systems programming' },
      { id: 'php', name: 'PHP', extension: 'php', description: 'Server-side web development' },
      { id: 'ruby', name: 'Ruby', extension: 'rb', description: 'Dynamic programming language' },
      { id: 'kotlin', name: 'Kotlin', extension: 'kt', description: 'Modern JVM language' },
      { id: 'scala', name: 'Scala', extension: 'scala', description: 'Functional JVM language' },
      { id: 'nodejs', name: 'Node.js', extension: 'js', description: 'Server-side JavaScript' },
    ],
  },
  mobile: {
    name: 'Mobile Development',
    icon: Smartphone,
    color: '#D97706',
    languages: [
      { id: 'swift', name: 'Swift', extension: 'swift', description: 'iOS development' },
      {
        id: 'objectivec',
        name: 'Objective-C',
        extension: 'm',
        description: 'Legacy iOS development',
      },
      { id: 'dart', name: 'Dart/Flutter', extension: 'dart', description: 'Cross-platform mobile' },
      {
        id: 'reactnative',
        name: 'React Native',
        extension: 'tsx',
        description: 'React for mobile',
      },
    ],
  },
  data: {
    name: 'Data Science & ML',
    icon: BarChart3,
  color: '#F59E0B',
    languages: [
      { id: 'python', name: 'Python', extension: 'py', description: 'Data science and ML' },
      { id: 'r', name: 'R', extension: 'r', description: 'Statistical computing' },
      { id: 'matlab', name: 'MATLAB', extension: 'm', description: 'Technical computing' },
      { id: 'julia', name: 'Julia', extension: 'jl', description: 'High-performance computing' },
    ],
  },
  database: {
    name: 'Database & Query',
    icon: Database,
    color: '#D97706',
    languages: [
      { id: 'sql', name: 'SQL', extension: 'sql', description: 'Database queries' },
      {
        id: 'postgresql',
        name: 'PostgreSQL',
        extension: 'sql',
        description: 'Advanced SQL database',
      },
      { id: 'mysql', name: 'MySQL', extension: 'sql', description: 'Popular SQL database' },
      { id: 'mongodb', name: 'MongoDB', extension: 'js', description: 'NoSQL database queries' },
    ],
  },
  devops: {
    name: 'DevOps & Config',
    icon: Terminal,
    color: '#84CC16',
    languages: [
      { id: 'bash', name: 'Bash/Shell', extension: 'sh', description: 'Unix shell scripting' },
      { id: 'powershell', name: 'PowerShell', extension: 'ps1', description: 'Windows automation' },
      { id: 'yaml', name: 'YAML', extension: 'yml', description: 'Configuration files' },
      { id: 'json', name: 'JSON', extension: 'json', description: 'Data interchange format' },
      {
        id: 'dockerfile',
        name: 'Dockerfile',
        extension: 'dockerfile',
        description: 'Container configuration',
      },
      {
        id: 'terraform',
        name: 'Terraform',
        extension: 'tf',
        description: 'Infrastructure as code',
      },
    ],
  },
  functional: {
    name: 'Functional Languages',
    icon: BookOpen,
    color: '#FCA5A5',
    languages: [
      {
        id: 'haskell',
        name: 'Haskell',
        extension: 'hs',
        description: 'Pure functional programming',
      },
      { id: 'erlang', name: 'Erlang', extension: 'erl', description: 'Concurrent programming' },
      { id: 'elixir', name: 'Elixir', extension: 'ex', description: 'Modern Erlang' },
      { id: 'clojure', name: 'Clojure', extension: 'clj', description: 'Lisp on JVM' },
    ],
  },
  system: {
    name: 'System Programming',
    icon: Cpu,
    color: '#8C8579',
    languages: [
      {
        id: 'assembly',
        name: 'Assembly',
        extension: 'asm',
        description: 'Low-level system programming',
      },
      { id: 'c', name: 'C', extension: 'c', description: 'System programming' },
      {
        id: 'cpp',
        name: 'C++',
        extension: 'cpp',
        description: 'System and application programming',
      },
      { id: 'rust', name: 'Rust', extension: 'rs', description: 'Memory-safe systems programming' },
    ],
  },
  config: {
    name: 'Config & Documentation',
    icon: FileText,
    color: '#A8A29E',
    languages: [
      { id: 'markdown', name: 'Markdown', extension: 'md', description: 'Documentation and notes' },
      { id: 'plain', name: 'Plain Text', extension: 'txt', description: 'Simple text files' },
      { id: 'xml', name: 'XML', extension: 'xml', description: 'Markup language' },
      { id: 'toml', name: 'TOML', extension: 'toml', description: 'Configuration format' },
      { id: 'ini', name: 'INI', extension: 'ini', description: 'Configuration files' },
    ],
  },
  latexdocs: {
    name: 'LaTeX & Papers',
    icon: FileText,
    color: '#FDE68A',
    languages: [
      {
        id: 'latex',
        name: 'LaTeX',
        extension: 'tex',
        description: 'Scientific typesetting language',
      },
      { id: 'bibtex', name: 'BibTeX', extension: 'bib', description: 'Bibliography database' },
    ],
  },
};


export const TEMPLATE_TYPES = {

  javascript: [
    { id: 'vanilla', name: 'Vanilla JS', description: 'Pure JavaScript without frameworks' },
    { id: 'module', name: 'ES6 Module', description: 'Modern JavaScript module' },
    { id: 'node', name: 'Node.js Script', description: 'Server-side JavaScript' },
    { id: 'class', name: 'ES6 Class', description: 'Object-oriented JavaScript' },
  ],
  typescript: [
    { id: 'basic', name: 'Basic TypeScript', description: 'Type-safe JavaScript' },
    { id: 'module', name: 'TS Module', description: 'TypeScript module with types' },
    { id: 'class', name: 'TypeScript Class', description: 'OOP with TypeScript' },
    { id: 'interface', name: 'Interface Definition', description: 'Type definitions' },
  ],
  react: [
    { id: 'component', name: 'Functional Component', description: 'React functional component' },
    { id: 'hook', name: 'Custom Hook', description: 'Reusable React hook' },
    { id: 'page', name: 'Page Component', description: 'Full page component' },
    { id: 'context', name: 'Context Provider', description: 'React context' },
  ],
  vue: [
    { id: 'sfc', name: 'Single File Component', description: 'Vue SFC with Composition API' },
    { id: 'composable', name: 'Composable', description: 'Vue 3 composable function' },
    { id: 'store', name: 'Pinia Store', description: 'State management' },
  ],


  python: [
    { id: 'script', name: 'Python Script', description: 'Basic Python script' },
    { id: 'class', name: 'Class Module', description: 'Object-oriented Python' },
    { id: 'flask', name: 'Flask App', description: 'Web application with Flask' },
    { id: 'fastapi', name: 'FastAPI App', description: 'Modern Python API' },
    { id: 'django', name: 'Django App', description: 'Django application' },
  ],
  java: [
    { id: 'class', name: 'Java Class', description: 'Java class with main method' },
    { id: 'interface', name: 'Interface', description: 'Java interface definition' },
    { id: 'spring', name: 'Spring Boot', description: 'Spring Boot application' },
    { id: 'servlet', name: 'Servlet', description: 'Web servlet' },
  ],
  go: [
    { id: 'main', name: 'Main Package', description: 'Go main package' },
    { id: 'package', name: 'Package', description: 'Go package' },
    { id: 'web', name: 'Web Server', description: 'HTTP server' },
    { id: 'cli', name: 'CLI Tool', description: 'Command line tool' },
  ],
  rust: [
    { id: 'main', name: 'Main Binary', description: 'Rust main binary' },
    { id: 'lib', name: 'Library', description: 'Rust library' },
    { id: 'web', name: 'Web Server', description: 'Axum/Warp web server' },
  ],


  cpp: [
    { id: 'main', name: 'Main Function', description: 'C++ with main function' },
    { id: 'class', name: 'Class Definition', description: 'C++ class' },
    { id: 'header', name: 'Header File', description: 'C++ header file' },
  ],
  c: [
    { id: 'main', name: 'Main Function', description: 'C with main function' },
    { id: 'header', name: 'Header File', description: 'C header file' },
  ],


  swift: [
    { id: 'app', name: 'iOS App', description: 'SwiftUI app' },
    { id: 'view', name: 'SwiftUI View', description: 'UI component' },
    { id: 'model', name: 'Data Model', description: 'Swift data model' },
  ],
  dart: [
    { id: 'app', name: 'Flutter App', description: 'Flutter application' },
    { id: 'widget', name: 'Widget', description: 'Flutter widget' },
    { id: 'model', name: 'Data Model', description: 'Dart data model' },
  ],


  html: [{ id: 'basic', name: 'HTML Page', description: 'Complete HTML document' }],
  css: [{ id: 'basic', name: 'CSS Stylesheet', description: 'CSS styles and layouts' }],
  scss: [{ id: 'basic', name: 'SCSS Stylesheet', description: 'SCSS with variables and mixins' }],
  csharp: [{ id: 'basic', name: 'C# Class', description: 'C# class with namespace' }],
  php: [{ id: 'basic', name: 'PHP Script', description: 'PHP web script' }],
  ruby: [{ id: 'basic', name: 'Ruby Script', description: 'Ruby script' }],
  kotlin: [{ id: 'basic', name: 'Kotlin Class', description: 'Kotlin class' }],
  scala: [{ id: 'basic', name: 'Scala Object', description: 'Scala object' }],
  sql: [{ id: 'basic', name: 'SQL Query', description: 'SQL database query' }],
  bash: [{ id: 'basic', name: 'Shell Script', description: 'Bash shell script' }],
  powershell: [
    { id: 'basic', name: 'PowerShell Script', description: 'Windows PowerShell script' },
  ],
  yaml: [{ id: 'basic', name: 'YAML Config', description: 'YAML configuration file' }],
  json: [{ id: 'basic', name: 'JSON Data', description: 'Structured data format' }],
  markdown: [{ id: 'basic', name: 'Markdown Doc', description: 'Documentation template' }],
  plain: [{ id: 'basic', name: 'Text File', description: 'Plain text document' }],
  latex: [
    { id: 'basic', name: 'Basic Article', description: 'Minimal article template' },
    { id: 'article', name: 'Article', description: 'Academic article structure' },
    { id: 'report', name: 'Report', description: 'Report / thesis structure' },
    { id: 'beamer', name: 'Beamer Slides', description: 'Presentation slides' },
    { id: 'book', name: 'Book', description: 'Book document class' },
  ],
  bibtex: [{ id: 'basic', name: 'BibTeX DB', description: 'Sample bibliography entries' }],
  r: [{ id: 'basic', name: 'R Script', description: 'R statistical script' }],
  haskell: [{ id: 'basic', name: 'Haskell Module', description: 'Haskell functional module' }],
  assembly: [{ id: 'basic', name: 'Assembly Code', description: 'Assembly language code' }],
};
