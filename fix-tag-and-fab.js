const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'apps/mobile/src/app/(app)/trips/[id].tsx');
let content = fs.readFileSync(file, 'utf8');

// Fix the unclosed Animated.View first
const brokenAnimatedBlockStart = `<Animated.View style={{ zIndex: 10 }} entering={FadeInDown.duration(400).springify()}>
              <View
                style={[
                  styles.headerWrapper,`;

if (content.includes(brokenAnimatedBlockStart)) {
  // Find where the mobile layout finishes, which is right before {/* FAB */}
  const mobileEndIndex = content.indexOf('{/* FAB */}');
  if (mobileEndIndex > -1) {
    // Find the last </View> before {/* FAB */}
    const contentBeforeFab = content.substring(0, mobileEndIndex);
    const lastViewIndex = contentBeforeFab.lastIndexOf('</View>');

    if (lastViewIndex > -1) {
      content =
        content.substring(0, lastViewIndex) +
        '</Animated.View>' +
        content.substring(lastViewIndex + 7);
    }
  }
}

// Now safely replace the FAB using regex
const fabRegex =
  /\{\/\*\s*FAB\s*\*\/\}.*?<Pressable[\s\S]*?<AppIcon name="plus" size=\{28\} color="#FFF" \/>\s*<\/Pressable>/;

const newFAB = `{/* EXPANDABLE FAB (Enhanced UI) */}
        <View style={{ position: 'absolute', bottom: insets.bottom + 24, right: 24, zIndex: 9999 }}>
          <ExpandableFAB
            actions={[
              { id: 'add-expense', label: 'Add Expense', icon: 'receipt', color: theme.colors.primary },
              { id: 'add-stop', label: 'Add Stop', icon: 'map-pin', color: theme.colors.secondary },
              { id: 'invite', label: 'Invite Friend', icon: 'user-plus', color: theme.colors.success },
            ]}
            onPress={(actionId) => {
              haptics.medium();
              if (actionId === 'add-expense') router.push(\`/(app)/trips/\${id}/add-expense\`);
              if (actionId === 'add-stop') router.push(\`/(app)/trips/\${id}/add-stop\`);
              if (actionId === 'invite') setShowInviteFriendModal(true);
            }}
          />
        </View>`;

content = content.replace(fabRegex, newFAB);

fs.writeFileSync(file, content);
console.log('REPLACED');
