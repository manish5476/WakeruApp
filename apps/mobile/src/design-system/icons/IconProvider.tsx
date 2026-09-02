'use client';

import React, { ReactNode, useMemo } from 'react';

/**
 * Icon Registry - Store all available icons
 */
export interface IconRegistry {
  [key: string]: React.ComponentType<IconProps>;
}

/**
 * Icon Props
 */
export interface IconProps {
  size?: number;
  color?: string;
  opacity?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Icon Context Type
 */
export interface IconContextType {
  icons: IconRegistry;
  registerIcon: (
    name: string,
    component: React.ComponentType<IconProps>,
  ) => void;
  registerIcons: (icons: IconRegistry) => void;
  getIcon: (name: string) => React.ComponentType<IconProps> | null;
  hasIcon: (name: string) => boolean;
}

/**
 * Create Icon Context
 */
export const IconContext = React.createContext<IconContextType | undefined>(
  undefined,
);

/**
 * Use Icon Context Hook
 */
export const useIconContext = (): IconContextType => {
  const context = React.useContext(IconContext);
  if (!context) {
    throw new Error('useIconContext must be used within IconProvider');
  }
  return context;
};

/**
 * Icon Provider Component
 */
interface IconProviderProps {
  children: ReactNode;
  initialIcons?: IconRegistry;
}

export const IconProvider: React.FC<IconProviderProps> = ({
  children,
  initialIcons = {},
}) => {
  const [icons, setIcons] = React.useState<IconRegistry>(initialIcons);

  const value = useMemo<IconContextType>(
    () => ({
      icons,
      registerIcon: (
        name: string,
        component: React.ComponentType<IconProps>,
      ) => {
        setIcons(prev => ({ ...prev, [name]: component }));
      },
      registerIcons: (newIcons: IconRegistry) => {
        setIcons(prev => ({ ...prev, ...newIcons }));
      },
      getIcon: (name: string) => icons[name] ?? null,
      hasIcon: (name: string) => name in icons,
    }),
    [icons],
  );

  return <IconContext.Provider value={value}>{children}</IconContext.Provider>;
};

/**
 * Icon Wrapper Component
 */
interface IconWrapperProps extends IconProps {
  name: string;
  fallback?: React.ComponentType<IconProps>;
}

export const Icon: React.FC<IconWrapperProps> = ({
  name,
  size = 24,
  color = 'currentColor',
  fallback: Fallback,
  ...props
}) => {
  try {
    const { getIcon } = useIconContext();
    const IconComponent = getIcon(name);

    if (!IconComponent && !Fallback) {
      console.warn(`Icon "${name}" not found in registry`);
      return null;
    }

    const Component = IconComponent || Fallback;
    if (!Component) return null;

    return <Component size={size} color={color} {...props} />;
  } catch {
    return null;
  }
};

/**
 * Common Icon Sizes
 */
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xl2: 40,
  xl3: 48,
  xl4: 64,
} as const;

/**
 * Icon Library Interface
 */
export interface IconLibrary {
  name: string;
  icons: IconRegistry;
}

/**
 * Icon Registry Manager
 */
export class IconRegistryManager {
  private static instance: IconRegistryManager;
  private registry: IconRegistry = {};

  private constructor() {}

  static getInstance(): IconRegistryManager {
    if (!IconRegistryManager.instance) {
      IconRegistryManager.instance = new IconRegistryManager();
    }
    return IconRegistryManager.instance;
  }

  register(name: string, component: React.ComponentType<IconProps>): void {
    this.registry[name] = component;
  }

  registerBatch(icons: IconRegistry): void {
    Object.assign(this.registry, icons);
  }

  registerLibrary(library: IconLibrary): void {
    Object.assign(this.registry, library.icons);
  }

  get(name: string): React.ComponentType<IconProps> | null {
    return this.registry[name] ?? null;
  }

  has(name: string): boolean {
    return name in this.registry;
  }

  getAll(): IconRegistry {
    return { ...this.registry };
  }

  clear(): void {
    this.registry = {};
  }

  remove(name: string): boolean {
    if (name in this.registry) {
      delete this.registry[name];
      return true;
    }
    return false;
  }
}
