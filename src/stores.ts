import { writable } from 'svelte/store'
import type { MechJSON } from './mechs/Mech'
import * as MechsManager from './mechs/MechsManager'
import Logger from './utils/Logger'
import { getURLQuery } from './utils/getURLQuery'
import { addPopup } from './managers/PopupManager'



// Types

import type { Battle } from './battle/Battle'
import type { TooltipData } from './components/Tooltip/useTooltip'
import type Item from './items/Item'

export type Orientations = 'landscape' | 'portrait'

export interface ItemsPackData {
  version: string
  name: string
  description: string
  key: string
  items: Item[]
  spritesSheet: HTMLCanvasElement
}



// Utils

const logger = new Logger()



// Stores

export const orientation = writable<Orientations>(getOrientation())
export const battle = writable<Battle | null>(null)
export const itemsPackData = writable<ItemsPackData | null>(null)
export const currentMech = writable<MechJSON | null>(null)
export const tooltip = writable<TooltipData | null>(null)



// Some independent shit

itemsPackData.subscribe(value => {

  if (value === null) {
    return
  }
  
  logger.log('Items Pack Data:', value)


  MechsManager.loadMechsForCurrentPack()

  try {

    const query = getURLQuery()
    const mech = MechsManager.importMechFromURLQuery(query)

    if (mech !== null && !MechsManager.hasMech(mech)) {

      MechsManager.saveMech(mech)
      MechsManager.setLastMech(mech.id)

      const message = (
        mech.pack_key === value.key
        ? `Mech "${mech.name}" has been set as your current mech!`
        : `Mech "${mech.name}" uses a different items pack, ask it to who sent you the link!`
      )

      addPopup({
        title: 'Imported mech from URL',
        message,
        mode: 'success',
        options: {
          Ok () { this.remove() }
        }
      })

    }

  } catch (err: any) {

    addPopup({
			title: 'Failed to import mech from URL',
			message: err.message,
			mode: 'error',
			options: {
				Ok () { this.remove() }
			}
		})

  }

  currentMech.set(MechsManager.getLastMech())

})


window.addEventListener('resize', () => {
  orientation.set(getOrientation())
})



// Utils

function getOrientation (): Orientations {
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
}
