import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { GuestStackParamList } from './types';
import LoginScreen from '@/features/authentication/presentation/screens/LoginScreen';
import RegisterScreen from '@/features/authentication/presentation/screens/RegisterScreen';
import ForgotPasswordScreen from '@/features/authentication/presentation/screens/ForgotPasswordScreen';
import SetPasswordScreen from '@/features/authentication/presentation/screens/SetPasswordScreen';
import OnboardingScreen from '@/features/authentication/presentation/screens/OnboardingScreen';

const Stack = createNativeStackNavigator<GuestStackParamList>();

export function GuestNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}

export default GuestNavigator;
