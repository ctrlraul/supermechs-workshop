import { createSyntheticItemAttachment, ImportResult } from './ItemsManager'
import { loadImage } from '../utils/loadImage'



// Types

import type Item from './Item'
import type { Attachment, Rectangle } from './Item'
import type { ItemsPackData } from '../stores'


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
	element: Item['element']
  stats: Item['stats']
  tags?: Item['tags']
	
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
  items: RawItemV2[]
}



export async function importItemsPackV2 (itemsPack: ItemsPackV2, onProgress: (progress: number) => void): Promise<ImportResult> {

  const spritesSheet = await loadSpritesSheet(itemsPack.spritesSheet)
  const { items, errors } = importItems(itemsPack.items, itemsPack.spritesMap)

  const data: ItemsPackData = {
    version: itemsPack.version,
    key: itemsPack.key,
    name: itemsPack.name,
    description: itemsPack.description,
    spritesSheet,
    items,
  }

  onProgress(1)

  return { data, errors }

}


async function loadSpritesSheet (url: string): Promise<HTMLCanvasElement> {

  const image = await loadImage(url)

  const spritesSheet = document.createElement('canvas')
  const ctx = spritesSheet.getContext('2d')!

  spritesSheet.width = image.naturalWidth
  spritesSheet.height = image.naturalHeight

  ctx.drawImage(image, 0, 0)

  return spritesSheet

}


function importItems (rawItems: RawItemV2[], spritesMap: ItemsPackV2['spritesMap']): { items: Item[], errors: string[] } {

  const items: Item[] = []
  const errors: string[] = []

  for (const raw of rawItems) {
    try {
      items.push(importItem(raw, spritesMap))
    } catch (err: any) {
      errors.push(err.message)
    }
  }

  return { items, errors }

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
    kind: getKindString(raw),
    unlockLevel: raw.unlock_level || 0,
    goldPrice: raw.gold_price || 0,
    tokensPrice: raw.tokens_price || 0,
    transformRange: raw.transform_range,

    type: raw.type,
    element: raw.element,
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

  const tags = raw.tags ? [...raw.tags] : []

  if (tags.includes('legacy')) {
    // Is legacy premium?
    if (raw.transform_range[0] === 'M') {
      tags.push('premium')
    }
  } else {
    // Is reloaded premium? (Checks if starts as L or M)
    if ('LM'.includes(raw.transform_range[0])) {
      tags.push('premium')
    }
  }

  if (!tags.includes('melee')) {
    // Is jumping weapon?
    if (raw.stats.advance || raw.stats.retreat) {
      tags.push('require_jump')
    }
  }

  return tags

}


function getKindString (item: RawItemV2): string {
  const words = [item.element, ...item.type.split('_')]
  return words.map(word => word[0].toUpperCase() + word.slice(1).toLowerCase()).join(' ')
}
