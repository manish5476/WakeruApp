const fs = require('fs');
const path = require('path');
const glob = require('glob');

// ============================================================
// Theme Migration Script
// Converts all screens to use useTheme() + useGlobalStyles()
// ============================================================

const TARGET_DIRS = ['src/app/(tabs)', 'src/app/(auth)', 'src/app/(app)'];

const NEW_IMPORTS = `
import { useTheme } from '../../../providers/ThemeProvider';
import { useGlobalStyles } from '../../../hooks/useGlobalStyles';
import { useMemo } from 'react';
`;

const HOOK_INJECTION = `
  const theme = useTheme();
  const globalStyles = useGlobalStyles();
`;

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Add new imports
  if (!content.includes('useGlobalStyles')) {
    // Find last import statement
    const importRegex = /^import .+ from .+;$/gm;
    const imports = content.match(importRegex) || [];
    const lastImport = imports[imports.length - 1];

    if (lastImport) {
      content = content.replace(
        lastImport,
        lastImport + '\n' + NEW_IMPORTS.trim(),
      );
      modified = true;
    }
  }

  // 2. Inject hooks into component
  if (!content.includes('const theme = useTheme()')) {
    // Find the main export default function
    const funcRegex = /export default function (\w+)\(/;
    const match = content.match(funcRegex);

    if (match) {
      // Find the first line inside the function
      const funcStart = content.indexOf(match[0]);
      const openBrace = content.indexOf('{', funcStart);
      const afterBrace = content.indexOf('\n', openBrace);

      content =
        content.slice(0, afterBrace + 1) +
        HOOK_INJECTION +
        content.slice(afterBrace + 1);
      modified = true;
    }
  }

  // 3. Convert StyleSheet.create to useStyles()
  if (
    content.includes('const styles = StyleSheet.create({') &&
    !content.includes('const useStyles = () => {')
  ) {
    content = content.replace(
      'const styles = StyleSheet.create({',
      `const useStyles = () => {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create({`,
    );
    content = content.replace(
      /}\s*\)\s*;/,
      `}), [theme]);
};`,
    );
    modified = true;
  }

  // 4. Replace common color patterns
  const colorReplacements = [
    [/colors\.gray900/g, 'theme.colors.textPrimary'],
    [/colors\.gray800/g, 'theme.colors.textPrimary'],
    [/colors\.gray700/g, 'theme.colors.textPrimary'],
    [/colors\.gray600/g, 'theme.colors.textSecondary'],
    [/colors\.gray500/g, 'theme.colors.textSecondary'],
    [/colors\.gray400/g, 'theme.colors.textTertiary'],
    [/colors\.gray300/g, 'theme.colors.borderDefault'],
    [/colors\.gray200/g, 'theme.colors.borderDefault'],
    [/colors\.gray100/g, 'theme.colors.borderLight'],
    [/colors\.gray50/g, 'theme.colors.background'],
    [/colors\.white/g, 'theme.colors.surface'],
    [/colors\.background/g, 'theme.colors.background'],
    [/'#1A56DB'/g, 'theme.colors.primary'],
    [/'#059669'/g, 'theme.colors.success'],
    [/'#DC2626'/g, 'theme.colors.danger'],
    [/'#D97706'/g, 'theme.colors.warning'],
  ];

  colorReplacements.forEach(([pattern, replacement]) => {
    if (content.match(pattern)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Migrated: ${path.basename(filePath)}`);
  } else {
    console.log(`⏭️  Skipped: ${path.basename(filePath)} (already migrated)`);
  }
}

// Run migration
console.log('🔧 Starting theme migration...\n');
TARGET_DIRS.forEach(dir => {
  const files = glob.sync(`${dir}/**/*.tsx`);
  files.forEach(migrateFile);
});
console.log('\n✅ Migration complete!');
