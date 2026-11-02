import { useCallback, useEffect, useRef, useState } from 'react';

/*
 * Follows the device's real GPS position while the component is on screen, so the punch button reacts the moment
 * someone walks into (or out of) the office. Nothing is ever assumed: until the browser reports a position,
 * `coords` stays null.
 *
 * status: 'locating' | 'ready' | 'denied' | 'unavailable' | 'unsupported'
 */
export function useLiveLocation() {
    const [coords, setCoords] = useState(null);
    const [status, setStatus] = useState('locating');
    const [error, setError] = useState('');
    const watchId = useRef(null);

    const start = useCallback(() => {
        if (!('geolocation' in navigator)) {
            setStatus('unsupported');
            setError('This browser cannot share its location.');
            return;
        }
        if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
        setStatus((s) => (s === 'ready' ? s : 'locating'));
        setError('');
        watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
                setCoords({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: Math.round(pos.coords.accuracy),
                    at: pos.timestamp,
                });
                setStatus('ready');
                setError('');
            },
            (err) => {
                if (err.code === err.PERMISSION_DENIED) {
                    setStatus('denied');
                    setError('Location access is blocked. Allow it for this site in your browser settings, then try again.');
                } else {
                    setStatus((s) => (s === 'ready' ? s : 'unavailable'));
                    setError('Your location could not be found. Check that location services are on.');
                }
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
        );
    }, []);

    useEffect(() => {
        start();
        return () => {
            if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
        };
    }, [start]);

    return { coords, status, error, retry: start };
}
