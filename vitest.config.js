import { defineConfig } from 'vitest/config'

// The suite covers the framework-free logic behind the wordlist, review
// schedule, and lexicon links. Components are exercised in the browser; these
// tests stay fast and need no DOM.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
