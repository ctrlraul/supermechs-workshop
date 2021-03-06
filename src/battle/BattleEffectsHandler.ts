import * as BattleAnimations from './BattleAnimations'
import { cloneDeep } from 'lodash'
import { getPlayerGfx } from '../BattleRenderer'



// Types

import type { Battle } from './Battle'
import type { BattlePlayer } from './BattlePlayer'



// Methods

export function fireDrone (battle: Battle, attacker: BattlePlayer, damage: number): void {

  const { drone } = attacker.slots

  if (drone === null) {
    throw new Error(`Failed to fire drone: ${attacker.name} does not have a drone equipped`)
  }

  const oldState = cloneDeep(battle)

  battle.dealDamagesAndTakeBackfire(attacker, drone, damage)
  battle.updatePositions(attacker, drone)
  battle.countItemUsage(attacker, drone)

  if (drone.stats.uses && drone.timesUsed === drone.stats.uses) {
    // Uses are refilled when the drone is
    // toggled on, so no need to do it here
    attacker.droneActive = false
  }

  battle.pushLog(`*${attacker.name}*'s *${drone.name}* fired! (${damage} damage)`)

  const newState = cloneDeep(battle)

  BattleAnimations.useWeapon(oldState, newState, attacker, drone, damage)

}


/**
 * Force player to cooldown or shutdown
 * @returns whether it was a cooldown or shutdown
 */
export function forceCooldown (battle: Battle, player: BattlePlayer): boolean {

  const double = player.stats.heat - player.stats.heaCol! > player.stats.heaCap;
  const amount = player.stats.heaCol! * (double ? 2 : 1)

  player.stats.heat = Math.max(0, player.stats.heat - amount)

  const newState = cloneDeep(battle)

  battle.pushLog(`*${player.name}* was forced to *${double ? 'double' : ''} cooldown* (-${amount} heat)`)

  BattleAnimations.cooldown(newState, player, amount)

  return double
  
}


export function regen (player: BattlePlayer): void {

  player.stats.energy = Math.min(
    player.stats.eneCap,
    player.stats.energy + player.stats.eneReg
  )

  for (const mod of player.modules) {

    if (mod && "healthReg" in mod.stats) {
      // @ts-ignore
      this.attacker.stats.health += mod.stats.healthReg
    }

    player.stats.health = Math.min(
      player.stats.healthCap,
      player.stats.health
    )

  }

  getPlayerGfx(player.id).updateStats()

}


export function regenEnergy (player: BattlePlayer): void {

  player.stats.energy = Math.min(
    player.stats.eneCap,
    player.stats.energy + player.stats.eneReg
  )

  getPlayerGfx(player.id).updateStats()

}
