import Mech from '../mechs/Mech'
import downloadJSON from '../utils/downloadJSON'
import { userData as userDataStore} from '../stores/userData'
import { get } from 'svelte/store'
import * as ItemsManager from '../items/ItemsManager'



// Types

interface MechsExportJSON {
  version: number
  mechs: {
    [ItemsPackKey: string]: {
      name: string
      setup: number[]
    }[]
  }
}



// Mech management methods

export function setCurrentMechID (id: string): void {
  userDataStore.update(userData => {
    userData.currentMechID = id
    return userData
  })
}


export function deleteMechInCurrentPackByID (mechID: string): void {

  userDataStore.update(userData => {

    const itemsPack = get(ItemsManager.itemsPackStore);

    if (itemsPack === null) {
      throw new Error('No items pack loaded')
    }

    if (mechID in userData.mechs[itemsPack.key]) {

      delete userData.mechs[itemsPack.key][mechID]

      // If there are no more mechs with this pack key, delete the pack data
      if (Object.keys(userData.mechs[itemsPack.key]).length === 0) {
        delete userData.mechs[itemsPack.key]
      }

    } else {
      throw new Error(`No mech in current pack with id "${mechID}"`)
    }

    if (mechID === userData.currentMechID) {
      userData.currentMechID === null
    }

    return userData

  })

}


export function createMechForCurrentPack (save = true): Mech {

  const itemsPack = get(ItemsManager.itemsPackStore);

  if (itemsPack === null) {
    throw new Error('No items pack loaded')
  }

  const mech = new Mech({
    pack_key: itemsPack.key,
    name: 'Unnamed Mech',
  })

  if (save) {
    saveMech(mech)
  }

  return mech

}


export function saveMech (mech: Mech): void {

  userDataStore.update(userData => {

    if (!(mech.packKey in userData.mechs)) {
      userData.mechs[mech.packKey] = {}
    }

    userData.mechs[mech.packKey][mech.id] = mech.toJSONModel()

    return userData

  })

}


export function exportMechs (mechs: Mech[]): void {

  const mechsExportJson: MechsExportJSON = {
    version: 1,
    mechs: {}
  }


  for (const mech of mechs) {

    const mechExportData: MechsExportJSON['mechs'][string][0] = {
      name: mech.name,
      setup: ItemsManager.items2ids(mech.getItems())
    }

    if (!(mech.packKey in mechsExportJson.mechs)) {
      mechsExportJson.mechs[mech.packKey] = []
    }

    mechsExportJson.mechs[mech.packKey].push(mechExportData)

  }


  downloadJSON(mechsExportJson, 'mechs')

}


/** Returns the mechs imported, automatically saves them. */
export function importMechs (mechsExportJSON: MechsExportJSON): Mech[] {

  const importedMechs: Mech[] = []

  userDataStore.update(userData => {

    for (const packKey in mechsExportJSON.mechs) {

      if (!(packKey in userData.mechs)) {
        userData.mechs[packKey] = {}
      }

      for (const { name, setup } of mechsExportJSON.mechs[packKey]) {

        const mech = new Mech({ name, setup, pack_key: packKey })

        userData.mechs[packKey][mech.id] = mech.toJSONModel()

        importedMechs.push(mech)

      }

    }

    return userData

  })

  return importedMechs

}


/** Imports a mech from the query parameter "mech", does not save it */
export function importMechFromURLQuery (query: URLSearchParams): Mech | null {

  const data = query.get('mech')

  if (data === null) {
    return null
  }

  const mechDataFromURL = JSON.parse(atob(data))

  const mech = new Mech({
    name: mechDataFromURL.name,
    pack_key: mechDataFromURL.pack_key,
    setup: mechDataFromURL.setup
  })

  return mech

}


/**
 * @param mech The mech to be checked
 * @returns Whether there is a mech with the same setup and same items pack key in the local storage.
*/
export function hasMech (mech: Mech): boolean {

  const data = get(userDataStore).mechs

  if (!(mech.packKey in data)) {
    return false
  }

  const setup = ItemsManager.items2ids(mech.getItems())

  return Object.values(data[mech.packKey]).some(json => {
    return json.setup.every((itemID, i) => itemID === setup[i])
  })

}
