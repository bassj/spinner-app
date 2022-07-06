import alias from '@rollup/plugin-alias';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import eslint from '@rollup/plugin-eslint';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';

import { terser } from 'rollup-plugin-terser';
import scss from 'rollup-plugin-scss';

const production = process.env.ROLLUP_WATCH;

const common_plugins = [
    alias({
        entries: [
            { find: 'src', replacement: './src' },
            { find: 'common', replacement: './src/common' }
        ]
    }),
    eslint(),
    babel({
        exclude: 'node_modules/**',
    }),
    commonjs(),
    json(),
    production && terser()
];

const frontend_plugins = [
    resolve({
        browser: true
    }),
    ...common_plugins
];

const backend_plugins = [
    alias({
        entries: [
            { find: '@utils', replacement: './src/backend/utils' }
        ]
    }),
    ...common_plugins
];

export default [
    { // Frontend files
        input: './src/frontend/room.js',
        output: {
            file: './dist/frontend/js/room.js',
            format: 'es',
            sourcemap: !production
        },
        plugins: [
            scss({
                output: './dist/frontend/css/room.css'
            }),
            ...frontend_plugins
        ]
    }, {
        input: './src/frontend/menu.js',
        output: {
            file: './dist/frontend/js/menu.js',
            format: 'es',
            sourcemap: !production 
        },
        plugins: [ scss({
            output: './dist/frontend/css/menu.css',
        }) ]
    }, { // Backend files
        input: './src/backend/index.js',
        output: {
            file:  './dist/backend/index.js',
            format: 'es',
            sourcemap: !production
        },
        plugins: backend_plugins
    }
];
