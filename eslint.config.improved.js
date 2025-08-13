/**
 * Configuración avanzada de ESLint
 * Mejora: Reglas específicas para React y buenas prácticas
 */

export default {
  extends: [
    '@eslint/js/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended'
  ],
  
  plugins: [
    'react',
    'react-hooks',
    'jsx-a11y'
  ],
  
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  
  env: {
    browser: true,
    es2024: true,
    node: true
  },
  
  settings: {
    react: {
      version: 'detect'
    }
  },
  
  rules: {
    // React específicas
    'react/prop-types': 'warn',
    'react/no-unused-prop-types': 'warn',
    'react/jsx-no-bind': 'warn',
    'react/jsx-key': 'error',
    'react/no-array-index-key': 'warn',
    'react/jsx-no-target-blank': 'error',
    
    // React Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Accesibilidad
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/click-events-have-key-events': 'warn',
    
    // JavaScript general
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    
    // Async/await
    'no-async-promise-executor': 'error',
    'prefer-promise-reject-errors': 'error',
    'no-return-await': 'error',
    
    // Funciones
    'no-empty-function': 'warn',
    'no-useless-return': 'warn',
    'consistent-return': 'warn',
    
    // Objetos y arrays
    'no-duplicate-keys': 'error',
    'no-sparse-arrays': 'error',
    'prefer-object-spread': 'warn',
    
    // Estilo de código
    'indent': ['warn', 2],
    'quotes': ['warn', 'single'],
    'semi': ['warn', 'always'],
    'comma-dangle': ['warn', 'never'],
    'object-curly-spacing': ['warn', 'always'],
    'array-bracket-spacing': ['warn', 'never'],
    
    // Seguridad
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error'
  },
  
  overrides: [
    {
      files: ['**/*.test.js', '**/*.test.jsx'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off'
      }
    },
    {
      files: ['src/services/**/*.js'],
      rules: {
        'no-console': 'warn' // Servicios pueden usar console para logging
      }
    }
  ]
};
