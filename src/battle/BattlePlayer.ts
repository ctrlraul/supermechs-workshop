import { BattleItem, getBattleItem } from '../items/ItemsManager'



// types

import type { SlotName } from '../mechs/Mech'
import type Mech from '../mechs/Mech';


export interface BattlePlayerArgs {

  id: string
  name: string
  mech: Mech
  admin?: boolean
  ai?: boolean

  position: number

}



export class BattlePlayer {

  private static WEAPON_SLOT_NAMES: SlotName[] = [
    'sideWeapon1', 'sideWeapon2', 'sideWeapon3',
    'sideWeapon4', 'topWeapon1', 'topWeapon2'
  ];

  private static UTILS_SLOT_NAMES: SlotName[] = [
    'drone', 'chargeEngine', 'teleporter', 'grapplingHook',
  ];

  private static MODULE_SLOT_NAMES: SlotName[] = [
    'module1', 'module2', 'module3', 'module4',
    'module5', 'module6', 'module7', 'module8'
  ];

  private static readonly SLOT_NAMES: SlotName[] = [
    'torso', 'legs',
    ...this.WEAPON_SLOT_NAMES,
    ...this.UTILS_SLOT_NAMES,
    ...this.MODULE_SLOT_NAMES
  ];

  public static getDummyStats(): BattlePlayer['stats'] {
    return {
      eleRes: 100,
      eneCap: 600,
      eneReg: 300,
      energy: 450,
      expRes: 100,
      heaCap: 600,
      heaCol: 300,
      health: 2000,
      healthCap: 3000,
      heat: 200,
      phyRes: 100
    }
  }


  // Meta
  id: string
  name: string
  mechName: string
  admin: boolean
  ai: boolean

  // Items
  public readonly weapons: BattleItem[] = [];
  public readonly utils: BattleItem[] = [];
  public readonly modules: BattleItem[] = [];
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


    // Meta

    this.id = args.id
    this.name = args.name
    this.mechName = args.mech.name
    this.admin = !!args.admin
    this.ai = !!args.ai


    // Set slots
    {
      const entries = BattlePlayer.SLOT_NAMES.map(name => {
        const item = mech.slots[name];
        return [name, item ? getBattleItem(item, name) : null];
      })

      this.slots = Object.fromEntries(entries) as BattlePlayer['slots']
    }


    for (const slotName of BattlePlayer.WEAPON_SLOT_NAMES) {
      if (this.slots[slotName]) {
        this.weapons.push(this.slots[slotName]!);
      }
    }

    for (const slotName of BattlePlayer.UTILS_SLOT_NAMES) {
      if (this.slots[slotName]) {
        this.utils.push(this.slots[slotName]!);
      }
    }

    for (const slotName of BattlePlayer.MODULE_SLOT_NAMES) {
      if (this.slots[slotName]) {
        this.modules.push(this.slots[slotName]!);
      }
    }


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
