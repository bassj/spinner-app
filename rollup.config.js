import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import scss from 'rollup-plugin-scss';

const production = process.env.ROLLUP_WATCH;

const plugins = [
    resolve({
        browser: true
    }),
    commonjs(),
    production && terser()
];

export default [
    {
        input: './src/frontend/room.js',
        output: {
            file: './static/dist/room.js',
            format: 'es',
            sourcemap: true
        },
        plugins: [
            scss({
                output: './static/dist/room.css'
            }),
            ...plugins
        ]
    }, {
        input: './src/frontend/menu.js',
        output: {
            file: './static/dist/menu.js',
            format: 'es',
            sourcemap: true
        },
        plugins: [ scss({
            output: './static/dist/menu.css',
        }) ]
    }
];
