import { ids2items, items2ids } from '../items/ItemsManager'



// Types

import type Item from '../items/Item'

export interface MechJSON {
  id: string
  name: string
  pack_key: string
  setup: number[]
}

export type SlotName = (
  'torso'       | 'legs'         | 'sideWeapon1' | 'sideWeapon2'   |
  'sideWeapon3' | 'sideWeapon4'  | 'topWeapon1'  | 'topWeapon2'    |
  'drone'       | 'chargeEngine' | 'teleporter'  | 'grapplingHook' |
  'module1'     | 'module2'      | 'module3'     | 'module4'       |
  'module5'     | 'module6'      | 'module7'     | 'module8'
)

interface Slot <ItemType extends Item['type'] = Item['type']> {
  type: ItemType
  item: Item | null
}



// Class

export default class Mech {

  static readonly TORSO_INDEX = 0
  static readonly LEGS_INDEX = 1
  static readonly SIDE_1_INDEX = 2
  static readonly SIDE_2_INDEX = 3
  static readonly SIDE_3_INDEX = 4
  static readonly SIDE_4_INDEX = 5
  static readonly TOP_1_INDEX = 6
  static readonly TOP_2_INDEX = 7
  static readonly DRONE_INDEX = 8
  static readonly CHARGE_INDEX = 9
  static readonly TELEPORTER_INDEX = 10
  static readonly HOOK_INDEX = 11
  // static readonly MODULE_1_INDEX = 12
  // static readonly MODULE_2_INDEX = 13
  // static readonly MODULE_3_INDEX = 14
  // static readonly MODULE_4_INDEX = 15
  // static readonly MODULE_5_INDEX = 16
  // static readonly MODULE_6_INDEX = 17
  // static readonly MODULE_7_INDEX = 18
  // static readonly MODULE_8_INDEX = 19


  static from (mech: Mech): Mech {
    return new Mech({
      name: mech.name,
      setup: items2ids(mech.setup),
      pack_key: mech.packKey
    })
  }


  id: string
  name: string
  packKey: string
  slots: Record<SlotName, Slot> = {
    torso:         { item: null, type: 'TORSO' },
    legs:          { item: null, type: 'LEGS' },
    sideWeapon1:   { item: null, type: 'SIDE_WEAPON' },
    sideWeapon2:   { item: null, type: 'SIDE_WEAPON' },
    sideWeapon3:   { item: null, type: 'SIDE_WEAPON' },
    sideWeapon4:   { item: null, type: 'SIDE_WEAPON' },
    topWeapon1:    { item: null, type: 'TOP_WEAPON' },
    topWeapon2:    { item: null, type: 'TOP_WEAPON' },
    drone:         { item: null, type: 'DRONE' },
    chargeEngine:  { item: null, type: 'CHARGE_ENGINE' },
    teleporter:    { item: null, type: 'TELEPORTER' },
    grapplingHook: { item: null, type: 'GRAPPLING_HOOK' },
    module1:       { item: null, type: 'MODULE' },
    module2:       { item: null, type: 'MODULE' },
    module3:       { item: null, type: 'MODULE' },
    module4:       { item: null, type: 'MODULE' },
    module5:       { item: null, type: 'MODULE' },
    module6:       { item: null, type: 'MODULE' },
    module7:       { item: null, type: 'MODULE' },
    module8:       { item: null, type: 'MODULE' },
  }


  constructor (json: Partial<MechJSON> = {}) {
    this.id = json.id || Date.now() + '-' + performance.now()
    this.name = json.name || 'Unnamed Mech'
    this.packKey = json.pack_key || 'dummy'
    this.setup = json.setup ? ids2items(json.setup) : Array(20).fill(null)
  }


  get setup () {
    return this.getItems()
  }

  set setup (items: (Item | null)[]) {

    const slots = Object.values(this.slots)

    for (let i = 0; i < items.length; i++) {
      slots[i].item = items[i]
    }

  }


  getItemAtSlot (slotName: SlotName): Item | null {
    return this.slots[slotName].item
  }

  setItemAtSlot (slotName: SlotName, item: Item | null): void {
    this.slots[slotName].item = item
  }

  getItems (): (Item | null)[] {
    return Object.values(this.slots).map(slot => slot.item)
  }

  clearSlots (): void {
    for (const name in this.slots) {
      this.slots[name as SlotName].item = null
    }
  }


  public toJSONModel (): MechJSON {

    return {
      id: this.id,
      name: this.name,
      pack_key: this.packKey,
      setup: items2ids(this.setup)
    }

  }

}
