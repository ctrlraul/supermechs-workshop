import { ids2items, items2ids } from '../items/ItemsManager'



// Types

import type Item from '../items/Item'

export interface MechJSON {
  id: string
  name: string
  pack_key: string
  setup: number[]
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
  setup: (Item | null)[]


  constructor (json: Partial<MechJSON> = {}) {

    this.id = json.id || Date.now() + '-' + performance.now()
    this.name = json.name || 'dummy'
    this.packKey = json.pack_key || 'dummy'
    this.setup = json.setup ? ids2items(json.setup) : Array(20).fill(null)

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
