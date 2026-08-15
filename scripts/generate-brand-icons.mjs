import { execFileSync } from 'node:child_process'
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const buildDirectory = join(root, 'build')
const source = join(buildDirectory, 'favicon-spectrum-v3.svg')
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'dsh-brand-icons-'))
const renderedPng = join(temporaryDirectory, `${basename(source)}.png`)

function resizePng(input, output, size) {
  execFileSync('sips', ['-z', String(size), String(size), input, '--out', output], {
    stdio: 'ignore',
  })
}

function createIco(entries, output) {
  const images = entries.map(({ path }) => readFileSync(path))
  const directorySize = 6 + images.length * 16
  const directory = Buffer.alloc(directorySize)
  directory.writeUInt16LE(0, 0)
  directory.writeUInt16LE(1, 2)
  directory.writeUInt16LE(images.length, 4)

  let imageOffset = directorySize
  entries.forEach(({ size }, index) => {
    const image = images[index]
    const entryOffset = 6 + index * 16
    directory.writeUInt8(size === 256 ? 0 : size, entryOffset)
    directory.writeUInt8(size === 256 ? 0 : size, entryOffset + 1)
    directory.writeUInt8(0, entryOffset + 2)
    directory.writeUInt8(0, entryOffset + 3)
    directory.writeUInt16LE(1, entryOffset + 4)
    directory.writeUInt16LE(32, entryOffset + 6)
    directory.writeUInt32LE(image.length, entryOffset + 8)
    directory.writeUInt32LE(imageOffset, entryOffset + 12)
    imageOffset += image.length
  })

  writeFileSync(output, Buffer.concat([directory, ...images]))
}

try {
  execFileSync('qlmanage', ['-t', '-s', '1024', '-o', temporaryDirectory, source], {
    stdio: 'ignore',
  })
  copyFileSync(renderedPng, join(buildDirectory, 'icon.png'))

  const iconsetDirectory = join(temporaryDirectory, 'dsh-desktop.iconset')
  mkdirSync(iconsetDirectory)
  const iconset = [
    ['icon_16x16.png', 16],
    ['icon_16x16@2x.png', 32],
    ['icon_32x32.png', 32],
    ['icon_32x32@2x.png', 64],
    ['icon_128x128.png', 128],
    ['icon_128x128@2x.png', 256],
    ['icon_256x256.png', 256],
    ['icon_256x256@2x.png', 512],
    ['icon_512x512.png', 512],
    ['icon_512x512@2x.png', 1024],
  ]
  for (const [name, size] of iconset) {
    resizePng(renderedPng, join(iconsetDirectory, name), size)
  }
  execFileSync('iconutil', [
    '-c',
    'icns',
    iconsetDirectory,
    '-o',
    join(buildDirectory, 'icon.icns'),
  ])

  const icoDirectory = join(temporaryDirectory, 'ico')
  mkdirSync(icoDirectory)
  const icoEntries = [16, 24, 32, 48, 64, 128, 256].map((size) => {
    const path = join(icoDirectory, `icon-${size}.png`)
    resizePng(renderedPng, path, size)
    return { path, size }
  })
  createIco(icoEntries, join(buildDirectory, 'icon.ico'))
} finally {
  rmSync(temporaryDirectory, { force: true, recursive: true })
}
