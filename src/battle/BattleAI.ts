// Maybe we should replace itemHasScopeRange with a "scope" item tag?
// TODO: make useScope it use items like explosive retreat too


import { Battle, BattleAction } from './Battle'
import { sample } from 'lodash'
import { ItemType } from '../items/Item'



// Types

import type { BattlePlayer } from './BattlePlayer'
import type { BattleItem } from '../items/ItemsManager'



// Methods

export function think (battle: Battle, actorID: string): BattleAction {

  const attacker = battle.getPlayerForID(actorID)
  const defender = battle.getOpponentForPlayerID(actorID)

  const thoughts = [
    [useScope, 'useScope'],
    [activateDrone, 'activateDrone'],
    [preventFromShuttingDown, 'preventFromShuttingDown'],
    [useWeapon, 'useWeapon'],
    [smartMotion, 'smartMotion'],
    [dumbMotion, 'dumbMotion'],
  ] as const

  for (const [thought, log] of thoughts) {
    const action = thought(battle, attacker, defender)
    if (action) {
      console.log(log)
      return { ...action, actorID }
    }
  }

  return { name: 'cooldown', actorID }

}



// Thoughts

function preventFromShuttingDown(_battle: Battle, attacker: BattlePlayer, _defender: BattlePlayer): Omit<BattleAction, 'actorID'> | null {

  if (attacker.stats.heaCap - attacker.stats.heat < 50) {
    return { name: 'cooldown' }
  }

  return null

}


function useScope(battle: Battle, attacker: BattlePlayer, defender: BattlePlayer): Omit<BattleAction, 'actorID'> | null {

  const scopes = battle.getFirableWeapons(['Out of range']).filter(weapon => {
    return weapon && itemHasScopeRange(weapon)
  })


  // No scopes at all lol
  if (scopes.length === 0) {
    return null
  }


  // Try to use a scope without moving/teleporting
  {
    const firableScopes = scopes.filter(scope => battle.canFireWeapon(scope))

    if (firableScopes.length) {

      const randomScope = sample(firableScopes)!

      return {
        name: 'useWeapon',
        slotName: randomScope.slotName
      }

    }
  }


  // Not enough turns to move/teleport and use a scope :(
  if (battle.actionPoints < 2) {
    return null
  }


  const positionsThatPutOpponentInRange = getPositionsToPutOpponentInRange(battle, attacker, defender, scopes)

  console.log("positionsThatPutOpponentInRange: ", positionsThatPutOpponentInRange)


  // Can't move anywhere to put opponent in range
  if (positionsThatPutOpponentInRange.length === 0) {
    return null
  }


  // Try to walk to put opponent in scope range
  for (const position of battle.getWalkablePositions()) {
    if (positionsThatPutOpponentInRange.includes(position)) {
      // Walk to position to use scope
      return { name: 'walk', position }
    }
  }


  // Try to use teleport to put opponent in scope range
  if (attacker.slots.teleporter && battle.canFireWeapon(attacker.slots.teleporter)) {
    return {
      name: 'teleport',
      position: sample(positionsThatPutOpponentInRange)!
    }
  }
  

  // Can't use scope :(
  return null

}


function activateDrone(_battle: Battle, attacker: BattlePlayer, _defender: BattlePlayer): Omit<BattleAction, 'actorID'> | null {

  if (attacker.slots.drone && !attacker.droneActive) {
    return { name: 'toggleDrone' }
  }

  return null

}


function useWeapon(battle: Battle, attacker: BattlePlayer, defender: BattlePlayer): Omit<BattleAction, 'actorID'> | null {

  // Try to use a random weapon
  {
    const firableWeapons = battle.getFirableWeapons()

    if (firableWeapons.length) {
      return {
        name: 'useWeapon',
        slotName: sample(firableWeapons)!.slotName
      }
    }
  }


  // Not enough turns to move and use a weapon
  if (battle.actionPoints < 2) {
    return null
  }


  const firableWeaponsOutOfRange = battle.getFirableWeapons(['Out of range'])
  const positionsThatPutOpponentInRange = getPositionsToPutOpponentInRange(battle, attacker, defender, firableWeaponsOutOfRange)


  // Can't move anywhere to put opponent in range
  if (positionsThatPutOpponentInRange.length === 0) {
    return null
  }


  // Try to put opponent in range by walking
  {
    const positionsToWalkTo: number[] = battle.getWalkablePositions().filter(position => {
      return positionsThatPutOpponentInRange.includes(position)
    })

    if (positionsToWalkTo.length) {
      return {
        name: 'walk',
        position: sample(positionsToWalkTo)!
      }
    }
  }


  const weaponRanges: number[] = []
  const cornerPositions = [0, Battle.MAX_POSITION_INDEX]
  const { chargeEngine, grapplingHook, teleporter } = attacker.slots
  const hasRange1Weapon = weaponRanges.includes(
    attacker.position + battle.getPositionalDirection(attacker.id)
  )

  for (const weapon of attacker.weapons) {
    if (weapon) {
      weaponRanges.push(...battle.getPositionsInItemRange(attacker, weapon))
    }
  }


  // Try to put opponent in range by using charge engine
  if (chargeEngine && battle.canFireWeapon(chargeEngine)) {

    const isOpponentInCorner = cornerPositions.includes(defender.position)
    const hasRange2Weapon = weaponRanges.includes(
      attacker.position + 2 * battle.getPositionalDirection(attacker.id)
    )

    if ((isOpponentInCorner && hasRange1Weapon)
     || (!isOpponentInCorner && hasRange2Weapon)) {
      return { name: 'charge' }
    }

  }
  

  // Try to put opponent in range by grappling
  if (hasRange1Weapon && grapplingHook && battle.canFireWeapon(grapplingHook)) {
    return { name: 'hook' }
  }


  // Try to put opponent in range by teleporting
  if (teleporter && battle.canFireWeapon(teleporter)) {
    return {
      name: 'teleport',
      position: sample(positionsThatPutOpponentInRange)!
    }
  }


  // Can't use any weapon, the infamous "combo issue" scenario
  return null

}


/** Tries to move to a position that will let it use weapons in the next turn */
function smartMotion (battle: Battle, attacker: BattlePlayer, defender: BattlePlayer): Omit<BattleAction, 'actorID'> | null {

  const nonScopeFirableWeaponsOutOfRange = battle
    .getFirableWeapons(['Out of range'])
    .filter(weapon => !itemHasScopeRange(weapon))

  const positionsThatPutOpponentInRange = getPositionsToPutOpponentInRange(
    battle,
    attacker,
    defender,
    nonScopeFirableWeaponsOutOfRange
  )


  // Can't move anywhere to put opponent in range
  if (positionsThatPutOpponentInRange.length === 0) {
    return null
  }


  // Try to put opponent in range by walking
  {
    const positionsToWalkTo = battle.getWalkablePositions().filter(position => {
      return positionsThatPutOpponentInRange.includes(position)
    })

    if (positionsToWalkTo.length) {
      return {
        name: 'walk',
        position: sample(positionsToWalkTo)!
      }
    }
  }


  // Proceed to try to put opponent in range by using utils

  const weaponRanges: number[] = []
  const cornerPositions = [0, Battle.MAX_POSITION_INDEX]
  const { chargeEngine, grapplingHook, teleporter } = attacker.slots
  const hasRange1Weapon = weaponRanges.includes(
    attacker.position + battle.getPositionalDirection(attacker.id)
  )

  for (const weapon of attacker.weapons) {
    if (weapon) {
      // Yes, this adds some positions multiple times if weapon ranges overlap,
      // but this isn't bad, as it serves as a natural bias towards teleporting
      // to positions that place the opponent in range of multiple weapons.
      weaponRanges.push(...battle.getPositionsInItemRange(attacker, weapon))
    }
  }


  // Try to put opponent in range by using charge engine
  if (chargeEngine && battle.canFireWeapon(chargeEngine)) {

    const isOpponentInCorner = cornerPositions.includes(defender.position)
    const hasRange2Weapon = weaponRanges.includes(
      attacker.position + 2 * battle.getPositionalDirection(attacker.id)
    )

    if ((isOpponentInCorner && hasRange1Weapon)
     || (!isOpponentInCorner && hasRange2Weapon)) {
      return { name: 'charge' }
    }

  }
  

  // Try to put opponent in range by grappling
  if (hasRange1Weapon && grapplingHook && battle.canFireWeapon(grapplingHook)) {
    return { name: 'hook' }
  }


  // Try to put opponent in range by teleporting
  if (teleporter && battle.canFireWeapon(teleporter)) {
    return {
      name: 'teleport',
      position: sample(positionsThatPutOpponentInRange)!
    }
  }


  return null

}


/** Walk to a random position or use a random util */
function dumbMotion (battle: Battle, attacker: BattlePlayer, defender: BattlePlayer): Omit<BattleAction, 'actorID'> | null {

  // Try to use a random util
  {
    const utils = [...attacker.utils]

    while (utils.length) {
      
      const index = Math.floor(Math.random() * utils.length)
      const util = utils.splice(index, 1)[0]

      if (!util || ItemType.DRONE || !battle.canFireWeapon(util)) {
        continue
      }

      switch (util.type) {
      
        case ItemType.CHARGE_ENGINE:
          return {
            name: 'charge',
          }

        case ItemType.TELEPORTER:
          return {
            name: 'teleport',
            position: sample(battle.getTeleportablePositions())!
          }

        case ItemType.GRAPPLING_HOOK:
          return {
            name: 'hook',
          }

      }
    
    }
  }


  // Try to walk to a random position
  {
    const walkablePositions = battle.getWalkablePositions()

    if (walkablePositions.length) {
      return {
        name: 'walk',
        position: sample(walkablePositions)!
      }
    }
  }


  // Mf can't even make dumb moves, going to have to cooldown lmao
  return null

}



// Utils

function itemHasScopeRange (item: BattleItem): boolean {
  return !!(item.stats.range && item.stats.range[0] > 6)
}


function getPositionsToPutOpponentInRange (battle: Battle, attacker: BattlePlayer, defender: BattlePlayer, weapons: BattleItem[]): number[] {

  const positionsThatPutOpponentInRange: number[] = []

  for (const weapon of weapons) {

    const positionsInItemRange = battle.getPositionsInItemRange(attacker, weapon, true)

    for (const position of positionsInItemRange) {
      
      // Position to move to, to put the opponent in this range position
      const positionToMove = attacker.position - (position - defender.position)

      // Make sure only valid positions are included
      if (positionToMove >= 0 && positionToMove <= Battle.MAX_POSITION_INDEX) {
        // This actually results in some positions showing up in
        // the array more than once, this serves as a natural bias
        // towards picking positions that put multiple weapons in range
        positionsThatPutOpponentInRange.push(positionToMove)
      }

    }
  }

  return positionsThatPutOpponentInRange

}
