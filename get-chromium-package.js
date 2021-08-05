#!/usr/bin/env node
const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')

async function getPosition(version) {
  const deps = await fetch(`https://omahaproxy.appspot.com/deps.json?version=${version}`).then(r => r.json())
  return deps.chromium_base_position
}

async function list(prefix) {
  const url = new URL('https://www.googleapis.com/storage/v1/b/chromium-browser-snapshots/o')
  url.searchParams.set('delimiter', '/')
  url.searchParams.set('prefix', prefix)
  url.searchParams.set('fields', 'items(kind,mediaLink,metadata,name,size,updated),kind,prefixes,nextPageToken')
  const items = []
  const prefixes = []
  while (true) {
    const page = await fetch(url).then(r => r.json())
    items.push(...(page.items || []))
    prefixes.push(...(page.prefixes || []))
    if (!page.nextPageToken) break
    url.searchParams.set('pageToken', page.nextPageToken)
  }
  return {items, prefixes}
}

async function getAvailablePositions(platform) {
  const cacheFileName = path.join(__dirname, `positions-${platform}.json`)
  if (fs.existsSync(cacheFileName) && new Date - fs.statSync(cacheFileName).mtime < 1000*60*60*6) {
    return JSON.parse(fs.readFileSync(cacheFileName, 'utf8'))
  }
  const { prefixes } = await list(platform + '/')
  const positions = prefixes.map(x => (/\/(\d+)\//.exec(x) || [])[1]).filter(x => x)
  fs.writeFileSync(cacheFileName, JSON.stringify(positions))
  return positions
}

async function getDownloadLink(platform, position) {
  const { items } = await list(`${platform}/${position}/`)
  const chromeZip = items.find(item => /\/chrome-\w+\.zip$/.test(item.name))
  return chromeZip.mediaLink
}

if (!module.parent) {
  (async () => {
    if (process.argv.length < 4) {
      console.error(`usage: $0 <platform> <version>`)
      console.error()
      console.error('  platform should be one of {Mac,Win_x64,Linux_x64,Mac_Arm,Win}')
      console.error('  version should be a Chrome version, e.g. 44.0.2403.157')
      process.exit(1)
    }
    const [platform, version] = process.argv.slice(2)
    const position = await getPosition(version)
    console.error('position for', version, 'is', position)
    const allPositions = await getAvailablePositions(platform)
    console.error('fetched', allPositions.length, 'positions')
    const closestPosition = allPositions.reduce((closest, p) => {
      if (!closest) return p
      if (Math.abs(p - position) < Math.abs(closest - position)) return p
      return closest
    })
    console.error('closest position', closestPosition)
    if (Math.abs(closestPosition - position) > 100) {
      console.error('WARNING: closest position is far from the given version, and resulting bundle may not be close to the desired Chromium version')
    }
    const link = await getDownloadLink(platform, closestPosition)
    console.log(link)
  })()
}
