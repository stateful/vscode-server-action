/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
    test: {
        include: ['test/**/*.test.ts'],
        /**
         * not to ESM ported packages
         */
        exclude: [
            'build', '.idea', '.git', '.cache',
            '**/node_modules/**', '__mocks__'
        ],
        coverage: {
            enabled: true,
            lines: 90,
            functions: 95,
            branches: 50,
            statements: 90
        }
    }
})
