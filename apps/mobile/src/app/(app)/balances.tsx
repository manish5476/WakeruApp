// src/app/(app)/balances.tsx
import React from 'react';
import { Redirect } from 'expo-router';

export default function BalancesRedirect() {
  return <Redirect href="/(app)/settlements?tab=payable" />;
}
