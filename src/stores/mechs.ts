import { get, writable } from 'svelte/store'
import Mech from '../mechs/Mech'
import { UserData, userData as userDataStore } from './userData'
import { ItemsPackData, itemsPackData as itemsPackDataStore } from '../stores'
import { createMechForCurrentPack } from '../managers/UserDataManager'



// Store

export const mechs = writable<Mech[]>([])
export const currentMech = writable<Mech | null>(null)



// Functions

function updateMechs (userData: UserData, itemsPackData: ItemsPackData | null): void {

  if (itemsPackData === null) {
    mechs.set([])
    return
  }

  // Check if has mechs saved for this pack
  if (itemsPackData.key in userData.mechs) {

    const mechJSONsData = userData.mechs[itemsPackData.key]
    const mechsList = Object.values(mechJSONsData).map(json => new Mech(json))

    const mech = mechsList.find(mech => mech.id === userData.currentMechID)

    currentMech.set(mech ? mech : mechsList[0])
    mechs.set(mechsList)

  } else {

    const mech = createMechForCurrentPack(false)

    userData.mechs[itemsPackData.key] = {
      [mech.id]: mech.toJSONModel()
    }

    currentMech.set(mech)
    mechs.set([mech])

  }

}



// Automatically update whenever userData or itemsPackData changes
userDataStore.subscribe(value => updateMechs(value, get(itemsPackDataStore)))
itemsPackDataStore.subscribe(value => updateMechs(get(userDataStore), value))
