const fs = require('fs');
const path = require('path');

// 1. Fix add-expense.tsx
const addExpensePath = path.join(__dirname, 'apps/mobile/src/app/(app)/trips/[id]/add-expense.tsx');
let addExpenseContent = fs.readFileSync(addExpensePath, 'utf8');
addExpenseContent = addExpenseContent.replace(/activeTrip/g, 'trip');
addExpenseContent = addExpenseContent.replace(/s =>/g, '(s: any) =>');
fs.writeFileSync(addExpensePath, addExpenseContent);

// 2. Fix [id].tsx
const idPath = path.join(__dirname, 'apps/mobile/src/app/(app)/trips/[id].tsx');
let idContent = fs.readFileSync(idPath, 'utf8');
idContent = idContent.replace(/onPress=\{\(actionId\)/g, 'onPress={(actionId: string)');
if (!idContent.includes('import { ExpandableFAB }')) {
  idContent = idContent.replace(
    "import AppIcon from '../../../components/common/AppIcon';",
    "import AppIcon from '../../../components/common/AppIcon';\nimport { ExpandableFAB } from '../../../components/trips/planner/ExpandableFAB';",
  );
}
fs.writeFileSync(idPath, idContent);

// 3. Fix AppRoot.tsx and ProviderComposer.tsx
const appRootPath = path.join(__dirname, 'apps/mobile/src/app/bootstrap/AppRoot.tsx');
if (fs.existsSync(appRootPath)) {
  let appRootContent = fs.readFileSync(appRootPath, 'utf8');
  appRootContent = appRootContent.replace(/mode=\{mode\}/g, 'mode={mode as any}');
  fs.writeFileSync(appRootPath, appRootContent);
}

const providerPath = path.join(__dirname, 'apps/mobile/src/app/bootstrap/ProviderComposer.tsx');
if (fs.existsSync(providerPath)) {
  let providerContent = fs.readFileSync(providerPath, 'utf8');
  providerContent = providerContent.replace(/mode=\{mode\}/g, 'mode={mode as any}');
  fs.writeFileSync(providerPath, providerContent);
}

console.log('FIXED TYPESCRIPT ERRORS');
