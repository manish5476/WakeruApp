import { Redirect } from 'expo-router';

export default function AppSplitsRedirect() {
  return <Redirect href="/(app)/(tabs)/expenses" />;
}
