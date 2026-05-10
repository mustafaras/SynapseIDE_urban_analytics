import { useFileExplorerStore } from '../stores/fileExplorerStore';
import type { FileNode } from '../types/state';

const demoDataFolder: FileNode = {
  id: 'folder-data-demo',
  name: 'data',
  type: 'folder',
  path: '/src/data',
  lastModified: new Date(),
  isExpanded: true,
  children: [
    {
      id: 'file-districts-geojson-demo',
      name: 'districts.geojson',
      type: 'file',
      path: '/src/data/districts.geojson',
      content: '{"type":"FeatureCollection","features":[]}',
      language: 'json',
      size: 1024,
      lastModified: new Date(),
      semanticStatus: {
        mapLayerCandidate: true,
        synced: true,
      },
    },
    {
      id: 'file-transit-shp-demo',
      name: 'transit_buffer.shp',
      type: 'file',
      path: '/src/data/transit_buffer.shp',
      size: 8192,
      lastModified: new Date(),
      semanticStatus: {
        mapLayerCandidate: true,
      },
    },
    {
      id: 'file-transit-dbf-demo',
      name: 'transit_buffer.dbf',
      type: 'file',
      path: '/src/data/transit_buffer.dbf',
      size: 2048,
      lastModified: new Date(),
    },
    {
      id: 'file-baseline-parquet-demo',
      name: 'baseline_metrics.parquet',
      type: 'file',
      path: '/src/data/baseline_metrics.parquet',
      size: 16384,
      lastModified: new Date(),
      semanticStatus: {
        generated: true,
        analysisOutput: true,
      },
    },
    {
      id: 'file-equity-scenario-demo',
      name: 'equity_scenario.toml',
      type: 'file',
      path: '/src/data/equity_scenario.toml',
      content: '[scenario]\nname = "equity"\nyear = 2030',
      language: 'toml',
      size: 512,
      lastModified: new Date(),
      semanticStatus: {
        scenarioArtifact: true,
      },
    },
    {
      id: 'file-network-ipynb-demo',
      name: 'network_analysis.ipynb',
      type: 'file',
      path: '/src/data/network_analysis.ipynb',
      content: '{"cells":[],"metadata":{},"nbformat":4,"nbformat_minor":5}',
      language: 'python',
      size: 4096,
      lastModified: new Date(),
      isDirty: true,
    },
  ],
};

const cloneNode = (node: FileNode): FileNode => ({
  ...node,
  lastModified: new Date(node.lastModified),
  children: node.children?.map(cloneNode),
});

const ensureDemoFilesInTree = (files: FileNode[]): FileNode[] => {
  const rootSrc = files.find(node => node.path === '/src' && node.type === 'folder');
  if (!rootSrc) {
    return files;
  }

  const nextFiles = files.map(node => (node.path === '/src' ? { ...node } : node));
  const srcFolder = nextFiles.find(node => node.path === '/src' && node.type === 'folder');
  if (!srcFolder) {
    return files;
  }

  const srcChildren = [...(srcFolder.children || [])];
  const dataFolderIdx = srcChildren.findIndex(child => child.path === '/src/data' && child.type === 'folder');

  if (dataFolderIdx === -1) {
    srcChildren.push(cloneNode(demoDataFolder));
  } else {
    const dataFolder = { ...srcChildren[dataFolderIdx] };
    const existingChildren = [...(dataFolder.children || [])];
    const existingPaths = new Set(existingChildren.map(child => child.path));
    for (const demoChild of demoDataFolder.children || []) {
      if (!existingPaths.has(demoChild.path)) {
        existingChildren.push(cloneNode(demoChild));
      }
    }
    dataFolder.children = existingChildren;
    dataFolder.isExpanded = true;
    srcChildren[dataFolderIdx] = dataFolder;
  }

  srcFolder.children = srcChildren;
  srcFolder.isExpanded = true;
  return nextFiles;
};


export const createSampleProject = () => {
  const sampleFiles: FileNode[] = [
    {
      id: 'folder-src',
      name: 'src',
      type: 'folder',
      path: '/src',
      lastModified: new Date(),
      isExpanded: true,
      children: [
        {
          id: 'file-app-tsx',
          name: 'App.tsx',
          type: 'file',
          path: '/src/App.tsx',
          content: `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Synapse IDE</h1>
        <p>Professional development environment</p>
      </header>
    </div>
  );
}

export default App;`,
          language: 'typescript',
          lastModified: new Date(),
          size: 345,
        },
        {
          id: 'file-main-tsx',
          name: 'main.tsx',
          type: 'file',
          path: '/src/main.tsx',
          content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);`,
          language: 'typescript',
          lastModified: new Date(),
          size: 234,
        },
        {
          id: 'folder-components',
          name: 'components',
          type: 'folder',
          path: '/src/components',
          lastModified: new Date(),
          isExpanded: false,
          children: [
            {
              id: 'file-button-tsx',
              name: 'Button.tsx',
              type: 'file',
              path: '/src/components/Button.tsx',
              content: `import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ children, onClick, variant = 'primary' }) => {
  return (
    <button
      className={\`btn btn-\${variant}\`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};`,
              language: 'typescript',
              lastModified: new Date(),
              size: 412,
            },
          ],
        },
        {
          id: 'folder-styles',
          name: 'styles',
          type: 'folder',
          path: '/src/styles',
          lastModified: new Date(),
          isExpanded: false,
          children: [
            {
              id: 'file-index-css',
              name: 'index.css',
              type: 'file',
              path: '/src/styles/index.css',
              content: `
:root {
  --primary-color: var(--color-primary, #F59E0B);
  --background-dark: var(--color-background-secondary, #121212);
  --text-primary: var(--color-text, #FAFAF9);
}

body {
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  background: var(--background-dark);
  color: var(--text-primary);
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s var(--syn-easing-bauhaus);
}

.btn-primary {
  background: var(--primary-color);
  color: var(--color-background, #000000);
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}`,
              language: 'css',
              lastModified: new Date(),
              size: 567,
            },
          ],
        },
        cloneNode(demoDataFolder),
      ],
    },
    {
      id: 'file-package-json',
      name: 'package.json',
      type: 'file',
      path: '/package.json',
      content: `{
  "name": "synapse-ide",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}`,
      language: 'json',
      lastModified: new Date(),
      size: 434,
    },
    {
      id: 'file-README',
      name: 'README.md',
      type: 'file',
      path: '/README.md',
      content: `# Synapse IDE

A professional development environment built with React and TypeScript.

## Features

- Modern file explorer
- Fast code editing
- Beautiful UI with golden theme
- AI-powered assistance

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Tech Stack

- React 18
- TypeScript
- Vite
- Zustand for state management
- Monaco Editor
- Lucide React icons

Built for developers.`,
      language: 'markdown',
      lastModified: new Date(),
      size: 456,
    },
  ];


  useFileExplorerStore.getState().setFiles(sampleFiles);
};


export const initializeSampleData = () => {
  if (typeof window === 'undefined') {
  }
  const w = window as unknown as { __SAMPLE_DATA_INIT?: boolean };

  let persisted = false;
  try {
    persisted = !!window.localStorage.getItem('__sample_data_initialized');
  } catch {}
  if (w.__SAMPLE_DATA_INIT || persisted) {
    const files = useFileExplorerStore.getState().files;
    useFileExplorerStore.getState().setFiles(ensureDemoFilesInTree(files));
    return;
  }
  w.__SAMPLE_DATA_INIT = true;
  try { window.localStorage.setItem('__sample_data_initialized', '1'); } catch {}
  setTimeout(() => {
    createSampleProject();
    const files = useFileExplorerStore.getState().files;
    useFileExplorerStore.getState().setFiles(ensureDemoFilesInTree(files));
  }, 50);
};


interface SampleDataWindow extends Window { __SAMPLE_DATA_INIT?: boolean; resetSampleData?: () => void }
declare const window: SampleDataWindow;

let isDevEnv = false;
try { isDevEnv = typeof import.meta !== 'undefined' && !!(import.meta as unknown as { env?: Record<string, unknown> }).env?.DEV; } catch {}
if (typeof window !== 'undefined' && isDevEnv) {
  window.resetSampleData = () => {
    try { window.localStorage.removeItem('__sample_data_initialized'); } catch {}
    delete window.__SAMPLE_DATA_INIT;
  };
}
