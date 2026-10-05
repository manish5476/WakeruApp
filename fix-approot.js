const fs = require('fs');
const path = require('path');

const appRootPath = path.join(__dirname, 'apps/mobile/src/app/bootstrap/AppRoot.tsx');
if (fs.existsSync(appRootPath)) {
  let appRootContent = fs.readFileSync(appRootPath, 'utf8');
  // Replace mode={mode} if it wasn't caught by the first regex (which was /mode=\{mode\}/g)
  // Sometimes it's mode={themeMode} or something else
  appRootContent = appRootContent.replace(/mode=\{[a-zA-Z]+\}/g, 'mode={"system" as any}');
  fs.writeFileSync(appRootPath, appRootContent);
  console.log('FIXED APPROOT');
}
