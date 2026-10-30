import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Crosshair,
  Building2,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  OFFICE_GEOFENCE_POLYGON,
  OFFICE_CENTROID,
  OFFICE_INFO,
  evaluateGeofence,
} from '../utils/geofence';
import './GeofenceMap.css';

export function GeofenceMap({
  userCoords,
  onCoordsChange,
  compact = false,
  height = '360px',
  className = '',
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const distanceLineRef = useRef(null);

  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Evaluate current geofence status
  const geofenceResult = evaluateGeofence(
    userCoords?.latitude,
    userCoords?.longitude,
    userCoords?.accuracy || 15
  );

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter = userCoords
      ? [userCoords.latitude, userCoords.longitude]
      : OFFICE_CENTROID;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 18,
      zoomControl: !compact,
      attributionControl: false,
    });

    // High quality OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
    }).addTo(map);

    // Office Geofence Polygon
    const polygon = L.polygon(OFFICE_GEOFENCE_POLYGON, {
      color: '#0f766e',
      weight: 2.5,
      opacity: 0.9,
      fillColor: '#14b8a6',
      fillOpacity: 0.3,
      dashArray: '5, 5',
    }).addTo(map);

    polygon.bindPopup(`
      <div style="font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.4; color: #0f172a;">
        <strong style="color: #0f766e; font-size: 14px; display: block; margin-bottom: 2px;">
          🏢 ${OFFICE_INFO.name}
        </strong>
        <span style="color: #64748b; font-size: 12px; display: block;">
          ${OFFICE_INFO.title}
        </span>
        <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #475569;">
          <strong>Polygon Vertices:</strong><br/>
          1. 26.853858, 75.766749<br/>
          2. 26.853565, 75.766882<br/>
          3. 26.853823, 75.767448<br/>
          4. 26.854029, 75.767214
        </div>
      </div>
    `);

    polygon.bindTooltip('🏢 Office Geofence Zone', {
      permanent: false,
      direction: 'top',
      className: 'geofence-tooltip',
    });

    polygonLayerRef.current = polygon;
    mapInstanceRef.current = map;

    // Click anywhere on map to set simulated coordinates
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (onCoordsChange) {
        onCoordsChange({
          latitude: lat,
          longitude: lng,
          accuracy: 10,
          simulated: true,
        });
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Marker & Accuracy Ring when userCoords change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!userCoords?.latitude || !userCoords?.longitude) {
      if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
      if (accuracyCircleRef.current) map.removeLayer(accuracyCircleRef.current);
      if (distanceLineRef.current) map.removeLayer(distanceLineRef.current);
      return;
    }

    const { latitude, longitude, accuracy = 15 } = userCoords;
    const isInside = geofenceResult.isInside;

    // 1. User Location Pulse Marker (using DivIcon)
    const markerHtml = `
      <div class="user-marker-pulse ${isInside ? 'is-inside' : 'is-outside'}">
        <div class="pulse-ring"></div>
        <div class="pulse-core"></div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: markerHtml,
      className: 'custom-user-pin',
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([latitude, longitude]);
      userMarkerRef.current.setIcon(customIcon);
    } else {
      userMarkerRef.current = L.marker([latitude, longitude], {
        icon: customIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    }

    userMarkerRef.current.bindPopup(`
      <div style="font-family: system-ui, sans-serif; font-size: 12.5px;">
        <strong style="color: ${isInside ? '#0f766e' : '#e11d48'};">
          ${isInside ? '🟢 You are INSIDE the office' : '🔴 You are OUTSIDE the office'}
        </strong><br/>
        <span>Distance to geofence: <strong>${Math.round(geofenceResult.distanceMeters || 0)}m</strong></span><br/>
        <span style="color: #64748b; font-size: 11px;">GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</span>
      </div>
    `);

    // 2. Accuracy Circle
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setLatLng([latitude, longitude]);
      accuracyCircleRef.current.setRadius(accuracy);
      accuracyCircleRef.current.setStyle({
        color: isInside ? '#0f766e' : '#e11d48',
        fillColor: isInside ? '#14b8a6' : '#f43f5e',
      });
    } else {
      accuracyCircleRef.current = L.circle([latitude, longitude], {
        radius: accuracy,
        color: isInside ? '#0f766e' : '#e11d48',
        weight: 1,
        opacity: 0.5,
        fillColor: isInside ? '#14b8a6' : '#f43f5e',
        fillOpacity: 0.12,
      }).addTo(map);
    }

    // 3. Distance connector line if outside
    if (!isInside) {
      if (distanceLineRef.current) {
        distanceLineRef.current.setLatLngs([
          [latitude, longitude],
          OFFICE_CENTROID,
        ]);
      } else {
        distanceLineRef.current = L.polyline(
          [[latitude, longitude], OFFICE_CENTROID],
          {
            color: '#e11d48',
            weight: 2,
            dashArray: '4, 4',
            opacity: 0.7,
          }
        ).addTo(map);
      }
    } else if (distanceLineRef.current) {
      map.removeLayer(distanceLineRef.current);
      distanceLineRef.current = null;
    }

    // Adjust view to fit both user and polygon if outside
    if (!isInside && polygonLayerRef.current) {
      const bounds = L.latLngBounds([
        [latitude, longitude],
        ...OFFICE_GEOFENCE_POLYGON,
      ]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
    }
  }, [userCoords?.latitude, userCoords?.longitude, userCoords?.accuracy, geofenceResult.isInside]);

  // Request browser GPS position
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        if (onCoordsChange) {
          onCoordsChange({
            latitude,
            longitude,
            accuracy: Math.round(accuracy),
            simulated: false,
          });
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 18);
        }
      },
      (err) => {
        setIsLocating(false);
        setGpsError(err.message || 'Unable to retrieve your location.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Simulate Inside Office
  const handleSimulateInside = () => {
    setGpsError(null);
    const [lat, lng] = OFFICE_CENTROID;
    if (onCoordsChange) {
      onCoordsChange({
        latitude: lat,
        longitude: lng,
        accuracy: 8,
        simulated: true,
      });
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 19);
    }
  };

  // Simulate Outside Office
  const handleSimulateOutside = () => {
    setGpsError(null);
    // ~150 meters north-east of office
    const lat = 26.8552;
    const lng = 75.7682;
    if (onCoordsChange) {
      onCoordsChange({
        latitude: lat,
        longitude: lng,
        accuracy: 12,
        simulated: true,
      });
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 17);
    }
  };

  // Recenter map on office polygon
  const handleRecenter = () => {
    if (mapInstanceRef.current && polygonLayerRef.current) {
      mapInstanceRef.current.fitBounds(polygonLayerRef.current.getBounds(), {
        padding: [30, 30],
        maxZoom: 19,
      });
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Geofence Status Header Banner */}
      <div
        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
          geofenceResult.isInside
            ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            : 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              geofenceResult.isInside
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {geofenceResult.isInside ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                {geofenceResult.isInside
                  ? 'Inside Office Geofence · Attendance Allowed'
                  : 'Outside Office Geofence · Attendance Locked'}
              </span>
              {userCoords?.simulated && (
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  Simulated
                </span>
              )}
            </div>
            <p className="text-xs opacity-90 mt-0.5">
              {geofenceResult.message}
            </p>
          </div>
        </div>

        {/* Distance Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="text-right">
            <span className="block text-[10px] uppercase tracking-wider font-semibold opacity-75">
              Distance to Office
            </span>
            <span className="text-base font-extrabold tabular-nums">
              {geofenceResult.isInside
                ? '0 meters'
                : `${Math.round(geofenceResult.distanceMeters || 0)}m away`}
            </span>
          </div>
        </div>
      </div>

      {gpsError && (
        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{gpsError} (You can use the simulation buttons below to test).</span>
        </div>
      )}

      {/* Map Display Container */}
      <div
        className="geofence-map-container"
        style={{ height }}
      >
        <div ref={mapContainerRef} className="geofence-leaflet" />

        {/* Top-Right Quick Map Controls */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md">
          <button
            type="button"
            onClick={handleRecenter}
            title="Recenter Office Geofence"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Building2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isLocating}
            title="Detect Live GPS"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-teal-600 dark:text-teal-400 transition-colors disabled:opacity-50"
          >
            {isLocating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Crosshair className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Bottom Map Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-3 shadow-sm pointer-events-none">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded bg-teal-500/40 border border-teal-600 inline-block"></span>
            Office Geofence
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block"></span>
            Your Position
          </span>
          <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">
            (Click map to test position)
          </span>
        </div>
      </div>

      {/* Geofence Quick Actions / Simulation Toolbar */}
      {!compact && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>
              Coordinates:{' '}
              <strong className="text-slate-800 dark:text-slate-200 tabular-nums">
                {userCoords
                  ? `${userCoords.latitude.toFixed(5)}, ${userCoords.longitude.toFixed(5)}`
                  : 'Not detected'}
              </strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
            >
              <Navigation className={`w-3.5 h-3.5 text-teal-600 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Detecting GPS...' : 'Detect Real GPS'}</span>
            </button>

            <button
              type="button"
              onClick={handleSimulateInside}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 hover:bg-teal-100 transition shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Test: Move Inside (0m)</span>
            </button>

            <button
              type="button"
              onClick={handleSimulateOutside}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 hover:bg-rose-100 transition shadow-sm"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Test: Move Outside (150m)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
