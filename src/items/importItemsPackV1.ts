import potpack from 'potpack'
import { createSyntheticItemAttachment, ImportResult, ProgressListener } from './ItemsManager'
import { loadImage } from '../utils/loadImage'



// Types

import type Item from './Item'
import type { Attachment, Rectangle } from './Item'
import type { ItemsPackData } from '../stores'


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
	element: Item['element']
  stats: Item['stats']
  tags?: Item['tags']
	
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
  items: RawItemV1[]
}

interface LoadItemImagesResult {
  imagesData: {
    rawItem: RawItemV1
    image: HTMLImageElement
  }[]
  errors: string[]
}



export async function importItemsPackV1 (itemsPack: ItemsPackV1, onProgress: ProgressListener): Promise<ImportResult> {

  const onProgressSub: ProgressListener = progress => onProgress(progress / 1.01)

  const { spritesSheet, errors, boxes } = await loadSpritesSheet(itemsPack, onProgressSub)
  const items = importItems(boxes)

  const data: ItemsPackData = {
    version: itemsPack.version || '1',
    key: itemsPack.config.key,
    name: itemsPack.config.name,
    description: itemsPack.config.description,
    spritesSheet: spritesSheet,
    items,
  }

  onProgress(1)

  return { data, errors }

}


async function loadSpritesSheet (itemsPack: ItemsPackV1, onProgress: ProgressListener) {

  // Get data required
  const baseURL = getProperBaseURL(itemsPack)
  const { imagesData, errors } = await loadItemImages(baseURL, itemsPack.items, onProgress)

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
  return { spritesSheet, errors, boxes }

}


function loadItemImages (baseURL: string, rawItems: RawItemV1[], onProgress: ProgressListener): Promise<LoadItemImagesResult> {

  return new Promise(resolve => {

    const result: LoadItemImagesResult = {
      imagesData: [],
      errors: []
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

        result.errors.push(err.message)

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
    kind: getKindString(raw),
    unlockLevel: raw.unlock_level || 0,
    goldPrice: raw.gold_price || 0,
    tokensPrice: raw.tokens_price || 0,
    transformRange: raw.transform_range,

    type: raw.type,
    element: raw.element,
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


function getKindString (item: RawItemV1): string {
  const words = [item.element, ...item.type.split('_')]
  return words.map(word => word[0].toUpperCase() + word.slice(1).toLowerCase()).join(' ')
}




// function checkItemsPack (itemsPack: ItemsPack): void {

//   // First we should check if the pack format is valid
//   // at all, but we don't do that at the moment because
//   // Runtypes decided to not give useful error messages.

//   // Then we check for items with the same ID

//   const idsMap: Record<string | number, RawItem[]> = {};
//   let messageLines: string[] = [];

//   for (const item of itemsPack.items) {
//     if (idsMap[item.id]) {
//       idsMap[item.id].push(item);
//     } else {
//       idsMap[item.id] = [item];
//     }
//   }

//   for (const [id, items] of Object.entries(idsMap)) {
//     if (items.length > 1) {
//       messageLines.push(`Found ${items.length} items with id ${id}`);
//     }
//   }

//   if (messageLines.length) {
//     throw new Error(messageLines.join('\n'));
//   }

// }