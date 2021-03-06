import * as BattleActionsHandler from './BattleActionsHandler'
import * as BattleEffectsHandler from './BattleEffectsHandler'
import * as BattleAnimations from './BattleAnimations'
import { BattlePlayer, BattlePlayerArgs } from './BattlePlayer'
import { cloneDeep, range } from 'lodash'
import { think } from './BattleAI'
import { setBattle } from '../BattleRenderer'
import Mech from '../mechs/Mech'



// Types

import type { BattleItem } from '../items/ItemsManager'
import type { SlotName } from '../mechs/Mech'

interface BattleArgs {
  online: boolean
  p1: BattlePlayerArgs
  p2: BattlePlayerArgs
  starterID: BattlePlayer['id']
  onUpdate: Battle['onUpdate']
  povPlayerID: BattlePlayer['id']
}

export interface BattleAction {
  name: keyof typeof BattleActionsHandler
  actorID: BattlePlayer['id']
  fromServer?: boolean
  slotName?: SlotName
  position?: number
  droneDamageScale?: number
  damageScale?: number
}

interface BattleCompletion {
  winner: BattlePlayer
  quit: boolean
}

interface BattleLog {
  type: 'info' | 'action' | 'error'
  message: string
  actorID: BattlePlayer['id']
}

type CantFireWeaponReason = (
  'Not enough energy'
  | 'Not enough health'
  | 'Out of uses'
  | 'Already used in this turn'
  | 'Out of range'
  | 'Require jumping'
  | 'Out of retreating range'
)



// Class

export class Battle {

  static readonly MAX_POSITION_INDEX = 9

  p1: BattlePlayer
  p2: BattlePlayer

  attacker: BattlePlayer
  defender: BattlePlayer

  povPlayerID: BattlePlayer['id']

  actionPoints: number = 1
  idle: boolean = true

  online: boolean

  completion: BattleCompletion | null = null
  logs: BattleLog[] = []
  onUpdate: (battle: Battle) => void


  constructor (args: BattleArgs) {

    this.p1 = new BattlePlayer(args.p1)
    this.p2 = new BattlePlayer(args.p2)

    this.attacker = this.p1.id === args.starterID ? this.p1 : this.p2
    this.defender = this.p1.id === args.starterID ? this.p2 : this.p1

    this.povPlayerID = args.povPlayerID

    this.online = args.online

    this.onUpdate = args.onUpdate

    this.pushLog(`Battle Started!`)

    setBattle(this, this.povPlayerID)

    console.log('[Battle] Battle created:', this)

  }



  // Methods

  async pushAction (action: BattleAction) {

    // Sanity Checks

    // Check if the action was made by the turn holder
    if (action.actorID !== this.attacker.id) {

      if (action.actorID === this.defender.id) {
        throw new Error(`${this.defender.name} tried to make an action, but it's their opponent's turn`)
      }

      throw new Error(`No player in battle with ID "${action.actorID}"`)
      
    }

    // Check if has action points left
    if (this.actionPoints === 0) {
      throw new Error(`${this.attacker.name} tried to make an action, but they're out of action points`)
    }

    // Check if battle is already complete
    if (this.completion !== null) {
      throw new Error(`${this.attacker.name} tried to make an action, but the battle is already complete`)
    }


    this.proccessAction(action)

  }


  pushLog (message: string, type: BattleLog['type'] = 'info'): void {

    this.logs.push({
      type,
      message,
      actorID: this.attacker.id,
    })

    this.onUpdate(this)

  }



  // Battle engine functions (To be used by BattleActionsHandler and BattleEffectsHandler)

  /** To be used by BattleActionsHandler and BattleEffectsHandler.
   * Returns the damage dealt.
   */
  dealDamagesAndTakeBackfire (attacker: BattlePlayer, item: BattleItem, damage: number): number {
  
    const defender = this.getOpponentForPlayerID(attacker.id)

    const statElement = item.element.substring(0, 3).toLowerCase()
    const resStatKey = statElement + 'Res' as 'phyRes' | 'expRes' | 'eleRes'
    const resStatDmgKey = resStatKey + 'Dmg' as 'phyResDmg' | 'expResDmg' | 'eleResDmg'
  
  
    /// Effects on attacker
    attacker.stats.health -= item.stats.backfire || 0
    attacker.stats.heat += item.stats.heaCost || 0
    attacker.stats.energy -= item.stats.eneCost || 0
  
  
    /// Effects on defender
  
    defender.stats.health -= damage
    defender.stats.heat += item.stats.heaDmg || 0
    defender.stats[resStatKey] -= item.stats[resStatDmgKey] || 0
  
    // Heat capacity damage
    if (item.stats.heaCapDmg) {
      defender.stats.heaCap = Math.max(1, defender.stats.heaCap - item.stats.heaCapDmg)
    }
  
    // Heat cooling damage
    if (item.stats.heaColDmg) {
      defender.stats.heaCol = Math.max(1, defender.stats.heaCol! - item.stats.heaColDmg)
    }
  
    // energy damage
    if (item.stats.eneDmg) {
      defender.stats.energy = Math.max(0, defender.stats.energy - item.stats.eneDmg || 0)
    }
  
    // energy capacity damage
    if (item.stats.eneCapDmg) {
      defender.stats.eneCap = Math.max(1, defender.stats.eneCap - item.stats.eneCapDmg)
      defender.stats.energy = Math.min(defender.stats.eneCap, defender.stats.energy)
    }
  
    // energy regeneration damage
    if (item.stats.eneRegDmg) {
      defender.stats.eneReg = Math.max(1, defender.stats.eneReg - item.stats.eneRegDmg)
    }
  
    return damage
  }


  /** To be used by BattleActionsHandler and BattleEffectsHandler. */
  countItemUsage (attacker: BattlePlayer, item: BattleItem): void {
    item.timesUsed++
    attacker.itemsAlreadyUsed.push(item)
  }
  
  
  /** To be used by BattleActionsHandler and BattleEffectsHandler. */
  updatePositions (attacker: BattlePlayer, item: BattleItem): void {
  
    const defender = this.getOpponentForPlayerID(attacker.id)
    const dir = this.getPositionalDirection(attacker.id)
  
    // Movements on attacker
  
    if (item.stats.recoil) {
      attacker.position = Math.max(0, Math.min(9, attacker.position - item.stats.recoil * dir));
    }
  
    if (item.stats.retreat) {
      attacker.position -= item.stats.retreat * dir;
    }
  
    if (item.stats.advance) {
      attacker.position = (
        attacker.position * dir + item.stats.advance < defender.position * dir
        ? attacker.position + item.stats.advance * dir
        : defender.position - dir
      );
    }
  
    // Movements on defender
  
    if (item.stats.push) {
      defender.position = Math.max(0, Math.min(9, defender.position + item.stats.push * dir));
    }
  
    if (item.stats.pull) {
      defender.position = (
        defender.position * dir - item.stats.pull > attacker.position * dir
        ? defender.position - item.stats.pull * dir
        : attacker.position + dir
      );
    }
  }



  // Utils

  getPlayerForID (id: BattlePlayer['id']): BattlePlayer {
    
    if (id === this.p1.id) {
      return this.p1
    }

    if (id === this.p2.id) {
      return this.p2
    }

    throw new Error(`No player found with id "${id}"`)

  }

  
  getOpponentForPlayerID (id: BattlePlayer['id']) {

    if (id === this.p1.id) {
      return this.p2
    }

    if (id === this.p2.id) {
      return this.p1
    }

    throw new Error(`No player found with id "${id}", therefore no opponent was found`)

  }


  getUIDirectionForPlayerID (id: BattlePlayer['id']): number {

    if (id === this.p1.id) {
      return 1
    }

    if (id === this.p2.id) {
      return -1
    }

    throw new Error(`No player found with id "${id}"`)

  }


  getPositionalDirection (id: BattlePlayer['id']): number {

    const opponent = this.getOpponentForPlayerID(id)
    const perspective = id === this.attacker.id ? this.attacker : this.defender

    return perspective.position < opponent.position ? 1 : -1

  }


  getWalkablePositions (): number[] {
  
    const { attacker, defender } = this
    
    const legs = attacker.slots.legs!
    const maxDistance = Math.max(legs.stats.walk || 0, legs!.stats.jump || 0)
    const positions = Array(10).fill(false)
  
  
    if (maxDistance) {
      for (let i = 0; i < positions.length; i++) {
  
        positions[i] = (
          i <= attacker.position + maxDistance &&
          i >= attacker.position - maxDistance
        )
  
      }
    }
  
  
    // If can't jump, remove positions beyond the opponent
    if (!legs.stats.jump) {
  
      const distance = Math.abs(attacker.position - defender.position)
      const direction = attacker.position < defender.position ? 1 : -1
  
      for (let i = 0; i < positions.length; i++) {
        positions[i] = positions[i] && (i * direction < attacker.position * direction + distance)
      }
  
    }
  
  
    // Set positions where the players are to inaccessible
    positions[attacker.position] = false
    positions[defender.position] = false
  
  
    return range(Battle.MAX_POSITION_INDEX + 1).filter(position => positions[position])
  
  }


  getTeleportablePositions (): number[] {
    const positions = range(Battle.MAX_POSITION_INDEX + 1);
    const playerPositions = [this.p1.position, this.p2.position];
    return positions.filter(position => !playerPositions.includes(position));
  }


  getPositionsInItemRange (player: BattlePlayer, item: BattleItem, includePositionsOutOfArena = false): number[] {

    // Item has infinite range, so we just return the entire arena
    if (!item.stats.range) {
      return range(Battle.MAX_POSITION_INDEX)
    }

    const dir = this.getPositionalDirection(player.id)
    const positions: number[] = []

    for (let i = item.stats.range[0]; i <= item.stats.range[1]; i++) {
      positions.push(player.position + i * dir)
    }

    if (includePositionsOutOfArena) {
      return positions
    }

    return positions.filter(position => {
      return position >= 0 && position <= Battle.MAX_POSITION_INDEX
    })

  }


  canFireWeapon (item: BattleItem, ignoreReasons: CantFireWeaponReason[] = []): boolean {
  
    const reasons = this.whyCantFireWeapon(item)
      .filter(reason => !ignoreReasons.includes(reason))

    return reasons.length === 0

  }


  getDamageForItemAtSlot (slot: SlotName, damageScale: number): number {

    const item = this.attacker.slots[slot]

    if (item === null) {
      throw new Error(`${this.attacker.name} has no item at slot "${slot}"`)
    }

    if (['TORSO', 'MODULE'].includes(item.type)) {
      throw new Error(`Can't get damage for item of type ${item.type}`)
    }
    
    const statElement = item.element.substring(0, 3).toLowerCase();

    const dmgStatKey = statElement + 'Dmg' as 'phyDmg' | 'expDmg' | 'eleDmg';
    const resStatKey = statElement + 'Res' as 'phyRes' | 'expRes' | 'eleRes';

    const dmgStatValue = item.stats[dmgStatKey];


    /// Damage calculations

    let damage = 0;

    // Base damage
    if (typeof dmgStatValue !== 'undefined') {
      const [dmgStatMin, dmgStatMax] = dmgStatValue;
      damage += dmgStatMin + Math.round(damageScale * (dmgStatMax - dmgStatMin));

      // Apply resistance
      if (this.defender.stats[resStatKey]) {
        damage = Math.max(1, damage - this.defender.stats[resStatKey]!);
      }
    }
    
    // Apply energy break bonus damage
    if (item.stats.eneDmg) {
      damage -= Math.min(0, this.defender.stats.energy - item.stats.eneDmg);
    }

    return damage;

  }


  whyCantFireWeapon (item: BattleItem): CantFireWeaponReason[] {

    const reasons: CantFireWeaponReason[] = []
    const { attacker, defender } = this
  
    if (item.stats.eneCost && item.stats.eneCost > attacker.stats.energy) {
      reasons.push('Not enough energy')
    }
  
    if (item.stats.backfire && item.stats.backfire >= attacker.stats.health) {
      reasons.push('Not enough health')
    }
  
    if (typeof item.stats.uses === 'number' && item.timesUsed >= item.stats.uses) {
      reasons.push('Out of uses')
    }
  
    /* Check if it's an weapon and if already used
     * it, weapons can only be used once per turn. */
    if (attacker.weapons.includes(item) && attacker.itemsAlreadyUsed.includes(item)) {
      reasons.push('Already used in this turn')
    }

    if (typeof item.stats.range !== 'undefined') {
      const positionsInRange = this.getPositionsInItemRange(attacker, item)
      if (!positionsInRange.includes(defender.position)) {
        reasons.push('Out of range')
      }
    }
    
    /* Check if it's not a melee item and requires
     * jumping. Melee items force the mech to jump. */
    if (item.tags.require_jump) {
      if (attacker.slots.legs!.stats.jump === undefined) {
        reasons.push('Require jumping')
      }
    }
  
    // Check if the retreat would put the attacker in an invalid position
    if (typeof item.stats.retreat === 'number') {
      const dir = attacker.position < defender.position ? 1 : -1
      const futurePosition = attacker.position - item.stats.retreat * dir
      if (futurePosition < 0 || futurePosition > Battle.MAX_POSITION_INDEX) {
        reasons.push('Out of retreating range')
      }
    }
  
    return reasons

  }


  /** Get weapons that can be fired */
  getFirableWeapons (ignoreReasons: CantFireWeaponReason[] = []): BattleItem[] {

    return this.attacker.weapons.filter(weapon => {

      const reasons = this.whyCantFireWeapon(weapon)
        .filter(reason => !ignoreReasons.includes(reason))

      if (reasons.length === 0) {
        return true
      }

    }) as BattleItem[]
  
  }



  // Functions

  private proccessAction (action: BattleAction) {

    try {

      if (!this.online || action.fromServer) {

        this.executeAction(action)

        // Spend action point
        this.actionPoints--

        this.onUpdate(this)


        // Handle battle completion
        if (this.hasDeadPlayer()) {

          this.setCompletion(
            this.p1.stats.health < this.p2.stats.health
            ? this.p2
            : this.p1
          )

        } else {

          // It was the last action point, so now we check if the drone should fire
          if (this.actionPoints === 0) {

            const canFireDrone = (
              this.attacker.slots.drone
              && this.attacker.droneActive
              && this.canFireWeapon(this.attacker.slots.drone)
            )

            if (canFireDrone) {

              const droneDamageScale = (
                typeof action.droneDamageScale === 'number'
                ? action.droneDamageScale
                : Math.random()
              )
  
              const damage = this.getDamageForItemAtSlot('drone', droneDamageScale)

              BattleEffectsHandler.fireDrone(this, this.attacker, damage)

              // Drone fired so we have to check if the battle is complete again
              if (this.hasDeadPlayer()) {

                this.setCompletion(
                  this.p1.stats.health < this.p2.stats.health
                  ? this.p2
                  : this.p1
                )

              } else {
                this.passTurn()
              }

            } else {
              this.passTurn()
            }

          } else {
            this.onIdle()
          }

        }

      } else {

        throw new Error(`Online battle but action didn't come from server!`)
  
      }

    } catch (err: any) {

      this.pushLog(err.message, 'error')
      this.onIdle()

    }

  }


  private executeAction (action: BattleAction) {

    const damageScale = action.damageScale || Math.random()
    const oldState = cloneDeep(this)
    const attacker = this.getPlayerForID(action.actorID)

    // Handle action
    switch (action.name) {

      case 'cooldown': {
        
        const amount = BattleActionsHandler.cooldown(this, attacker)
        const newState = cloneDeep(this)

        BattleAnimations.cooldown(newState, attacker, amount)

        break

      }

      
      case 'walk': {

        if (typeof action.position !== 'number'
         || action.position < 0
         || action.position > Battle.MAX_POSITION_INDEX) {
          throw new Error(`Invalid "position" property: ${action.position}`)
        }

        BattleActionsHandler.walk(this, attacker, action.position)

        const newState = cloneDeep(this)

        BattleAnimations.move(oldState, newState, attacker)

        break

      }


      case 'stomp': {

        const damageScale = action.damageScale || Math.random()
        const damage = this.getDamageForItemAtSlot('legs', damageScale)

        BattleActionsHandler.stomp(this, attacker, damage)

        const newState = cloneDeep(this)

        BattleAnimations.stomp(oldState, newState, attacker, damage)

        break

      }


      case 'useWeapon': {

        const slotNames: (keyof BattlePlayer['slots'])[] = [
          'torso',
          'legs',
          'sideWeapon1',
          'sideWeapon2',
          'sideWeapon3',
          'sideWeapon4',
          'topWeapon1',
          'topWeapon2',
          'drone',
          'chargeEngine',
          'teleporter',
          'grapplingHook'
        ]

        if (!action.slotName || !slotNames.includes(action.slotName)) {
          throw new Error(`Invalid "slotName" property: ${action.slotName}`)
        }

        const weapon = attacker.slots[action.slotName]

        if (weapon === null) {
          throw new Error(`${attacker.name} has no item at slot ${action.slotName}`)
        }

        const damage = this.getDamageForItemAtSlot(action.slotName, damageScale)

        BattleActionsHandler.useWeapon(this, attacker, weapon, damage)

        const newState = cloneDeep(this)

        BattleAnimations.useWeapon(oldState, newState, attacker, weapon, damage)

        break

      }


      case 'toggleDrone': {
        BattleActionsHandler.toggleDrone(this)
        BattleAnimations.toggleDrone(attacker)
        break
      }


      case 'charge': {

        const damage = this.getDamageForItemAtSlot('chargeEngine', damageScale)

        BattleActionsHandler.charge(this, attacker, damage)

        const newState = cloneDeep(this)

        BattleAnimations.charge(oldState, newState, attacker, damage)

        break

      }


      case 'teleport': {

        if (typeof action.position !== 'number') {
          throw new Error(`Invalid "position" property: ${action.position}`)
        }

        const damageScale = action.damageScale || Math.random()
        const damageBase = this.getDamageForItemAtSlot('teleporter', damageScale)

        const damageDealt = BattleActionsHandler.teleport(this, damageBase, action.position)

        const newState = cloneDeep(this)

        BattleAnimations.teleport(oldState, newState, attacker, damageDealt)

        break

      }


      case 'hook': {

        const damageScale = action.damageScale || Math.random()
        const damage = this.getDamageForItemAtSlot('grapplingHook', damageScale)

        BattleActionsHandler.hook(this, damage)

        const newState = cloneDeep(this)

        BattleAnimations.hook(oldState, newState, attacker, damage)

        break

      }

      
      default:
        throw new Error(`Unknown action "${action.name}"`)
      
    }

  }


  private hasDeadPlayer (): boolean {
    return this.p1.stats.health <= 0 || this.p2.stats.health <= 0
  }


  private setCompletion (winner: BattlePlayer, quit: boolean = false) {
    this.completion = { winner, quit }
    this.pushLog(`${winner.name} won!`)
    this.onUpdate(this)
    this.actionPoints = 0
  }


  private passTurn () {

    this.actionPoints = 0

    // Regen stats at end of turn
    BattleEffectsHandler.regen(this.attacker)

    // Clear items used
    this.attacker.itemsAlreadyUsed = []

    // Swap attacker and defender
    const temp = this.attacker
    this.attacker = this.defender
    this.defender = temp

    // Check if new attacker was forced to cooldown
    if (this.attacker.stats.heat > this.attacker.stats.heaCap) {

      const double = BattleEffectsHandler.forceCooldown(this, this.attacker)

      if (double) {
        this.passTurn()
      } else {
        this.actionPoints = 1
      }

    } else {

      // Reset action points
      this.actionPoints = 2

    }

    // Update UI or whatever depends on this changing
    this.onUpdate(this)


    this.onIdle()

  }


  private onIdle () {

    if (this.attacker.ai && this.actionPoints > 0) {

      try {

        const action = think(this, this.attacker.id)

        console.log({ action })
  
        this.pushAction(action)

      } catch (err: any) {

        console.log('AI caused an error:', err)

        this.pushLog(`AI caused an error: ${err.message}`)
        this.pushAction({
          actorID: this.attacker.id,
          name: 'cooldown'
        })

      }

    }

  }

}
