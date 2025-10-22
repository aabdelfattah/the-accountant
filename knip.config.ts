import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'app/**/*.tsx',
    'app/**/*.ts',
    'lib/**/*.ts',
    'components/**/*.tsx',
    'components/**/*.ts',
    'prisma/seed.ts',
    'auth.ts',
    'auth.config.ts',
  ],
  project: ['**/*.ts', '**/*.tsx'],
  ignore: [
    'node_modules/**',
    '.next/**',
    'dist/**',
    'build/**',
    '**/*.config.{js,ts,mjs}',
    'next-env.d.ts',
  ],
  ignoreDependencies: [
    // Build tools that are used but not directly imported
    'autoprefixer',
    'postcss',
    'tailwindcss',
    // TypeScript types
    '@types/node',
    '@types/react',
    '@types/react-dom',
    '@types/bcryptjs',
    // Next.js handles these internally
    'eslint-config-next',
    // Dev tools
    'tsx',
    // Testing and quality tools
    'husky',
    'lint-staged',
    'prettier',
    'depcheck',
  ],
};

export default config;
