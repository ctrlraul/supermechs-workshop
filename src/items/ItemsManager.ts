// TODO: filterInvalidItems should have more in-depht checks



import Logger from '../utils/Logger'
import { importItemsPackV1 } from './importItemsPackV1'
import { importItemsPackV2 } from './importItemsPackV2'
import { cloneDeep } from 'lodash'
import { getBuffedItemStats } from '../stats/StatsManager'
import { itemsPackData as itemsPackDataStore, ItemsPackData } from '../stores'
import { sha256 } from 'hash.js'
import { get } from 'svelte/store'
import { ItemType } from './Item'



// Types

import type Item from './Item'
import type { ItemsPackV1 } from './importItemsPackV1'
import type { ItemsPackV2 } from './importItemsPackV2'
import type { AttachmentPoint, TorsoAttachment } from './Item'
import type { SlotName } from '../mechs/Mech'


export type ItemsPack = ItemsPackV1 | ItemsPackV2
export type ProgressListener = (progress: number) => void


/** Only the data needed to be used in battle. */
export interface BattleItem {
  slotName: SlotName
  id: number
  name: string
  type: Item['type']
  stats: Item['stats']
  tags: Item['tags']
  element: Item['element']
  timesUsed: number
}



type MechSetup = (Item | null)[];



// Stuff

const itemElements = ['PHYSICAL', 'EXPLOSIVE', 'ELECTRIC', 'COMBINED']
const logger = new Logger()



// Methods

export async function importItemsPack (url: string, onProgress: (progress: number) => void): Promise<ItemsPackData> {

  const response = await fetch(url)
  const itemsPack = await response.json()
  const itemsPackData = await useCorrectImportFunction(itemsPack as unknown as ItemsPack, onProgress)
  const filterResult = filterInvalidItems(itemsPackData.items)

  itemsPackData.items = filterResult.items
  itemsPackData.issues.push(...filterResult.issues)

  return itemsPackData

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


function filterInvalidItems (items: Item[]) {

  const issues: string[] = [];
  const validItems: Item[] = [];

  // Sort items by element (btw this inverts the list order and that isn't desired)
  items.sort((a, b) => itemElements.indexOf(a.element) > itemElements.indexOf(b.element) ? 1 : -1);

  for (const item of items) {

    if (!ItemType.hasOwnProperty(item.type)) {
      issues.push(`${item.name}: Invalid item type '${item.type}', expected: ${Object.keys(ItemType).join(', ')}`);
      continue;
    }

    if (item.stats.range) {

      if (item.stats.range.length !== 2) {
        issues.push(`${item.name}}: Invalid 'range' stat: Expected two values [min, max]`);
        continue;
      }

      if (item.stats.range[0] > item.stats.range[1]) {
        issues.push(`${item.name}: Invalid 'range' stat: Min range (${item.stats.range[0]}) is greater than max range (${item.stats.range[1]})`);
        continue;
      }

    }

    validItems.push(item);

  }

  return {
    issues,
    items: validItems,
  };

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

  const slotNames: SlotName[] = [
    'torso', 'legs', 'sideWeapon1', 'sideWeapon2',
    'sideWeapon3', 'sideWeapon4',  'topWeapon1',
    'topWeapon2', 'drone', 'teleporter',
    'chargeEngine', 'grapplingHook',
    'module1', 'module2', 'module3', 'module4',
    'module5', 'module6', 'module7', 'module8'
  ]

  const battleItems: (BattleItem | null)[] = []

  for (let i = 0; i < slotNames.length; i++) {

    const id = setup[i] || 0
    const battleItem = getBattleItem(id, slotNames[i], throwIfInvalid)

    battleItems.push(battleItem)

  }

  return battleItems
}



export function getBattleItem (item: Item, slotName: SlotName, throwIfInvalid?: boolean): BattleItem;
export function getBattleItem (itemdID: Item['id'], slotName: SlotName, throwIfInvalid?: boolean): BattleItem | null;
export function getBattleItem (value: Item | Item['id'] | null, slotName: SlotName, throwIfInvalid = false): BattleItem | null {

  const getItemFn = throwIfInvalid ? getItemByIdOrThrow : getItemByID
  const item = typeof value === 'number' ? getItemFn(value) : value

  if (item === null) {
    return null
  }

  const battleItem: BattleItem = {
    slotName,
    element: item.element,
    id: item.id,
    name: item.name,
    stats: getBuffedItemStats(item.id), // Battle items always buffed
    tags: cloneDeep(item.tags),
    timesUsed: 0,
    type: item.type,
  }

  return battleItem

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


export function getItemKindString (type: Item['type'], element?: Item['element']): string {

  const words: string[] = [...type.split('_')];

  if (element) {
    words.unshift(element);
  }

  words.forEach((word, i) => {
    words[i] = word[0].toUpperCase() + word.slice(1).toLowerCase();
  });

  return words.join(' ');
}
