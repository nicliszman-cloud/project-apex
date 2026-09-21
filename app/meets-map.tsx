import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type EventCoordinate = {
  id: string;
  latitude: number;
  longitude: number;
};

type UserCoordinate = {
  latitude: number;
  longitude: number;
};

const BRAZIL_REGION: Region = {
  latitude: -14.235,
  longitude: -51.9253,
  latitudeDelta: 28,
  longitudeDelta: 28,
};

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0d0f12' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8c929c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d0f12' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2b2d32' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0d0f12' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#121419' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#686d76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#23262c' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#121419' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#30343b' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#17191e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#08090b' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4b515c' }] },
];

export default function MeetsMapScreen() {
  const { events } = useApp();
  const mapRef = useRef<MapView>(null);
  const attemptedGeocodes = useRef(new Set<string>());
  const [eventCoordinates, setEventCoordinates] = useState<EventCoordinate[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [userLocation, setUserLocation] = useState<UserCoordinate | null>(null);
  const [locationAllowed, setLocationAllowed] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);

  const selected = useMemo(
    () => events.find((item) => item.id === selectedId) || null,
    [events, selectedId]
  );

  useEffect(() => {
    let mounted = true;

    async function loadCoordinates() {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('events')
        .select('id, latitude, longitude')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (!mounted) return;
      if (error?.code === '42703') {
        setEventCoordinates([]);
        return;
      }
      if (error) {
        console.warn('StreetClub map events:', error.message);
        return;
      }

      setEventCoordinates(
        (data ?? [])
          .filter((row: any) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude))
          .map((row: any) => ({
            id: row.id,
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
          }))
      );
    }

    void loadCoordinates();
    const timer = setInterval(() => {
      void loadCoordinates();
    }, 15000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let active = true;

    async function startLocation() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!active) return;

        if (permission.status !== 'granted') {
          setLocationAllowed(false);
          setLoadingLocation(false);
          return;
        }

        setLocationAllowed(true);

        const lastKnown = await Location.getLastKnownPositionAsync({
          maxAge: 120000,
          requiredAccuracy: 500,
        });

        if (active && lastKnown) {
          const next = {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          };
          setUserLocation(next);
          mapRef.current?.animateToRegion(
            { ...next, latitudeDelta: 0.16, longitudeDelta: 0.16 },
            500
          );
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (position) => {
            if (!active) return;
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          }
        );
      } catch (error: any) {
        if (active) Alert.alert('Mapa', error?.message ?? 'Não foi possível obter sua localização.');
      } finally {
        if (active) setLoadingLocation(false);
      }
    }

    void startLocation();

    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (!locationAllowed) return;

    let active = true;

    async function geocodeLegacyEvents() {
      const missing = events
        .filter((event) => !eventCoordinates.some((coordinate) => coordinate.id === event.id))
        .filter((event) => !attemptedGeocodes.current.has(event.id))
        .slice(0, 10);

      for (const event of missing) {
        attemptedGeocodes.current.add(event.id);
        try {
          const address = [event.place, event.city.replace(/•/g, ','), 'Brasil'].filter(Boolean).join(', ');
          const result = await Location.geocodeAsync(address);
          if (!active || !result[0]) continue;

          setEventCoordinates((current) => {
            if (current.some((coordinate) => coordinate.id === event.id)) return current;
            return [...current, {
              id: event.id,
              latitude: result[0].latitude,
              longitude: result[0].longitude,
            }];
          });
        } catch {
          // Keep the event in the list even when the device geocoder cannot resolve it.
        }
      }
    }

    void geocodeLegacyEvents();

    return () => {
      active = false;
    };
  }, [locationAllowed, events, eventCoordinates]);

  useEffect(() => {
    if (selectedId) return;
    const first = eventCoordinates.find((coord) => events.some((event) => event.id === coord.id));
    if (first) setSelectedId(first.id);
  }, [eventCoordinates, events, selectedId]);

  function centerOnUser() {
    if (!userLocation) {
      Alert.alert('Localização', locationAllowed ? 'Aguardando uma posição do aparelho.' : 'Permita o acesso à localização para centralizar o mapa.');
      return;
    }

    mapRef.current?.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      },
      450
    );
  }

  const initialRegion = userLocation
    ? { ...userLocation, latitudeDelta: 0.16, longitudeDelta: 0.16 }
    : eventCoordinates[0]
      ? { ...eventCoordinates[0], latitudeDelta: 0.18, longitudeDelta: 0.18 }
      : BRAZIL_REGION;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
        <View>
          <Text style={styles.title}>Mapa</Text>
          <Text style={styles.subtitle}>Meets e sua posição em tempo real</Text>
        </View>
        <Pressable onPress={centerOnUser} style={styles.locationButton}>
          <Ionicons
            name={loadingLocation ? 'hourglass-outline' : 'navigate'}
            size={19}
            color={theme.colors.accent}
          />
        </Pressable>
      </View>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={initialRegion}
          customMapStyle={DARK_MAP_STYLE}
          userInterfaceStyle="dark"
          showsUserLocation={locationAllowed}
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
          onPress={() => setSelectedId('')}
        >
          {eventCoordinates.map((coordinate) => {
            const event = events.find((item) => item.id === coordinate.id);
            if (!event) return null;
            const active = selectedId === event.id;

            return (
              <Marker
                key={event.id}
                coordinate={{
                  latitude: coordinate.latitude,
                  longitude: coordinate.longitude,
                }}
                onPress={() => setSelectedId(event.id)}
              >
                <View style={[styles.pin, active && styles.pinActive]}>
                  <Ionicons name="car-sport" size={17} color={theme.colors.white} />
                </View>
              </Marker>
            );
          })}
        </MapView>

        {!locationAllowed && !loadingLocation && (
          <View style={styles.permissionBanner}>
            <Ionicons name="location-outline" size={17} color={theme.colors.accent} />
            <Text style={styles.permissionText}>Ative a localização para ver sua posição no mapa.</Text>
          </View>
        )}

        {eventCoordinates.length === 0 && (
          <View pointerEvents="none" style={styles.noPins}>
            <Text style={styles.noPinsText}>Novos eventos marcados com localização aparecerão como pins vermelhos.</Text>
          </View>
        )}

        {!!selected && (
          <Pressable style={styles.eventCard} onPress={() => router.push('/event/' + selected.id)}>
            <AppImage uri={selected.image} style={styles.eventImage} />
            <View style={styles.eventInfo}>
              <Text style={styles.eventEyebrow}>{selected.category.toUpperCase()}</Text>
              <Text style={styles.eventTitle} numberOfLines={1}>{selected.title}</Text>
              <Text style={styles.eventMeta} numberOfLines={1}>{selected.date}</Text>
              <Text style={styles.eventMeta} numberOfLines={1}>{selected.place} · {selected.city}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.muted2} />
          </Pressable>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 62,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 3 },
  title: { color: theme.colors.text, fontSize: 20, fontWeight: '900' },
  subtitle: { color: theme.colors.muted, fontSize: 9.5, marginTop: 2 },
  locationButton: {
    marginLeft: 'auto',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapWrap: { flex: 1, backgroundColor: '#08090B', overflow: 'hidden' },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9A111B',
    borderWidth: 3,
    borderColor: '#25070A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinActive: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.accent,
    borderColor: '#41090E',
  },
  permissionBanner: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(8,9,11,.94)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  permissionText: { color: theme.colors.textSoft, fontSize: 10.5, flex: 1 },
  noPins: {
    position: 'absolute',
    top: 68,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  noPinsText: {
    color: theme.colors.muted,
    fontSize: 10,
    textAlign: 'center',
    backgroundColor: 'rgba(8,9,11,.78)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  eventCard: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 16,
    minHeight: 96,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(16,17,20,.97)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  eventImage: { width: 74, height: 74, borderRadius: 12 },
  eventInfo: { flex: 1, marginLeft: 11 },
  eventEyebrow: { color: theme.colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  eventTitle: { color: theme.colors.text, fontSize: 13, fontWeight: '900', marginTop: 3 },
  eventMeta: { color: theme.colors.muted, fontSize: 9.5, marginTop: 3 },
});
