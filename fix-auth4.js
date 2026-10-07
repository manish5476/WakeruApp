const fs = require('fs');
const path = require('path');

const fixAuthFile = (filePath, screenName) => {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Fix useLocalSearchParams
  content = content.replace(/import \{.*?useLocalSearchParams.*?\} from 'expo-router';/g, '');
  content = content.replace(/const \{.*?\} = useLocalSearchParams.*\(\);/g, "const returnTo = '';");

  // Fix router
  content = content.replace(
    /router\.push\(\{ pathname: '\/register' \}\)/g,
    "navigation.navigate('Register')",
  );
  content = content.replace(
    /router\.push\(\{ pathname: '\/login' \}\)/g,
    "navigation.navigate('Login')",
  );
  content = content.replace(/router\.push\(\{ pathname: '.*?' \}\)/g, ''); // catch-all

  // Fix showToast
  content = content.replace(/showToast\.fromError\((err), '.*?'\)/g, 'showToast.fromError($1)');

  fs.writeFileSync(filePath, content, 'utf-8');
};

const screensDir = path.join(
  __dirname,
  'apps/mobile/src/features/authentication/presentation/screens',
);
fixAuthFile(path.join(screensDir, 'LoginScreen.tsx'), 'Login');
fixAuthFile(path.join(screensDir, 'RegisterScreen.tsx'), 'Register');

const storagePath = path.join(__dirname, 'apps/mobile/src/shared/utils/storage.ts');
let storageContent = fs.readFileSync(storagePath, 'utf-8');
if (!storageContent.includes('getBoolean')) {
  storageContent = storageContent.replace(
    /get: \(k: string\) => null,/g,
    'get: (k: string) => null,\n  getBoolean: (k: string) => false,\n  delete: (k: string) => {},',
  );
  fs.writeFileSync(storagePath, storageContent, 'utf-8');
}

console.log('Fixed syntax error pass 3');
