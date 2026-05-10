/**
 * Google Directions panel — multi-waypoint routing with mode selection,
 * alternatives display, and route summary.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMapState } from '../hooks/useMapState';
import { useTrackApiCall } from './hooks/useGoogleMapsAPI';
import {
 directionsRouteToFeature,
} from './utils/googleToGeoJSON';
import type { Feature, LineString } from 'geojson';

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

export type TravelMode = 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';

export interface Waypoint {
 label?: string;
 location: google.maps.LatLngLiteral;
}

export interface RouteSummary {
 index: number;
 distance: string;
 duration: string;
 summary: string;
 geojson: Feature<LineString>;
}

export interface GoogleDirectionsProps {
 origin: google.maps.LatLngLiteral;
 destination: google.maps.LatLngLiteral;
 waypoints?: Waypoint[];
 mode?: TravelMode;
 /** Include traffic-aware ETA (requires a future departure time). */
 departureTime?: Date;
 /** Request alternative routes. */
 alternatives?: boolean;
 /** Called when results arrive. */
 onRoutes?: (routes: RouteSummary[]) => void;
 className?: string;
 style?: React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */

const MODES: { value: TravelMode; label: string }[] = [
 { value: 'DRIVING', label: ' Drive' },
 { value: 'WALKING', label: ' Walk' },
 { value: 'BICYCLING', label: ' Bike' },
 { value: 'TRANSIT', label: ' Transit' },
];

const GoogleDirections: React.FC<GoogleDirectionsProps> = ({
 origin,
 destination,
 waypoints = [],
 mode: modeProp = 'DRIVING',
 departureTime,
 alternatives = true,
 onRoutes,
 className,
 style,
}) => {
 const [mode, setMode] = useState<TravelMode>(modeProp);
 const [routes, setRoutes] = useState<RouteSummary[]>([]);
 const [selectedIdx, setSelectedIdx] = useState(0);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const serviceRef = useRef<google.maps.DirectionsService | null>(null);
 const flyTo = useMapState((s) => s.flyTo);
 const trackCall = useTrackApiCall();

 /* --- Init --- */
 useEffect(() => {
 if (typeof google !== 'undefined' && google.maps) {
 serviceRef.current = new google.maps.DirectionsService();
 }
 }, []);

 /* --- Fetch directions --- */
 const fetchDirections = useCallback(() => {
 if (!serviceRef.current) return;
 setLoading(true);
 setError(null);

 const request: google.maps.DirectionsRequest = {
 origin,
 destination,
 waypoints: waypoints.map((wp) => ({
 location: wp.location,
 stopover: true,
 })),
 travelMode: mode as unknown as google.maps.TravelMode,
 provideRouteAlternatives: alternatives,
 ...(departureTime && {
 drivingOptions: { departureTime, trafficModel: 'bestguess' as any },
 }),
 };

 serviceRef.current.route(request, (result, status) => {
 setLoading(false);
 if (status !== google.maps.DirectionsStatus.OK || !result) {
 setError(`Directions failed: ${status}`);
 return;
 }

 trackCall('directions', 1, 0.005); // $5/1000

 const summaries: RouteSummary[] = result.routes.map((r, i) => ({
 index: i,
 distance: r.legs.map((l) => l.distance?.text ?? '').join(' + '),
 duration: r.legs.map((l) => l.duration?.text ?? '').join(' + '),
 summary: r.summary,
 geojson: directionsRouteToFeature(r, i),
 }));

 setRoutes(summaries);
 setSelectedIdx(0);
 onRoutes?.(summaries);
 });
 }, [origin, destination, waypoints, mode, departureTime, alternatives, onRoutes, trackCall]);

 /* Re-fetch when inputs change */
 useEffect(() => {
 fetchDirections();
 }, [fetchDirections]);

 /* --- Fly to selected route --- */
 const handleRouteClick = useCallback(
 (idx: number) => {
 setSelectedIdx(idx);
 const feat = routes[idx]?.geojson;
 if (feat) {
 const coords = feat.geometry.coordinates;
 const mid = coords[Math.floor(coords.length / 2)];
 flyTo({ longitude: mid[0], latitude: mid[1] });
 }
 },
 [routes, flyTo],
 );

 return (
 <div
 className={className}
 style={{
 background: '#1e1e1e',
 color: '#ddd',
 padding: 12,
 borderRadius: 6,
 fontSize: 13,
 maxWidth: 340,
 ...style,
 }}
 >
 {/* Mode selector */}
 <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
 {MODES.map((m) => (
 <button
 key={m.value}
 onClick={() => setMode(m.value)}
 style={{
 flex: 1,
 padding: '4px 0',
 border: '1px solid',
 borderColor: mode === m.value ? '#fbbf24' : '#555',
 borderRadius: 4,
 background: mode === m.value ? '#44390d' : '#2a2a2a',
 color: mode === m.value ? '#fbbf24' : '#aaa',
 cursor: 'pointer',
 fontSize: 12,
 }}
 >
 {m.label}
 </button>
 ))}
 </div>

 {/* Status */}
 {!!loading && <div style={{ color: '#888' }}>Calculating…</div>}
 {!!error && <div style={{ color: '#e05050' }}>{error}</div>}

 {/* Route list */}
 {routes.length > 0 && (
 <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
 {routes.map((r) => (
 <li
 key={r.index}
 onClick={() => handleRouteClick(r.index)}
 style={{
 padding: '8px 6px',
 marginBottom: 4,
 borderRadius: 4,
 cursor: 'pointer',
 background:
 r.index === selectedIdx ? '#333' : 'transparent',
 borderLeft:
 r.index === selectedIdx
 ? '3px solid #fbbf24'
 : '3px solid transparent',
 }}
 >
 <div style={{ fontWeight: 600 }}>
 {r.summary || `Route ${r.index + 1}`}
 </div>
 <div style={{ color: '#aaa', fontSize: 11, marginTop: 2 }}>
 {r.distance} — {r.duration}
 </div>
 </li>
 ))}
 </ul>
 )}
 </div>
 );
};

export default GoogleDirections;
