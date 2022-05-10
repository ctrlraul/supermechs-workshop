import { BattleItem, getBattleItem } from '../items/ItemsManager'



// types

import type Mech from '../mechs/Mech'
import type { SlotName } from '../mechs/Mech'


export interface BattlePlayerArgs {

  id: string
  name: string
  mech: Mech
  admin?: boolean
  ai?: boolean

  position: number

}



export class BattlePlayer {

  // Meta
  id: string
  name: string
  mechName: string
  admin: boolean
  ai: boolean

  // Items
  weapons: (BattleItem | null)[]
  utils: (BattleItem | null)[]
  modules: (BattleItem | null)[]
  slots: Record<SlotName, BattleItem | null>

  // Stats
  position: number
  droneActive: boolean = false
  itemsAlreadyUsed: BattleItem[] = []
  stats: {
    healthCap: number,
    health: number,
    eneCap: number,
    eneReg: number,
    energy: number,
    heaCap: number,
    heaCol: number,
    heat: number,
    phyRes: number,
    expRes: number,
    eleRes: number,
  }


  constructor (args: BattlePlayerArgs) {

    const { mech } = args

    if (!mech.slots.torso || !mech.slots.legs) {
      throw new Error(`Torso and legs are necessary to battle`)
    }


    // Meta

    this.id = args.id
    this.name = args.name
    this.mechName = args.mech.name
    this.admin = !!args.admin
    this.ai = !!args.ai


    // Set slots
    {

      const slotNames: SlotName[] = [
        'torso',       'legs',         'sideWeapon1', 'sideWeapon2',
        'sideWeapon3', 'sideWeapon4',  'topWeapon1',  'topWeapon2',
        'drone',       'chargeEngine', 'teleporter',  'grapplingHook',
        'module1',     'module2',      'module3',     'module4',
        'module5',     'module6',      'module7',     'module8'
      ]

      const entries = slotNames.map(name => {
        const item  = mech.slots[name]
        return [name, item ? getBattleItem(item, name) : null] as const
      })

      this.slots = Object.fromEntries(entries) as BattlePlayer['slots']

    }

    this.weapons = [
      this.slots.sideWeapon1,
      this.slots.sideWeapon2,
      this.slots.sideWeapon3,
      this.slots.sideWeapon4,
      this.slots.topWeapon1,
      this.slots.topWeapon2,
    ]

    this.utils = [
      this.slots.drone,
      this.slots.chargeEngine,
      this.slots.teleporter,
      this.slots.grapplingHook,
    ]

    this.modules = [
      this.slots.module1,
      this.slots.module2,
      this.slots.module3,
      this.slots.module4,
      this.slots.module5,
      this.slots.module6,
      this.slots.module7,
      this.slots.module8,
    ]


    // Stats

    const summary = mech.getSummary(true)

    this.position = args.position

    this.stats = {

      healthCap: summary.health!,
      health: summary.health!,

      energy: summary.eneCap!,
      eneCap: summary.eneCap!,
      eneReg: summary.eneReg!,

      heat: 0,
      heaCap: summary.heaCap!,
      heaCol: summary.heaCol!,

      phyRes: summary.phyRes!,
      expRes: summary.expRes!,
      eleRes: summary.eleRes!

    }

  }

}
