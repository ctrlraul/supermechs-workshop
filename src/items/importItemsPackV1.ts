import potpack from 'potpack'
import type { Attachment } from './Item'
import type Item from './Item'
import { createSyntheticItemAttachment, ImportItemsPackFn } from './ItemsManager'



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

type IndividualImagesResult = Promise<{
  images: [RawItemV1, HTMLImageElement][]
  failed: Awaited<ReturnType<ImportItemsPackFn>>[1]
}>



// Methods

/**
 * Beyond importing the items, this function also compiles
 * all the individual item images into a sprites sheet.
 */
const importItemsPackV1: ImportItemsPackFn<ItemsPackV1> = async (itemsPack, onProgress) => {
  
  const baseURL = getBaseURL(itemsPack)

  const done: Item[] = []
  const result = await loadIndividualItemImages(baseURL, itemsPack.items, onProgress)

  const boxes = result.images.map(([item, image]) => ({
    item,
    image,
    w: item.width || image.naturalWidth,
    h: item.height || image.naturalHeight,
    x: 0,
    y: 0
  }))

  const potpackStats = potpack(boxes)
  const spritesSheet = document.createElement('canvas')
  const ctx = spritesSheet.getContext('2d')!

  spritesSheet.width = potpackStats.w
  spritesSheet.height = potpackStats.h

  for (const { image, item, w, h, x, y } of boxes) {

    // Render on sprites sheet
    ctx.drawImage(image, x, y, w, h)

    const finalItem: Item = {
        
      id: item.id,

      name: item.name,
      kind: getKindString(item),
      unlockLevel: item.unlock_level || 0,
      goldPrice: item.gold_price || 0,
      tokensPrice: item.tokens_price || 0,
      transformRange: item.transform_range,

      type: item.type,
      element: item.element,
      stats: item.stats,
      tags: getItemTags(item),

      width: item.width || image.naturalWidth,
      height: item.height || image.naturalHeight,
      image: { width: w, height: h, x, y },
      attachment: item.attachment || null,

    }

    if (finalItem.attachment === null) {
      finalItem.attachment = createSyntheticItemAttachment(
        finalItem.type,
        finalItem.width,
        finalItem.height
      )
    }

    done.push(finalItem)

  }

  return [done, result.failed, spritesSheet]

}



// Private utils

function getBaseURL (itemsPack: ItemsPackV1): string {
  
  const oldBaseURL = 'https://raw.githubusercontent.com/ctrl-raul/workshop-unlimited/master/items/'
  const newBaseURL = 'https://raw.githubusercontent.com/ctrl-raul/supermechs-item-images/master/png/'

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


function loadIndividualItemImages (baseURL: string, rawItems: RawItemV1[], onProgress: (progress: number) => void): IndividualImagesResult {

  return new Promise(resolve => {

    const result: Awaited<IndividualImagesResult> = {
      images: [],
      failed: []
    }

    let completedItems = 0

    const awaiter = setInterval(() => {

      const progress = completedItems / rawItems.length

      onProgress(progress)

      if (progress === 1) {
        clearInterval(awaiter)
        resolve(result)
      }

    }, 250)

    for (const item of rawItems) {
    
      const image = new Image()

      image.addEventListener('load', () => {
        result.images.push([item, image])
        completedItems++
      })

      image.addEventListener('error', ({ message }) => {
        result.failed.push({ item, message })
        completedItems++
      })

      image.src = item.image.replace('%url%', baseURL)

    }

  })

}



export default importItemsPackV1


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