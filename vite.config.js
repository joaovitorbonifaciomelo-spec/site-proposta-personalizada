import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

/** Injeta o wordmark oficial como <symbol>, para o header funcionar mesmo sem JavaScript. */
const wordmark = () => ({
  name: 'bonifacio-wordmark',
  transformIndexHtml(html) {
    const paths = readFileSync(new URL('./src/wordmark-paths.svgfrag', import.meta.url), 'utf8')
    return html.replace(
      '<!--WORDMARK-->',
      `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><symbol id="wordmark" viewBox="0 0 2000 469">${paths}</symbol></svg>`,
    )
  },
})

export default defineConfig({
  base: './',
  plugins: [wordmark()],
  build: { assetsInlineLimit: 0, cssMinify: true },
})
