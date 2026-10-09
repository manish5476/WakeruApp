import { Stack } from 'expo-router';
import { GlobalBackground } from '../../components/ui/GlobalBackground';
import { SEOHead } from '../../components/seo/SEOHead';

export default function AuthLayout() {
  return (
    <GlobalBackground>
      <SEOHead title="Account Authentication" noindex nofollow />
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
        <Stack.Screen name="verify-email" />
      </Stack>
    </GlobalBackground>
  );
}
