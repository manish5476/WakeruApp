import React from 'react';
import { TabBar, TabItem } from './TabBar';

interface SegmentedControlProps {
  options: string[];
  selectedValue: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({
  options,
  selectedValue,
  onChange,
}: SegmentedControlProps) {
  const tabs: TabItem[] = options.map(opt => ({ key: opt, label: opt }));

  return (
    <TabBar
      tabs={tabs}
      activeKey={selectedValue}
      onTabChange={onChange}
      variant="segmented"
      scrollable
      size="sm"
    />
  );
}
