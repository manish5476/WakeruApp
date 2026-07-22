import { ThemeTokens, lightThemeTokens, darkThemeTokens, amoledThemeTokens } from '../tokens';

export type ThemeName = 'light' | 'dark' | 'amoled' | string;

class ThemeRegistryClass {
  private themes: Record<ThemeName, ThemeTokens> = {
    light: lightThemeTokens,
    dark: darkThemeTokens,
    amoled: amoledThemeTokens,
  };

  registerTheme(name: ThemeName, tokens: ThemeTokens) {
    this.themes[name] = tokens;
  }

  getTheme(name: ThemeName): ThemeTokens {
    if (!this.themes[name]) {
      console.warn(`Theme ${name} not found. Falling back to light theme.`);
      return this.themes.light;
    }
    return this.themes[name] || this.themes.light;
  }

  getAllThemeNames(): ThemeName[] {
    return Object.keys(this.themes);
  }
}

export const ThemeRegistry = new ThemeRegistryClass();
