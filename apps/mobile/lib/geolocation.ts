import { useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';

export type LocationData = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
};

export function usePreciseLocation(pollingInterval = 1000 * 60 * 10) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watcher = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission de localisation refusée');
          return;
        }
        setPermissionGranted(true);

        

        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          setError('La localisation est désactivé sur votre appareil');
          return;
        }

        watcher.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: pollingInterval,
            distanceInterval: 1,
          },
          (loc) => {
            const { latitude, longitude, accuracy } = loc.coords;
            setLocation({
              latitude,
              longitude,
              accuracy,
              timestamp: loc.timestamp,
            });
          }
        );
      } catch (e) {
        setError((e as Error).message);
      }
    })();

    return () => {
      watcher.current?.remove();
    };
  }, []);

  return { location, permissionGranted, error };
}
