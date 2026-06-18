import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, X } from 'lucide-react';
import { useFileExplorerStore } from '../../stores/fileExplorerStore';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useScrollLock } from '@/hooks/useScrollLock';
import { LANGUAGE_CATEGORIES, TEMPLATE_TYPES } from './newFileTemplates';
import css from './NewFileModal.module.css';

interface NewFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFile: (language?: string, template?: string, fileName?: string) => void;
  sidebarWidth: number;
}

const NewFileModal: React.FC<NewFileModalProps> = ({
  isOpen,
  onClose,
  onCreateFile,
  sidebarWidth,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('web');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [step, setStep] = useState<'category' | 'language' | 'template' | 'filename'>('category');
  const inputRef = useRef<HTMLInputElement>(null);
  const files = useFileExplorerStore(s => s.files);

  // Shared foundation (MFP-02/03): focus trap + restore, ref-counted scroll lock.
  const { trapRef, activate } = useFocusTrap(isOpen);
  useScrollLock(isOpen);

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedLanguage('');
    setSelectedTemplate('');
    setStep('language');
  }, []);

  const handleLanguageSelect = useCallback((languageId: string) => {
    setSelectedLanguage(languageId);
    setSelectedTemplate('');
    const templates = TEMPLATE_TYPES[languageId as keyof typeof TEMPLATE_TYPES];
    if (templates && templates.length > 1) {
      setStep('template');
    } else {
      setSelectedTemplate(templates?.[0]?.id || 'basic');
      setStep('filename');
    }
  }, []);

  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplate(templateId);
    setStep('filename');
  }, []);


  const currentCategory = LANGUAGE_CATEGORIES[selectedCategory as keyof typeof LANGUAGE_CATEGORIES];
  const currentLanguage = currentCategory?.languages.find(lang => lang.id === selectedLanguage);
  const expectedExt = `.${currentLanguage?.extension || 'txt'}`;
  const baseName = (fileName || '').trim();
  const finalNamePreview = (baseName.length ? baseName : 'untitled') + expectedExt;
  const rootSiblings = useMemo(
    () => (files || []).filter(f => !f.path.includes('/')).map(f => f.name),
    [files]
  );
  const isDuplicate = rootSiblings.includes(finalNamePreview);
  const validationError = useMemo(() => {
    if (step !== 'filename') return '';
    if (!baseName.length) return 'Enter a file name.';
    if (!/[a-zA-Z0-9]/.test(baseName)) return 'Use letters or numbers in the file name.';
    if (/[\\/]/.test(baseName)) return 'File name cannot contain / or \\';
    if (!selectedLanguage) return 'Choose a language.';
    if (isDuplicate) return `A file named "${finalNamePreview}" already exists.`;
    return '';
  }, [baseName, selectedLanguage, isDuplicate, finalNamePreview, step]);

  // Move initial focus into the dialog on open (trap restores it to the opener on close).
  useEffect(() => {
    if (isOpen) activate();
  }, [isOpen, activate]);

  // Preserve the filename-input autofocus on the final step.
  useEffect(() => {
    if (isOpen && step === 'filename') {
      const id = requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [isOpen, step]);

  const handleCreate = useCallback(async () => {
    if (!selectedLanguage) return;
    if (validationError) return;

    const baseOnly = fileName && fileName.trim().length > 0 ? fileName.trim() : 'untitled';
    const finalFileName = baseOnly;

    // Lazy-load the heavy template content map only when a file is actually created (NF4).
    const { getTemplateContentByLanguage } = await import('./newFileTemplateContent');
    const templateContent = getTemplateContentByLanguage(
      selectedLanguage,
      selectedTemplate,
      finalFileName
    );

    onCreateFile(selectedLanguage, templateContent, finalFileName);

    setSelectedCategory('web');
    setSelectedLanguage('');
    setSelectedTemplate('');
    setFileName('');
    setStep('category');
    onClose();
  }, [selectedLanguage, selectedTemplate, fileName, onCreateFile, onClose, validationError]);

  const handleBack = useCallback(() => {
    switch (step) {
      case 'language':
        setStep('category');
        break;
      case 'template':
        setStep('language');
        break;
      case 'filename': {
        const templates = TEMPLATE_TYPES[selectedLanguage as keyof typeof TEMPLATE_TYPES];
        if (templates && templates.length > 1) {
          setStep('template');
        } else {
          setStep('language');
        }
        break;
      }
    }
  }, [step, selectedLanguage]);

  const handleDialogKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  };

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',

      zIndex: 1000000,
      opacity: isOpen ? 1 : 0,
      visibility: isOpen ? ('visible' as const) : ('hidden' as const),
      transition: 'opacity 0.3s var(--syn-easing-bauhaus), visibility 0.3s var(--syn-easing-bauhaus)',
    },

    modal: {
      width: Math.min(sidebarWidth * 1.8, 600),
      maxHeight: '80vh',
      background: `linear-gradient(145deg,
        rgba(37, 37, 37, 0.95) 0%,
        rgba(18, 18, 18, 0.98) 100%)`,
      backdropFilter: 'blur(16px)',
      border: '1px solid #3a3a3a',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: `
        0 12px 32px rgba(0, 0, 0, 0.5),
        0 4px 16px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(55, 148, 255, 0.1)`,
      color: '#D6D3D1',
      fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
      transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column' as const,
    },

    header: {
      padding: '20px 24px 16px',
      borderBottom: '1px solid #2A2A2A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'color-mix(in srgb, var(--syn-interaction-active) 6%, transparent)',
    },

    title: {
      fontSize: '18px',
      fontWeight: 600,
      color: 'var(--syn-interaction-active)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },

    closeButton: {
      width: '32px',
      height: '32px',
      background: 'transparent',
      border: 'none',
      color: '#8C8579',
      cursor: 'pointer',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'var(--syn-transition-medium)',
    },

    content: {
      flex: 1,
      padding: '24px',
      overflowY: 'auto' as const,
      maxHeight: 'calc(80vh - 140px)',
    },

    navigation: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '20px',
      fontSize: '13px',
      color: '#A8A29E',
    },

    navStep: {
      padding: '4px 8px',
      borderRadius: '4px',
      background: 'color-mix(in srgb, var(--syn-interaction-active) 12%, transparent)',
      color: 'var(--syn-interaction-active)',
    },

    navArrow: {
      color: '#8C8579',
    },

    categoryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '12px',
      marginBottom: '20px',
    },

    categoryCard: {
      padding: '16px',
      background: 'var(--syn-gradient-card-hover)',
      border: '1px solid #3a3a3a',
      borderRadius: '8px',
      cursor: 'pointer',
      font: 'inherit',
      color: 'inherit',
      textAlign: 'left' as const,
      width: '100%',
    },

    categoryHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px',
    },

    categoryName: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#D6D3D1',
    },

    languageList: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '10px',
    },

    languageItem: {
      padding: '12px 16px',
      background: 'rgba(37, 37, 37, 0.6)',
      border: '1px solid #3a3a3a',
      borderRadius: '6px',
      cursor: 'pointer',
      font: 'inherit',
      color: 'inherit',
      textAlign: 'left' as const,
      width: '100%',
    },

    languageName: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#D6D3D1',
      marginBottom: '4px',
    },

    languageDesc: {
      fontSize: '12px',
      color: '#A8A29E',
      lineHeight: 1.4,
    },

    templateList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },

    templateItem: {
      padding: '12px 16px',
      background: 'rgba(37, 37, 37, 0.6)',
      border: '1px solid #3a3a3a',
      borderRadius: '6px',
      cursor: 'pointer',
      font: 'inherit',
      color: 'inherit',
      textAlign: 'left' as const,
      width: '100%',
    },

    fileNameInput: {
      width: '100%',
      padding: '12px 16px',
      background: 'rgba(37, 37, 37, 0.8)',
      border: '1px solid #3a3a3a',
      borderRadius: '6px',
      color: '#D6D3D1',
      fontSize: '14px',
      fontFamily: 'inherit',
      outline: 'none',
      transition: 'border-color 0.2s var(--syn-easing-bauhaus)',
    },

    footer: {
      padding: '16px 24px',
      borderTop: '1px solid #2A2A2A',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'rgba(18, 18, 18, 0.5)',
    },

    button: {
      padding: '8px 16px',
      border: '1px solid #3a3a3a',
      borderRadius: '6px',
      background: 'rgba(37, 37, 37, 0.8)',
      color: '#D6D3D1',
      fontSize: '13px',
      fontFamily: 'inherit',
      cursor: 'pointer',
      transition: 'var(--syn-transition-medium)',
    },

    primaryButton: {
      background: 'color-mix(in srgb, var(--syn-interaction-active) 18%, transparent)',
      color: 'var(--syn-interaction-active)',
      fontWeight: 600,
    },
  };

  if (!isOpen) return null;

  const currentTemplates = selectedLanguage
    ? TEMPLATE_TYPES[selectedLanguage as keyof typeof TEMPLATE_TYPES] || []
    : [];

  const radioStyle = (base: React.CSSProperties, checked: boolean): React.CSSProperties =>
    checked ? { ...base, borderColor: 'var(--syn-interaction-active)' } : base;

  const modalContent = (
    <div style={styles.overlay} onClick={onClose} role="presentation">
      <div
        style={styles.modal}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleDialogKeyDown}
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Create New File"
      >
        <div style={styles.header}>
          <div style={styles.title}>
            <FileText size={20} />
            Create New File
          </div>
          <button style={styles.closeButton} className={css.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <div style={styles.content}>
          {}
          <div style={styles.navigation}>
            <span style={step === 'category' ? styles.navStep : {}}>Category</span>
            {step !== 'category' && (
              <>
                <span style={styles.navArrow}>→</span>
                <span style={step === 'language' ? styles.navStep : {}}>Language</span>
              </>
            )}
            {(step === 'template' || step === 'filename') && currentTemplates.length > 1 && (
              <>
                <span style={styles.navArrow}>→</span>
                <span style={step === 'template' ? styles.navStep : {}}>Template</span>
              </>
            )}
            {step === 'filename' && (
              <>
                <span style={styles.navArrow}>→</span>
                <span style={styles.navStep}>File Name</span>
              </>
            )}
          </div>

          {}
          {step === 'category' && (
            <div style={styles.categoryGrid} role="radiogroup" aria-label="File category">
              {Object.entries(LANGUAGE_CATEGORIES).map(([categoryId, category]) => (
                <button
                  key={categoryId}
                  type="button"
                  role="radio"
                  aria-checked={selectedCategory === categoryId}
                  style={radioStyle(styles.categoryCard, selectedCategory === categoryId)}
                  className={css.interactive}
                  onClick={() => handleCategorySelect(categoryId)}
                >
                  <div style={styles.categoryHeader}>
                    <category.icon size={20} style={{ color: category.color }} />
                    <span style={styles.categoryName}>{category.name}</span>
                  </div>
                  <div style={styles.languageDesc}>
                    {category.languages.length} languages available
                  </div>
                </button>
              ))}
            </div>
          )}

          {}
          {step === 'language' && currentCategory ? <div style={styles.languageList} role="radiogroup" aria-label="Language">
              {currentCategory.languages.map(language => (
                <button
                  key={language.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedLanguage === language.id}
                  style={radioStyle(styles.languageItem, selectedLanguage === language.id)}
                  className={css.interactive}
                  onClick={() => handleLanguageSelect(language.id)}
                >
                  <div style={styles.languageName}>{language.name}</div>
                  <div style={styles.languageDesc}>{language.description}</div>
                </button>
              ))}
            </div> : null}

          {}
          {step === 'template' && currentTemplates.length > 0 && (
            <div style={styles.templateList} role="radiogroup" aria-label="File template">
              {currentTemplates.map(template => (
                <button
                  key={template.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedTemplate === template.id}
                  style={radioStyle(styles.templateItem, selectedTemplate === template.id)}
                  className={css.interactive}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <div style={styles.languageName}>{template.name}</div>
                  <div style={styles.languageDesc}>{template.description}</div>
                </button>
              ))}
            </div>
          )}

          {}
          {step === 'filename' && (
            <div>
              <label htmlFor="new-file-name-input" style={{ display: 'block', marginBottom: '8px', color: '#A8A29E' }}>
                File Name:
              </label>
              <input
                id="new-file-name-input"
                type="text"
                ref={inputRef}
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                placeholder={`untitled.${currentLanguage?.extension || 'txt'}`}
                className={css.input}
                style={{
                  ...styles.fileNameInput,
                  ...(validationError ? { borderColor: '#EF4444' } : {}),
                }}
                autoFocus
              />
              {validationError ? (
                <div role="alert" style={{ marginTop: '8px', fontSize: '12px', color: '#EF4444' }}>
                  {validationError}
                </div>
              ) : (
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#8C8579' }}>
                  Final name: <span style={{ color: '#f59e0b' }}>{finalNamePreview}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <div>
            {step !== 'category' && (
              <button style={styles.button} className={css.btn} onClick={handleBack}>
                ← Back
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={styles.button} className={css.btn} onClick={onClose}>
              Cancel
            </button>
            {step === 'filename' && (
              <button
                style={{ ...styles.button, ...styles.primaryButton }}
                className={css.btn}
                onClick={() => { void handleCreate(); }}
                disabled={!!validationError}
              >
                Create File
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );


  return createPortal(modalContent, document.body);
};

export default NewFileModal;
