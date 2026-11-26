/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // `npm run eval` (mode "eval") runs the real NER model on eval/contracts; `npm test` stays fast.
  test: mode === 'eval'
    ? { include: ['eval/**/*.test.ts'], testTimeout: 300_000 }
    : { include: ['src/**/*.test.ts'] },
}))
