import { BattleItem, getBattleItems } from '../items/ItemsManager'
import { getBuffedMechSummary } from '../stats/StatsManager'
import Mech from '../mechs/Mech'



export interface BattlePlayerArgs {

  id: string
  name: string
  mechName: string
  admin?: boolean
  ai?: boolean

  position: number

  setup: number[]

}



export class BattlePlayer {

  // Meta
  id: string
  name: string
  mechName: string
  admin: boolean
  ai: boolean

  // Items
  items: (BattleItem | null)[]
  torso: BattleItem
  legs: BattleItem
  weapons: (BattleItem | null)[]
  drone: BattleItem | null = null
  utils: (BattleItem | null)[]

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

    // Meta

    this.id = args.id
    this.name = args.name
    this.mechName = args.mechName
    this.admin = !!args.admin
    this.ai = !!args.ai


    // Items

    const items = getBattleItems(args.setup)

    this.items = items
    this.torso = items[Mech.TORSO_INDEX]!
    this.legs = items[Mech.LEGS_INDEX]!
    this.weapons = items.slice(Mech.SIDE_1_INDEX, Mech.TOP_2_INDEX + 1)
    this.drone = items[Mech.DRONE_INDEX]
    this.utils = items.slice(Mech.DRONE_INDEX, Mech.HOOK_INDEX + 1)


    // Stats

    const summary = getBuffedMechSummary(args.setup)

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
