const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'apps/mobile/src/app/(app)/trips/[id].tsx');
let content = fs.readFileSync(file, 'utf8');

const targetFAB = `{/* FAB */}
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            {
              bottom: insets.bottom + 24,
              backgroundColor: theme.colors.secondary,
            },
            pressed && { transform: [{ scale: 0.95 }] },
          ]}
          onPress={() => {
            haptics.medium();
            router.push(\`/(app)/trips/\${id}/add-expense\`);
          }}
        >
          <LinearGradient
            colors={theme.gradients.secondary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <AppIcon name="plus" size={28} color="#FFF" />
        </Pressable>`;

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

if (content.includes('{/* FAB */}')) {
  // Inject import if not present
  if (!content.includes('ExpandableFAB')) {
    content = content.replace(
      "import { EmptyState } from '../../../components/ui/EmptyState';",
      "import { EmptyState } from '../../../components/ui/EmptyState';\nimport { ExpandableFAB } from '../../../components/trips/planner/ExpandableFAB';",
    );
  }

  // Replace FAB
  content = content.replace(targetFAB, newFAB);

  // Add FadeInDown to mobile container
  content = content.replace(
    '<View style={{ zIndex: 10 }}>',
    '<Animated.View style={{ zIndex: 10 }} entering={FadeInDown.duration(400).springify()}>',
  );

  fs.writeFileSync(file, content);
  console.log('SUCCESS');
} else {
  console.log('FAB NOT FOUND');
}
