import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';

const Icon = ({ emoji, focused }: { emoji: string; focused: boolean }) => <Text style={{ fontSize: focused ? 24 : 21, opacity: focused ? 1 : 0.62 }}>{emoji}</Text>;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#0D0F12',
        borderTopColor: theme.colors.border,
        height: 62 + Math.max(insets.bottom, 8),
        paddingTop: 7,
        paddingBottom: Math.max(insets.bottom, 8),
      },
      tabBarActiveTintColor: theme.colors.accent,
      tabBarInactiveTintColor: theme.colors.muted,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '800' },
    }}>
      <Tabs.Screen name="feed" options={{ title: 'Feed', tabBarIcon: ({ focused }) => <Icon emoji="⌂" focused={focused}/> }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: ({ focused }) => <Icon emoji="🔥" focused={focused}/> }} />
      <Tabs.Screen name="create" options={{ title: 'Criar', tabBarIcon: ({ focused }) => <Icon emoji="＋" focused={focused}/> }} />
      <Tabs.Screen name="meets" options={{ title: 'Meets', tabBarIcon: ({ focused }) => <Icon emoji="📍" focused={focused}/> }} />
      <Tabs.Screen name="garage" options={{ title: 'Garage', tabBarIcon: ({ focused }) => <Icon emoji="🏎️" focused={focused}/> }} />
    </Tabs>
  );
}
