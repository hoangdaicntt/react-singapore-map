import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';
import {readFileSync} from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default {
    input: 'index.tsx',
    output: [
        {
            file: packageJson.main,
            format: 'cjs',
            sourcemap: false,
            exports: 'named'
        },
        {
            file: packageJson.module,
            format: 'esm',
            sourcemap: false,
            exports: 'named'
        }
    ],
    plugins: [
        peerDepsExternal(),
        json(),
        resolve(),
        commonjs(),
        typescript({
            tsconfig: './tsconfig.json',
            declaration: true,
            declarationDir: 'dist'
        }),
        postcss({
            extensions: ['.css', '.scss']
        })
    ],
    external: ['react', 'react-dom']
};
