import { cloneDeep } from 'lodash'
import importItemsPackV1 from './importItemsPackV1'
import importItemsPackV2 from './importItemsPackV2'
import Logger from '../utils/Logger'
import { getBuffedItemStats } from '../stats/StatsManager'
import { itemsPackData as itemsPackDataStore, ItemsPackData } from '../stores'
import { sha256 } from 'hash.js'



// Types

import type Item from './Item'
import type { ItemsPackV1 } from './importItemsPackV1'
import type { ItemsPackV2 } from './importItemsPackV2'
import { get } from 'svelte/store'


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

export const Tags = {
  TAG_ROLLER: 'roller'
}

const itemElements = ['PHYSICAL', 'EXPLOSIVE', 'ELECTRIC', 'COMBINED']
const logger = new Logger('ItemsManager')

let imported: boolean = false
let importing: boolean = false

let items: Item[]
let itemsFailed: any[]

let itemsPackData = get(itemsPackDataStore)

itemsPackDataStore.subscribe(value => itemsPackData = value)



// Methods

export async function importItemsPack (url: string, onProgress: (progress: number) => void): Promise<void> {

  if (importing) {
    throw new Error('Already importing a pack.')
  }


  // Reset state

  imported = false
  importing = true


  // Import

  try {

    // Fetch data

    const response = await fetch(url)
    const itemsPack = await response.json()
    const result = await doImport(itemsPack, onProgress)

    items = result.items
    itemsFailed = result.itemsFailed

    imported = true
    importing = false

    itemsPackDataStore.set(result.itemsPackData)

  } catch (err: any) {

    importing = false

    throw err

  }

}


async function doImport (itemsPack: ItemsPack, onProgress: (progress: number) => void) {

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

  const [done, failed, sprites] = await importFn(itemsPack, onProgress)

  // Sort items by element
  done.sort((a, b) => itemElements.indexOf(a.element) > itemElements.indexOf(b.element) ? 1 : -1)

  packData.items = done
  packData.spritesSheet = sprites

  return {
    items: done,
    itemsFailed: failed,
    spritesSheet: sprites,
    itemsPackData: packData as ItemsPackData
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
    return null
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


export function getBattleItems (setup: number[], throwIfInvalid = true): (BattleItem | null)[] {

  const getItemFn = throwIfInvalid ? getItemByIdOrThrow : getItemByID

  return setup.map((id, i) => {

    if (id === 0) {
      return null;
    }

    const item = getItemFn(id)

    if (item === null) {
      return null
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
    }

    return battleItem;

  })
}


export function renderItem (ctx: CanvasRenderingContext2D, item: Item, x: number, y: number, width: number, height: number): void {

  if (itemsPackData === null) {
    throw new Error('No items pack loaded')
  }

  ctx.drawImage(
    itemsPackData.spritesSheet,
    item.image.x,
    item.image.y,
    item.image.width,
    item.image.height,
    x,
    y,
    width, 
    height
  )

}


export function getItemsHash (setup: number[]): string {

  const jsonString = JSON.stringify(getBattleItems(setup, false))
  const hash = sha256().update(jsonString).digest('hex')

  return hash

}


export function matchItemsHash (setup: number[], hash: string): boolean {

  const newHash = getItemsHash(setup)

  return newHash === hash

}
