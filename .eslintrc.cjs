export default {
    'plugins': [ 
        'autofix',
        'jsdoc',
        'sort-imports-es6-autofix',
        'import'
    ],
    'env': {
        'browser': true,
        'es2021': true,
        'node': true,
        'jest/globals': true,
    },
    'extends': [ 
        'eslint:recommended', 
        'plugin:jsdoc/recommended',
        'plugin:import/recommended',
        'plugin:jest/recommended',
    ],
    'parser': '@babel/eslint-parser',
    'parserOptions': {
        'ecmaVersion': 'latest',
        'sourceType': 'module'
    },
    'rules': {
        'indent': [
            'error',
            4
        ],
        'linebreak-style': [
            'error',
            'unix'
        ],
        'quotes': [
            'error',
            'single'
        ],
        'semi': [
            'error',
            'always'
        ],
        'no-unused-vars': [
            'warn',
            {
                'varsIgnorePattern': '^_.*$'
            }
        ],
        'import/no-unresolved': 'off', // Buggy with aliases
        'import/no-commonjs': 'error',
        'autofix/no-console': 'warn',
        'sort-imports-es6-autofix/sort-imports-es6': 'warn',
        'jsdoc/require-description': 'warn',
        'jsdoc/check-syntax': 'warn',
        'jsdoc/require-jsdoc': [
            'warn',
            {
                'publicOnly': false,
                'minLineCount': 10,
                'require': {
                    'FunctionExpression': true,
                    'ArrowFunctionExpression': true,
                    'FunctionDeclaration': true,
                    'MethodDefinition': true
                }
            }
        ]
    }
};
