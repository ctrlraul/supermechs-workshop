
// Types

import type { SlotName } from 'src/mechs/Mech'
import type Item from '../../items/Item'

export type SlotConfig = {
  name: SlotName
  type: Item['type']
  rtl?: boolean
}



// Data

export const SLOTS_CONFIG: SlotConfig[] = [
  { name: 'topWeapon1',    type: 'TOP_WEAPON' },
  { name: 'drone',         type: 'DRONE' },
  { name: 'topWeapon2',    type: 'TOP_WEAPON', rtl: true },
  { name: 'sideWeapon3',   type: 'SIDE_WEAPON' },
  { name: 'torso',         type: 'TORSO' },
  { name: 'sideWeapon4',   type: 'SIDE_WEAPON', rtl: true },
  { name: 'sideWeapon1',   type: 'SIDE_WEAPON' },
  { name: 'legs',          type: 'LEGS' },
  { name: 'sideWeapon2',   type: 'SIDE_WEAPON', rtl: true },
  { name: 'chargeEngine',  type: 'CHARGE_ENGINE' },
  { name: 'teleporter',    type: 'TELEPORTER' },
  { name: 'shield',        type: 'SHIELD' },
  { name: 'grapplingHook', type: 'GRAPPLING_HOOK' },
  { name: 'module1',       type: 'MODULE' },
  { name: 'module2',       type: 'MODULE' },
  { name: 'module3',       type: 'MODULE' },
  { name: 'module4',       type: 'MODULE' },
  { name: 'module5',       type: 'MODULE' },
  { name: 'module6',       type: 'MODULE' },
  { name: 'module7',       type: 'MODULE' },
  { name: 'module8',       type: 'MODULE' },
]
