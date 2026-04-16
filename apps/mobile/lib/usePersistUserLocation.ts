import { authClient } from '@/lib/auth-client';
import { usePreciseLocation } from '@/lib/geolocation';
import { useTRPC } from '@/provider/appProvider';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

const MIN_INTERVAL_MS = 2 * 60 * 1000;

/**
 * Envoie la position au serveur quand l’utilisateur est connecté et que le suivi GPS fournit un point.
 * Limité à une sauvegarde toutes les 2 minutes si les coordonnées n’ont presque pas bougé.
 */
export function usePersistUserLocation() {
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();
  const { location, permissionGranted } = usePreciseLocation();
  const { mutate } = useMutation(trpc.user.saveLocation.mutationOptions());
  const lastSentAt = useRef(0);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id || !permissionGranted || !location) {
      return;
    }

    const key = `${location.latitude.toFixed(5)},${location.longitude.toFixed(5)}`;
    const now = Date.now();
    const sameCell = lastKey.current === key;
    const tooSoon = now - lastSentAt.current < MIN_INTERVAL_MS;

    if (sameCell && tooSoon) {
      return;
    }

    lastKey.current = key;
    lastSentAt.current = now;
    mutate({
      latitude: location.latitude,
      longitude: location.longitude,
    });
  }, [session?.user?.id, permissionGranted, location?.latitude, location?.longitude, mutate]);
}
