import rawStatsData from './StatFormats'
import { cloneDeep } from 'lodash'
import { getItemByID, ids2items } from '../items/ItemsManager'
import { getBlob } from '../utils/getImageData'
import { userData } from '../stores/userData'
import { get } from 'svelte/store'



// Types

import type { StatFormat } from './StatFormats'
import type Item from '../items/Item'

export type StatFormatWithImage = StatFormat & {
  imageURL: string
}



// Data

export const WEIGHT_LIMIT = 1000
export const OVERLOAD_LIMIT = 1010
const OVERLOAD_PENALTY = 15

const STAT_IMAGES_BASE_URL = 'https://gist.githubusercontent.com/ctrlraul/de0f1ed5783ee5d5e16894f426f17ee2/raw/'
const IMAGE_MISSING_URL = '/assets/images/texture-missing.png'
const MAX_IMAGE_SIZE = 128

const stats = {} as Record<keyof Item['stats'], StatFormatWithImage>
const statsFromPack: Record<string, StatFormatWithImage> = {}

const buffFunctions = {
  add: (x: number, amount: number) => x + amount,
  mul: (x: number, amount: number) => x * amount
}



// Functions

export function includeStatFormats (statFormats: StatFormatWithImage[]): void {

  // Delete previous stats (don't use for...in, that also includes built-in)
  for (const key of Object.keys(statsFromPack)) {
    delete statsFromPack[key]
  }

  for (const format of statFormats) {
    statsFromPack[format.key] = format
  }

}


function getBuffedStats (stats: Item['stats'], isMechSummary: boolean): Item['stats'] {

  const buffedStats = cloneDeep(stats)
  const keys = Object.keys(buffedStats) as (keyof Item['stats'])[]

  for (const key of keys) {

    // Health buff is only applied to whole mech, not to each item
    if (key === 'health' && !isMechSummary) {
      continue
    }

    const value = buffedStats[key]
    const { buff } = getStatInstruction(key)

    if (buff !== null) {

      const buffFunction = buffFunctions[buff.mode]

      if (Array.isArray(value)) {

        // @ts-ignore
        buffedStats[key] = [
          Math.round(buffFunction(value[0], buff.amount)),
          Math.round(buffFunction(value[1], buff.amount)),
        ]

      } else if (typeof value === 'number') {

        // @ts-ignore
        buffedStats[key] = Math.round(buffFunction(value, buff.amount))

      }

    }

  }

  return buffedStats

}


export function loadStatImages (): Promise<void> {
  return new Promise(resolve => {

    let loadedStatsCount = 0


    const loadStat = async (instruction: StatFormat) => {

      stats[instruction.key] = Object.assign({ imageURL: IMAGE_MISSING_URL }, instruction)

      try {

        const src = STAT_IMAGES_BASE_URL + instruction.key + '.svg'
        const imageData = await getBlob(src, MAX_IMAGE_SIZE)

        stats[instruction.key].imageURL = imageData.url

      } catch (err: any) {

        console.error(`Error while loading stat "${instruction.key}": "${err.message}"`)

      } finally {

        loadedStatsCount++

        if (loadedStatsCount === rawStatsData.length) {
          resolve()
        }

      }

    }

    for (const instruction of rawStatsData) {
      loadStat(instruction)
    }

  });
}


/** Returns mech summary without buffs */
export function getMechSummary (setup: number[]): Item['stats'] {

  const items = ids2items(setup)
  const summary: Item['stats'] = {
    weight: 0, health: 0, eneCap: 0,
    eneReg: 0, heaCap: 0, heaCol: 0,
    phyRes: 0, expRes: 0, eleRes: 0,
  }


  for (const key of Object.keys(summary) as (keyof Item['stats'])[]) {

    // @ts-ignore
    summary[key] = 0

    for (const item of items) {
      if (item !== null && key in item.stats) {
        // @ts-ignore
        summary[key] = summary[key] + item.stats[key]
      }
    }

  }


  // Do health penalty due to overweight

  if (summary.weight as number > WEIGHT_LIMIT) {
    const overload = summary.weight as number - WEIGHT_LIMIT
    summary.health = summary.health as number - overload * OVERLOAD_PENALTY
  }


  return summary

}


/** Returns buffed mech summary */
export function getBuffedMechSummary (setup: number[]): Item['stats'] {
  return getBuffedStats(getMechSummary(setup), true)
}


/** Returns the item stats with arena buffs applied when enabled */
export function getSmartMechSummary (setup: number[]): Item['stats'] {
  return (
    get(userData).settings.arenaBuffs
    ? getBuffedMechSummary(setup)
    : getMechSummary(setup)
  )
}


/** Returns item stats without buffs */
export function getItemStats (id: Item['id']): Item['stats'] {

  if (id === 0) {
    throw new Error('0 is not a valid item id')
  }

  return cloneDeep(getItemByID(id)!.stats)

}


/** Returns buffed item stats */
export function getBuffedItemStats (id: Item['id']): Item['stats'] {
  return getBuffedStats(getItemStats(id), false)
}


/** Returns the item stats with arena buffs applied when enabled */
export function getSmartItemStats (id: Item['id']): Item['stats'] {
  return (
    get(userData).settings.arenaBuffs
    ? getBuffedItemStats(id)
    : getItemStats(id)
  )
}


export function getStatInstruction (key: keyof Item['stats']): StatFormatWithImage {

  if (stats[key]) {
    return stats[key]
  }

  if (statsFromPack[key]) {
    return statsFromPack[key]
  }

  console.error(`Stat '${key}' did not load or doesn't exist.`)

  // throw `Stat '${key}' did not load or doesn't exist.`
  return {
    key,
    // @ts-ignore
    name: 'Error: Unknown Stat',
    type: 'number',
    buff: null,
    imageURL: IMAGE_MISSING_URL
  }

}
