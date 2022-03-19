import type { Attachment } from "./Item";
import type Item from "./Item";
import type { Rectangle } from "./Item";
import { createSyntheticItemAttachment, ImportItemsPackFn } from "./ItemsManager";



// Types

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



const importItemsPackV2: ImportItemsPackFn<ItemsPackV2> = (itemsPack, onProgress) => {

  return new Promise((resolve, reject) => {

    const image = new Image()

    // Import sprites sheet

    image.onload = () => {

      const done: Item[] = []
      const failed: Awaited<ReturnType<ImportItemsPackFn>>[1] = []


      // Import items
      for (const raw of itemsPack.items) {

        const spritesMapKey = raw.name.replace(/\s/g, '')
        const rect = itemsPack.spritesMap[spritesMapKey]

        if (rect !== undefined) {

          const finalItem: Item = {
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
  
            width: raw.width || rect.width,
            height: raw.height || rect.height,
            image: rect,
            attachment: raw.attachment || null,
          }

          if (finalItem.attachment === null) {
            finalItem.attachment = createSyntheticItemAttachment(
              finalItem.type,
              finalItem.width,
              finalItem.height
            )
          }

          done.push(finalItem)

        } else {

          failed.push({
            item: raw,
            message: `No image mapped for key "${spritesMapKey}"`
          })

        }

      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight

      ctx.drawImage(image, 0, 0)

      resolve([done, failed, canvas])
      onProgress(1)

    }

    image.onerror = reject

    image.src = itemsPack.spritesSheet

  })

}


export default importItemsPackV2


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
