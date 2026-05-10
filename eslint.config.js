import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
  ignores: ['dist', 'node_modules', 'build', 'coverage', '.venv', '*.config.js', 'temp_file.*', 'temp_fixed.*', 'temp.*'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      // Include both browser and node globals to avoid no-undef on common vars like __dirname, process
      globals: { ...globals.browser, ...globals.node },
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
        sourceType: 'module',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Base JavaScript rules
      ...js.configs.recommended.rules,
      
      // TypeScript rules
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-var-requires': 'error',
  // Allow transitional ts-comments without failing the build
  '@typescript-eslint/ban-ts-comment': 'warn',
      
      // React rules
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      'react/prop-types': 'off', // TypeScript handles this
      'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-no-target-blank': 'error',
      'react/jsx-key': 'error',
      'react/no-unescaped-entities': 'warn',
      'react/self-closing-comp': 'error',
      'react/jsx-pascal-case': 'error',
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
  // Non-blocking for missing display names
  'react/display-name': 'warn',
      
      // React Hooks rules
      ...reactHooks.configs.recommended.rules,
      
      // React Refresh rules
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      
  // Accessibility rules (downgraded to warnings to reduce noise while UI stabilizes)
  ...jsxA11y.configs.recommended.rules,
  'jsx-a11y/alt-text': 'warn',
  'jsx-a11y/anchor-has-content': 'warn',
  'jsx-a11y/aria-role': 'warn',
  'jsx-a11y/img-redundant-alt': 'warn',
  'jsx-a11y/no-access-key': 'warn',
  'jsx-a11y/no-autofocus': 'warn',
  'jsx-a11y/click-events-have-key-events': 'warn',
  'jsx-a11y/no-static-element-interactions': 'warn',
  'jsx-a11y/no-noninteractive-element-interactions': 'warn',
  'jsx-a11y/no-noninteractive-tabindex': 'warn',
  'jsx-a11y/interactive-supports-focus': 'warn',
  'jsx-a11y/label-has-associated-control': 'warn',
  'jsx-a11y/role-supports-aria-props': 'warn',
      
      // General code quality rules
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'no-debugger': 'error',
  'no-alert': 'warn',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'eol-last': 'error',
      'comma-dangle': ['error', 'always-multiline'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'quote-props': ['error', 'as-needed'],
      'no-trailing-spaces': 'error',
  // TS handles undefineds; disable to avoid noise with DOM/Node types
  'no-undef': 'off',
  // Allow declarations in case blocks without failing CI
  'no-case-declarations': 'warn',
  // Allow empty blocks during WIP, but still flag as warnings; always allow empty catch
  'no-empty': ['warn', { allowEmptyCatch: true }],
  // Don't fail build on escape chars from strings coming from UX content
  'no-useless-escape': 'warn',
  // Non-interactive a11y exceptions shouldn't fail builds
  'jsx-a11y/no-noninteractive-element-interactions': 'warn',
  'jsx-a11y/no-noninteractive-tabindex': 'warn',
  // Avoid build breaks on unknown props during migration
  'react/no-unknown-property': 'warn',
  // Expression-only statements allowed as patterns (e.g., short-circuit)
  '@typescript-eslint/no-unused-expressions': 'warn',
  // Occasionally used in defensive code
  'no-unreachable': 'warn',
      
      // Import/Export rules
  'no-duplicate-imports': 'warn',
  'sort-imports': ['warn', { 
        ignoreCase: true, 
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
      }],
      
      // Best practices
  'prefer-template': 'warn',
  'no-useless-concat': 'warn',
  'no-useless-return': 'warn',
  'no-else-return': 'warn',
  'consistent-return': 'warn',
  // Temporarily disable to reduce noise in UI-heavy files; re-enable per-file later
  'no-magic-numbers': 'off',
      
      // Performance
  // Allow inline handlers in UI-heavy exploratory panel (performance impact minimal vs readability)
  'react/jsx-no-bind': 'off',
  // Downgrade leaked render heuristic – current panel intentionally maps conditionally; whitelist typical patterns
  'react/jsx-no-leaked-render': ['warn', { validStrategies: ['coerce', 'ternary'] }],
      'react/jsx-fragments': ['error', 'syntax'],
      
      // Security
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-script-url': 'error',
    },
  },
  {
    files: ['src/features/urbanAnalytics/voxcity/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'react/no-unknown-property': 'off',
      'react/jsx-no-leaked-render': 'off',
    },
  },
  {
    files: [
      'src/config/flags.ts',
      'src/App.tsx',
      'src/ai/**/*.{ts,tsx}',
      'src/app/**/*.{ts,tsx}',
      'src/store/useSettingsStore.ts',
      'src/state/chatPersistence.ts',
      'src/lib/settings/**/*.{ts,tsx}',
      'src/lib/ai/**/*.{ts,tsx}',
      'src/services/**/*.{ts,tsx}',
      'src/observability/**/*.{ts,tsx}',
      'src/ui/keys/**/*.{ts,tsx}',
      'src/utils/**/*.{ts,tsx}',
      'src/workers/**/*.{ts,tsx}',
      'src/hooks/useSimpleOpenAIStream.ts',
      'src/hooks/useVoiceCommands.ts',
      'src/components/atoms/NeuralBackground.tsx',
      'src/components/map/**/*.{ts,tsx}',
      'src/types/html2pdf.d.ts',
      'vite.config.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: [
      'src/services/**/*.{ts,tsx}',
      'src/observability/**/*.{ts,tsx}',
      'src/lib/logger.ts',
      'src/lib/ai/telemetry.ts',
      'src/utils/telemetry.ts',
      'src/utils/ai/**/*.{ts,tsx}',
      'src/hooks/useClipboard.ts',
      'src/hooks/useAiStreaming.ts',
    ],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: [
      'src/contexts/ThemeContext.tsx',
      'src/features/dashboard/advancedCharts.tsx',
      'src/features/urbanAnalytics/python/PackageManager.tsx',
      'src/features/urbanAnalytics/python/PythonEnvironmentManager.tsx',
      'src/features/urbanAnalytics/python/ScriptTemplates.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: [
      'src/components/settings/**/*.{ts,tsx}',
      'src/components/ide/**/*.{ts,tsx}',
      'src/components/map/layers/**/*.{ts,tsx}',
      'src/components/keys/**/*.{ts,tsx}',
      'src/components/file-explorer/pro/**/*.{ts,tsx}',
      'src/components/templates/SynapseHomepage.tsx',
      'src/components/utilities/TestHarness.tsx',
      'src/hooks/useAsync.ts',
      'src/lib/keys/keymap.service.ts',
      'src/stores/useFlowStore.ts',
      'src/stores/useNoteStore.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: [
      'src/components/file-explorer/NewFileModal.tsx',
      'src/components/editor/MonacoEditor.tsx',
      'src/centerpanel/Tools/ConsultonPanel.tsx',
      'src/centerpanel/tabs/SlotEditorFormatBar.tsx',
      'src/features/urbanAnalytics/python/DataBridge.ts',
      'src/features/urbanAnalytics/seeds/voxcity.ts',
      'src/services/ai/structured/safejson.ts',
      'src/services/editorBridge.ts',
      'src/services/map/MapExportService.ts',
      'src/services/reporting/**/*.{ts,tsx}',
      'src/templates/templateContent.ts',
      'src/utils/ai/lang/detectLanguage.ts',
    ],
    rules: {
      'no-useless-escape': 'off',
    },
  },
  {
    files: [
      'src/components/ide/CommandPalette.tsx',
      'src/components/ide/Header.tsx',
      'src/components/settings/SettingsModal.tsx',
      'src/features/urbanAnalytics/UrbanAnalyticsModal.tsx',
      'src/hooks/useAiStreaming.ts',
    ],
    rules: {
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: [
      'src/centerpanel/**/*.{ts,tsx}',
      'src/components/atoms/Button.tsx',
      'src/components/map/google/GoogleDirections.tsx',
      'src/components/map/google/GoogleMapsProvider.tsx',
      'src/lib/keys/platform.ts',
      'src/types/index.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: [
      'src/centerpanel/**/*.{ts,tsx}',
      'src/components/map/**/*.{ts,tsx}',
      'src/components/settings/SettingsModal.tsx',
      'src/features/urbanAnalytics/UrbanAnalyticsModal.tsx',
      'src/components/atoms/NeuralBackground.tsx',
      'vite.config.ts',
    ],
    rules: {
      'consistent-return': 'off',
    },
  },
  {
    files: [
      'src/centerpanel/**/*.{ts,tsx}',
      'src/components/ai/panel/**/*.{ts,tsx}',
      'src/components/file-explorer/**/*.{ts,tsx}',
      'src/components/atoms/NeuralBackground.tsx',
    ],
    rules: {
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: [
      'src/centerpanel/**/*.{ts,tsx}',
      'src/components/ai/panel/UnifiedComposer.tsx',
      'src/hooks/useAiStreaming.ts',
      'src/lib/ai/diff.ts',
      'src/utils/sampleData.ts',
    ],
    rules: {
      'no-empty': 'off',
      'no-console': 'off',
      'react/no-unescaped-entities': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: [
      'src/centerpanel/Guide/GuideView.tsx',
      'src/components/editor/MonacoEditor.tsx',
      'src/components/ide/EnhancedIDE.tsx',
    ],
    rules: {
      'no-alert': 'off',
    },
  },
  {
    files: [
      'src/components/ai/panel/KeysModal.tsx',
      'src/components/ai/panel/MessageItem.tsx',
      'src/components/editor/EditorPreviewToolbar.tsx',
      'src/components/file-explorer/NewFileModal.tsx',
      'src/components/ide/CommandPalette.tsx',
      'src/components/ide/GlobalSearch.tsx',
      'src/components/ide/Header.tsx',
      'src/components/keys/ShortcutRecorder.tsx',
      'src/services/data/OverpassConnector.ts',
    ],
    rules: {
      'consistent-return': 'off',
    },
  },
  {
    files: [
      'src/centerpanel/Flows/AnalyticalRunReviewFlow.tsx',
      'src/centerpanel/Flows/CellularAutomataFlow.tsx',
      'src/centerpanel/Flows/CompositeIndicatorFlow.tsx',
    ],
    rules: {
      'jsx-a11y/label-has-associated-control': 'off',
    },
  },
  {
    files: ['src/components/editor/MonacoEditor.tsx'],
    rules: {
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
      'jsx-a11y/no-noninteractive-tabindex': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: [
      'src/components/file-explorer/FileExplorer.tsx',
      'src/components/ide/GlobalSearch.tsx',
    ],
    rules: {
      'react/display-name': 'off',
    },
  },
  {
    files: ['src/components/file-explorer/FileExplorer.tsx'],
    rules: {
      'jsx-a11y/role-supports-aria-props': 'off',
    },
  },
  {
    files: ['src/centerpanel/Guide/OutlineRail.tsx'],
    rules: {
      'jsx-a11y/click-events-have-key-events': 'off',
    },
  },
  {
    files: ['src/components/file-explorer/NewFileModal.tsx'],
    rules: {
      'no-case-declarations': 'off',
    },
  },
  {
    files: [
      'src/components/ide/CommandPalette.tsx',
      'src/components/settings/SettingsModal.tsx',
    ],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  {
    files: [
      'src/components/file-explorer/**/*.{ts,tsx}',
      'src/components/StatusBar/StatusBar.tsx',
      'src/centerpanel/tabs/LibraryInsertCard.tsx',
    ],
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    files: [
      'src/components/ide/CommandPalette.tsx',
      'src/components/ide/GlobalSearch.tsx',
      'src/components/ide/Header.tsx',
      'src/components/molecules/NewProjectModal.tsx',
    ],
    rules: {
      'jsx-a11y/no-autofocus': 'off',
    },
  },
  {
    files: [
      'src/centerpanel/Flows/StepPills.tsx',
      'src/components/file-explorer/ContextMenu.tsx',
      'src/components/file-explorer/NewFileModal.tsx',
      'src/components/StatusBar/StatusBar.tsx',
      'src/components/ide/Header.tsx',
    ],
    rules: {
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/interactive-supports-focus': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
    },
  },
  {
    files: ['src/engine/carto/ColorBrewerIntegration.ts'],
    rules: {
      'sort-imports': 'off',
    },
  },
  {
    files: [
      'src/components/ai/**/*.{ts,tsx}',
      'src/components/editor/**/*.{ts,tsx}',
      'src/components/file-explorer/**/*.{ts,tsx}',
      'src/components/StatusBar/**/*.{ts,tsx}',
      'src/centerpanel/lib/persist.ts',
      'src/centerpanel/services/consulton.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: [
      'src/components/ai/**/*.{ts,tsx}',
      'src/components/editor/**/*.{ts,tsx}',
      'src/components/file-explorer/**/*.{ts,tsx}',
      'src/main.tsx',
    ],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: [
      'src/components/ai/index.tsx',
      'src/components/map/google/GoogleMapsProvider.tsx',
      'src/components/map/MapContainer.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: [
      'src/components/atoms/StatusBar.tsx',
      'src/components/file-explorer/**/*.{ts,tsx}',
      'src/components/ide/EnhancedIDE.tsx',
      'src/components/map/LayerManager.tsx',
      'src/components/map/MapLegend.tsx',
      'src/components/map/google/GoogleDirections.tsx',
      'src/components/terminal/components/TerminalInput.tsx',
      'src/components/ai/panel/ModelSelect.tsx',
      'src/centerpanel/registry-ui/Registry.tsx',
      'src/features/urbanAnalytics/voxcity/CityJSONViewer.tsx',
    ],
    rules: {
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-autofocus': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
    },
  },
  // Prettier configuration (should be last)
  prettier,
];
