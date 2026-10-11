// Renders the PNG icons, favicon.ico and the link preview image (og.png)
// into public/, from public/favicon.svg and the HTML below. Run it with
// `bun run generate-images` after changing either, and commit the output.
// It uses Playwright's Chromium and the self-hosted Outfit font.
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const PUBLIC = join(import.meta.dir, '..', 'public')
const BACKGROUND = '#0a0a0a'

const svg = await readFile(join(PUBLIC, 'favicon.svg'), 'utf8')
const outfit = await readFile(
  fileURLToPath(
    import.meta
      .resolve('@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2'),
  ),
)
// Without rounded corners, for icons that the OS masks itself.
const squareSvg = svg.replace('rx="14"', 'rx="0"')
const dataUrl = (source: string) =>
  `data:image/svg+xml;base64,${Buffer.from(source).toString('base64')}`

const browser = await chromium.launch()
const page = await browser.newPage()

async function render(html: string, width: number, height: number) {
  await page.setViewportSize({ width, height })
  await page.setContent(
    `<!doctype html><html><body style="margin:0">${html}</body></html>`,
    { waitUntil: 'networkidle' },
  )
  await page.evaluate(() => document.fonts.ready)
  return page.screenshot({ omitBackground: true })
}

// `scale` shrinks the mark onto a full-bleed background, for maskable icons
// whose outer edge may be cropped.
function icon(size: number, { square = false, scale = 1 } = {}) {
  const source = square ? squareSvg : svg
  const inner = Math.round(size * scale)
  return render(
    `<div style="width:${size}px;height:${size}px;display:grid;place-items:center;${square ? `background:${BACKGROUND}` : ''}">
      <img src="${dataUrl(source)}" width="${inner}" height="${inner}">
    </div>`,
    size,
    size,
  )
}

// An .ico whose entries are PNGs, which every current browser reads.
function ico(images: Array<{ size: number; png: Buffer }>) {
  const header = Buffer.alloc(6 + 16 * images.length)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = header.length
  images.forEach(({ size, png }, i) => {
    const entry = 6 + 16 * i
    header.writeUInt8(size >= 256 ? 0 : size, entry)
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1)
    header.writeUInt16LE(1, entry + 4)
    header.writeUInt16LE(32, entry + 6)
    header.writeUInt32LE(png.length, entry + 8)
    header.writeUInt32LE(offset, entry + 12)
    offset += png.length
  })
  return Buffer.concat([header, ...images.map(({ png }) => png)])
}

const OG_HTML = `
<style>
  @font-face {
    font-family: Outfit;
    font-weight: 100 900;
    src: url(data:font/woff2;base64,${outfit.toString('base64')}) format('woff2');
  }
</style>
<div style="position:relative;width:1200px;height:630px;overflow:hidden;background:${BACKGROUND};color:#fafafa;font-family:Outfit,sans-serif">
  <div style="position:absolute;top:-420px;left:200px;width:1100px;height:1100px;border-radius:50%;opacity:.45;filter:blur(110px);background:radial-gradient(circle at 35% 40%, oklch(0.6 0.22 340 / .55), transparent 60%), radial-gradient(circle at 70% 60%, oklch(0.55 0.18 270 / .5), transparent 60%)"></div>
  <div style="position:relative;display:flex;flex-direction:column;justify-content:space-between;height:100%;padding:72px 80px;box-sizing:border-box">
    <div style="display:flex;align-items:center;gap:20px">
      <img src="${dataUrl(svg)}" width="72" height="72">
      <span style="font-size:56px;font-weight:900;letter-spacing:-.02em">sonq<span style="color:#ed6aff">.</span></span>
    </div>
    <div style="font-size:92px;font-weight:900;line-height:1.02;letter-spacing:-.03em">
      Guess the song.<br><span style="color:#ed6aff">Faster than your friends.</span>
    </div>
    <div style="font-size:32px;color:#a3a3a3">
      Free multiplayer music quiz · up to 16 players · no sign-up
    </div>
  </div>
</div>`

async function save(name: string, data: Buffer | Promise<Buffer>) {
  await writeFile(join(PUBLIC, name), await data)
  console.log(`wrote public/${name}`)
}

try {
  await save('icon-192.png', icon(192))
  await save('icon-512.png', icon(512))
  await save('icon-maskable-512.png', icon(512, { square: true, scale: 0.7 }))
  await save('apple-touch-icon.png', icon(180, { square: true }))
  const small = []
  for (const size of [16, 32, 48]) small.push({ size, png: await icon(size) })
  await save('favicon.ico', ico(small))
  await save('og.png', render(OG_HTML, 1200, 630))
} finally {
  await browser.close()
}
