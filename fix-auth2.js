const fs = require('fs');
const path = require('path');

const fixAuthFile = (filePath, screenName) => {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Fix GuestNavigationProp
  content = content.replace(/GuestNavigationProp/g, `GuestNavigationProp<"${screenName}">`);

  // Fix Toast
  content = content.replace(
    /import Toast from 'react-native-toast-message';\nconst showToast = \(type, text1, text2\) => Toast\.show\(\{ type, text1, text2 \}\);/g,
    "import { showToast } from '@/shared/utils/toast';",
  );
  content = content.replace(/@\/shared\/utils\/toast/g, '@/shared/utils/toast'); // just in case

  if (!content.includes("import { showToast } from '@/shared/utils/toast';")) {
    content = content.replace(
      /import \{ showToast \} from '..\/..\/utils\/toast';/g,
      "import { showToast } from '@/shared/utils/toast';",
    );
  }
  content = content.replace(/..\/..\/utils\/toast/g, '@/shared/utils/toast'); // catch-all

  // Fix router
  content = content.replace(/router\.canGoBack\(\)/g, 'navigation.canGoBack()');
  content = content.replace(/router\.back\(\)/g, 'navigation.goBack()');
  content = content.replace(/router\.push\('\/\(tabs\)\/dashboard'\)/g, '/* auto unmounts */');
  content = content.replace(/router\.replace\('\/\(tabs\)\/dashboard'\)/g, '/* auto unmounts */');
  content = content.replace(/router\.push\('\/\(auth\)\/login'\)/g, "navigation.navigate('Login')");
  content = content.replace(
    /router\.push\('\/\(auth\)\/register'\)/g,
    "navigation.navigate('Register')",
  );

  // Fix AppLogo
  content = content.replace(
    /<AppLogo size=\{36\} \/>/g,
    '<AppIcon name="plane" size={36} color="#FFFFFF" />',
  );
  content = content.replace(
    /<AppLogo size=\{34\} \/>/g,
    '<AppIcon name="plane" size={34} color="#FFFFFF" />',
  );
  content = content.replace(
    /<AppIcon size=\{36\} \/>/g,
    '<AppIcon name="plane" size={36} color="#FFFFFF" />',
  );
  content = content.replace(
    /<AppIcon size=\{34\} \/>/g,
    '<AppIcon name="plane" size={34} color="#FFFFFF" />',
  );

  // Fix Link
  content = content.replace(/<Link href="[^"]+" asChild>\s*([\s\S]*?)\s*<\/Link>/g, '$1');
  content = content.replace(
    /<Link href=".*?">([\s\S]*?)<\/Link>/g,
    '<Pressable onPress={() => {}}>$1</Pressable>',
  );

  // Fix useLocalSearchParams
  content = content.replace(
    /const \{ returnTo \} = useLocalSearchParams<\w+>\(\);/g,
    "const returnTo = '';",
  );

  // Fix storage
  content = content.replace(/@\/shared\/utils\/storage/g, '@/shared/utils/storage');
  content = content.replace(/..\/..\/utils\/storage/g, '@/shared/utils/storage');

  fs.writeFileSync(filePath, content, 'utf-8');
};

const screensDir = path.join(
  __dirname,
  'apps/mobile/src/features/authentication/presentation/screens',
);
fixAuthFile(path.join(screensDir, 'LoginScreen.tsx'), 'Login');
fixAuthFile(path.join(screensDir, 'RegisterScreen.tsx'), 'Register');

// Create toast stub if missing
const toastStub = `
import Toast from 'react-native-toast-message';

export const showToast = {
  success: (msg: string, desc?: string) => Toast.show({ type: 'success', text1: msg, text2: desc }),
  error: (msg: string, desc?: string) => Toast.show({ type: 'error', text1: msg, text2: desc }),
  warning: (msg: string, desc?: string) => Toast.show({ type: 'info', text1: msg, text2: desc }),
  info: (msg: string, desc?: string) => Toast.show({ type: 'info', text1: msg, text2: desc }),
  fromError: (err: any) => Toast.show({ type: 'error', text1: 'Error', text2: err?.message || 'Something went wrong' }),
};
`;

const toastPath = path.join(__dirname, 'apps/mobile/src/shared/utils/toast.ts');
if (!fs.existsSync(toastPath)) {
  fs.mkdirSync(path.dirname(toastPath), { recursive: true });
  fs.writeFileSync(toastPath, toastStub, 'utf-8');
}

// Create storage stub if missing
const storageStub = `
export const storage = {
  set: (k: string, v: string) => {},
  get: (k: string) => null,
};
`;
const storagePath = path.join(__dirname, 'apps/mobile/src/shared/utils/storage.ts');
if (!fs.existsSync(storagePath)) {
  fs.writeFileSync(storagePath, storageStub, 'utf-8');
}

console.log('Fixed Auth screens pass 2');
