/// <reference types="vitest" />
import { defineConfig, preview } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [tsconfigPaths()],
    resolve: {
        extensions: ['.ts', '.js']
    },
    test: {
        globals: true,
	},
});

