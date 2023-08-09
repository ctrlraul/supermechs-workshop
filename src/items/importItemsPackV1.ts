import potpack from 'potpack'
import { createSyntheticItemAttachment, ProgressListener, getItemKindString } from './ItemsManager'
import { loadImage } from '../utils/loadImage'
import { includeStatFormats } from '../stats/StatsManager'
// import { ItemsPackV1Te } from './Typeyes/ItemsPackV1Te'



// Types

import type Item from './Item'
import type { Attachment, Rectangle } from './Item'
import type { ItemsPackData } from '../stores'
import type { StatFormatWithImage } from '../stats/StatsManager'



// Types

interface RawItemV1 {

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

  /** URL */
  image: string
  attachment?: Attachment

}

export interface ItemsPackV1 {
  version?: '1'
  config: {
    name: string
    description: string
    key: string
    base_url: string
  }
  stats?: StatFormatWithImage[]
  items: RawItemV1[]
}

interface LoadItemImagesResult {
  imagesData: {
    rawItem: RawItemV1
    image: HTMLImageElement
  }[]
  issues: string[]
}



// Methods

export async function importItemsPackV1 (itemsPack: ItemsPackV1, onProgress: ProgressListener): Promise<ItemsPackData> {

  // Throw error if pack doesn't match the format expected
  // ItemsPackV1Te.assert(itemsPack)

  const onProgressSub: ProgressListener = progress => onProgress(progress / 1.01)

  const { spritesSheet, issues, boxes } = await loadSpritesSheet(itemsPack, onProgressSub)
  const items = importItems(boxes)

  const data: ItemsPackData = {
    version: itemsPack.version || '1',
    key: itemsPack.config.key,
    name: itemsPack.config.name,
    description: itemsPack.config.description,
    spritesSheet: spritesSheet,
    items,
    issues,
  }

  includeStatFormats(itemsPack.stats || [])

  onProgress(1)

  return data

}



// Functions

async function loadSpritesSheet (itemsPack: ItemsPackV1, onProgress: ProgressListener) {

  // Get data required
  const baseURL = getProperBaseURL(itemsPack)
  const { imagesData, issues } = await loadItemImages(baseURL, itemsPack.items, onProgress)

  // Create sprites sheet rects
  const boxes = createBoxes(imagesData)
  const potpackStats = potpack(boxes)

  // Create canvas
  const spritesSheet = document.createElement('canvas')
  const ctx = spritesSheet.getContext('2d')!

  // Prepare the canvas
  spritesSheet.width = potpackStats.w
  spritesSheet.height = potpackStats.h

  // Render the sprites sheet
  for (const box of boxes) {
    ctx.drawImage(box.image, box.x, box.y, box.w, box.h)
  }

  // Bob is your uncle
  return { spritesSheet, issues, boxes }

}


function loadItemImages (baseURL: string, rawItems: RawItemV1[], onProgress: ProgressListener): Promise<LoadItemImagesResult> {

  return new Promise(resolve => {

    const textureMissingImage = document.createElement("img")
    textureMissingImage.src = "assets/images/texture-missing.png"

    const result: LoadItemImagesResult = {
      imagesData: [],
      issues: []
    }

    let completedItems = 0


    const awaiter = setInterval(() => {

      const progress = completedItems / rawItems.length

      onProgress(progress)

      if (progress === 1) {
        clearInterval(awaiter)
        resolve(result)
      }

    }, 100)


    for (const rawItem of rawItems) {

      const url = rawItem.image.replace('%url%', baseURL)

      loadImage(url).then(image => {

        result.imagesData.push({ rawItem, image })

      }).catch(err => {

        result.imagesData.push({ rawItem, image: textureMissingImage })
        result.issues.push(`${rawItem.name}: Failed to load image: ${err.message}`);

      }).finally(() => {

        completedItems++

      })

    }

  })

}


function createBoxes (imagesData: LoadItemImagesResult['imagesData']) {
  return imagesData.map(({ rawItem, image }) => {

    return {
      rawItem,
      image,
      w: rawItem.width || image.naturalWidth,
      h: rawItem.height || image.naturalHeight,
      x: 0,
      y: 0
    }

  })
}


function importItems (boxes: ReturnType<typeof createBoxes>): Item[] {

  return boxes.map(box => {

    const rect: Rectangle = {
      width: box.w,
      height: box.h,
      x: box.x,
      y: box.y
    }

    return importItem(box.rawItem, rect)

  })

}


function importItem (raw: RawItemV1, rect: Rectangle): Item {

  const item: Item = {
    id: raw.id,

    name: raw.name,
    kind: getItemKindString(raw.type, raw.element),
    unlockLevel: raw.unlock_level || 0,
    goldPrice: raw.gold_price || 0,
    tokensPrice: raw.tokens_price || 0,
    transformRange: raw.transform_range,

    type: raw.type,
    element: raw.element || 'PHYSICAL',
    stats: raw.stats,
    tags: getItemTags(raw),

    /* As I type this, rect's width and height already tests for the item's raw width
     * and height, but we test here again for some possible future change we don't know */
    width: raw.width || rect.width,
    height: raw.height || rect.height,
    image: rect,
    
    attachment: raw.attachment || null,
  }

  if (item.attachment === null) {
    item.attachment = createSyntheticItemAttachment(item.type, item.width, item.height)
  }

  return item

}


function getProperBaseURL (itemsPack: ItemsPackV1): string {
  
  const oldBaseURL = 'https://raw.githubusercontent.com/ctrl-raul/workshop-unlimited/master/items/'
  const newBaseURL = 'https://raw.githubusercontent.com/ctrlraul/supermechs-item-images/master/png/'

  // Oui, we changed where we host the item images, it's
  // not in the WU repo anymore, so we do this here.
  if (itemsPack.config.base_url === oldBaseURL) {
    return newBaseURL
  }

  return itemsPack.config.base_url

}


function getItemTags (raw: RawItemV1): Item['tags'] {

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
