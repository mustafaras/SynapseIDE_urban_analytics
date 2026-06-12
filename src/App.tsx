/* eslint-disable no-console */

import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { GlobalStyles } from './styles/GlobalStyles';
import Button from './components/atoms/Button';
import Input from './components/atoms/Input';
import AppThemeProvider from '@/app/AppThemeProvider';
import StatusBar from './components/StatusBar/StatusBar';
import NewProjectModal from './components/molecules/NewProjectModal';
import ErrorBoundary from './components/utilities/ErrorBoundary';
import TestHarness from './components/utilities/TestHarness';
import { AiAssistant } from './components/ai.ts';
import WelcomeModal from '@/features/urbanAnalytics/WelcomeModal';
import '@/styles/fonts.css';
import '@/styles/ui.css';
import SynapseHomepage from './components/templates/SynapseHomepage';
import { EnhancedIDE } from './components/ide/EnhancedIDE';
import CenterPanelShell from '@/centerpanel/CenterPanelShell';
import { FileExplorer } from './components/file-explorer/FileExplorer';

import { Code, FolderOpen, Monitor, Moon, Plus, Sun } from 'lucide-react';
import { storage } from './services/storage';
import { initializeSampleData } from './utils/sampleData';
import { wireNetworkEvents } from './utils/resilience/netEvents';
import { flags } from './config/flags';
import { useAppStore } from './stores/appStore';
import { useTemporalLayerStore } from '@/stores/useTemporalLayerStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useSynapseWorkspaceStore } from '@/stores/useSynapseWorkspaceStore';
import { useUrbanStore } from './features/urbanAnalytics/store';
import { ChunkLoadBoundary, lazyWithRetry } from '@/utils/lazyWithRetry';

const UrbanAnalyticsModal = lazyWithRetry(() => import('@/features/urbanAnalytics/UrbanAnalyticsModal'));
const MapExplorerHost = lazyWithRetry(() => import('@/centerpanel/components/MapExplorerHost'));

function ModalLoadingFallback({ label, testId }: { label: string; testId: string }) {
  return (
    <div
      data-testid={testId}
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483646,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--syn-surface-overlay)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          borderRadius: 14,
          background: 'var(--syn-surface-elevated)',
          border: '1px solid var(--syn-border-default)',
          color: 'var(--syn-text-default)',
          boxShadow: 'var(--shadow-overlay)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="var(--syn-border-strong)" strokeWidth="3" />
          <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="var(--syn-interaction-active)" strokeLinecap="round" strokeWidth="3">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 12 12"
              to="360 12 12"
              dur="0.85s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
        <span>{label}</span>
      </div>
    </div>
  );
}

const ThemeToggle: React.FC = () => {
  const { themeName, toggleTheme } = useTheme();

  const getIcon = () => {
    switch (themeName) {
      case 'light':
        return <Sun size={16} />;
      case 'dark':
        return <Moon size={16} />;
      case 'neutral':
        return <Monitor size={16} />;
      default:
        return <Monitor size={16} />;
    }
  };

  return (
    <Button
      className="active-chip focus-ring"
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      icon={getIcon()}
      aria-label={`Switch to ${themeName === 'light' ? 'dark' : themeName === 'dark' ? 'neutral' : 'light'} theme`}
    >
      {themeName}
    </Button>
  );
};

interface DemoPageProps { onOpenAnalytics: () => void }
const DemoPage: React.FC<DemoPageProps> = ({ onOpenAnalytics }) => {

  const loadPersisted = useSettingsStore(s => s.loadPersisted);
  useEffect(() => { try { loadPersisted().catch(() => {}); } catch {} }, [loadPersisted]);
  useEffect(() => { wireNetworkEvents(); }, []);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  const [recentProjects, setRecentProjects] = useState(() => storage.getRecentProjects());

  const handleCreateProject = async (projectData: {
    name: string;
    template: string;
    description?: string;
  }) => {

    const newProject = {
      id: Date.now().toString(),
      name: projectData.name,
      template: projectData.template,
      description: projectData.description,
      createdAt: new Date().toISOString(),
    };


    const updatedProjects = [newProject, ...recentProjects].slice(0, 10);
    setRecentProjects(updatedProjects);
    storage.setRecentProjects(updatedProjects);

    console.log('Project created:', newProject);
  };

  const handleOpenProject = (project: any) => {
    console.log('Opening project:', project);

  };


  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--app-shell-bg)',
        fontFamily: 'var(--font-family-primary)',
        transition: 'all 300ms var(--timing-function-global)',
      }}
    >
      <header
        className="glass-surface"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'var(--glass-background)',
          backdropFilter: 'var(--blur-glass)',
          WebkitBackdropFilter: 'var(--blur-glass)',
          borderBottom: '1px solid var(--app-shell-border)',
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            paddingInline: 'clamp(1rem, 5vw, 4rem)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--spacing-lg) clamp(1rem, 5vw, 4rem)',
            transition: 'all 300ms var(--timing-function-global)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                borderRadius: 'var(--border-radius-md)',
                padding: 'var(--spacing-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Code size={24} color="white" />
            </div>
            <div>
              <h1
                className="glow-text"
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-xl)',
                  fontFamily: 'var(--font-family-brand)',
                  fontWeight: 'var(--font-weight-bold)',
                  lineHeight: 'var(--line-height-tight)',
                }}
              >
                SynapseIDE
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-family-primary)',
                }}
              >
                Professional Development Environment
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            {}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {}
      <section
      style={{
        background: `linear-gradient(135deg,
            var(--app-shell-bg) 0%,
            color-mix(in srgb, var(--syn-interaction-active) 6%, var(--app-shell-bg)) 50%,
            var(--app-shell-bg) 100%)`,
          borderBottom: '1px solid var(--app-shell-border)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            paddingInline: 'clamp(1rem, 5vw, 4rem)',
            padding: 'var(--spacing-xxl) clamp(1rem, 5vw, 4rem) var(--spacing-xl)',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 'var(--spacing-lg)',
              animation: 'pulse-glow 3s ease-in-out infinite',
            }}
          >
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                minWidth: '80px',
                minHeight: '80px',
                filter: 'drop-shadow(0 0 20px currentColor)',
              }}
            >
              <defs>
                <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--logo-color-primary)" />
                  <stop offset="100%" stopColor="var(--logo-color-secondary)" />
                </linearGradient>
              </defs>
              {}
              <circle
                cx="40"
                cy="40"
                r="38"
                stroke="url(#logo-gradient)"
                strokeWidth="2"
                fill="none"
                opacity="0.3"
              />
              <circle
                cx="40"
                cy="40"
                r="28"
                stroke="url(#logo-gradient)"
                strokeWidth="2"
                fill="none"
                opacity="0.5"
              />
              <circle
                cx="40"
                cy="40"
                r="18"
                stroke="url(#logo-gradient)"
                strokeWidth="2"
                fill="none"
                opacity="0.7"
              />
              <circle cx="40" cy="40" r="8" fill="url(#logo-gradient)" />
              {}
              <line
                x1="20"
                y1="20"
                x2="35"
                y2="35"
                stroke="url(#logo-gradient)"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <line
                x1="60"
                y1="20"
                x2="45"
                y2="35"
                stroke="url(#logo-gradient)"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <line
                x1="20"
                y1="60"
                x2="35"
                y2="45"
                stroke="url(#logo-gradient)"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <line
                x1="60"
                y1="60"
                x2="45"
                y2="45"
                stroke="url(#logo-gradient)"
                strokeWidth="1.5"
                opacity="0.6"
              />
              {}
              <circle cx="20" cy="20" r="3" fill="url(#logo-gradient)" opacity="0.8" />
              <circle cx="60" cy="20" r="3" fill="url(#logo-gradient)" opacity="0.8" />
              <circle cx="20" cy="60" r="3" fill="url(#logo-gradient)" opacity="0.8" />
              <circle cx="60" cy="60" r="3" fill="url(#logo-gradient)" opacity="0.8" />
            </svg>
          </div>

          {}
          <p
            style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text-secondary)',
              margin: '0 0 var(--spacing-md) 0',
              fontFamily: 'var(--font-family-primary)',
            }}
          >
            Welcome To
          </p>

          {}
          <h1
            style={{
              fontSize: 'clamp(3.5rem, 8vw, 5rem)',
              fontWeight: '800',
              lineHeight: '0.9',
              margin: '0 0 var(--spacing-lg) 0',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-warning) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 40px var(--color-primary)',
              fontFamily: 'var(--font-family-brand)',
              letterSpacing: '-0.02em',
              filter: 'drop-shadow(0 0 20px var(--color-primary))',
            }}
          >
            SynapseIDE
          </h1>

          {}
          <p
            style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              fontVariant: 'small-caps',
              letterSpacing: '1rem',
              color: 'var(--color-text-secondary)',
              margin: '0 0 var(--spacing-xl) 0',
              fontFamily: 'var(--font-family-primary)',
              textShadow: '0 2px 4px var(--syn-depth-subtle)',
            }}
          >
            The Future of Development
          </p>

          {}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'var(--spacing-md)',
              flexWrap: 'wrap',
            }}
          >
            <div className="active-chip" style={{ padding: 'var(--spacing-xs) var(--spacing-md)' }}>
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                Inter Typography
              </span>
            </div>
            <div
              className="active-chip"
              style={{
                padding: 'var(--spacing-xs) var(--spacing-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)',
                background:
                  'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 16%, transparent), color-mix(in srgb, var(--color-primary) 8%, transparent))',
                border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)',
                borderRadius: '6px',
                transition: 'var(--syn-transition-slow)',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, var(--color-primary), var(--color-warning))',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '600',
                  color: 'var(--color-primary)',
                  letterSpacing: '0.5px',
                }}
              >
                Glassmorphism
              </span>
            </div>
            <div
              className="active-chip"
              style={{
                padding: 'var(--spacing-xs) var(--spacing-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)',
                background:
                  'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 16%, transparent), color-mix(in srgb, var(--color-primary) 8%, transparent))',
                border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)',
                borderRadius: '6px',
                transition: 'var(--syn-transition-slow)',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '2px',
                  background: 'linear-gradient(45deg, var(--color-primary), var(--color-warning))',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '600',
                  color: 'var(--color-primary)',
                  letterSpacing: '0.5px',
                }}
              >
                12-Column Grid
              </span>
            </div>
            <div
              className="active-chip"
              style={{
                padding: 'var(--spacing-xs) var(--spacing-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)',
                background:
                  'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 16%, transparent), color-mix(in srgb, var(--color-primary) 8%, transparent))',
                border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)',
                borderRadius: '6px',
                transition: 'var(--syn-transition-slow)',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, var(--color-warning), var(--color-secondary, var(--color-primary)))',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '600',
                  color: 'var(--color-warning)',
                  letterSpacing: '0.5px',
                }}
              >
                Max Contrast
              </span>
            </div>
          </div>
        </div>
      </section>

      <main
        style={{
          flex: 1,
          background: 'var(--app-shell-bg)',
          transition: 'all 300ms var(--timing-function-global)',
          padding: 'var(--spacing-xl) 0',
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            paddingInline: 'clamp(1rem, 5vw, 4rem)',
          }}
        >
          <div className="grid" style={{ gap: 'var(--spacing-lg)', alignItems: 'start' }}>
            {}
            <div className="col-12 col-md-6">
              <div
                className="glass-surface"
                style={{ padding: 'var(--spacing-xl)', height: '100%' }}
              >
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <h2
                    className="glow-text"
                    style={{
                      marginBottom: 'var(--spacing-md)',
                      fontSize: 'var(--font-size-xxl)',
                      fontFamily: 'var(--font-family-brand)',
                      fontWeight: 'var(--font-weight-bold)',
                      lineHeight: 'var(--line-height-tight)',
                    }}
                  >
                    Welcome to SynapseIDE
                  </h2>
                  <p
                    style={{
                      color: 'var(--color-text-secondary)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--font-size-md)',
                      lineHeight: 'var(--line-height-relaxed)',
                      marginBottom: 'var(--spacing-lg)',
                    }}
                  >
                    A revolutionary IDE with advanced AI assistance, glassmorphism design, and
                    maximum contrast for accessibility. Built with modern web technologies and
                    Bauhaus design principles.
                  </p>
                </div>

                {}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-lg)',
                  }}
                >
                  <Button
                    className="focus-ring"
                    variant="primary"
                    icon={<Plus size={16} />}
                    onClick={() => setIsNewProjectModalOpen(true)}
                  >
                    New Project
                  </Button>
                  <Button
                    className="focus-ring"
                    variant="secondary"
                    icon={<FolderOpen size={16} />}
                  >
                    Open File
                  </Button>
                  <Button
                    className="focus-ring"
                    variant="ghost"
                    onClick={onOpenAnalytics}
                  >
                    Urban Analytics
                  </Button>
                </div>

                {}
                <div className="focus-ring">
                  <Input
                    label="Quick Search"
                    placeholder="Search projects, files, or commands..."
                  />
                </div>
              </div>
            </div>

            {}
            <div className="col-12 col-md-6">
              <div
                className="glass-surface"
                style={{ padding: 'var(--spacing-xl)', height: '100%' }}
              >
                <h3
                  className="glow-text"
                  style={{
                    marginBottom: 'var(--spacing-lg)',
                    fontSize: 'var(--font-size-xl)',
                    fontFamily: 'var(--font-family-brand)',
                    fontWeight: 'var(--font-weight-semibold)',
                    lineHeight: 'var(--line-height-tight)',
                  }}
                >
                  Recent Projects
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  {recentProjects.length > 0 ? (
                    recentProjects.slice(0, 5).map((project: any, index: number) => (
                      <div
                        key={project.id || index}
                        className="active-chip focus-ring"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenProject(project); } }}
                        onClick={() => handleOpenProject(project)}
                        style={{
                          padding: 'var(--spacing-md)',
                          cursor: 'pointer',
                          borderRadius: 'var(--border-radius-md)',
                          transition: 'all 300ms var(--timing-function-global)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color: 'var(--color-text)',
                                fontWeight: 'var(--font-weight-medium)',
                                fontFamily: 'var(--font-family-primary)',
                                fontSize: 'var(--font-size-md)',
                                marginBottom: 'var(--spacing-xs)',
                              }}
                            >
                              {project.name}
                            </div>
                            {project.template ? <div
                                style={{
                                  fontSize: 'var(--font-size-sm)',
                                  color: 'var(--color-text-secondary)',
                                  fontFamily: 'var(--font-family-primary)',
                                }}
                              >
                                {project.template}
                              </div> : null}
                          </div>
                          <Button variant="ghost" size="sm" className="focus-ring">
                            Open
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      className="glass-surface"
                      style={{
                        padding: 'var(--spacing-xl)',
                        textAlign: 'center',
                        border: '2px dashed var(--color-border)',
                        borderRadius: 'var(--border-radius-lg)',
                      }}
                    >
                      <p
                        style={{
                          color: 'var(--color-text-secondary)',
                          fontStyle: 'italic',
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--font-size-md)',
                          margin: 0,
                        }}
                      >
                        No recent projects. Create your first project to get started!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {}
            <div className="col-12">
              <div className="glass-surface" style={{ padding: 'var(--spacing-xl)' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                  <h3
                    className="glow-text"
                    style={{
                      marginBottom: 'var(--spacing-md)',
                      fontSize: 'var(--font-size-xxl)',
                      fontFamily: 'var(--font-family-brand)',
                      fontWeight: 'var(--font-weight-bold)',
                      lineHeight: 'var(--line-height-tight)',
                    }}
                  >
                    Powerful IDE Features
                  </h3>
                  <p
                    style={{
                      color: 'var(--color-text-secondary)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--font-size-lg)',
                      lineHeight: 'var(--line-height-relaxed)',
                      maxWidth: '600px',
                      margin: '0 auto',
                    }}
                  >
                    Experience next-generation development tools designed for modern workflows
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 'var(--spacing-lg)',
                    maxWidth: '1200px',
                    margin: '0 auto',
                  }}
                >
                  {[
                    {
                      name: 'Monaco Editor',
                      desc: 'Industry-standard code editor with advanced IntelliSense',
                      icon: '--',
                    },
                    {
                      name: 'AI Assistant',
                      desc: 'Intelligent code completion and AI-powered suggestions',
                      icon: '--',
                    },
                    {
                      name: 'Multi-Language',
                      desc: 'Support for 30+ programming languages and frameworks',
                      icon: '--',
                    },
                    {
                      name: 'Git Integration',
                      desc: 'Built-in version control with visual diff and merge tools',
                      icon: '--',
                    },
                    {
                      name: 'Live Collaboration',
                      desc: 'Real-time team coding with synchronized editing',
                      icon: '--',
                    },
                    {
                      name: 'Plugin System',
                      desc: 'Extensible architecture with rich ecosystem support',
                      icon: '--',
                    },
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="active-chip focus-ring"
                      style={{
                        padding: 'var(--spacing-lg)',
                        textAlign: 'center',
                        background: 'var(--glass-background)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--border-radius-lg)',
                        transition: 'all 300ms var(--timing-function-global)',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '2rem',
                          marginBottom: 'var(--spacing-md)',
                          lineHeight: 1,
                        }}
                      >
                        {feature.icon}
                      </div>
                      <h4
                        style={{
                          margin: 0,
                          marginBottom: 'var(--spacing-sm)',
                          fontSize: 'var(--font-size-lg)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-text)',
                          fontFamily: 'var(--font-family-brand)',
                          lineHeight: 'var(--line-height-tight)',
                        }}
                      >
                        {feature.name}
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-secondary)',
                          lineHeight: 'var(--line-height-relaxed)',
                          fontFamily: 'var(--font-family-primary)',
                        }}
                      >
                        {feature.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {}
      {(() => {
        try {
          const sp = new URLSearchParams(window.location.search);
          if (sp.get('tests') === '1') {
            return <TestHarness />;
          }
        } catch {}
        return null;
      })()}

      <footer
        className="glass-surface"
        style={{
          marginTop: 'auto',
          background: 'var(--glass-background)',
          borderTop: '1px solid var(--app-shell-border)',
          backdropFilter: 'var(--blur-glass)',
          WebkitBackdropFilter: 'var(--blur-glass)',
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            paddingInline: 'clamp(1rem, 5vw, 4rem)',
            padding: 'var(--spacing-lg) clamp(1rem, 5vw, 4rem)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--spacing-lg)',
              alignItems: 'center',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            <div>
              <h4
                className="glow-text"
                style={{
                  margin: 0,
                  marginBottom: 'var(--spacing-xs)',
                  fontSize: 'var(--font-size-md)',
                  fontFamily: 'var(--font-family-brand)',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                SynapseIDE
              </h4>
              <p
                style={{
                  margin: 0,
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                }}
              >
                Next-generation development environment
              </p>
            </div>

            <div>
              <p
                style={{
                  margin: 0,
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  lineHeight: 'var(--line-height-relaxed)',
                }}
              >
                Built with React, TypeScript, and Bauhaus design principles.
                <br />
                <span className="glow-text" style={{ fontSize: 'var(--font-size-xs)' }}>
                  Experience the future of development
                </span>
              </p>
            </div>
          </div>

          <div
              style={{
                paddingTop: 'var(--spacing-md)',
                borderTop: '1px solid var(--app-shell-border)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              gap: 'var(--spacing-sm)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-family-primary)',
              }}
            >
              Design System: Glassmorphism • Typography: Inter/Poppins • Animation:
              cubic-bezier(0.4, 0, 0.2, 1)
            </span>
          </div>
        </div>
      </footer>

  {}

      {}
      {isNewProjectModalOpen ? <NewProjectModal
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          onCreateProject={handleCreateProject}
        /> : null}
    </div>
  );
};

interface MainAppProps { onOpenAnalytics: () => void }
const MainApp: React.FC<MainAppProps> = ({ onOpenAnalytics }) => {
  const [currentView, setCurrentView] = useState<'homepage' | 'demo' | 'ide' | 'fileexplorer' | 'analyst' | 'test'>(() => {

    if (flags.e2e) return 'ide';
    try {
      const sp = new URLSearchParams(window.location.search);
      const v = sp.get('view');
  if (v === 'ide' || v === 'homepage' || v === 'demo' || v === 'fileexplorer' || v === 'analyst' || v === 'test') return v as any;
    } catch {}
    return 'homepage';
  });

  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);


  useEffect(() => {

    const shouldSeedSampleData = (() => {
      try {
        const sp = new URLSearchParams(window.location.search);
        return sp.get('sampleData') === '1' || flags.e2e;
      } catch {
        return flags.e2e;
      }
    })();

    if (shouldSeedSampleData) {
      initializeSampleData();
    }

    const handleNavigateToHome = (event: CustomEvent) => {
 console.log(' Received home navigation event from:', event.detail?.source);
      setCurrentView('homepage');
    };

    window.addEventListener('navigateToHome', handleNavigateToHome as EventListener);


    try {
      if (typeof window !== 'undefined') {
        const loadMapExplorerStore = async () => {
          const { useMapExplorerStore } = await import('@/stores/useMapExplorerStore');
          return useMapExplorerStore;
        };

        (window as any).e2e = (window as any).e2e || {};
        (window as any).e2e.setView = (v: 'homepage'|'demo'|'ide'|'fileexplorer') => setCurrentView(v);
        (window as any).e2e.openAssistant = async () => {
          useAppStore.getState().updateLayout({ aiChatVisible: true });
          setIsAiAssistantOpen(true);
          await new Promise(r => setTimeout(r, 0));
        };
        (window as any).e2e.setAiChatVisible = async (v: boolean) => {
          useAppStore.getState().updateLayout({ aiChatVisible: !!v });
          setIsAiAssistantOpen(!!v);
        };
        (window as any).e2e.toggleAI = async () => {
          const cur = !!useAppStore.getState().layout.aiChatVisible;
          useAppStore.getState().updateLayout({ aiChatVisible: !cur });
          setIsAiAssistantOpen((v) => !v);
        };
        (window as any).e2e.seedGeoJSONLayer = async (input: {
          id?: string;
          name: string;
          featureCollection: {
            type: string;
            features: Array<{
              geometry?: { type?: string | null } | null;
              properties?: Record<string, unknown> | null;
            }>;
          };
          datasetTitle?: string;
          sourceLabel?: string;
        }) => {
          const useMapExplorerStore = await loadMapExplorerStore();
          const featureCollection = input.featureCollection;
          const geometryType = featureCollection.features[0]?.geometry?.type ?? 'Unknown';
          const fields = Array.from(new Set(featureCollection.features.flatMap((feature) => Object.keys(feature.properties ?? {}))));

          useMapExplorerStore.getState().addOverlayLayer({
            id: input.id ?? `e2e-layer-${Date.now()}`,
            name: input.name,
            type: 'geojson',
            visible: true,
            opacity: 0.92,
            group: 'data',
            sourceData: featureCollection as GeoJSON.FeatureCollection,
            metadata: {
              geometryType,
              featureCount: featureCollection.features.length,
              fields,
              datasetContext: {
                datasetTitle: input.datasetTitle ?? input.name,
                source: input.sourceLabel ?? 'E2E seeded layer',
              },
            },
          });
        };
        (window as any).e2e.openMapExplorer = async () => {
          const useMapExplorerStore = await loadMapExplorerStore();
          useMapExplorerStore.getState().open();
        };
        (window as any).e2e.seedTemporalLayer = async (input: {
          id?: string;
          name: string;
          frames: Array<{
            key: string;
            label: string;
            featureCollection: GeoJSON.FeatureCollection;
          }>;
          timeProperty?: string;
          valueField?: string;
          engine?: string;
          runtimeMode?: 'live' | 'demo' | 'synthetic' | 'unknown';
          sourceLabel?: string;
        }) => {
          const useMapExplorerStore = await loadMapExplorerStore();
          const frames = input.frames.map((frame) => ({
            key: frame.key,
            label: frame.label,
            data: frame.featureCollection,
          }));
          const firstFrame = frames[0]?.data ?? { type: 'FeatureCollection', features: [] };
          const geometryType = firstFrame.features[0]?.geometry?.type ?? 'Unknown';
          const fields = Array.from(new Set(frames.flatMap((frame) =>
            frame.data.features.flatMap((feature) => Object.keys(feature.properties ?? {})),
          )));

          useMapExplorerStore.getState().addOverlayLayer({
            id: input.id ?? `e2e-temporal-layer-${Date.now()}`,
            name: input.name,
            type: 'geojson',
            visible: true,
            opacity: 0.92,
            group: 'analysis',
            sourceKind: 'derived',
            sourceData: firstFrame,
            metadata: {
              geometryType,
              featureCount: frames.reduce((count, frame) => count + frame.data.features.length, 0),
              fields,
              sourceId: input.id ?? input.name,
              datasetContext: {
                datasetTitle: input.name,
                source: input.sourceLabel ?? 'E2E seeded temporal layer',
              },
              analysisResult: {
                engine: input.engine ?? 'E2E Temporal Fixture',
                runTimestamp: new Date().toISOString(),
                parameterSummary: `${frames.length} temporal frame(s) seeded for E2E`,
                inputParameters: { frames: frames.length },
                statisticalSummary: { frames: frames.length },
                visualization: {
                  kind: 'temporal',
                  title: input.name,
                  timeProperty: input.timeProperty ?? 'timestamp',
                  temporalFrames: frames,
                  ...(input.valueField ? { valueField: input.valueField } : {}),
                },
                runtimeMode: input.runtimeMode ?? 'demo',
              },
            },
          });
        };
        (window as any).e2e.getTemporalPlaybackState = async () => {
          const useMapExplorerStore = await loadMapExplorerStore();
          const map = useMapExplorerStore.getState();
          const temporal = useTemporalLayerStore.getState();
          return {
            mapOpen: map.isOpen,
            currentTimestep: map.currentTimestep,
            isPlaying: map.isPlaying,
            playbackSpeed: map.playbackSpeed,
            overlayLayerCount: map.overlayLayers.length,
            temporalFrameCount: temporal.frames.length,
            temporalActiveFrameIndex: temporal.activeFrameIndex,
            temporalIsPlaying: temporal.isPlaying,
            temporalSpeed: temporal.speed,
          };
        };
        (window as any).e2e.clearGeoJSONLayers = async () => {
          const useMapExplorerStore = await loadMapExplorerStore();
          useMapExplorerStore.getState().replaceOverlayLayers([]);
        };
      }
    } catch {}

  return () => {
      window.removeEventListener('navigateToHome', handleNavigateToHome as EventListener);
    };
  }, []);

  const handleLaunchWorkspace = () => {
    setCurrentView('ide');
  };


  const handleBackToHome = () => {
    setCurrentView('homepage');
  };


  return (
    <div style={{ minHeight: '100vh', paddingBottom: currentView === 'homepage' ? 0 : '22px', overflow: currentView === 'homepage' ? 'hidden' : undefined }}>
      {}
      <div
        data-testid="app-main-content"
        style={{
          pointerEvents: currentView !== 'ide' && isAiAssistantOpen ? 'none' : 'auto',


          visibility: currentView !== 'ide' && isAiAssistantOpen ? 'hidden' : 'visible',
        }}
        {...(currentView !== 'ide' && isAiAssistantOpen ? { inert: '' as any } : {})}
      >
    {}
        {currentView === 'homepage' ? (
          <SynapseHomepage onLaunchIDE={handleLaunchWorkspace} />
        ) : currentView === 'ide' ? (
          <div style={{ position: 'relative' }} data-testid="ide-root">
            <EnhancedIDE />
          </div>
        ) : currentView === 'analyst' ? (
          <div style={{ position: 'relative', minHeight: '100vh' }}>
            <CenterPanelShell />
          </div>
        ) : currentView === 'fileexplorer' ? (

          <div style={{ position: 'relative', minHeight: '100vh' }}>
            {}
            <div
              style={{
                position: 'fixed',
                top: '20px',
                left: '20px',
                zIndex: 1000,
              }}
            >
              <Button icon={<FolderOpen />} onClick={handleBackToHome} className="glass-button" />
            </div>
            <div style={{ padding: '60px 20px 20px 20px' }}>
              <FileExplorer />
            </div>
          </div>
        ) : (

          <div style={{ position: 'relative' }}>
            {}
            <div
              style={{
                position: 'fixed',
                top: 'var(--spacing-md)',
                left: 'var(--spacing-md)',
                zIndex: 1000,
              }}
            >
              <div className="glass-surface" style={{ padding: 'var(--spacing-xs)' }}>
                <Button
                  className="focus-ring"
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToHome}
                  icon={<Code size={16} />}
                >
                  Back to Home
                </Button>
              </div>
            </div>
            <DemoPage onOpenAnalytics={onOpenAnalytics} />
          </div>
        )}

        {}
        {currentView === 'ide' && (
          <StatusBar
            language="javascript"
            content="// Welcome to Synapse IDE"
            cursorPosition={{ line: 1, column: 1 }}
            encoding="UTF-8"
            lineEnding="LF"
            tabSize={2}
            indentation="spaces"
            fontSize={14}
            errors={0}
            warnings={0}
            isLiveServer={false}
            gitBranch="main"
            isModified={false}
          />
        )}
      </div>

    {}
  {currentView !== 'ide' && isAiAssistantOpen ? (
        <div
          aria-hidden="true"

          style={{ position: 'fixed', inset: 0, zIndex: 2147482990, background: 'transparent', pointerEvents: 'none' }}
        />
      ) : null}

    {}
  {currentView !== 'ide' && isAiAssistantOpen ? (
        <div
          data-component="ai-assistant"
          data-testid="assistant-modal"
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            right: 0,
            top: 0,
            bottom: 0,
            width: 500,
    // Design-tier modal (toasts 10080 / popovers 10060 / tooltips 10070 still win).
    zIndex: 10050,
            background: 'var(--app-shell-surface)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
    pointerEvents: 'auto',
    isolation: 'isolate',
          }}
        >
          <AiAssistant onClose={() => setIsAiAssistantOpen(false)} />
        </div>
      ) : null}
    </div>
  );
};

function App() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showUrbanModal, setShowUrbanModal] = useState(false);
  const [hasLoadedUrbanModal, setHasLoadedUrbanModal] = useState(false);

  useEffect(() => { document.title = 'Urban Analytics Workbench'; }, []);

  // ── Synapse workspace memory: hydrate .synapse/ slots on mount ──────────
  useEffect(() => {
    const store = useSynapseWorkspaceStore.getState();
    store.hydrate();
    // Initialize workspace identity if not already present
    if (!store.workspace) store.initWorkspace();
    else store.touchWorkspace();
  }, []);

  // ── Map Explorer → IDE receiver (Prompt 22): subscribe to incoming bus
  //    events emitted by Map Explorer so the IDE can register artifacts,
  //    surface provenance, and respond to user-driven open/insert actions.
  useEffect(() => {
    void import('@/services/map/mapToIdeHandoff')
      .then(({ installMapToIdeReceiver }) => {
        installMapToIdeReceiver();
      })
      .catch((error) => {
        console.error('[App] Failed to install Map Explorer → IDE receiver.', error);
      });
  }, []);

  // ── Synapse IDE → Map Explorer receiver (Map Prompt 19): recognizes IDE
  //    file/artifact references as map evidence candidates. Layer state is
  //    not materialized unless Map Explorer has validated the referenced data.
  useEffect(() => {
    void import('@/services/map/IdeToMapArtifactRecognitionService')
      .then(({ installIdeToMapArtifactReceiver }) => {
        installIdeToMapArtifactReceiver();
      })
      .catch((error) => {
        console.error('[App] Failed to install IDE → Map Explorer artifact receiver.', error);
      });
  }, []);

  // ── Urban Analytics → IDE receiver (Prompt 24): mirrors incoming
  //    analytics.* events into the IDE.  Generated code (scaffolds) is
  //    staged in a pending queue and never auto-inserted; explicit user
  //    consumption through the apply-preview surface is required.
  useEffect(() => {
    void import('@/services/analytics/urbanToIdeHandoff')
      .then(({ installUrbanToIdeReceiver }) => {
        installUrbanToIdeReceiver();
      })
      .catch((error) => {
        console.error('[App] Failed to install Urban Analytics → IDE receiver.', error);
      });
  }, []);

  // ── Synapse IDE → Urban Analytics receiver (Prompt 19): recognizes IDE
  //    file/artifact references as Urban evidence without reading editor
  //    buffers or taking ownership of IDE state.
  useEffect(() => {
    void import('@/features/urbanAnalytics/context/ideArtifactRecognition')
      .then(({ installUrbanIdeArtifactReceiver }) => {
        installUrbanIdeArtifactReceiver();
      })
      .catch((error) => {
        console.error('[App] Failed to install IDE → Urban Analytics artifact receiver.', error);
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('clearMapExplorerCache') !== '1') {
      return;
    }

    void (async () => {
      try {
        const { clearPersistedMapProjectSnapshots } = await import('@/services/map/MapPersistenceService');
        const { useMapExplorerStore } = await import('@/stores/useMapExplorerStore');
        const removedProjectSnapshots = clearPersistedMapProjectSnapshots();
        useMapExplorerStore.getState().clearProjectContent();
        void useMapExplorerStore.persist.clearStorage();

        params.delete('clearMapExplorerCache');
        const nextSearch = params.toString();
        const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
        window.history.replaceState(window.history.state, '', nextUrl);

        console.info(
          `[Map Explorer] Cleared active map layers and ${removedProjectSnapshots} persisted map project snapshot${removedProjectSnapshots === 1 ? '' : 's'}.`,
        );
      } catch (error) {
        console.error('[Map Explorer] Failed to clear persisted map project snapshots.', error);
      }
    })();
  }, []);


  useEffect(() => {
    try {
      const keys = Object.keys(localStorage);
      const urbanKeys = keys.filter(k => k.includes('urban') || k.includes('urbanAnalytics'));


      const storeKey = urbanKeys.find(k => k.includes('urban'));
      if (storeKey) {
        const data = localStorage.getItem(storeKey);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.state?.isOpen) {
              parsed.state.isOpen = false;
              localStorage.setItem(storeKey, JSON.stringify(parsed));
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error('localStorage cleanup failed:', e);
    }
  }, []);


  const handleOpenAnalytics = () => {
    setHasLoadedUrbanModal(true);
    setShowWelcome(true);
  };

  const handleWelcomeDone = () => {
    setShowWelcome(false);
    setHasLoadedUrbanModal(true);
    setShowUrbanModal(true);
  };




  useEffect(() => {
    let previousIsOpen = useUrbanStore.getState().isOpen;

    const unsubscribe = useUrbanStore.subscribe((state) => {
      const currentIsOpen = state.isOpen;
      // Update closure var BEFORE side-effects so the re-entrant notification
      // triggered by close() below sees the correct previous value. Otherwise
      // the trailing assignment after close() overwrites the inner update with
      // a stale `true`, and the next user click is treated as a no-op
      // transition (true → true) → modal never opens again.
      const wasOpen = previousIsOpen;
      previousIsOpen = currentIsOpen;

      if (!wasOpen && currentIsOpen) {
        setHasLoadedUrbanModal(true);
        setShowWelcome(true);

        useUrbanStore.getState().close?.();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppThemeProvider>
          <GlobalStyles />
          <Router>
            <div className="urban-v2">
              <MainApp onOpenAnalytics={handleOpenAnalytics} />

              <WelcomeModal
                open={showWelcome}
                onClose={handleWelcomeDone}
              />

              {hasLoadedUrbanModal ? (
                <ChunkLoadBoundary
                  compact
                  title="Urban Analytics Workbench unavailable"
                  message="The Urban Analytics Workbench did not load. Retry after the dev server reconnects, or reload the app if it persists."
                >
                  <Suspense fallback={<ModalLoadingFallback label="Loading Urban Analytics Workbench..." testId="urban-analytics-modal-loading" />}>
                    <UrbanAnalyticsModal
                      open={showUrbanModal}
                      onClose={() => setShowUrbanModal(false)}
                    />
                  </Suspense>
                </ChunkLoadBoundary>
              ) : null}

              <ChunkLoadBoundary
                compact
                title="Map Explorer host unavailable"
                message="The Map Explorer host did not load. Retry after the dev server reconnects, or reload the app if it persists."
              >
                <Suspense fallback={null}>
                  <MapExplorerHost />
                </Suspense>
              </ChunkLoadBoundary>

              {}
              {}
            </div>
          </Router>
          {}
        </AppThemeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
