import tseslint from 'typescript-eslint';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['.next/**', 'node_modules/**', 'drizzle/**', 'next-env.d.ts'] },

  // Brings in @next/next, react, react-hooks, jsx-a11y and import rules.
  ...nextCoreWebVitals,
  ...nextTypescript,

  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',

      // Accessibility rules the legacy UI violated throughout: clickable <div>s
      // with no role or key handler, and <img> tags with no alt text.
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/alt-text': 'error',

      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
    },
  },

  // Must stay last so formatting rules lose to Prettier.
  prettier,
);
