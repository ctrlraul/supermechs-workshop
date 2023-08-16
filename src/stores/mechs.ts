import { get, writable } from 'svelte/store'
import Mech from '../mechs/Mech'
import { UserData, userData as userDataStore } from './userData'
import { createMechForCurrentPack } from '../managers/UserDataManager'
import * as ItemsManager from '../items/ItemsManager'



// Store

export const mechs = writable<Mech[]>([])
export const currentMech = writable<Mech | null>(null)



// Functions

function updateMechs (userData: UserData, itemsPack: ItemsManager.ItemsPack | null): void {

  if (!itemsPack) {
    mechs.set([])
    return
  }

  // Check if has mechs saved for this pack
  if (itemsPack.key in userData.mechs) {

    const mechJSONsData = userData.mechs[itemsPack.key]
    const mechsList = Object.values(mechJSONsData).map(json => new Mech(json))

    const mech = mechsList.find(mech => mech.id === userData.currentMechID)

    currentMech.set(mech ? mech : mechsList[0])
    mechs.set(mechsList)

  } else {

    const mech = createMechForCurrentPack(false)

    userData.mechs[itemsPack.key] = {
      [mech.id]: mech.toJSONModel()
    }

    currentMech.set(mech)
    mechs.set([mech])

  }

}


// Automatically update whenever user data or items pack changes
userDataStore.subscribe(value => updateMechs(value, get(ItemsManager.itemsPackStore)));
ItemsManager.itemsPackStore.subscribe(value => updateMechs(get(userDataStore), value));
