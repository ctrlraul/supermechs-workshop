import type Item from '../../items/Item'

export default {

  parts: [
    { type: 'TORSO',       grid: 'torso' },
    { type: 'LEGS',        grid: 'legs' },
    { type: 'SIDE_WEAPON', grid: 'side-3' },
    { type: 'SIDE_WEAPON', grid: 'side-4', rtl: true },
    { type: 'SIDE_WEAPON', grid: 'side-1' },
    { type: 'SIDE_WEAPON', grid: 'side-2', rtl: true },
    { type: 'TOP_WEAPON',  grid: 'top-1' },
    { type: 'TOP_WEAPON',  grid: 'top-2',  rtl: true },
    { type: 'DRONE',       grid: 'drone' },
  ],

  utils: [
    { type: 'CHARGE_ENGINE' },
    { type: 'TELEPORTER' },
    { type: 'GRAPPLING_HOOK' },
  ],

} as {

  parts: {
    type: Item['type']
    grid: string
    rtl?: boolean
  }[]

  utils: {
    type: Item['type']
  }[]

}
