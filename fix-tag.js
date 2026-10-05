const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'apps/mobile/src/app/(app)/trips/[id].tsx');
let lines = fs.readFileSync(file, 'utf8').split('\n');

let targetIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('EXPANDABLE FAB')) {
    targetIndex = i;
    break;
  }
}

if (targetIndex !== -1) {
  // Look backwards for the first `</View>`
  for (let i = targetIndex - 1; i >= 0; i--) {
    if (lines[i].includes('</View>')) {
      // Replace the first occurrence of </View> on this line with </Animated.View>
      lines[i] = lines[i].replace('</View>', '</Animated.View>');
      console.log('Replaced at line ' + i);
      break;
    }
  }
  fs.writeFileSync(file, lines.join('\n'));
} else {
  console.log('Not found');
}
