/* NOTE: Mostly to avoid typos and invalid data related
 * in local storage keys. Avoid using this module, it's
 * purpose is to serve manager modules like MechsManager.
 */



import type { MechJSON } from '../mechs/Mech'



// Types

export interface LocalStorageData {

  'settings': {
    arena_buffs: boolean
    buffs_on_tooltip: boolean
    clear_slot_button: boolean
    control_opponent_mech: boolean
  }

  'mechs': {
    [pack_key: string]: {
      [mech_id: string]: MechJSON
    }
  }

  'last-mech-id': null | string

  'last-items-pack-url': string

}



// Data

let loaded = false

const PREFIX = 'workshop-unlimited.'

// Set default values here
const cache: LocalStorageData = {

  'settings': {
    arena_buffs: false,
    buffs_on_tooltip: true,
    clear_slot_button: true,
    control_opponent_mech: false,
  },

  'mechs': {},

  'last-mech-id': null,

  'last-items-pack-url': '',

}



// functions

/**
 * Load the values stored in local storage to cache
 */
export function loadLocalData (): void {

  if (loaded) {
    throw new Error(`Already loaded`)
  }

  loaded = true

  for (const key in cache) {
    try {

      const rawValue = localStorage.getItem(PREFIX + key)

      if (rawValue === null) {
        continue
      }

      // @ts-ignore
      cache[key] = JSON.parse(rawValue)

    } catch (err: any) {

      console.log(`Failed to load value for '${key}': ${err.message}\n`)

    }
  }
}


export function get <T extends keyof LocalStorageData> (key: T): LocalStorageData[T]
export function get <T extends keyof LocalStorageData> (key: T, optional?: LocalStorageData[T]): LocalStorageData[T]
export function get <T extends keyof LocalStorageData> (key: T, optional?: LocalStorageData[T]): LocalStorageData[T] {

  console.trace(key)

  if (!loaded) {
    throw new Error('You forgot to call loadLocalData.')
  }

  const data = cache[key] as LocalStorageData[T]

  if (data === null) {

    if (optional !== undefined) {
      set(key, optional)
      return optional
    }
    
  }

  return JSON.parse(JSON.stringify(data))

}


export function set <T extends keyof LocalStorageData> (key: T, value: LocalStorageData[T]): void {

  cache[key] = value

  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (err: any) {
    console.warn(`Failed to save "${key}" to local storage: ${err.message}`)
  }

}


/**
 * Delete item from local storage
 */
export function del (key: keyof LocalStorageData): void {
  localStorage.removeItem(PREFIX + key)
}
