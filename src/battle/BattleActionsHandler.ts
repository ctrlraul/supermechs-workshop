import type { BattleItem } from 'src/items/ItemsManager'
import Mech from '../mechs/Mech'
import type { Battle } from './Battle'
import type { BattlePlayer } from './BattlePlayer'



export function useWeapon (battle: Battle, attacker: BattlePlayer, weapon: BattleItem, damage: number): void {

  battle.dealDamagesAndTakeBackfire(weapon, damage)
  battle.updatePositions(weapon)
  battle.countItemUsage(weapon)

  battle.pushLog(`*${attacker.name}* used *${weapon.name}*! (${damage} damage)`, 'action')

}


/**
 * @returns The amount of heat cooled
*/
export function cooldown (battle: Battle, attacker: BattlePlayer): number {

  const previousHeat = attacker.stats.heat
  
  attacker.stats.heat = Math.max(0, attacker.stats.heat - attacker.stats.heaCol!)

  battle.pushLog(`*${attacker.name} cooled down* (${previousHeat - attacker.stats.heat} heat)`, 'action')

  return previousHeat - attacker.stats.heat

}


export function walk (battle: Battle, attacker: BattlePlayer, position: number): void {

  const previousPosition  = attacker.position
  
  attacker.position = position

  battle.pushLog(`*${attacker.name}*'s moved from position *${previousPosition}* to position *${attacker.position}*`, 'action')

}


export function stomp (battle: Battle, damage: number): void {

  const legs = battle.attacker.legs

  battle.dealDamagesAndTakeBackfire(legs, damage)
  battle.updatePositions(legs)
  battle.countItemUsage(legs)

  battle.pushLog(`*${battle.attacker.name}* *stomped*! (${damage} damage)`, 'action')

}


export function toggleDrone (battle: Battle): void {

  if (battle.attacker.drone === null) {
    const message = `${battle.attacker.name} tried to toggle drone, but didn't equip one`
    battle.pushLog(message, 'error')
    throw new Error(message)
  }


  battle.attacker.droneActive = !battle.attacker.droneActive
  
  // Refill uses
  if (battle.attacker.droneActive && battle.attacker.drone.stats.uses) {
    battle.attacker.drone.timesUsed = 0
  }

  battle.pushLog(`*${battle.attacker.name}* ${battle.attacker.droneActive ? 'enabled' : 'disabled'} the drone`, 'action')

}


export function charge (battle: Battle, attacker: BattlePlayer, damage: number): void {

  const charge = attacker.items[Mech.CHARGE_INDEX]

  if (charge === null) {
    const message = `${battle.attacker.name} tried to use charge engine, but didn't equip one`
    battle.pushLog(message, 'error')
    throw new Error(message)
  }

  const defender = battle.getOpponentForPlayerID(attacker.id)
  const dir = battle.getPositionalDirection(attacker.id)

  attacker.position = defender.position - dir

  battle.dealDamagesAndTakeBackfire(charge, damage)
  battle.countItemUsage(charge)
  battle.updatePositions(charge)

  battle.pushLog(`*${attacker.name}* used *${charge.name}*! (${damage} damage)`, 'action')

}


export function hook (battle: Battle, damage: number): void {

  const { attacker, defender } = battle

  const hook = attacker.items[Mech.HOOK_INDEX]

  if (hook === null) {
    const message = `${battle.attacker.name} tried to use grappling hook, but didn't equip one`
    battle.pushLog(message, 'error')
    throw new Error(message)
  }

  battle.dealDamagesAndTakeBackfire(hook, damage)
  battle.countItemUsage(hook)


  // We manually update the positions here

  const dir = battle.getPositionalDirection(attacker.id)

  defender.position = attacker.position + dir


  battle.pushLog(`*${attacker.name}* used *${hook.name}*! (${damage} damage)`)

}


export function teleport (battle: Battle, damage: number, position: number): void {

  const { attacker, defender } = battle

  const tele = attacker.items[Mech.TELEPORTER_INDEX]
  const previousPosition = attacker.position

  if (tele === null) {
    const message = `${battle.attacker.name} tried to use teleporter, but didn't equip one`
    battle.pushLog(message, 'error')
    throw new Error(message)
  }
  
  // Only deals damage if teleported to opponent's side
  const teleportedToOpponentSide = Math.abs(position - defender.position) === 1

  if (teleportedToOpponentSide) {
    battle.dealDamagesAndTakeBackfire(tele,
      teleportedToOpponentSide ? damage : 0
    )
  }
  
  battle.countItemUsage(tele)

  // We update the position of the attacker manually
  // here but still call battle.updatePositions ase it's
  // a teleporter with knockback or something (lol)
  attacker.position = position
  battle.updatePositions(tele)


  battle.pushLog(`*${attacker.name} teleported* from position *${previousPosition}* to position *${attacker.position}* (${damage} damage)`, 'action')

}
