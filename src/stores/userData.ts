/**
 * Remember to always update the types "UserData" and
 * "UserDataAnyVersion" whenever creating a new user data
 * version, unless you want to fuck everyone's mechs of course.
*/



import Logger from '../utils/Logger'
import { writable } from 'svelte/store'
import * as LocalStorageHandler from '../managers/LocalStorageHandler'



// Types

import type { MechJSON } from '../mechs/Mech'


interface UserDataV1 {
  version?: undefined
  name: string
}

interface UserDataV2 {
  version: '2'
  name: string
  mechs: {
    [pack_key: string]: {
      [mech_id: string]: MechJSON
    }
  }
  settings: {
    arenaBuffs: boolean
  }
  currentMechID: string | null
  lastItemsPackURL: string | null
}

type UserDataAnyVersion = UserDataV1 | UserDataV2

/** Typed with the latest version of the user data */
export type UserData = UserDataV2



// Functions

function loadUserData () {

  logger.log('Loading user data...')

  try {

    LocalStorageHandler.loadLocalData()

    const json = localStorage.getItem(LOCAL_STORAGE_KEY)

    if (json === null) {
      logger.log('No user data found, time to create it')
      userData.set(updateUserData({ name: 'Unnamed Pilot' }))
      return
    }

    const unknownUserData: UserDataAnyVersion = JSON.parse(json)

    logger.log('Successfuly loaded user data')

    const upToDateUserData = updateUserData(unknownUserData)

    userData.set(upToDateUserData)
  
  } catch (err: any) {

    logger.error('Failed to load user data:', err.message)

  }

}


function saveUserData (data: UserData): void {

  try {

    const json = JSON.stringify(data)

    localStorage.setItem('superMechsWorkshop-userData', json)

  } catch (err: any) {

    logger.error('Failed to save user data:', err)

  }

}


function updateUserData (data: UserDataAnyVersion): UserData {

  switch (data.version) {

    case undefined: { // v1

      logger.log('Updating user data from v1 to v2')

      const v2: UserDataV2 = {
        version: '2',
        name: data.name,
        mechs: LocalStorageHandler.get('mechs'),
        settings: {
          arenaBuffs: LocalStorageHandler.get('settings').arena_buffs
        },
        currentMechID: LocalStorageHandler.get('last-mech-id'),
        lastItemsPackURL: LocalStorageHandler.get('last-items-pack-url') || null
      }

      return updateUserData(v2)

    }

    case '2':
      logger.log('User data is up to date')
      return data

  }

}



// Consts

const LOCAL_STORAGE_KEY = 'superMechsWorkshop-userData'
const DEFAULT_USER_DATA: UserData = {
  version: '2',
  name: 'Unnamed Pilot',
  mechs: {},
  settings: {
    arenaBuffs: false
  },
  currentMechID: null,
  lastItemsPackURL: null
}



// Data

const logger = new Logger()
export const userData = writable<UserData>(DEFAULT_USER_DATA)

loadUserData() // Auto-load user data

userData.subscribe(saveUserData) // Auto-save user data
