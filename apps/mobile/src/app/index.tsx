import GlobalLoader from '../components/common/GlobalLoader';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/auth.store';
import { View } from 'react-native';
import { colors } from '../theme';
import { GlobalBackground } from '../components/ui/GlobalBackground';

export default function Index() {
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return (
      <GlobalBackground>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.white,
          }}
        >
          <GlobalLoader variant="inline" size="large" color={colors.primary} />
        </View>
      </GlobalBackground>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  return <Redirect href="/(auth)/onboarding" />;
}
