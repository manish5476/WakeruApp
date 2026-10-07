const fs = require('fs');
const path = require('path');

const fixAuthFile = (filePath, screenName) => {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Fix the broken import
  content = content.replace(
    /import type \{ GuestNavigationProp<"\w+"> \} from '@\/navigation\/types';/g,
    "import type { GuestNavigationProp } from '@/navigation/types';",
  );

  // Fix the usage inside the component (if it was somehow broken or already had it)
  content = content.replace(
    /useNavigation<GuestNavigationProp>\(\)/g,
    `useNavigation<GuestNavigationProp<"${screenName}">>()`,
  );

  fs.writeFileSync(filePath, content, 'utf-8');
};

const screensDir = path.join(
  __dirname,
  'apps/mobile/src/features/authentication/presentation/screens',
);
fixAuthFile(path.join(screensDir, 'LoginScreen.tsx'), 'Login');
fixAuthFile(path.join(screensDir, 'RegisterScreen.tsx'), 'Register');

console.log('Fixed syntax error');
