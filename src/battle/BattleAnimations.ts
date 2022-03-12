import TWEEN from '@tweenjs/tween.js'
import * as BR from '../BattleRenderer'



// Types

import type { BattleItem } from '../items/ItemsManager'
import { Battle } from './Battle'
import type { BattlePlayer } from './BattlePlayer'



// Consts (Editing durations might fuck up animations, send me a line)

const JUMP_HEIGHT = 70
const STOMP_LEG_RAISE_HEIGHT = 30
const CHARGE_HIT_INSET = 40

const FLIGHT_DURATION = 1000
const JUMP_DURATION = 400
const HIT_DURATION = 200
const COOLDOWN_DURATION = 500
const STOMP_LEG_MOVEMENT_DURATION = 400
const KNOCKBACK_DURATION = 200
const DRONE_TOGGLE_DURATION = 300
const TELEPORTING_DURATION = 400
const HOOK_DURATION = 5000



// Methods

export function jump (oldState: Battle, newState: Battle, attacker: BattlePlayer, povPlayerID: BattlePlayer['id']): void {

  BR.pushAnimation(() => {

    const defender = newState.getOpponentForPlayerID(attacker.id)

    const attackerGfx = BR.getPlayerGfx(attacker.id)
    const newAttackerVisualX = BR.getVisualX(newState.attacker.position)
    const defenderGfx = BR.getPlayerGfx(defender.id)
    const newDefenderVisualX = BR.getVisualX(newState.defender.position)


    // Reset positions before running animation

    attackerGfx.x = BR.getVisualX(oldState.attacker.position)
    attackerGfx.y = 0
  

    // Move horizontally
    new TWEEN.Tween(attackerGfx)
      .to({ x: newAttackerVisualX }, JUMP_DURATION * 2)
      .start()
      .onUpdate(() => {
        const value = attacker.id === povPlayerID ? 1 : -1
        const dir = (attackerGfx.x > newDefenderVisualX ? -value : value)
        attackerGfx.scaleX = 0.2 * dir
        defenderGfx.scaleX = attackerGfx.scaleX * -1
      })

    // Jump
    new TWEEN.Tween(attackerGfx)
      .to({ y: -JUMP_HEIGHT }, JUMP_DURATION)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start()
      .onComplete(() => {

        // Fall
        new TWEEN.Tween(attackerGfx)
          .to({ y: 0 }, JUMP_DURATION)
          .easing(TWEEN.Easing.Quadratic.In)
          .start()
          .onComplete(() => BR.nextAnimation())

      })

  })
  
}



export function cooldown (oldState: Battle, newState: Battle, attacker: BattlePlayer, heat: number): void {

  BR.pushAnimation(() => {

    const attackerGfx = BR.getPlayerGfx(attacker.id)


    // Reset positions before running animation

    attackerGfx.x = BR.getVisualX(newState.attacker.position)
    attackerGfx.y = 0


    // Create animation

    showFlyingDamage(heat, attackerGfx.x)
    
    setTimeout(() => BR.nextAnimation(), COOLDOWN_DURATION)

  })

}



export function stomp (oldState: Battle, newState: Battle, attacker: BattlePlayer, damage: number): void {

  BR.pushAnimation(() => {

    const defender = newState.getOpponentForPlayerID(attacker.id)

    const attackerGfx = BR.getPlayerGfx(attacker.id)
    const defenderGfx = BR.getPlayerGfx(defender.id)
    const newDefenderVisualX = BR.getVisualX(newState.defender.position)


    // Reset positions before running animation

    attackerGfx.x = BR.getVisualX(attacker.position)
    attackerGfx.y = 0
    defenderGfx.x = BR.getVisualX(oldState.defender.position)
    defenderGfx.y = 0


    // Create animation

    const legGfx = attackerGfx.parts[2]!

    const hitDefender = new TWEEN.Tween(defenderGfx)
      .to({ x: newDefenderVisualX }, KNOCKBACK_DURATION)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onComplete(() => BR.nextAnimation())
    
    const lowerLeg = new TWEEN.Tween(legGfx)
      .to({ y: -legGfx.height }, STOMP_LEG_MOVEMENT_DURATION * 0.2)
      .easing(TWEEN.Easing.Quintic.In)
      .chain(hitDefender)
      .onComplete(() => showFlyingDamage(damage, defenderGfx.x))

    // Raise leg
    new TWEEN.Tween(legGfx)
      .to({ y: legGfx.y - STOMP_LEG_RAISE_HEIGHT }, STOMP_LEG_MOVEMENT_DURATION * 0.8)
      .chain(lowerLeg)
      .start()

  })

}



export function useWeapon (oldState: Battle, newState: Battle, attacker: BattlePlayer, weapon: BattleItem, damage: number) {

  BR.pushAnimation(() => {

    const defender = newState.getOpponentForPlayerID(attacker.id)

    const attackerGfx = BR.getPlayerGfx(attacker.id)
    const newAttackerVisualX = BR.getVisualX(newState.attacker.position)
    const defenderGfx = BR.getPlayerGfx(defender.id)
    const newDefenderVisualX = BR.getVisualX(newState.defender.position)


    // Reset positions before running animation

    attackerGfx.x = BR.getVisualX(oldState.attacker.position)
    attackerGfx.y = 0
    defenderGfx.x = BR.getVisualX(oldState.defender.position)
    defenderGfx.y = 0


    // Create animation

    const hitOpponent = new TWEEN.Tween(defenderGfx)
      .to({ x: newDefenderVisualX }, HIT_DURATION)
      .easing(TWEEN.Easing.Quadratic.Out)
    
    

    if ('advance' in weapon.stats || 'retreat' in weapon.stats) {
  
      const fall = new TWEEN.Tween(attackerGfx)
        .to({ y: 0 }, JUMP_DURATION)
        .easing(TWEEN.Easing.Quadratic.In)
        .onComplete(() => BR.nextAnimation())

      // Jump
      new TWEEN.Tween(attackerGfx)
        .to({ y: -JUMP_HEIGHT }, JUMP_DURATION)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start()
  
      // Fly
      new TWEEN.Tween(attackerGfx)
        .to({ x: newAttackerVisualX }, FLIGHT_DURATION)
        .easing(TWEEN.Easing.Sinusoidal.Out)
        .chain(hitOpponent, fall)
        .onComplete(() => showFlyingDamage(damage, defenderGfx.x))
        .start()
  
    } else {

      showFlyingDamage(damage, defenderGfx.x)
  
      // Recoil
      new TWEEN.Tween(attackerGfx)
        .to({ x: newAttackerVisualX }, HIT_DURATION)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => BR.nextAnimation())
        .start()
    
      hitOpponent.start()
  
    }
  
  })

}



export function toggleDrone (attacker: BattlePlayer): void {
  
  BR.pushAnimation(() => {

    const attackerGfx = BR.getPlayerGfx(attacker.id)
    const droneGfx = attackerGfx.parts[9]!
  
    const droneActivePosition = attackerGfx.getActiveDronePosition()
    const droneInactivePosition = attackerGfx.getInactiveDronePosition()

    const from = attacker.droneActive ? droneInactivePosition : droneActivePosition
    const to = attacker.droneActive ? droneActivePosition : droneInactivePosition

    droneGfx.x = from.x
    droneGfx.y = from.y
    droneGfx.opacity = 1

    new TWEEN.Tween(droneGfx)
      .to(to, DRONE_TOGGLE_DURATION)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start()
      .onComplete(() => BR.nextAnimation())

  })

}



export function charge (oldState: Battle, newState: Battle, attacker: BattlePlayer, damage: number): void {

  BR.pushAnimation(() => {

    const defender = newState.getOpponentForPlayerID(attacker.id)

    const attackerGfx = BR.getPlayerGfx(attacker.id)
    const newAttackerVisualX = BR.getVisualX(newState.attacker.position)
    const defenderGfx = BR.getPlayerGfx(defender.id)
    const newDefenderVisualX = BR.getVisualX(newState.defender.position)


    // Reset positions before running animation

    attackerGfx.x = BR.getVisualX(oldState.attacker.position)
    attackerGfx.y = 0
    defenderGfx.x = BR.getVisualX(oldState.defender.position)
    defenderGfx.y = 0


    // Create animation

    const bounceBack = new TWEEN.Tween(attackerGfx)
      .to({ x: newAttackerVisualX }, KNOCKBACK_DURATION)
      .easing(TWEEN.Easing.Quadratic.Out)
    
    const hitOpponent = new TWEEN.Tween(defenderGfx)
      .to({ x: newDefenderVisualX }, KNOCKBACK_DURATION)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onComplete(() => BR.nextAnimation())

    // Charge towards opponent
    new TWEEN.Tween(attackerGfx)
      .to({ x: newAttackerVisualX + CHARGE_HIT_INSET }, 1000)
      .easing(TWEEN.Easing.Quadratic.In)
      .chain(bounceBack, hitOpponent)
      .onComplete(() => showFlyingDamage(damage, defenderGfx.x))
      .start()

  })

}



export function teleport (oldState: Battle, newState: Battle, attacker: BattlePlayer, damage: number, povPlayerID: BattlePlayer['id']): void {

  BR.pushAnimation(() => {

    const defender = newState.getOpponentForPlayerID(attacker.id)

    const attackerGfx = BR.getPlayerGfx(attacker.id)
    const defenderGfx = BR.getPlayerGfx(defender.id)
    const newAttackerVisualX = BR.getVisualX(newState.attacker.position)
    const newDefenderVisualX = BR.getVisualX(newState.defender.position)


    // Reset positions before running animation

    attackerGfx.x = BR.getVisualX(oldState.attacker.position)
    attackerGfx.y = 0
    defenderGfx.x = BR.getVisualX(oldState.defender.position)
    defenderGfx.y = 0


    // Create animation
    
    const appear = new TWEEN.Tween(attackerGfx)
      .to({ opacity: 1 }, TELEPORTING_DURATION * 0.5)
      .easing(TWEEN.Easing.Quadratic.In)
  
    const hitOpponent = new TWEEN.Tween(defenderGfx)
      .to({ x: newDefenderVisualX }, KNOCKBACK_DURATION)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onComplete(() => BR.nextAnimation())
    
    // Disappear
    const disappear = new TWEEN.Tween(attackerGfx)
      .to({ opacity: 0 }, TELEPORTING_DURATION * 0.5)
      .easing(TWEEN.Easing.Quadratic.In)
      .chain(appear, hitOpponent)
      .onComplete(() => {
        const value = attacker.id === povPlayerID ? 1 : -1
        const dir = (newAttackerVisualX > newDefenderVisualX ? -value : value)
        attackerGfx.scaleX = 0.2 * dir
        defenderGfx.scaleX = attackerGfx.scaleX * -1
        attackerGfx.x = newAttackerVisualX
      })
      .start()
    
    if (damage > 0) {
      disappear.onComplete(() => showFlyingDamage(damage, defenderGfx.x))
    }

  })

}



export function hook (oldState: Battle, newState: Battle, attacker: BattlePlayer, damage: number): void {

  BR.pushAnimation(() => {

    const defender = newState.getOpponentForPlayerID(attacker.id)

    const attackerGfx = BR.getPlayerGfx(attacker.id)
    const defenderGfx = BR.getPlayerGfx(defender.id)
    const newDefenderVisualX = BR.getVisualX(newState.defender.position)


    // Reset positions before running animation

    attackerGfx.x = BR.getVisualX(newState.attacker.position)
    attackerGfx.y = 0
    defenderGfx.x = BR.getVisualX(oldState.defender.position)
    defenderGfx.y = 0


    // Create animation

    const distanceScale = Math.abs(attacker.position - defender.position) / Battle.MAX_POSITION_INDEX
          
    new TWEEN.Tween(defenderGfx)
      .to({ x: newDefenderVisualX }, HOOK_DURATION * distanceScale)
      .onComplete(() => BR.nextAnimation())
      .start()
    
    showFlyingDamage(damage, defenderGfx.x)

  })

}



// Utils

function showFlyingDamage (damage: number, x: number) {
  BR.showFlyingText('-' + damage, x, [255, 40, 40])
}
