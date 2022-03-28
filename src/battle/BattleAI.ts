import { Battle, BattleAction } from './Battle'
import { sample } from 'lodash'
import Mech from '../mechs/Mech'



// Methods

export function think (battle: Battle, actorID: string): BattleAction {

  const attacker = battle.getPlayerForID(actorID)
  const defender = battle.getOpponentForPlayerID(actorID)


  // Drone
  if (attacker.drone && !attacker.droneActive) {
    return { actorID, name: 'toggleDrone' }
  }


  { // Weapons
    const usableWeapons = battle.getFirableWeapons()
    const pick = sample(usableWeapons)

    if (pick) {
      return { actorID, name: 'useWeapon', itemIndex: pick.index }
    }
  }


  // Stomp
  {
    const legs = attacker.items[Mech.LEGS_INDEX]
    if (legs !== null) {
      if (battle.canFireWeapon(legs)) {
        return { actorID, name: 'useWeapon', itemIndex: legs.index }
      }
    }
  }


  // Can't stomp or use any weapon, time to
  // check if it can use any weapon by moving

  {
    const weapons = battle.getFirableWeapons(['Out of range'])

    if (weapons.length) {

      const walkablePositions = battle.getWalkablePositions()
      const positionsThatPutOpponentInRange: number[] = []
      const weaponRanges: number[] = []

      for (const weapon of weapons) {
        const range = battle.getItemRange(weapon)
        for (const position of range) {
          
          // Position to move to, to put the opponent in this range position
          const positionToMove = attacker.position - (position - defender.position)

          // Make sure only valid positions are included
          if (position >= 0 && position <= Battle.MAX_POSITION_INDEX) {
            // This actually results in some positions showing up in
            // the array more than once, this serves as a natural bias
            // towards picking positions that put multiple weapons in range
            positionsThatPutOpponentInRange.push(positionToMove)
          }

          // This is used to determine whether it has range 1 or range 2 weapons later
          weaponRanges.push(position)
        }
      }

      const walkablePositionsThatPutOpponentInRange = positionsThatPutOpponentInRange.filter(
        position => walkablePositions.includes(position)
      )

      // Walk to put opponent in range
      if (walkablePositionsThatPutOpponentInRange.length) {
        return {
          actorID,
          name: 'walk',
          position: sample(walkablePositionsThatPutOpponentInRange)
        }
      }


      // Can't walk anywhere that would put some weapon
      // in range, we see if using specials would help

      const hasRange1Weapon = weaponRanges.includes(
        attacker.position + battle.getPositionalDirection(attacker.id)
      )
      

      // Try grappling hook
      if (hasRange1Weapon) {
        const hook = attacker.items[Mech.HOOK_INDEX]
        if (hook && battle.canFireWeapon(hook)) {
          return { actorID, name: 'hook' }
        }
      }

      // Try charge engine
      {
        const charge = attacker.items[Mech.CHARGE_INDEX]

        if (charge && battle.canFireWeapon(charge)) {

          const opponentOnCorner = [0, Battle.MAX_POSITION_INDEX].includes(defender.position)

          const hasRange2Weapon = weaponRanges.includes(
            attacker.position + 2 * battle.getPositionalDirection(attacker.id)
          )
  
          if ((opponentOnCorner && hasRange1Weapon) || (!opponentOnCorner && hasRange2Weapon)) {
            return { actorID, name: 'charge' }
          }
        }
      }

      // Try teleporter
      if (positionsThatPutOpponentInRange.length) {
        const tele = attacker.items[Mech.TELEPORTER_INDEX]

        if (tele && battle.canFireWeapon(tele)) {
          return {
            actorID,
            position: sample(positionsThatPutOpponentInRange),
            name: 'teleport',
          }
        }
      }

    }
  }


  return { actorID, name: 'cooldown' }

}
