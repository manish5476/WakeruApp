import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';

export type GuestStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type GuestNavigationProp = NativeStackNavigationProp<GuestStackParamList>;

const Stack = createNativeStackNavigator<GuestStackParamList>();

// Placeholders
function LoginScreen() { return <View><Text>Login</Text></View>; }
function SignUpScreen() { return <View><Text>SignUp</Text></View>; }

export function GuestNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}
