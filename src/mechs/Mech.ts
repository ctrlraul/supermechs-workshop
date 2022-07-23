import { ids2items, items2ids } from '../items/ItemsManager'



// Types

import type Item from '../items/Item'
import { getBuffedMechSummary, getMechSummary } from '../stats/StatsManager'

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



// Class

export default class Mech {

  public static readonly NULL_MECH: Mech = new Mech();

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
  static readonly MODULE_1_INDEX = 12
  static readonly MODULE_2_INDEX = 13
  static readonly MODULE_3_INDEX = 14
  static readonly MODULE_4_INDEX = 15
  static readonly MODULE_5_INDEX = 16
  static readonly MODULE_6_INDEX = 17
  static readonly MODULE_7_INDEX = 18
  static readonly MODULE_8_INDEX = 19


  static from (mech: Mech): Mech {
    return new Mech({
      name: mech.name,
      setup: items2ids(mech.getItems()),
      pack_key: mech.packKey
    })
  }


  id: string
  name: string
  packKey: string
  slots: Record<SlotName, Item | null> = {
    torso: null,
    legs: null,
    sideWeapon1: null,
    sideWeapon2: null,
    sideWeapon3: null,
    sideWeapon4: null,
    topWeapon1: null,
    topWeapon2: null,
    drone: null,
    chargeEngine: null,
    teleporter: null,
    grapplingHook:null,
    module1: null,
    module2: null,
    module3: null,
    module4: null,
    module5: null,
    module6: null,
    module7: null,
    module8: null,
  }


  constructor (json: Partial<MechJSON> = {}) {
  
    this.id = json.id || Date.now() + '-' + performance.now()
    this.name = json.name || 'Unnamed Mech'
    this.packKey = json.pack_key || 'dummy'
  
    const items = json.setup ? ids2items(json.setup) : Array(20).fill(null)

    this.slots.torso = items[Mech.TORSO_INDEX]
    this.slots.legs = items[Mech.LEGS_INDEX]
    this.slots.sideWeapon1 = items[Mech.SIDE_1_INDEX]
    this.slots.sideWeapon2 = items[Mech.SIDE_2_INDEX]
    this.slots.sideWeapon3 = items[Mech.SIDE_3_INDEX]
    this.slots.sideWeapon4 = items[Mech.SIDE_4_INDEX]
    this.slots.topWeapon1 = items[Mech.TOP_1_INDEX]
    this.slots.topWeapon2 = items[Mech.TOP_2_INDEX]
    this.slots.drone = items[Mech.DRONE_INDEX]
    this.slots.chargeEngine = items[Mech.CHARGE_INDEX]
    this.slots.teleporter = items[Mech.TELEPORTER_INDEX]
    this.slots.grapplingHook = items[Mech.HOOK_INDEX]
    this.slots.module1 = items[Mech.MODULE_1_INDEX]
    this.slots.module2 = items[Mech.MODULE_2_INDEX]
    this.slots.module3 = items[Mech.MODULE_3_INDEX]
    this.slots.module4 = items[Mech.MODULE_4_INDEX]
    this.slots.module5 = items[Mech.MODULE_5_INDEX]
    this.slots.module6 = items[Mech.MODULE_6_INDEX]
    this.slots.module7 = items[Mech.MODULE_7_INDEX]
    this.slots.module8 = items[Mech.MODULE_8_INDEX]

  }


  get setup () {
    return this.getItems()
  }

  set setup (_: any) {
    throw new Error('NO')
  }


  getItemAtSlot (slotName: SlotName): Item | null {
    return this.slots[slotName]
  }

  setItemAtSlot (slotName: SlotName, item: Item | null): void {
    this.slots[slotName] = item
  }

  getItems (): (Item | null)[] {
    return Object.values(this.slots)
  }

  clearSlots (): void {
    for (const name in this.slots) {
      this.slots[name as SlotName] = null
    }
  }


  getSummary (buffed: boolean): Partial<Item['stats']> {
    const itemIDs = this.getItems().map(item => item ? item.id : 0)
    return buffed ? getBuffedMechSummary(itemIDs) : getMechSummary(itemIDs)
  }


  toJSONModel (): MechJSON {

    return {
      id: this.id,
      name: this.name,
      pack_key: this.packKey,
      setup: items2ids(this.getItems())
    }

  }

}
