import { cloneDeep } from 'lodash'
import importItemsPackV1 from './importItemsPackV1'
import importItemsPackV2 from './importItemsPackV2'
import Logger from '../utils/Logger'
import { getBuffedItemStats } from '../stats/StatsManager'
import { itemsPackData, ItemsPackData } from '../stores'



// Types

import type Item from './Item'
import type { ItemsPackV1 } from './importItemsPackV1'
import type { ItemsPackV2 } from './importItemsPackV2'


export type ItemsPack = ItemsPackV1 | ItemsPackV2


/**
 * Only the data needed to be used in battle.
 */
export interface BattleItem {
  id: number;
  index: number;
  name: string;
  type: Item['type'];
  stats: Item['stats'];
  tags: Item['tags'];
  element: Item['element'];
  timesUsed: number;
}





type MechSetup = (Item | null)[];


type ImportedItemsData = Promise<[
  done: Item[],
  failed: { item: any, message: string }[],
  spritesSheet: HTMLCanvasElement
]>

export type ImportItemsPackFn <ItemsPack = any> = (itemsPack: ItemsPack, onProgress: (progress: number) => void) => ImportedItemsData





// Stuff

const itemElements = ['PHYSICAL', 'EXPLOSIVE', 'ELECTRIC', 'COMBINED'];
const logger = new Logger('ItemsManager')

let spritesSheet: HTMLCanvasElement | null = null

let imported: boolean = false
let importing: boolean = false

let items: Item[]
let itemsFailed: any[]





// Methods

export async function importItemsPack (itemsPack: ItemsPack, onProgress: (progress: number) => void): Promise<void> {

  if (importing) {
    throw new Error('Already importing a pack.')
  }


  imported = false
  importing = true


  let importFn: ImportItemsPackFn
  let packData: Partial<ItemsPackData>


  // Pick the right function to import
  switch (itemsPack.version) {

    case '1':
      logger.log('Importing items pack version 1')
      importFn = importItemsPackV1
      packData = {
        version: itemsPack.version,
        key: itemsPack.config.key,
        name: itemsPack.config.name,
        description: itemsPack.config.description,
      }
      break
    
    case '2':
      logger.log('Importing items pack version 2')
      importFn = importItemsPackV2
      packData = {
        version: itemsPack.version,
        key: itemsPack.key,
        name: itemsPack.name,
        description: itemsPack.description,
      }
      break
    
    default:
      logger.warn(`Items pack version missing or unknown (${itemsPack.version}). Importing as version 1`)
      importFn = importItemsPackV1
      packData = {
        version: '1',
        key: itemsPack.config.key,
        name: itemsPack.config.name,
        description: itemsPack.config.description,
      }
      break
    
  }


  try {

    const [done, failed, sprites] = await importFn(itemsPack, onProgress)

    items = done
    itemsFailed = failed
    spritesSheet = sprites

    // Sort items by element
    items.sort((a, b) => itemElements.indexOf(a.element) > itemElements.indexOf(b.element) ? 1 : -1)

    packData.items = items
    packData.spritesSheet = sprites
    itemsPackData.set(packData as ItemsPackData)

    imported = true

  } catch (err: any) {

    imported = false

    throw err // Let whatever called this function to handle the issue.

  } finally {

    importing = false

  }

}


export function hasLoadedItemsPack (): boolean {
  return imported;
}


export function items2ids (items: (Item | BattleItem | null)[]): number[] {
  return items.map(item => item ? item.id : 0);
}


export function ids2items (ids: Item['id'][]): MechSetup {
  return ids.map(id => getItemByID(id));
}


export function getItems (filter?: (item: Item) => boolean): Item[] {
  return filter ? items.filter(filter) : items
}


export function getItemByID (id: Item['id']): Item | null {

  if (id === 0) {
    return null
  }

  const item = items.find(item => item.id === id)

  if (!item) {
    throw new Error(`No item with id "${id}" in the current pack.`)
  }

  return item

}


export function getItemByIdOrThrow (id: Item['id']): Item {

  const item = getItemByID(id)

  if (item === null) {
    throw new Error(`No item with id "${id}" in the current pack.`)
  }

  return item

}


export function getBattleItems (setup: number[]): (BattleItem | null)[] {
  return setup.map((id, i) => {

    if (id === 0) {
      return null;
    }

    const item = getItemByID(id)

    if (item === null) {
      throw new Error(`No item with id '${id}'`)
    }

    const battleItem: BattleItem = {
      element: item.element,
      id: item.id,
      index: i,
      name: item.name,
      stats: getBuffedItemStats(item.id), // Battle items always buffed
      tags: cloneDeep(item.tags),
      timesUsed: 0,
      type: item.type,
    };

    return battleItem;

  });
}


export function renderItem (ctx: CanvasRenderingContext2D, item: Item, x: number, y: number, width: number, height: number): void {

  if (spritesSheet === null) {
    throw new Error('No sprites sheet loaded')
  }

  if (typeof item.image === 'string') {
    throw new Error('TODO: Make compile all item images from packs with individual images into a single spritessheet to make this work lols')
  }

  ctx.drawImage(
    spritesSheet,
    item.image.x, item.image.y,
    item.image.width, item.image.height,
    x, y,
    width, height
  )

}
