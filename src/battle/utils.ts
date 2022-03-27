import type Item from '../items/Item'
import type { BattleItem } from '../items/ItemsManager'
import Mech from '../mechs/Mech'



export function checkSetup (items: (Item | BattleItem | null)[]): void {

  // .filter(Boolean) to remove any falsy value from the array
  const modules = items.slice(12, 20).filter(Boolean) as Item[]
  const resistances: string[] = []
  const weight = (items.filter(Boolean) as Item[])
    .reduce((a, b) => a + (b.stats.weight || 0), 0)

  
  // Missing torso
  if (!items[Mech.TORSO_INDEX]) {
    throw new Error('Missing torso')
  }

  const legs = items[Mech.LEGS_INDEX]

  // No legs
  if (!legs) {

    throw new Error('Missing legs')
  
  } else {

    // Jumping legs with weapons that require jump?

    if (!legs.stats.jump) {

      // .filter(Boolean) to remove any falsy value from the array
      const weapons = items.slice(2, 8).filter(Boolean) as Item[]

      for (const weapon of weapons) {
        if ('advance' in weapon.stats || 'retreat' in weapon.stats) {
          throw new Error(`${weapon.name} requires jumping! The legs you're using can't jump.`)
        }
      }

    }
    
  }


  // Multiple Resistance Modules
  for (const modu of modules) {

    for (const elementPrefix of ['phy', 'exp', 'ele']) {

      const resStatKey = elementPrefix + 'Res'

      if (resStatKey in modu.stats) {

        if (resistances.includes(resStatKey)) {
          throw new Error('Can not use multiple modules with the same resistance type in battle.')
        } else {
          resistances.push(resStatKey)
        }
      }
    }
  }

  // Overweighted
  if (weight > 1015) {
    throw new Error('Too heavy')
  }

}


export function getRandomStartingPositions (): [number, number] {
  const presets: [number, number][] = [[4, 5], [3, 6], [2, 7]]
  return presets[Math.floor(Math.random() * presets.length)]
}
