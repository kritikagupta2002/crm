/**
 * Bansal Geo Solutions Geofence Service
 * Polygon Boundary Coordinates:
 * 1: 26.853858, 75.766749
 * 2: 26.853565, 75.766882
 * 3: 26.853823, 75.767448
 * 4: 26.854029, 75.767214
 */
import { config } from '../config/config.js';

export const OFFICE_POLYGON = [
  [26.853858, 75.766749],
  [26.853565, 75.766882],
  [26.853823, 75.767448],
  [26.854029, 75.767214],
];

export const OFFICE_CENTROID = [
  (26.853858 + 26.853565 + 26.853823 + 26.854029) / 4,
  (75.766749 + 75.766882 + 75.767448 + 75.767214) / 4,
];

// Production buffer tolerance (15 meters) to accommodate indoor GPS drift & concrete building attenuation
export const BUFFER_TOLERANCE_METERS = 15;

export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isPointInPolygon(point, vs = OFFICE_POLYGON) {
  const x = point[0];
  const y = point[1];
  let inside = false;

  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0];
    const yi = vs[i][1];
    const xj = vs[j][0];
    const yj = vs[j][1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToSegment(p, v, w) {
  const d1 = haversineDistanceMeters(p[0], p[1], v[0], v[1]);
  const dx = w[0] - v[0];
  const dy = w[1] - v[1];
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return d1;
  const t = Math.max(0, Math.min(1, ((p[0] - v[0]) * dx + (p[1] - v[1]) * dy) / lenSq));
  const proj = [v[0] + t * dx, v[1] + t * dy];
  return haversineDistanceMeters(p[0], p[1], proj[0], proj[1]);
}

export function getDistanceToPolygon(point, vs = OFFICE_POLYGON) {
  if (isPointInPolygon(point, vs)) return 0;
  let minDist = Infinity;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const d = distToSegment(point, vs[i], vs[j]);
    if (d < minDist) minDist = d;
  }
  return Math.round(minDist * 10) / 10;
}

/**
 * Check if the client IP is on the trusted Office Network / Localhost
 */
export function isOfficeNetworkIp(clientIp) {
  if (!clientIp) return false;
  const cleanIp = clientIp.replace(/^::ffff:/, '');
  return config.officeIps.some((trusted) => cleanIp === trusted || cleanIp.startsWith(trusted));
}

/**
 * Full Production Geofence Evaluation
 * Includes 15-meter buffer margin and accuracy threshold check
 */
export function verifyGeofence(latitude, longitude, accuracy = null, clientIp = null) {
  // 1. Check office IP fallback for desktop workstations
  if (isOfficeNetworkIp(clientIp)) {
    return {
      isInside: true,
      distanceMeters: 0,
      verifiedBy: 'Office Network / IP Whitelist',
      centroid: OFFICE_CENTROID,
      polygon: OFFICE_POLYGON,
    };
  }

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return { isInside: false, distanceMeters: null, error: 'GPS coordinates missing.' };
  }

  const point = [latitude, longitude];
  const rawInside = isPointInPolygon(point);
  const distanceMeters = getDistanceToPolygon(point);

  // Apply 15m buffer tolerance: if user is within 15 meters of perimeter, grant access
  const isInside = rawInside || distanceMeters <= BUFFER_TOLERANCE_METERS;

  const isLowAccuracy = typeof accuracy === 'number' && accuracy > 50;

  return {
    isInside,
    rawInside,
    distanceMeters,
    accuracy: typeof accuracy === 'number' ? Math.round(accuracy) : null,
    isLowAccuracy,
    bufferApplied: !rawInside && isInside,
    verifiedBy: 'Office Polygon GPS Geofence',
    centroid: OFFICE_CENTROID,
    polygon: OFFICE_POLYGON,
  };
}
