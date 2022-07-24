import { createSyntheticItemAttachment, getItemKindString } from './ItemsManager'
import { loadImage } from '../utils/loadImage'
import { includeStatFormats } from '../stats/StatsManager'



// Types

import type Item from './Item'
import type { Attachment, Rectangle } from './Item'
import type { ItemsPackData } from '../stores'
import type { StatFormatWithImage } from '../stats/StatsManager'


interface RawItemV2 {

  id: Item['id']

  // Meta
  name: Item['name']
  transform_range: Item['transformRange']
  unlock_level?: Item['unlockLevel']
  gold_price?: Item['goldPrice']
  tokens_price?: Item['tokensPrice']

  // Stats
  type: Item['type']
  element?: Item['element']
  stats: Item['stats']
  tags?: (keyof Item['tags'])[]
  
  // Graphic
  width?: number
  height?: number
  attachment?: Attachment

}

export interface ItemsPackV2 {
  version: '2'
  key: string
  name: string
  description: string
  spritesSheet: string
  spritesMap: Record<string, Rectangle>
  stats?: StatFormatWithImage[]
  items: RawItemV2[]
}



export async function importItemsPackV2 (itemsPack: ItemsPackV2, onProgress: (progress: number) => void): Promise<ItemsPackData> {

  const spritesSheet = await loadSpritesSheet(itemsPack.spritesSheet)
  const { items, issues } = importItems(itemsPack.items, itemsPack.spritesMap)

  const data: ItemsPackData = {
    version: itemsPack.version,
    key: itemsPack.key,
    name: itemsPack.name,
    description: itemsPack.description,
    spritesSheet,
    items,
    issues,
  }

  includeStatFormats(itemsPack.stats || [])

  onProgress(1)

  return data

}


async function loadSpritesSheet (url: string): Promise<HTMLCanvasElement> {

  try {

    const image = await loadImage(url)
    const spritesSheet = document.createElement('canvas')
    const ctx = spritesSheet.getContext('2d')!

    spritesSheet.width = image.naturalWidth
    spritesSheet.height = image.naturalHeight

    ctx.drawImage(image, 0, 0)

    return spritesSheet

  } catch (err: any) {

    throw new Error('Failed to load sprites sheet: ' + err.message)

  }

}


function importItems (rawItems: RawItemV2[], spritesMap: ItemsPackV2['spritesMap']): { items: Item[], issues: string[] } {

  const items: Item[] = []
  const issues: string[] = []

  for (const raw of rawItems) {
    try {
      items.push(importItem(raw, spritesMap))
    } catch (err: any) {
      issues.push(err.message)
    }
  }

  return { items, issues }

}


function importItem (raw: RawItemV2, spritesMap: ItemsPackV2['spritesMap']): Item {

  const spritesMapKey = raw.name.replace(/\s/g, '')
  const spriteRect = spritesMap[spritesMapKey]

  if (spriteRect === undefined) {
    throw new Error(`Failed to import "${raw.name}": No sprite mapped for key "${spritesMapKey}"`)
  }

  const item: Item = {
    id: raw.id,

    name: raw.name,
    kind: getItemKindString(raw.type, raw.element),
    unlockLevel: raw.unlock_level || 0,
    goldPrice: raw.gold_price || 0,
    tokensPrice: raw.tokens_price || 0,
    transformRange: raw.transform_range,

    type: raw.type,
    element: raw.element || 'EXPLOSIVE',
    stats: raw.stats,
    tags: getItemTags(raw),

    width: raw.width || spriteRect.width,
    height: raw.height || spriteRect.height,
    image: spriteRect,
    attachment: raw.attachment || null,
  }

  if (item.attachment === null) {
    item.attachment = createSyntheticItemAttachment(item.type, item.width, item.height)
  }

  return item

}


function getItemTags (raw: RawItemV2): Item['tags'] {

  const tags: Item['tags'] = {
    legacy: false,
    melee: false,
    premium: false,
    require_jump: false,
    roller: false,
    sword: false,
    custom: false
  }

  if (raw.tags !== undefined) {
    tags.legacy = raw.tags.includes('legacy')
    tags.melee = raw.tags.includes('melee')
    tags.roller = raw.tags.includes('roller')
    tags.sword = raw.tags.includes('sword')
  }

  tags.premium = (
    tags.legacy
    ? raw.transform_range[0] === 'M' // Legacy premium
    : 'LM'.includes(raw.transform_range[0]) // Reloaded premium
  )

  tags.require_jump = 'advance' in raw.stats || 'retreat' in raw.stats

  return tags

}
