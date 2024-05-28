/// <reference types="vitest" />
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [tsconfigPaths()],
    resolve: {
        extensions: ['.ts', '.js']
    },
    test: {
        globals: true,
        environment: 'jsdom',
    },
});