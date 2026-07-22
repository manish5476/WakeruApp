const fs = require('fs');
const path = require('path');

const dirs = [
  'd:/Split/New/TripSplit/src/UIcomponents',
  'd:/Split/New/TripSplit/src/components/ui'
];

const results = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const hasExpo = /['"]expo-.*?['"]|['"]@expo\/.*?['"]/.test(content);
      const isDuplicate = false; // We'll compute this later
      const lines = content.split('\n').length;
      results.push({
        file: file,
        path: filePath,
        hasExpo,
        lines,
        dir: dir,
        contentHead: content.substring(0, 200).replace(/\n/g, ' ')
      });
    }
  }
}

dirs.forEach(walk);

const nameCount = {};
results.forEach(r => {
  nameCount[r.file] = (nameCount[r.file] || 0) + 1;
});

results.forEach(r => {
  r.isDuplicate = nameCount[r.file] > 1;
});

fs.writeFileSync('d:/Split/New/TripSplitNative/audit_ui_results.json', JSON.stringify(results, null, 2));
console.log(`Audited ${results.length} files. Saved to audit_ui_results.json`);
