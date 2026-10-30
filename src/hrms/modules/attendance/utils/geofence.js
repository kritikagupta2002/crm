/**
 * Geofencing Utilities & Office Polygon Definition
 * Bansal Geo Solutions Pvt. Ltd.
 */

// 4-point office polygon boundary coordinates provided:
// 1: 26.853858, 75.766749
// 2: 26.853565, 75.766882
// 3: 26.853823, 75.767448
// 4: 26.854029, 75.767214
export const OFFICE_GEOFENCE_POLYGON = [
  [26.853858, 75.766749],
  [26.853565, 75.766882],
  [26.853823, 75.767448],
  [26.854029, 75.767214],
];

export const OFFICE_CENTROID = [
  (26.853858 + 26.853565 + 26.853823 + 26.854029) / 4,
  (75.766749 + 75.766882 + 75.767448 + 75.767214) / 4,
]; // ~ [26.8538188, 75.7670733]

// 15-meter buffer margin to accommodate concrete building walls and GPS attenuation
export const BUFFER_TOLERANCE_METERS = 15;

export const OFFICE_INFO = {
  name: 'Bansal Geo Solutions Pvt. Ltd.',
  title: 'HQ & Attendance Geofence Zone',
  address: 'Jaipur, Rajasthan',
  centroid: OFFICE_CENTROID,
  polygon: OFFICE_GEOFENCE_POLYGON,
};

/**
 * Great-circle distance between two GPS coordinates using Haversine formula (in meters)
 */
export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
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

/**
 * Point-in-polygon test using ray-casting algorithm
 * @param {[number, number]} point [latitude, longitude]
 * @param {Array<[number, number]>} vs Array of [latitude, longitude] vertices
 * @returns {boolean}
 */
export function isPointInPolygon(point, vs = OFFICE_GEOFENCE_POLYGON) {
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

/**
 * Calculates perpendicular or nearest distance from point to line segment
 */
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

/**
 * Calculates minimum distance from a point to the polygon boundary (in meters)
 * If point is inside, distance is 0.
 */
export function getDistanceToPolygon(point, vs = OFFICE_GEOFENCE_POLYGON) {
  if (isPointInPolygon(point, vs)) {
    return 0;
  }

  let minDist = Infinity;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const d = distToSegment(point, vs[i], vs[j]);
    if (d < minDist) {
      minDist = d;
    }
  }
  return Math.round(minDist * 10) / 10;
}

/**
 * Evaluates geofence status for given coordinates with 15m buffer tolerance & accuracy check
 */
export function evaluateGeofence(latitude, longitude, accuracy = 0) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return {
      isInside: false,
      rawInside: false,
      distanceMeters: null,
      status: 'unknown',
      message: 'GPS coordinates unavailable',
      isLowAccuracy: false,
    };
  }

  const point = [latitude, longitude];
  const rawInside = isPointInPolygon(point, OFFICE_GEOFENCE_POLYGON);
  const distanceMeters = getDistanceToPolygon(point, OFFICE_GEOFENCE_POLYGON);

  // Apply 15m buffer tolerance for indoor reception & device drift
  const isInside = rawInside || distanceMeters <= BUFFER_TOLERANCE_METERS;
  const isLowAccuracy = typeof accuracy === 'number' && accuracy > 50;

  let message = '';
  if (isInside) {
    message = rawInside
      ? 'You are inside the office polygon. Attendance punch is enabled.'
      : 'You are within the 15-meter office buffer zone. Attendance punch is enabled.';
  } else {
    message = `You are ${distanceMeters < 1000 ? `${Math.round(distanceMeters)}m` : `${(distanceMeters / 1000).toFixed(2)}km`} away from the office. Move inside to punch attendance.`;
  }

  return {
    isInside,
    rawInside,
    distanceMeters,
    accuracy: Math.round(accuracy),
    isLowAccuracy,
    status: isInside ? 'inside' : 'outside',
    message,
    accuracyWarning: isLowAccuracy
      ? `Low GPS accuracy (±${Math.round(accuracy)}m). Indoor reception may drift. Please step near a window if verification is delayed.`
      : null,
  };
}
