import React from 'react';
import { View, Text as RNText, StyleSheet } from 'react-native';

export interface IconConfig {
  name: string;
  library: 'feather' | 'material' | 'fontawesome' | 'custom';
  unicode?: string;
}

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  testID?: string;
}

type IconComponent = React.FC<IconProps>;

export class IconRegistry {
  private static icons: Map<string, IconComponent> = new Map();
  private static defaultLibrary: 'feather' | 'material' | 'fontawesome' =
    'feather';

  static register(name: string, component: IconComponent): void {
    this.icons.set(name, component);
  }

  static registerMultiple(icons: Record<string, IconComponent>): void {
    Object.entries(icons).forEach(([name, component]) => {
      this.icons.set(name, component);
    });
  }

  static get(name: string): IconComponent | undefined {
    return this.icons.get(name);
  }

  static has(name: string): boolean {
    return this.icons.has(name);
  }

  static getAll(): Map<string, IconComponent> {
    return new Map(this.icons);
  }

  static remove(name: string): boolean {
    return this.icons.delete(name);
  }

  static clear(): void {
    this.icons.clear();
  }

  static setDefault(library: 'feather' | 'material' | 'fontawesome'): void {
    this.defaultLibrary = library;
  }

  static getDefault(): string {
    return this.defaultLibrary;
  }
}

// Default icon set using simple SVG-based fallbacks
export const DEFAULT_ICONS: Record<string, IconComponent> = {
  'arrow-left': ({ size = 24, color: _color = 'black' }) =>
    React.createElement(View, {
      style: [styles.icon, { width: size, height: size }],
    }),
  'arrow-right': ({ size = 24, color: _color = 'black' }) =>
    React.createElement(View, {
      style: [styles.icon, { width: size, height: size }],
    }),
  'arrow-up': ({ size = 24, color: _color = 'black' }) =>
    React.createElement(View, {
      style: [styles.icon, { width: size, height: size }],
    }),
  'arrow-down': ({ size = 24, color: _color = 'black' }) =>
    React.createElement(View, {
      style: [styles.icon, { width: size, height: size }],
    }),
  home: ({ size = 24, color: _color = 'black' }) =>
    React.createElement(View, {
      style: [styles.icon, { width: size, height: size }],
    }),
  settings: ({ size = 24, color: _color = 'black' }) =>
    React.createElement(View, {
      style: [styles.icon, { width: size, height: size }],
    }),
  search: ({ size = 24, color: _color = 'black' }) =>
    React.createElement(View, {
      style: [styles.icon, { width: size, height: size }],
    }),
  plus: ({ size = 24, color: _color = 'black' }) =>
    React.createElement(View, {
      style: [styles.icon, { width: size, height: size }],
    }),
  close: ({ size = 24, color: _color = 'black' }) =>
    React.createElement(View, {
      style: [styles.icon, { width: size, height: size }],
    }),
  check: ({ size = 24, color: _color = 'black' }) =>
    React.createElement(View, {
      style: [styles.icon, { width: size, height: size }],
    }),
  menu: ({ size = 24, color: _color = 'black' }) =>
    React.createElement(View, {
      style: [styles.icon, { width: size, height: size }],
    }),
  'more-vertical': ({ size = 24, color: _color = 'black' }) =>
    React.createElement(View, {
      style: [styles.icon, { width: size, height: size }],
    }),
  'more-horizontal': ({ size = 24, color: _color = 'black' }) =>
    React.createElement(View, {
      style: [styles.icon, { width: size, height: size }],
    }),
  bell: ({ size = 24, color: _color = 'black' }) =>
    React.createElement(View, {
      style: [styles.icon, { width: size, height: size }],
    }),
  user: ({ size = 24, color: _color = 'black' }) =>
    React.createElement(View, {
      style: [styles.icon, { width: size, height: size }],
    }),
  edit: ({ size = 24, color: _color = 'black' }) =>
    React.createElement(View, {
      style: [styles.icon, { width: size, height: size }],
    }),
  trash: ({ size = 24, color: _color = 'black' }) =>
    React.createElement(View, {
      style: [styles.icon, { width: size, height: size }],
    }),
  eye: ({ size = 24, color: _color = 'black' }) =>
    React.createElement(View, {
      style: [styles.icon, { width: size, height: size }],
    }),
  'eye-off': ({ size = 24, color: _color = 'black' }) =>
    React.createElement(View, {
      style: [styles.icon, { width: size, height: size }],
    }),
  share: ({ size = 24, color: _color = 'black' }) =>
    React.createElement(View, {
      style: [styles.icon, { width: size, height: size }],
    }),
};

const styles = StyleSheet.create({
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Initialize default icons
IconRegistry.registerMultiple(DEFAULT_ICONS);
