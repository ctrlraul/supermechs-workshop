import potpack from 'potpack'
import Logger from '../utils/Logger'
import { loadImage } from '../utils/loadImage'
import { cloneDeep } from 'lodash'
import { getBuffedItemStats, getItemStats } from '../stats/StatsManager'
import { sha256 } from 'hash.js'
import { get, writable } from 'svelte/store'
import { ItemType } from './Item'



// Types

import type Item from './Item'
import type { AttachmentPoint, TorsoAttachment } from './Item'
import type { SlotName } from '../mechs/Mech'


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

export interface ItemsPackImportResult {
  itemsPack: ItemsPack;
  renderSprite: typeof renderSprite;
}

export interface ItemsPack {
  name: string;
  description: string;
  key: string;
  items: Item[];
  legacy: boolean;
  issues: string[];
}

type MechSetup = (Item | null)[];

export interface RawItem {

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
  attachment?: Item['attachment']

}

export type SpriteHandlingMethod = "spritessheet" | "individual"

export interface RawItemsPack {
  name: string
  description: string
  key: string
  base_url: string
  legacy: boolean
  sprite_handling_method: SpriteHandlingMethod
  items: RawItem[]
}

type SpritesMap = { [id: Item['id']]: HTMLImageElement };

interface LoadItemImagesResult {
  spritesMap: SpritesMap;
  issues: string[]
}



const DEFAULT_SPRITE_HANDLING_METHOD: SpriteHandlingMethod = 'spritessheet'
export const itemsPackStore = writable<ItemsPack | null>(null);
export const rawItemsPackStore = writable<RawItemsPack | null>(null);
const logger = new Logger("Items Manager");

let _renderSprite: (ctx: CanvasRenderingContext2D, item: Item, x?: number, y?: number, scale?: number) => void;



export async function importItemsPack (url: string, onProgress: (progress: number) => void) {

  logger.log("Pack URL:", url);

  const response = await fetch(url);
  const data = await response.json();
  const rawItemsPack = parseRawItemsPack(data);

  logger.log("Raw items pack:", rawItemsPack);

  rawItemsPackStore.set(rawItemsPack);

  const loadItemImagesResult = await loadItemImages(
    rawItemsPack.base_url,
    rawItemsPack.items,
    onProgress
  );

  const importItemsResult = importItems(
    rawItemsPack.items,
    loadItemImagesResult.spritesMap
  );

  const itemsPack: ItemsPack = {
    name: rawItemsPack.name,
    description: rawItemsPack.description,
    key: rawItemsPack.key,
    legacy: rawItemsPack.legacy,
    items: importItemsResult.items,
    issues: [
      ...loadItemImagesResult.issues,
      ...importItemsResult.issues
    ],
  }

  _renderSprite = getRenderSpriteMethod(
    rawItemsPack.sprite_handling_method,
    loadItemImagesResult.spritesMap,
  );

  logger.log("Items Pack:", itemsPack);

  itemsPackStore.set(itemsPack);
  rawItemsPackStore.set(null);

}


export function items2ids (items: (Item | BattleItem | null)[]): number[] {
  return items.map(item => item ? item.id : 0);
}


export function ids2items (ids: Item['id'][]): MechSetup {
  const itemsPack = assertItemsPackLoaded()
  return ids.map(id => itemsPack.items.find(item => item.id === id) || null)
}


export function getItemsByType (type: Item['type']): Item[] {
  const itemsPack = assertItemsPackLoaded()
  return itemsPack.items.filter(item => item.type === type)
}


export function getItemByID (id: Item['id']): Item | null {

  if (id === 0) {
    return null
  }

  const itemsPack = assertItemsPackLoaded()
  const item = itemsPack.items.find(item => item.id === id)

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


export function renderSprite(ctx: CanvasRenderingContext2D, item: Item, x?: number, y?: number, scale?: number): void {
  assertItemsPackLoaded();
  _renderSprite(ctx, item, x, y, scale);
}


export function getBattleItem (item: Item, slotName: SlotName, throwIfInvalid?: boolean): BattleItem;
export function getBattleItem (itemdID: Item['id'], slotName: SlotName, throwIfInvalid?: boolean): BattleItem | null;
export function getBattleItem (value: Item | Item['id'] | null, slotName: SlotName, throwIfInvalid = false): BattleItem | null {

  const getItemFn = throwIfInvalid ? getItemByIdOrThrow : getItemByID
  const item = typeof value === 'number' ? getItemFn(value) : value

  if (item === null) {
    return null
  }

  const buffStats = assertItemsPackLoaded().legacy;

  const battleItem: BattleItem = {
    slotName,
    element: item.element,
    id: item.id,
    name: item.name,
    stats: buffStats ? getBuffedItemStats(item.id) : getItemStats(item.id), // Battle items always buffed
    tags: cloneDeep(item.tags),
    timesUsed: 0,
    type: item.type,
  }

  return battleItem

}


export function getItemsHash (setup: number[]): string {

  const jsonString = JSON.stringify(getBattleItems(setup, false))
  const hash = sha256().update(jsonString).digest('hex')

  return hash

}


export function isLegacyPack(): boolean {
  return assertItemsPackLoaded().legacy;
}


export function matchItemsHash (setup: number[], hash: string): boolean {

  const newHash = getItemsHash(setup)

  return newHash === hash

}


function createSyntheticItemAttachment (type: Item['type'], width: number, height: number): TorsoAttachment | AttachmentPoint | null {

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


function getItemKindString (type: Item['type'], element?: Item['element']): string {

  const words: string[] = [...type.split('_')];

  if (element) {
    words.unshift(element);
  }

  words.forEach((word, i) => {
    words[i] = word[0].toUpperCase() + word.slice(1).toLowerCase();
  });

  return words.join(' ');
}


function importItems(rawItems: RawItem[], spritesMap: SpritesMap) {

  const allItems = rawItems.map(importItem);
  const itemElements = ['PHYSICAL', 'EXPLOSIVE', 'ELECTRIC', 'COMBINED'];
  const issues: string[] = [];
  const validItems: Item[] = [];

  for (const item of allItems) {

    if (!ItemType.hasOwnProperty(item.type)) {
      issues.push(`${item.name}: Invalid item type '${item.type}', expected: ${Object.keys(ItemType).join(', ')}`);
      continue;
    }

    if (item.stats.range) {

      if (item.stats.range.length < 2) {
        issues.push(`${item.name}}: Invalid 'range' stat: Expected two values [min, max]`);
        item.stats.range.push(item.stats.range[0]);
      }

      if (item.stats.range[0] > item.stats.range[1]) {
        issues.push(`${item.name}: Invalid 'range' stat: Min range (${item.stats.range[0]}) is greater than max range (${item.stats.range[1]})`);
        item.stats.range.reverse();
      }

    }

    if (item.name == "Ultra Gladiator") {
      console.log(spritesMap[item.id])
    }

    item.width = spritesMap[item.id].naturalWidth;
    item.height = spritesMap[item.id].naturalHeight;

    // Kinda want this in importItem but the item's
    // width and height need to be set before this runs
    if (item.attachment === null) {
      item.attachment = createSyntheticItemAttachment(item.type, item.width, item.height)
    }

    validItems.push(item);

  }

  // Sort items by element (btw this inverts the list order and that isn't desired)
  validItems.sort((a, b) => itemElements.indexOf(a.element) > itemElements.indexOf(b.element) ? 1 : -1);

  return {
    issues,
    items: validItems,
  };

}


function assertItemsPackLoaded(): ItemsPack {

  const itemsPack = get(itemsPackStore);

  if (itemsPack === null) {
    throw new Error(`No items pack loaded`);
  }

  return itemsPack;

}


function parseRawItemsPack(source: any): RawItemsPack {

  const checked = source;//ItemsPackTy.assert(source);
  const oldBaseURL = 'https://raw.githubusercontent.com/ctrl-raul/workshop-unlimited/master/items/'
  const newBaseURL = 'https://raw.githubusercontent.com/ctrlraul/supermechs-item-images/master/png/'

  let pack: RawItemsPack;

  if ('config' in checked) {
    pack = {
      items: checked.items,
      legacy: !!checked.legacy,
      sprite_handling_method: checked.sprite_handling_method || DEFAULT_SPRITE_HANDLING_METHOD,

      ...checked.config,
    }
  } else {
    pack = {
      items: checked.items,
      legacy: !!checked.legacy,
      sprite_handling_method: checked.sprite_handling_method || DEFAULT_SPRITE_HANDLING_METHOD,
      
      // Config
      key: checked.key,
      base_url: checked.base_url,
      description: checked.description,
      name: checked.name,
    }
  }

  if (pack.base_url == oldBaseURL) {
    pack.base_url = newBaseURL;
  }

  return pack;

}


function getRenderSpriteMethod(handlingMethod: SpriteHandlingMethod, spritesMap: SpritesMap): ItemsPackImportResult['renderSprite'] {

  switch(handlingMethod) {

    case 'spritessheet': {
      const { spritesSheet, boxesMap } = createSpritesSheet(spritesMap);
      return (ctx, item, x = 0, y = 0, scale = 1) => {
        const box = boxesMap[item.id];
        ctx.drawImage(spritesSheet, box.x, box.y, box.w, box.h, x, y, item.width * scale, item.height * scale);
      };
    }
    
    case 'individual': {
      return (ctx, item, x = 0, y = 0, scale = 1) => {
        ctx.drawImage(spritesMap[item.id], x, y, item.width * scale, item.height * scale);
      };
    }

  }

}


function createSpritesSheet(spritesMap: LoadItemImagesResult['spritesMap']) {

  interface Rectangle {
    x: number;
    y: number;
    w: number;
    h: number;
  }

  const spriteEntries = Object.entries(spritesMap);
  const boxesMap: { [key: string]: Rectangle } = {};
  const boxes: Rectangle[] = [];

  // NOTE: potpack will rearrange the order of the items in the array,
  // so while technically possible, combining this loop with the other
  // below won't work as indexes won't match after calling potpack
  for (let i = 0; i < spriteEntries.length; i++) {
    const [id, sprite] = spriteEntries[i];
    const box = {
      x: 0,
      y: 0,
      w: sprite.naturalWidth,
      h: sprite.naturalHeight,
    };
    boxesMap[id] = box;
    boxes.push(box);
  }

  const potpackStats = potpack(boxes);
  const spritesSheet = document.createElement('canvas');
  const ctx = spritesSheet.getContext('2d')!;

  spritesSheet.width = potpackStats.w;
  spritesSheet.height = potpackStats.h;

  for (let i = 0; i < spriteEntries.length; i++) {
    const [id, sprite] = spriteEntries[i];
    const box = boxesMap[id];
    ctx.drawImage(sprite, box.x, box.y, box.w, box.h);
  }

  return {
    spritesSheet,
    boxesMap
  };

}


function loadItemImages (baseURL: string, rawItems: RawItem[], onProgress: ProgressListener): Promise<LoadItemImagesResult> {

  return new Promise(resolve => {

    const textureMissingImage = document.createElement("img")
    textureMissingImage.src = "assets/images/texture-missing.png"

    const result: LoadItemImagesResult = {
      spritesMap: {},
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

      if (!rawItem.image) {
        result.issues.push(`${rawItem.name}: Lacks an image`);
        logger.log(`${rawItem.name}: Lacks an image`);
        continue;
      }

      const url = rawItem.image.replace('%url%', baseURL)

      loadImage(url).then(image => {

        result.spritesMap[rawItem.id] = image;

      }).catch(err => {

        result.spritesMap[rawItem.id] = textureMissingImage;
        result.issues.push(`${rawItem.name}: Failed to load image: ${err.message}`);
        
      }).finally(() => {

        completedItems++

      })

    }

  })

}


function importItem (raw: RawItem): Item {

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

    width: 0,
    height: 0,
    
    attachment: raw.attachment || null,
  }

  return item

}


function getItemTags (raw: RawItem): Item['tags'] {

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
