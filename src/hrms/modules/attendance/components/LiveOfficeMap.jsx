import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { OFFICE_GEOFENCE_POLYGON, OFFICE_CENTROID } from '../utils/geofence';
import './GeofenceMap.css';

const OFFICE_PIN = L.divIcon({
    className: 'office-pin',
    html: '<span class="office-pin-dot"></span><span class="office-pin-label">Office</span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
});

const userIcon = (inside) => L.divIcon({
    className: 'custom-user-pin',
    html: `<div class="user-marker-pulse ${inside ? 'is-inside' : 'is-outside'}"><div class="pulse-ring"></div><div class="pulse-core"></div></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
});

/*
 * The office boundary with a pin, the person's live position with its GPS accuracy ring, and, when they are
 * outside, a dashed line to the office. The view keeps both in frame as the person moves.
 */
export function LiveOfficeMap({ coords, inside }) {
    const hostRef = useRef(null);
    const mapRef = useRef(null);
    const layers = useRef({});

    useEffect(() => {
        if (!hostRef.current || mapRef.current) return undefined;
        const map = L.map(hostRef.current, {
            center: OFFICE_CENTROID,
            zoom: 18,
            zoomControl: true,
            attributionControl: false,
            scrollWheelZoom: false,
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20 }).addTo(map);
        layers.current.fence = L.polygon(OFFICE_GEOFENCE_POLYGON, {
            color: '#0e6b66',
            weight: 2.5,
            fillColor: '#0e6b66',
            fillOpacity: 0.16,
            dashArray: '6 5',
        }).addTo(map);
        L.marker(OFFICE_CENTROID, { icon: OFFICE_PIN, keyboard: false, interactive: false }).addTo(map);
        mapRef.current = map;
        // The map may mount inside a container that is still animating in; measure again once it settles.
        const t = setTimeout(() => map.invalidateSize(), 350);
        const onResize = () => map.invalidateSize();
        window.addEventListener('resize', onResize);
        return () => {
            clearTimeout(t);
            window.removeEventListener('resize', onResize);
            map.remove();
            mapRef.current = null;
            layers.current = {};
        };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const l = layers.current;
        if (!coords) {
            ['user', 'ring', 'line'].forEach((k) => {
                if (l[k]) {
                    map.removeLayer(l[k]);
                    l[k] = null;
                }
            });
            return;
        }
        const here = [coords.latitude, coords.longitude];
        const colour = inside ? '#0e6b66' : '#b42318';

        if (l.user) {
            l.user.setLatLng(here);
            l.user.setIcon(userIcon(inside));
        } else {
            l.user = L.marker(here, { icon: userIcon(inside), zIndexOffset: 1000, keyboard: false }).addTo(map);
        }
        if (l.ring) {
            l.ring.setLatLng(here).setRadius(coords.accuracy || 15).setStyle({ color: colour, fillColor: colour });
        } else {
            l.ring = L.circle(here, { radius: coords.accuracy || 15, color: colour, weight: 1, opacity: 0.45, fillColor: colour, fillOpacity: 0.08 }).addTo(map);
        }
        if (!inside) {
            if (l.line) l.line.setLatLngs([here, OFFICE_CENTROID]);
            else l.line = L.polyline([here, OFFICE_CENTROID], { color: '#b42318', weight: 2, dashArray: '4 6', opacity: 0.75 }).addTo(map);
            map.fitBounds(L.latLngBounds([here, ...OFFICE_GEOFENCE_POLYGON]), { padding: [36, 36], maxZoom: 18, animate: true });
        } else {
            if (l.line) {
                map.removeLayer(l.line);
                l.line = null;
            }
            map.fitBounds(l.fence.getBounds(), { padding: [40, 40], maxZoom: 19, animate: true });
        }
    }, [coords, inside]);

    return <div ref={hostRef} className="live-map" role="img" aria-label={coords ? (inside ? 'Map: you are inside the office' : 'Map: you are outside the office') : 'Map of the office'}/>;
}
