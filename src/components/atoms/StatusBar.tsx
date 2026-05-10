import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Clock,
  Code2,
  CornerDownLeft,
  Cpu,
  FileCode,
  FileText,
  GitBranch,
  Hash,
  MapPin,
  MemoryStick,
  Scissors,
  Settings,
  Type,
  Wifi,
  WifiOff,
  XCircle,
  Zap,
} from 'lucide-react';

interface StatusBarProps {
  language: string;
  content: string;
  cursorPosition?: { line: number; column: number };
  encoding?: string;
  lineEnding?: string;
  tabSize?: number;
  indentation?: 'spaces' | 'tabs';
  fontSize?: number;
  errors?: number;
  warnings?: number;
  isLiveServer?: boolean;
  gitBranch?: string;
  isModified?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  language = 'javascript',
  content,
  cursorPosition = { line: 1, column: 1 },
  encoding = 'UTF-8',
  lineEnding = 'LF',
  tabSize = 2,
  indentation = 'spaces',
  errors = 0,
  warnings = 0,
  isLiveServer = false,
  gitBranch = 'main',
  isModified = false,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cpuUsage, setCpuUsage] = useState(Math.floor(Math.random() * 20) + 5);
  const [memoryUsage, setMemoryUsage] = useState(Math.floor(Math.random() * 30) + 40);


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 30) + 5);
      setMemoryUsage(Math.floor(Math.random() * 40) + 30);
    }, 3000);
    return () => clearInterval(interval);
  }, []);


  const lineCount = content.split('\n').length;
  const charCount = content.length;
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  const selectedText = '';
  const selectedChars = selectedText.length;

  const getLanguageIcon = (lang: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
  javascript: <Code2 size={12} color="#F59E0B" />,
      typescript: <Code2 size={12} color="#3178C6" />,
      html: <FileCode size={12} color="#E34F26" />,
      css: <Type size={12} color="#1572B6" />,
  json: <FileText size={12} color="#F59E0B" />,
      python: <Code2 size={12} color="#3776AB" />,
      java: <Code2 size={12} color="#ED8B00" />,
      cpp: <Zap size={12} color="#00599C" />,
      csharp: <Code2 size={12} color="#239120" />,
      go: <Code2 size={12} color="#00ADD8" />,
      rust: <Settings size={12} color="#CE422B" />,
      php: <Code2 size={12} color="#777BB4" />,
      ruby: <Code2 size={12} color="#CC342D" />,
      swift: <Code2 size={12} color="#FA7343" />,
      kotlin: <Code2 size={12} color="#0095D5" />,
    };
  return iconMap[lang.toLowerCase()] || <FileText size={12} color="#F59E0B" />;
  };

  return (
    <div
      data-component="status-bar"
      className="status-bar"
      style={{
        height: '24px',
        background: 'var(--syn-gradient-surface)',
        borderTop: '2px solid transparent',
        borderImage:
          'linear-gradient(90deg, rgba(245, 158, 11, 0.6), rgba(245, 158, 11, 0.3), rgba(245, 158, 11, 0.6)) 1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        fontSize: '11px',
        fontFamily: 'JetBrains Mono, Fira Code, SF Mono, Consolas, monospace',
        fontWeight: '500',
  color: '#F59E0B',
        userSelect: 'none',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        overflow: 'hidden',
        boxShadow:
          '0 -4px 16px rgba(0, 0, 0, 0.4), 0 -2px 8px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(245, 158, 11, 0.15)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: 'var(--syn-glow-subtle)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(245, 158, 11, 0.22)';
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.55)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.35)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--syn-glow-subtle)';
          }}
        >
          <GitBranch size={12} color="#F59E0B" />
          <span style={{ color: '#F59E0B', fontWeight: 'bold', fontSize: '10px' }}>
            {gitBranch}
          </span>
          {isModified ? <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#EF4444',
                marginLeft: '4px',
              }}
            /> : null}
        </div>

        {}
        {isLiveServer ? <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              background: 'rgba(34, 197, 94, 0.2)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <Activity size={12} color="#22C55E" />
            <span style={{ color: '#22C55E', fontSize: '10px', fontWeight: 'bold' }}>LIVE</span>
          </div> : null}

        {}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: 'var(--syn-glow-subtle)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(245, 158, 11, 0.22)';
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.55)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.35)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--syn-glow-subtle)';
          }}
        >
          {getLanguageIcon(language)}
          <span
            style={{
              color: '#F59E0B',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: '10px',
            }}
          >
            {language}
          </span>
        </div>

        {}
        {(errors > 0 || warnings > 0) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            {errors > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 6px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '4px',
                }}
              >
                <XCircle size={12} color="#EF4444" />
                <span style={{ color: '#EF4444', fontSize: '10px', fontWeight: 'bold' }}>
                  {errors}
                </span>
              </div>
            )}
            {warnings > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 6px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '4px',
                }}
              >
                <AlertTriangle size={12} color="#F59E0B" />
                <span style={{ color: '#F59E0B', fontSize: '10px', fontWeight: 'bold' }}>
                  {warnings}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            color: '#D6D3D1',
            fontSize: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FileText size={10} color="#F59E0B" />
            <span style={{ color: '#F59E0B' }}>{lineCount}</span>
            <span style={{ color: '#8C8579', fontSize: '9px' }}>lines</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Type size={10} color="#F59E0B" />
            <span style={{ color: '#F59E0B' }}>{wordCount}</span>
            <span style={{ color: '#8C8579', fontSize: '9px' }}>words</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Hash size={10} color="#F59E0B" />
            <span style={{ color: '#F59E0B' }}>{charCount}</span>
            <span style={{ color: '#8C8579', fontSize: '9px' }}>chars</span>
          </div>
          {selectedChars > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Scissors size={10} color="#FCD34D" />
              <span style={{ color: '#FCD34D' }}>{selectedChars}</span>
              <span style={{ color: '#8C8579', fontSize: '9px' }}>selected</span>
            </div>
          )}
        </div>

        {}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#D6D3D1',
            fontSize: '10px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              background: cpuUsage > 80 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.1)',
              border: `1px solid ${cpuUsage > 80 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.3)'}`,
              borderRadius: '3px',
            }}
          >
            <Cpu size={10} color={cpuUsage > 80 ? '#EF4444' : '#F59E0B'} />
            <span style={{ color: cpuUsage > 80 ? '#EF4444' : '#F59E0B', fontWeight: 'bold' }}>
              {cpuUsage}%
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              background: memoryUsage > 85 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.1)',
              border: `1px solid ${memoryUsage > 85 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.3)'}`,
              borderRadius: '3px',
            }}
          >
            <MemoryStick size={10} color={memoryUsage > 85 ? '#EF4444' : '#F59E0B'} />
            <span style={{ color: memoryUsage > 85 ? '#EF4444' : '#F59E0B', fontWeight: 'bold' }}>
              {memoryUsage}%
            </span>
          </div>
        </div>
      </div>

      {}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: 'var(--syn-glow-subtle)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(245, 158, 11, 0.22)';
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.55)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.35)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--syn-glow-subtle)';
          }}
        >
          <MapPin size={12} color="#F59E0B" />
          <span style={{ color: '#F59E0B', fontWeight: 'bold', fontSize: '10px' }}>
            {cursorPosition.line}:{cursorPosition.column}
          </span>
        </div>

        {}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            color: '#D6D3D1',
            padding: '2px 6px',
            borderRadius: '3px',
            transition: 'var(--syn-transition-medium)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Settings size={10} color="#8C8579" />
          <span style={{ fontSize: '10px', color: '#8C8579' }}>
            {indentation === 'spaces' ? `${tabSize} Spaces` : `${tabSize} Tabs`}
          </span>
        </div>

        {}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#D6D3D1',
            cursor: 'pointer',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '3px',
            transition: 'var(--syn-transition-medium)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <FileCode size={10} color="#8C8579" />
          <span style={{ color: '#8C8579' }}>{encoding}</span>
        </div>

        {}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#D6D3D1',
            cursor: 'pointer',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '3px',
            transition: 'var(--syn-transition-medium)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <CornerDownLeft size={10} color="#8C8579" />
          <span style={{ color: '#8C8579' }}>{lineEnding}</span>
        </div>

        {}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            fontSize: '10px',
            padding: '4px 6px',
            background: isOnline ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            border: `1px solid ${isOnline ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            borderRadius: '4px',
          }}
        >
          {isOnline ? <Wifi size={10} color="#22C55E" /> : <WifiOff size={10} color="#EF4444" />}
          <span style={{ color: isOnline ? '#22C55E' : '#EF4444', fontWeight: 'bold' }}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '10px',
            fontWeight: 'bold',
            padding: '4px 10px',
            background: 'rgba(245, 158, 11, 0.25)',
            border: '1.5px solid rgba(245, 158, 11, 0.5)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: 'var(--syn-glow-subtle)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(245, 158, 11, 0.35)';
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.7)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(245, 158, 11, 0.25)';
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.5)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--syn-glow-subtle)';
          }}
        >
          <Clock size={10} color="#F59E0B" />
          <span style={{ color: '#F59E0B' }}>
            {currentTime.toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>
      </div>

      {}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: var(--syn-glow-subtle);
          }
          50% {
            box-shadow: var(--shadow-glow);
          }
        }

        @keyframes slideIn {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .status-bar {
          animation: slideIn 0.3s ease-out;
        }


        .status-bar::-webkit-scrollbar {
          height: 2px;
        }

        .status-bar::-webkit-scrollbar-track {
          background: rgba(245, 158, 11, 0.08);
        }

        .status-bar::-webkit-scrollbar-thumb {
          background: rgba(245, 158, 11, 0.4);
          border-radius: 1px;
        }

        .status-bar::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 158, 11, 0.6);
        }


        @media (max-width: 768px) {
          .status-bar {
            padding: 0 8px;
            font-size: 10px;
          }
        }


        @media (prefers-contrast: high) {
          .status-bar {
            background: #000000 !important;
            border-top: 2px solid #F59E0B !important;
            color: #FFFFFF !important;
          }
        }


        @media (prefers-reduced-motion: reduce) {
          .status-bar,
          .status-bar * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};
