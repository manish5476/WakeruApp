const fs = require('fs');
const path = require('path');

const fixAuthFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Remove expo-router
  content = content.replace(
    /import \{.*?\} from 'expo-router';/g,
    "import { useNavigation } from '@react-navigation/native';\nimport type { GuestNavigationProp } from '@/navigation/types';",
  );

  // Fix imports
  content = content.replace(/..\/..\/stores\/auth.store/g, '@/state/auth.store');
  content = content.replace(/..\/..\/providers\/ThemeProvider/g, '@tripsplit/design-system');
  content = content.replace(/..\/..\/utils\/haptics/g, '@/shared/utils/haptics');
  content = content.replace(/..\/..\/utils\/toast/g, 'react-native-toast-message');
  content = content.replace(/..\/..\/components\/ui\/GlassCard/g, '@/shared/components/GlassCard');
  content = content.replace(/..\/..\/utils\/storage/g, '@/shared/utils/storage');
  content = content.replace(
    /..\/..\/components\/common\/GlobalLoader/g,
    '@/shared/components/GlobalLoader',
  );
  content = content.replace(/..\/..\/components\/common\/AppIcon/g, '@/shared/components/AppIcon');
  content = content.replace(/..\/..\/components\/common\/AppLogo/g, '@/shared/components/AppIcon'); // AppLogo missing? Or we can map it
  content = content.replace(
    /..\/..\/components\/ui\/Typography/g,
    '@/shared/components/Typography',
  );
  content = content.replace(
    /..\/..\/components\/ui\/AppBackground/g,
    '@/shared/components/GlobalBackground',
  );

  // Replace router calls
  content = content.replace(
    /const \{ returnTo \} = useLocalSearchParams<\w+>\(\);/g,
    "const returnTo = '';",
  );

  // Navigation
  content = content.replace(
    /router\.replace\('\/\(tabs\)\/dashboard'\)/g,
    '/* Auth state will unmount GuestNavigator automatically */',
  );
  content = content.replace(
    /router\.replace\('\/onboarding'\)/g,
    "navigation.navigate('Onboarding')",
  );
  content = content.replace(/router\.push\('\/register'\)/g, "navigation.navigate('Register')");
  content = content.replace(/router\.push\('\/login'\)/g, "navigation.navigate('Login')");
  content = content.replace(
    /router\.push\('\/forgot-password'\)/g,
    "navigation.navigate('ForgotPassword')",
  );

  // Inside component
  if (!content.includes('const navigation = useNavigation')) {
    content = content.replace(/export default function \w+\(\) \{/, (match) => {
      return `${match}\n    const navigation = useNavigation<GuestNavigationProp>();`;
    });
  }

  // Fix Toast import logic
  content = content.replace(
    /import \{ showToast \} from 'react-native-toast-message';/g,
    "import Toast from 'react-native-toast-message';\nconst showToast = (type, text1, text2) => Toast.show({ type, text1, text2 });",
  );

  // Fix default export name if needed

  // Expo router Link -> Pressable
  content = content.replace(
    /<Link href=".*?">([\s\S]*?)<\/Link>/g,
    '<Pressable onPress={() => {}}>$1</Pressable>',
  );

  fs.writeFileSync(filePath, content, 'utf-8');
};

const screensDir = path.join(
  __dirname,
  'apps/mobile/src/features/authentication/presentation/screens',
);
fixAuthFile(path.join(screensDir, 'LoginScreen.tsx'));
fixAuthFile(path.join(screensDir, 'RegisterScreen.tsx'));

console.log('Fixed Auth screens');
