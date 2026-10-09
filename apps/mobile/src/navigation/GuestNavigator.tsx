import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { GuestStackParamList } from './types';
import LoginScreen from '../app/(auth)/login';
import RegisterScreen from '../app/(auth)/register';
import ForgotPasswordScreen from '../app/(auth)/forgot-password';
import SetPasswordScreen from '../app/(auth)/set-password';
import OnboardingScreen from '../app/(auth)/onboarding';
import VerifyEmailScreen from '../app/(auth)/verify-email';
import { GlobalBackground } from '../components/ui/GlobalBackground';

const Stack = createNativeStackNavigator<GuestStackParamList>();

export function GuestNavigator() {
  console.log(
    '>>> [BOOT] GuestNavigator rendering canonical Expo auth screens',
  );
  return (
    <GlobalBackground>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      </Stack.Navigator>
    </GlobalBackground>
  );
}

export default GuestNavigator;
