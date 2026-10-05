const fs = require('fs');
const path = require('path');

const plannerTabPath = path.join(__dirname, 'apps/mobile/src/components/trips/PlannerTab.tsx');
let content = fs.readFileSync(plannerTabPath, 'utf8');

// 1. Swap import
content = content.replace(
  "import { PremiumSegmentedTabs, TabItem } from './planner/PremiumSegmentedTabs';",
  "import { TabBar } from '../ui/TabBar';",
);

// 2. Map tabsWithBadges format
// TabBar expects { key, label, badge } while PremiumSegmentedTabs expects { id, label, badge }
content = content.replace('const tabsWithBadges: TabItem[] = [', 'const tabsWithBadges = [');

// 3. Swap component
const oldComponent = `<PremiumSegmentedTabs
          tabs={tabsWithBadges}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="secondary"
        />`;

const newComponent = `<TabBar
          tabs={tabsWithBadges.map(t => ({ key: t.id, label: t.label, badge: t.badge }))}
          activeKey={activeTab}
          onTabChange={setActiveTab}
          variant="segmented"
          scrollable={true}
        />`;

content = content.replace(oldComponent, newComponent);

fs.writeFileSync(plannerTabPath, content);
console.log('REPLACED PLANNER TAB');
