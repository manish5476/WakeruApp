import React from 'react';
import { StatusBar as RNStatusBar } from 'react-native';

export interface StatusBarProps {
  style?: 'auto' | 'inverted' | 'light' | 'dark';
  hidden?: boolean;
  animated?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  style = 'auto',
  ...props
}) => {
  const barStyle =
    style === 'light'
      ? 'light-content'
      : style === 'dark'
        ? 'dark-content'
        : 'default';
  return <RNStatusBar barStyle={barStyle} {...props} />;
};

export default StatusBar;
