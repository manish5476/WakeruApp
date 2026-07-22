import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({
  id: 'theme-storage',
});

const THEME_KEY = 'AppTheme.SelectedTheme';

export const ThemeStorage = {
  getTheme: (): string | undefined => {
    return storage.getString(THEME_KEY);
  },
  setTheme: (theme: string) => {
    storage.set(THEME_KEY, theme);
  },
};
