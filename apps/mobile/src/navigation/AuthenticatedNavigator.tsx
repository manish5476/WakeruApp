import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

export type AuthenticatedTabParamList = {
  Dashboard: undefined;
  Trips: undefined;
  Profile: undefined;
};

export type AuthenticatedNavigationProp = BottomTabNavigationProp<AuthenticatedTabParamList>;

const Tab = createBottomTabNavigator<AuthenticatedTabParamList>();

// Placeholders
function DashboardScreen() { return <View><Text>Dashboard</Text></View>; }
function TripsScreen() { return <View><Text>Trips</Text></View>; }
function ProfileScreen() { return <View><Text>Profile</Text></View>; }

export function AuthenticatedNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Trips" component={TripsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
