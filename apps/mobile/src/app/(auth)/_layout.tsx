import { Stack } from 'expo-router';
import { GlobalBackground } from '../../components/ui/GlobalBackground';

export default function AuthLayout() {
  return (
    <GlobalBackground>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
      </Stack>
    </GlobalBackground>
  );
}
