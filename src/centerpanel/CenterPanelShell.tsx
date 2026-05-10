import React, { Suspense, useEffect, useState } from "react";
import styles from "./styles/centerpanel.module.css";
import a11y from "./styles/a11y.module.css";
import "./styles/tokens.css";

import { MAIN_SCROLL_ROOT_ID } from "./sections";
import SessionPersistence from "./SessionPersistence";
import { usePersistMeta } from "../stores/usePersistMeta";

import { useAccessStore } from "../stores/useAccessStore";

import { ensureProjectSeed, ProjectRegistryProvider } from "./registry/state";
import DraftSnapshotCard from "./rail/DraftSnapshotCard";
import railStyles from "./rail/rail.module.css";
import { useNewProjectDraftStore } from "../stores/useNewProjectDraftStore";

import { isGuideV2Enabled } from "./Guide/featureFlags";
import type { FlowId } from "./Flows/flowTypes";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import type { EducationFocusRequest } from "@/features/education/types";
import type { DashboardWidgetType } from "@/features/dashboard/types";
import type { IndicatorCatalogFocusRequest } from "@/features/urbanAnalytics/indicators/types";

import TopHeader from "./components/TopHeader";
import { CenterPanelTabFrame } from "./components/CenterPanelTabFrame";
import { useMapExplorerStore } from "../stores/useMapExplorerStore";
import { usePanelBridgeStore } from "../stores/usePanelBridgeStore";
import { useFlowStore } from "../stores/useFlowStore";
import { useFlowsUIStore } from "./Flows/uiStore";
import { ChunkLoadBoundary, lazyWithRetry } from "@/utils/lazyWithRetry";
import { CollaborationProvider } from "@/features/collaboration/CollaborationProvider";
import { CollaborationHeaderControls } from "@/features/collaboration/CollaborationUI";
import WorkspaceInfoCard from "./rail/WorkspaceInfoCard";


export interface CenterPanelShellProps {
	title?: string;
	subtitle?: string;
	outlineSlot?: React.ReactNode;
	mainSlot?: React.ReactNode;

	footnoteLeft?: React.ReactNode;
	footerLeft?: React.ReactNode;
	footerRight?: React.ReactNode;
	noteSlot?: React.ReactNode;
	flowsSlot?: React.ReactNode;
	toolsSlot?: React.ReactNode;
}

type Tab = "Projects" | "New Project" | "Methods" | "Education" | "Report" | "Workflows" | "Dashboard" | "Toolbox";

const TABS: Tab[] = ["Projects", "New Project", "Methods", "Education", "Report", "Workflows", "Dashboard", "Toolbox"];

const MethodsView = lazyWithRetry(() => import("./Guide/MethodsView"));
const GuideViewV2 = lazyWithRetry(() => import("./Guide/GuideViewV2"));
const OutlineRail = lazyWithRetry(() => import("./Guide/OutlineRail"));
const OutlineRailV2 = lazyWithRetry(() => import("./Guide/OutlineRailV2"));
const RegistryLeft = lazyWithRetry(async () => {
	const module = await import("./registry-ui/Registry.tsx");
	return { default: module.RegistryLeft };
});
const RegistryMain = lazyWithRetry(async () => {
	const module = await import("./registry-ui/Registry.tsx");
	return { default: module.RegistryMain };
});
const NewProjectPage = lazyWithRetry(() => import("./registry-ui/NewProjectPage"));
const Note = lazyWithRetry(() => import("./tabs/Note"));
const NoteRail = lazyWithRetry(async () => {
	const module = await import("./tabs/Note");
	return { default: module.NoteRail };
});
const FlowHost = lazyWithRetry(() => import("./Flows/FlowHost"));
const FlowsRail = lazyWithRetry(() => import("./Flows/FlowsRail"));
const ToolsProjectList = lazyWithRetry(() => import("./Tools/ToolsProjectList"));
const ToolsActionPanel = lazyWithRetry(() => import("./Tools/ToolsActionPanel"));
const MapExplorerModal = lazyWithRetry(async () => {
	const module = await import("./components/MapExplorerModal");
	return { default: module.MapExplorerModal };
});
const DashboardBuilder = lazyWithRetry(async () => {
	const module = await import("@/features/dashboard/DashboardBuilder");
	return { default: module.DashboardBuilder };
});
const EducationModule = lazyWithRetry(async () => {
	const module = await import("@/features/education/EducationModule");
	return { default: module.EducationModule };
});

function DeferredPanelFallback({ label }: { label: string }): React.ReactElement {
	return (
		<div
			className={styles.panelEnter}
			data-testid="cp-lazy-fallback"
			role="status"
			aria-live="polite"
			style={{
				padding: 16,
				display: "flex",
				alignItems: "center",
				gap: 10,
				color: "rgba(248, 250, 252, 0.88)",
				background: "rgba(15, 23, 42, 0.42)",
				border: "1px solid rgba(245, 158, 11, 0.16)",
				borderRadius: 12,
			}}
		>
			<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
				<circle cx="12" cy="12" r="9" fill="none" stroke="rgba(245, 158, 11, 0.22)" strokeWidth="3" />
				<path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="#F59E0B" strokeLinecap="round" strokeWidth="3">
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
	);
}

function renderDeferredPanel(node: React.ReactNode, title: string, message: string): React.ReactElement {
	return (
		<ChunkLoadBoundary compact title={title} message={message}>
			<Suspense fallback={<DeferredPanelFallback label="Loading panel..." />}>
				{node}
			</Suspense>
		</ChunkLoadBoundary>
	);
}

const CenterPanelShell: React.FC<CenterPanelShellProps> = ({
	footerLeft,
	footerRight,
}) => {
	const defaultTab: Tab = "Projects";
	const [activeTab, setActiveTab] = useState<Tab>(() => defaultTab);
	const [activeFlowId, setActiveFlowId] = useState<FlowId>("site_suitability");
	const [educationFocusRequest, setEducationFocusRequest] = useState<EducationFocusRequest | null>(null);
	const [dashboardBindingRequest, setDashboardBindingRequest] = useState<{
		bindingId: string;
		widgetType: DashboardWidgetType;
		requestedAt: number;
	} | null>(null);
	const [toolboxIndicatorFocusRequest, setToolboxIndicatorFocusRequest] = useState<IndicatorCatalogFocusRequest | null>(null);

	const [activeReviewRun, setActiveReviewRun] = useState<{ sessionId: string; runIndex: number } | null>(null);
	const sessionName = usePersistMeta(s => s.sessionName);

	// Sync tab changes to panel bridge store
	useEffect(() => {
		usePanelBridgeStore.getState().setActiveTab(activeTab);
	}, [activeTab]);

	useEffect(() => {
		usePanelBridgeStore.getState().setActiveFlowId(activeFlowId);
	}, [activeFlowId]);

	// Listen for cross-panel navigation events (e.g., Right Panel "Open Related Flow")
	useEffect(() => {
		const handler = (e: Event) => {
			const detail = (e as CustomEvent).detail;
			if (detail?.tab && TABS.includes(detail.tab)) {
				setActiveTab(detail.tab as Tab);
			}
			if (detail?.tab === "Education") {
				setEducationFocusRequest({
					view: detail.educationView ?? "paths",
					pathId: detail.educationPathId,
					explainerId: detail.educationExplainerId,
					requestedAt: detail.educationRequestedAt ?? Date.now(),
				});
			}
			if (detail?.tab === "Toolbox" && (detail.indicatorKind || detail.indicatorGroupId || detail.indicatorQuery)) {
				setToolboxIndicatorFocusRequest({
					view: "indicators",
					indicatorKind: detail.indicatorKind,
					groupId: detail.indicatorGroupId,
					query: detail.indicatorQuery,
					requestedAt: detail.indicatorRequestedAt ?? Date.now(),
				});
			}
			if (detail?.tab === "Dashboard" && typeof detail.dashboardBindingId === "string" && typeof detail.dashboardWidgetType === "string") {
				setDashboardBindingRequest({
					bindingId: detail.dashboardBindingId,
					widgetType: detail.dashboardWidgetType as DashboardWidgetType,
					requestedAt: detail.dashboardRequestedAt ?? Date.now(),
				});
			}
			if (detail?.flowId) {
				setActiveFlowId(detail.flowId as FlowId);
				useFlowsUIStore.getState().activateFlow(detail.flowId);
			}
		};
		window.addEventListener('synapse:navigate', handler);
		return () => window.removeEventListener('synapse:navigate', handler);
	}, []);


	const isMapOpen = useMapExplorerStore(s => s.isOpen);
	const closeMap = useMapExplorerStore(s => s.close);
	const toggleMap = useMapExplorerStore(s => s.toggle);
	const overlayLayers = useMapExplorerStore(s => s.overlayLayers);
	const addOverlayLayer = useMapExplorerStore(s => s.addOverlayLayer);
	const completedRuns = useFlowStore(s => s.completedRuns);

	useEffect(() => {
		if (completedRuns.length === 0) {
			return;
		}

		let cancelled = false;
		const existingLayerIds = overlayLayers.map(layer => layer.id);

		void import("../services/map/MapEngineAdapter")
			.then(({ collectPendingAnalysisLayers }) => {
				if (cancelled) {
					return;
				}

				const pendingLayers = collectPendingAnalysisLayers(completedRuns, existingLayerIds);
				for (const pending of pendingLayers) {
					addOverlayLayer(pending.layer);
				}
			})
			.catch(() => {});

		return () => {
			cancelled = true;
		};
	}, [addOverlayLayer, completedRuns, overlayLayers]);


	useEffect(() => {
	  const onKeyDown = (e: KeyboardEvent) => {
	    const isM = (e.key === "m" || e.key === "M");
	    if (isM && e.shiftKey && (e.ctrlKey || e.metaKey)) {
	      e.preventDefault();
	      e.stopPropagation();
					toggleMap();
	    }
	  };
	  window.addEventListener("keydown", onKeyDown, { capture: true });
	  return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
		}, [toggleMap]);


	const [nowTs, setNowTs] = useState<number>(() => Date.now());
	useEffect(() => {
		const id = setInterval(() => setNowTs(Date.now()), 1000);
		return () => clearInterval(id);
	}, []);


	useEffect(() => { try { ensureProjectSeed(); } catch {} }, []);


	useEffect(() => {
			const onKey = (e: KeyboardEvent) => {
			if (e.altKey || e.metaKey || e.ctrlKey) return;
			const idx = Number(e.key);
				if (Number.isFinite(idx) && idx >= 1 && idx <= TABS.length) setActiveTab(TABS[idx - 1]);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);


	const mode = useAccessStore(s => s.mode);


	const draftActive = useNewProjectDraftStore(s => s.isDirty);


	const showFooter = false;

		const reduceMotion = usePrefersReducedMotion();


		return (
			<CollaborationProvider>
				<section className={styles.shell} data-access-mode={mode} aria-label="Center panel area" data-reduce-motion={reduceMotion ? true : undefined}>
		<a href={`#${MAIN_SCROLL_ROOT_ID}`} className={a11y.skipLink}>Skip to main content</a>

	            {}
	            <ProjectRegistryProvider>
						<TopHeader
	            	    tabs={TABS}
	            	    activeTab={activeTab}
	            	    onTabChange={(t: string) => setActiveTab(t as Tab)}
	            	    sessionLabel={(sessionName || "session")}
	            	    nowTs={nowTs}
		            	>
		            		<CollaborationHeaderControls />
		            	</TopHeader>

	{}

			{}
					<SessionPersistence />
					<div className={`${styles.body} ${styles.bodyNoRightDock}`}>
						{activeTab === "Projects" ? (
							<CenterPanelTabFrame
								activeTab={activeTab}
								outlineAriaLabel="Left navigation"
								railContent={renderDeferredPanel(
									<RegistryLeft />,
									"Project rail unavailable",
									"The project rail did not load. Retry after the dev server reconnects, or reload the app if it persists.",
								)}
								mainContent={renderDeferredPanel(
									<RegistryMain />,
									"Project workspace unavailable",
									"The project workspace did not load. Retry after the dev server reconnects, or reload the app if it persists.",
								)}
							/>
						) : activeTab === "New Project" ? (
							<CenterPanelTabFrame
								activeTab={activeTab}
								outlineAriaLabel="Left navigation"
								railContent={draftActive ? (
									<aside className={railStyles.leftRailRoot}>
										<DraftSnapshotCard />
									</aside>
								) : (
									<WorkspaceInfoCard
										title="New Project"
										description="Start a new urban analytics project by filling in the form on the right. Once a draft is created, its summary will appear here."
										bullets={[
											"Define project name and description",
											"Select spatial scope and scale",
											"Choose analytical methods",
											"Add data sources and references",
										]}
									/>
								)}
								mainContent={renderDeferredPanel(
									<NewProjectPage />,
									"New project workspace unavailable",
									"The new project workspace did not load. Retry after the dev server reconnects, or reload the app if it persists.",
								)}
							/>
						) : activeTab === "Methods" ? (
							<CenterPanelTabFrame
								activeTab={activeTab}
								outlineAriaLabel="Left navigation"
								railContent={renderDeferredPanel(
									isGuideV2Enabled() ? <OutlineRailV2 /> : <OutlineRail />,
									"Methods rail unavailable",
									"The methods navigation rail did not load. Retry after the dev server reconnects, or reload the app if it persists.",
								)}
								mainContent={renderDeferredPanel(
									isGuideV2Enabled() ? <GuideViewV2 /> : <MethodsView />,
									"Methods view unavailable",
									"The methods workspace did not load. Retry after the dev server reconnects, or reload the app if it persists.",
								)}
							/>
						) : activeTab === "Education" ? (
							<CenterPanelTabFrame
								activeTab={activeTab}
								outlineAriaLabel="Education left rail"
								panelId="panel-education"
								railContent={(
									<WorkspaceInfoCard
										title="Education Workspace"
										description="Structured learning paths for graduate planning studios, now paired with rubric-based exercises, targeted hints, persistent scoring, and methodology explainers tied to live tools."
										bullets={[
											"Browse all eight planning education paths",
											"Launch category-filtered exercise studios with inspectable rubrics and feedback",
											"Inspect six pre-loaded teaching city datasets with schema metadata",
											"Track module completion and self-rated confidence",
											"Review assigned, completed, and mastered exercise history without leaving Center Panel",
											"Open formulas, assumptions, and misuse warnings in context",
											"Review cohort-level instructor signals without leaving Center Panel",
										]}
										accent
									/>
								)}
								mainContent={renderDeferredPanel(
									<EducationModule focusRequest={educationFocusRequest} />,
									"Education workspace unavailable",
									"The education workspace did not load. Retry after the dev server reconnects, or reload the app if it persists.",
								)}
							/>
						) : activeTab === "Toolbox" ? (
							<CenterPanelTabFrame
								activeTab={activeTab}
								outlineAriaLabel="Left navigation"
								outlineClassName={styles.outlineTight}
								railContent={(
									<aside className={`${railStyles.leftRailRoot} ${railStyles.toolsRailPad5}`}>
										{renderDeferredPanel(
											<ToolsProjectList />,
											"Toolbox rail unavailable",
											"The toolbox rail did not load. Retry after the dev server reconnects, or reload the app if it persists.",
										)}
									</aside>
								)}
								mainContent={renderDeferredPanel(
									<ToolsActionPanel indicatorFocusRequest={toolboxIndicatorFocusRequest} />,
									"Toolbox unavailable",
									"The toolbox workspace did not load. Retry after the dev server reconnects, or reload the app if it persists.",
								)}
							/>
						) : activeTab === "Report" ? (
							<CenterPanelTabFrame
								activeTab={activeTab}
								outlineAriaLabel="Report left rail"
								railContent={renderDeferredPanel(
									<NoteRail />,
									"Report rail unavailable",
									"The report rail did not load. Retry after the dev server reconnects, or reload the app if it persists.",
								)}
								mainContent={renderDeferredPanel(
									<Note />,
									"Report workspace unavailable",
									"The report workspace did not load. Retry after the dev server reconnects, or reload the app if it persists.",
								)}
							/>
						) : activeTab === "Workflows" ? (
							<CenterPanelTabFrame
								activeTab={activeTab}
								outlineAriaLabel="Flows left rail"
								panelId="panel-flows"
								railContent={renderDeferredPanel(
									<FlowsRail
										activeFlowId={activeFlowId}
										onSelectFlow={(fid) => {
											setActiveFlowId(fid);
											if (fid !== "review") setActiveReviewRun(null);
										}}
										onOpenReviewRun={(sessionId, runIndex) => {
											setActiveReviewRun({ sessionId, runIndex });
											setActiveFlowId("review");
										}}
									/>,
									"Workflow rail unavailable",
									"The workflow navigation rail did not load. Retry after the dev server reconnects, or reload the app if it persists.",
								)}
								mainContent={renderDeferredPanel(
									<FlowHost activeFlowId={activeFlowId} activeReviewRun={activeReviewRun} />,
									"Workflow workspace unavailable",
									"The workflow workspace did not load. Retry after the dev server reconnects, or reload the app if it persists.",
								)}
							/>
						) : activeTab === "Dashboard" ? (
							<CenterPanelTabFrame
								activeTab={activeTab}
								outlineAriaLabel="Dashboard builder rail"
								panelId="panel-dashboard"
								railContent={(
									<WorkspaceInfoCard
										title="Dashboard Builder"
										description="Build presentation-ready municipal dashboards with reusable widgets, saveable layouts, and export outputs for PDF, PNG, and embeddable HTML."
										bullets={[
											"Drag widgets into a snap-to-grid canvas",
											"Load city profile, SDG, risk, equity, and neighbourhood templates",
											"Save, restore, rename, and export dashboards from one workspace",
										]}
										accent
									/>
								)}
								mainContent={renderDeferredPanel(
									<DashboardBuilder pendingBindingRequest={dashboardBindingRequest} />,
									"Dashboard builder unavailable",
									"The dashboard builder did not load. Retry after the dev server reconnects, or reload the app if it persists.",
								)}
							/>
						) : (
							<CenterPanelTabFrame
								activeTab={activeTab}
								outlineAriaLabel="Left navigation"
								panelId="panel-fallback"
								railContent={<div />}
								mainContent={<div />}
							/>
						)}

						{}
					</div>
	            {}
	            {isMapOpen ? renderDeferredPanel(
					<MapExplorerModal open={isMapOpen} onClose={closeMap} />,
					"Map Explorer unavailable",
					"The Map Explorer did not load. Retry after the dev server reconnects, or reload the app if it persists.",
				) : null}
	            </ProjectRegistryProvider>

				{}
				{showFooter && (
					<footer className={styles.footer} role="contentinfo">
						<div>{footerLeft ?? <span />}</div>
						<div>{footerRight ?? <span />}</div>
					</footer>
				)}
		</section>
			</CollaborationProvider>
	);
};

export default CenterPanelShell;
