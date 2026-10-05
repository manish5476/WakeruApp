const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'apps/mobile/src/app/(app)/(tabs)/dashboard.tsx');
let content = fs.readFileSync(dashboardPath, 'utf8');

// 1. Remove the function TripCardHorizontal definition
content = content.replace(/function TripCardHorizontal\([\s\S]*?\}\n  \}\n/g, ''); // Try to match till end of function

// Actually, regexing a React component out is tricky. Let's just find where it starts and ends.
const startIndex = content.indexOf('function TripCardHorizontal({');
if (startIndex !== -1) {
  let braceCount = 0;
  let endIndex = -1;
  let i = startIndex;

  // Fast forward to first brace
  while (content[i] !== '{' && i < content.length) i++;

  if (i < content.length) {
    braceCount = 1;
    i++;
    while (braceCount > 0 && i < content.length) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      i++;
    }
    endIndex = i;
  }

  if (endIndex !== -1) {
    content = content.substring(0, startIndex) + content.substring(endIndex);
  }
}

// 2. Replace usages of <TripCardHorizontal
content = content.replace(/<TripCardHorizontal/g, '<TripCard variant="horizontal"');

// 3. Add import for TripCard if it doesn't exist
if (!content.includes('import { TripCard }')) {
  content = content.replace(
    /import \{ GlassCard \}.*?;/,
    "$&\nimport { TripCard } from '../../../components/ui/TripCard';",
  );
}

fs.writeFileSync(dashboardPath, content);
console.log('Done refactoring dashboard.tsx');
