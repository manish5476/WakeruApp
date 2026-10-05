const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'apps/mobile/src/app/(app)/trips/[id].tsx');
let content = fs.readFileSync(file, 'utf8');

// Find `<Animated.View` and then the next `<ScrollView`
const animatedIdx = content.indexOf('<Animated.View');
if (animatedIdx > -1) {
  const scrollViewIdx = content.indexOf('<ScrollView', animatedIdx);
  if (scrollViewIdx > -1) {
    const textBetween = content.substring(animatedIdx, scrollViewIdx);
    const lastViewIdx = textBetween.lastIndexOf('</View>');
    if (lastViewIdx > -1) {
      const absoluteLastViewIdx = animatedIdx + lastViewIdx;
      content =
        content.substring(0, absoluteLastViewIdx) +
        '</Animated.View>' +
        content.substring(absoluteLastViewIdx + 7);

      // Revert my earlier bad replace near FAB if it happened
      const badAnimatedIdx = content.indexOf('</Animated.View>', scrollViewIdx);
      if (
        badAnimatedIdx > -1 &&
        content.substring(badAnimatedIdx - 20, badAnimatedIdx + 40).includes('FAB')
      ) {
        content =
          content.substring(0, badAnimatedIdx) + '</View>' + content.substring(badAnimatedIdx + 16);
      }

      fs.writeFileSync(file, content);
      console.log('FIXED TAGS');
    }
  }
}
