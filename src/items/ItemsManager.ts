import Logger from '../utils/Logger'
import { importItemsPackV1 } from './importItemsPackV1'
import { importItemsPackV2 } from './importItemsPackV2'
import { cloneDeep } from 'lodash'
import { getBuffedItemStats } from '../stats/StatsManager'
import { itemsPackData as itemsPackDataStore, ItemsPackData } from '../stores'
import { sha256 } from 'hash.js'
import { get } from 'svelte/store'



// Types

import type Item from './Item'
import type { ItemsPackV1 } from './importItemsPackV1'
import type { ItemsPackV2 } from './importItemsPackV2'
import type { AttachmentPoint, TorsoAttachment } from './Item'


export type ItemsPack = ItemsPackV1 | ItemsPackV2
export type ProgressListener = (progress: number) => void


/** Only the data needed to be used in battle. */
export interface BattleItem {
  id: number
  index: number
  name: string
  type: Item['type']
  stats: Item['stats']
  tags: Item['tags']
  element: Item['element']
  timesUsed: number
}



type MechSetup = (Item | null)[];


export interface ImportResult {
  data: ItemsPackData
  errors: string[]
}



// Stuff

const itemElements = ['PHYSICAL', 'EXPLOSIVE', 'ELECTRIC', 'COMBINED']
const logger = new Logger()



// Methods

export async function importItemsPack (url: string, onProgress: (progress: number) => void): Promise<ImportResult> {

  const response = await fetch(url)
  const itemsPack = await response.json()
  const result = await useCorrectImportFunction(itemsPack as unknown as ItemsPack, onProgress)

  // Sort items by element
  result.data.items.sort((a, b) => itemElements.indexOf(a.element) > itemElements.indexOf(b.element) ? 1 : -1)

  return result

}


async function useCorrectImportFunction (itemsPack: ItemsPack, onProgress: (progress: number) => void) {

  switch (itemsPack.version) {

    case '1':
      logger.log('Importing items pack version 1')
      return await importItemsPackV1(itemsPack, onProgress)
    
    case '2':
      logger.log('Importing items pack version 2')
      return await importItemsPackV2(itemsPack, onProgress)
    
    default:
      logger.warn(`Items pack version missing or unknown (${itemsPack.version}). Importing as version 1`)
      return await importItemsPackV1(itemsPack, onProgress)
    
  }

}


export function getItemsPackData () {
  return get(itemsPackDataStore)
}


export function items2ids (items: (Item | BattleItem | null)[]): number[] {
  return items.map(item => item ? item.id : 0);
}


function assertItemsPackDataLoaded (): ItemsPackData {

  const itemsPackData = getItemsPackData()!

  if (getItemsPackData() === null) {
    throw new Error(`No items pack data loaded`)
  }

  return itemsPackData

}


export function ids2items (ids: Item['id'][]): MechSetup {
  const itemsPackData = assertItemsPackDataLoaded()
  return ids.map(id => itemsPackData.items.find(item => item.id === id) || null)
}


export function getItemsByType (type: Item['type']): Item[] {
  const itemsPackData = assertItemsPackDataLoaded()
  return itemsPackData.items.filter(item => item.type === type)
}


export function getItemByID (id: Item['id']): Item | null {

  if (id === 0) {
    return null
  }

  const itemsPackData = assertItemsPackDataLoaded()
  const item = itemsPackData.items.find(item => item.id === id)

  if (item === undefined) {
    return null
  }

  return item

}


export function getItemByIdOrThrow (id: Item['id']): Item {

  const item = getItemByID(id)

  if (item === null) {
    throw new Error(`No item with id (${id}) in the current pack.`)
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

    return battleItem

  })
}


export function renderItem (ctx: CanvasRenderingContext2D, item: Item, x: number, y: number, width: number, height: number): void {

  const { spritesSheet } = assertItemsPackDataLoaded()

  ctx.drawImage(
    spritesSheet,
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


export function createSyntheticItemAttachment (type: Item['type'], width: number, height: number): TorsoAttachment | AttachmentPoint | null {

  switch (type) {

    case 'TORSO':
      return {
        leg1: { x: width * 0.4, y: height * 0.9 },
        leg2: { x: width * 0.8, y: height * 0.9 },
        side1: { x: width * 0.25, y: height * 0.6 },
        side2: { x: width * 0.75, y: height * 0.6 },
        side3: { x: width * 0.2, y: height * 0.3 },
        side4: { x: width * 0.80, y: height * 0.3 },
        top1: { x: width * 0.25, y: height * 0.1 },
        top2: { x: width * 0.75, y: height * 0.1 },
      }
    
    case 'LEGS':
      return {
        x: width * 0.5,
        y: height * 0.1
      }
  
    case 'SIDE_WEAPON':
      return {
        x: width * 0.3,
        y: height * 0.5
      }
  
    case 'TOP_WEAPON':
      return {
        x: width * 0.3,
        y: height * 0.8
      }

    default:
      return null

  }

}