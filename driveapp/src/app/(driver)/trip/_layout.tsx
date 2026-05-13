import { useTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';

export default function TripStackLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        contentStyle: { backgroundColor: theme.colors.background },
        headerStyle: { backgroundColor: theme.colors.card },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: { color: theme.colors.text },
      }}
    />
  );
}
