import React from 'react';
import { createRoot } from 'react-dom/client';


import '@/styles/fonts.css'
import '@/styles/ui.css'

import AppRoot from './app/AppRoot';

import '@/services/editor/aiEditorBridgeGlobal';
import { AppErrorBoundary, installGlobalRejectionHandler } from './app/ErrorBoundary';
import './services/tasksAdapter';
import { initOtelOnce } from '@/observability/otel';

// Legacy storeDebug archived — no longer loaded


import { initRemoveToolkitCtas } from './lib/removeCtas';
initRemoveToolkitCtas();

type GlobalAiStore = {
	getState?: () => {
		clearAllKeys?: () => void;
	};
};

type GlobalWindowStores = Window & {
	useAiConfigStore?: GlobalAiStore;
	useAiSettingsStore?: GlobalAiStore;
};

const rootElement = document.getElementById('root');

if (!rootElement) {
 console.error(' ROOT ELEMENT NOT FOUND!');
 document.body.innerHTML =
 '<h1 style="color: var(--syn-status-error, #f87171); font-size: 2rem; text-align: center; margin: 2rem; padding: 1.5rem; border: 1px solid var(--syn-border-default, #343a44); background: var(--syn-surface-panel, #232832);">ERROR: Root element not found!</h1>';
} else {
 try {
 installGlobalRejectionHandler();

 try { initOtelOnce(); } catch {}
 const root = createRoot(rootElement);

 try {


 const params = new URLSearchParams(location.search);
 if (params.get('aiWipeKeys') === '1') {
 const globalStores = window as GlobalWindowStores;
 try { globalStores.useAiSettingsStore?.getState?.().clearAllKeys?.(); } catch {}
 try {
 const unified = globalStores.useAiConfigStore?.getState?.();
 unified?.clearAllKeys?.();
 } catch {}
 }
 } catch {}

 let useStrictMode = true;
 try {
 const sp = new URLSearchParams(location.search);
 if (sp.has('nostrict')) useStrictMode = false;
 } catch { }
 const appTree = (
 <AppErrorBoundary>
 <AppRoot />
 </AppErrorBoundary>
 );
 root.render(
 useStrictMode ? <React.StrictMode>{appTree}</React.StrictMode> : appTree
 );
 } catch (error) {
 console.error(' Error rendering app:', error);
 const errorMessage = error instanceof Error ? error.message : String(error);
 const errorStack = error instanceof Error ? error.stack : String(error);
 document.body.innerHTML = `<h1 style="color: var(--syn-status-error, #f87171); font-size: 1.5rem; text-align: center; margin: 2rem; padding: 2rem; border: 2px solid var(--syn-status-error, #f87171); background: var(--syn-surface-panel, #232832);">ERROR: ${errorMessage}</h1>`;
 document.body.innerHTML += `<pre style="color: var(--syn-text-default, #d7dce5); text-align: left; margin: 2rem; padding: 1rem; border: 1px solid var(--syn-border-default, #343a44); background: var(--syn-surface-elevated, #2b3038);">${errorStack}</pre>`;
 }
}
