'use client';

import { useEffect, useRef } from 'react';
// MapLibre v6 ships named exports only — there is no default export.
import {
  AttributionControl,
  LngLatBounds,
  MapLibreMap,
  Marker,
  NavigationControl,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { dayColorVar } from '@/lib/schemas/trip';

/**
 * Interactive itinerary map.
 *
 * Tiles come from OpenFreeMap, which serves OpenStreetMap-derived vector tiles
 * with no API key, no account and no usage billing — the only option that fits
 * a project meant to cost nothing to run. MapLibre GL is the open fork of
 * Mapbox GL and carries no licence key either.
 */

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export type MapPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  day: number;
  /** 1-based position within its day, used as the pin label. */
  order: number;
};

type Props = {
  points: MapPoint[];
  center: { lat: number; lng: number };
  activeId: string | null;
  onActivate: (id: string | null) => void;
  className?: string;
};

export default function TripMap({ points, center, activeId, onActivate, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, { marker: Marker; element: HTMLElement }>>(new Map());

  // Keep the latest callback reachable from listeners bound once at mount.
  // Written in an effect rather than during render: refs must not be mutated
  // while rendering, or a discarded render can leave a stale value behind.
  const onActivateRef = useRef(onActivate);
  useEffect(() => {
    onActivateRef.current = onActivate;
  }, [onActivate]);

  // --- Map lifecycle -------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: STYLE_URL,
      center: [center.lng, center.lat],
      zoom: 11,
      attributionControl: false,
    });

    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(
      new AttributionControl({
        compact: true,
        customAttribution: '© OpenStreetMap contributors · OpenFreeMap',
      }),
    );

    map.on('click', () => onActivateRef.current(null));
    mapRef.current = map;

    // Captured now so cleanup does not read a ref that may have been
    // reassigned by the time the component unmounts.
    const markers = markersRef.current;

    return () => {
      map.remove();
      mapRef.current = null;
      markers.clear();
    };
    // Mount once. Recentring on prop change is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Markers -------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const { marker } of markersRef.current.values()) marker.remove();
    markersRef.current.clear();

    if (points.length === 0) return;

    for (const point of points) {
      const element = document.createElement('button');
      element.type = 'button';
      element.className = 'wayfare-pin';
      element.textContent = String(point.order);
      element.setAttribute('aria-label', `Day ${point.day}, stop ${point.order}: ${point.name}`);
      element.style.setProperty('--pin-color', dayColorVar(point.day));

      element.addEventListener('click', (event) => {
        event.stopPropagation();
        onActivateRef.current(point.id);
      });
      element.addEventListener('mouseenter', () => onActivateRef.current(point.id));

      const marker = new Marker({ element }).setLngLat([point.lng, point.lat]).addTo(map);

      markersRef.current.set(point.id, { marker, element });
    }

    // Frame all stops, unless there is only one to frame.
    if (points.length === 1) {
      const only = points[0]!;
      map.easeTo({ center: [only.lng, only.lat], zoom: 14 });
      return;
    }

    const bounds = points.reduce(
      (acc, point) => acc.extend([point.lng, point.lat]),
      new LngLatBounds([points[0]!.lng, points[0]!.lat], [points[0]!.lng, points[0]!.lat]),
    );

    map.fitBounds(bounds, { padding: 64, maxZoom: 14, duration: 0 });
  }, [points]);

  // --- Selection sync ------------------------------------------------------
  useEffect(() => {
    for (const [id, { element }] of markersRef.current) {
      element.classList.toggle('is-active', id === activeId);
    }

    if (!activeId) return;

    const point = points.find((candidate) => candidate.id === activeId);
    if (point && mapRef.current) {
      mapRef.current.easeTo({ center: [point.lng, point.lat], duration: 400 });
    }
  }, [activeId, points]);

  return <div ref={containerRef} className={className} role="application" aria-label="Trip map" />;
}
