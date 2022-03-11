import { Battle, BattleAnimation } from '../battle/Battle'
import { CanvasEngine, CanvasImage, CanvasObject } from '../CanvasRenderer'
import { ids2items, items2ids } from '../items/ItemsManager'
import Mech from '../mechs/Mech'
import { itemsPackData } from '../stores'
import TWEEN from '@tweenjs/tween.js'



// Types

import type Item from '../items/Item'
import type { AttachmentPoint, TorsoAttachment } from '../items/Item'
import type { BattlePlayer } from '../battle/BattlePlayer'

type PartName = 'torso' | 'leg1' | 'leg2' | 'side1' | 'side2' | 'side3' | 'side4' | 'top1' | 'top2' | 'drone'



// Classes

class CanvasMech extends CanvasObject {

  player!: BattlePlayer
  parts: (CanvasMechPart | null)[] = []


  constructor (player: BattlePlayer) {

    super()

    this.player = player
    this.scaleX = 0.2
    this.scaleY = 0.2

  }


  override render (ctx: CanvasRenderingContext2D) {
    this.renderChildren(ctx)
    // ctx.beginPath()
    // ctx.strokeStyle = '#00ff00'
    // ctx.lineWidth = 2
    // ctx.moveTo(this.globalX, this.globalY - 5)
    // ctx.lineTo(this.globalX, this.globalY + 5)
    // ctx.moveTo(this.globalX - 5, this.globalY)
    // ctx.lineTo(this.globalX + 5, this.globalY)
    // ctx.stroke()
    // ctx.closePath()
  }


  init (): void {

    const items = ids2items(items2ids(this.player.items))

    if (items[Mech.TORSO_INDEX] === null) {
      throw new Error('Torso required')
    }

    this.parts = this.createParts(items)

    const sortedParts = 
      // Copy so we don't mutate the old array, just good practice IMO.
      Array.from(this.parts)
      // Remove null(s)
      .filter(Boolean)
      // Sort by Z index, so they show in correct order
      .sort((a, b) => a!.zIndex - b!.zIndex) as CanvasMechPart[]

    this.addChild(...sortedParts)

    this.adjust()

  }


  adjust (): void {
    this.x = this.getVisualPositionX()
    this.y = this.root.height - 10
    this.attachParts(this.parts)
  }


  private createParts (setup: Mech['setup']): (CanvasMechPart | null)[] {

    // Slice to keep only the items we will use
    const items = setup.slice(0, Mech.DRONE_INDEX + 1)
  
    // Add second leg
    items.splice(1, 0, items[1])
    
    // Positioning configuraion
    const names: PartName[] = ['torso', 'leg1', 'leg2', 'side1', 'side2', 'side3', 'side4', 'top1', 'top2', 'drone']
    const zIndexes = [5, 6, 4, 8, 1, 9, 2, 7, 3, 0]
  
    // Dew it
    return items.map((item, i) => {
      return item ? new CanvasMechPart(names[i], item, zIndexes[i]) : null
    })
  
  }
  

  private attachParts (parts: (CanvasMechPart | null)[]): void {

    // These are attached "manually" first 
    const skipAttaching: PartName[] = ['torso', 'leg1', 'drone']
  
    const torso = parts[0]!
    const leg1 = parts[1]
    const drone = parts[9]
    const torsoAttachment = torso.item.attachment as TorsoAttachment
  
    // If no legs, just place the torso on the bottom center
    if (leg1 === null) {
  
      torso.x = torso.item.width * -0.5
      torso.y = -torso.item.height
  
    } else {
  
      const leg1Attachment = leg1.item.attachment as AttachmentPoint
      
      leg1.x = (-leg1.item.width - (torsoAttachment!.leg2.x - torsoAttachment.leg1.x)) * 0.5
      leg1.y =  -leg1.item.height
  
      torso.x = leg1.x + leg1Attachment.x - torsoAttachment.leg1.x;
      torso.y = leg1.y + leg1Attachment.y - torsoAttachment.leg1.y;
  
    }
  
    // If has drone, set drone position. We
    // don't use attachment points for that
    if (drone !== null) {
      const position = this.player.droneActive ? this.getActiveDronePosition() : this.getInactiveDronePosition()
      Object.assign(drone, position)
      drone.opacity = Number(this.player.droneActive)
    }
  
    // Attach the other parts
    for (let i = 0; i < parts.length; i++) {
  
      const part = parts[i]
  
      if (part !== null && !skipAttaching.includes(part.partName)) {
        const partAttachment = part.item.attachment as AttachmentPoint
        const partName = part.partName as keyof TorsoAttachment
        part.x = torso.x + torsoAttachment[partName].x - partAttachment.x
        part.y = torso.y + torsoAttachment[partName].y - partAttachment.y
      }
  
    }
  
  }

  getVisualPositionX () {
    return (5 + this.player.position / Battle.MAX_POSITION_INDEX * 90) / 100 * this.root.width
  }

  getActiveDronePosition () {

    const torso = this.parts[0]!
    const drone = this.parts[9]!

    return {
      x: torso.x - drone.width - 20,
      y: torso.y - drone.item.height - 30
    }

  }

  getInactiveDronePosition () {

    const torso = this.parts[0]!
    const drone = this.parts[9]!

    return {
      x: torso.x + (torso.width - drone.width) * 0.5,
      y: torso.y + (torso.height - drone.height) * 0.5,
    }

  }

}


class CanvasMechPart extends CanvasObject {

  partName: PartName
  item: Item
  zIndex: number

  constructor (partName: PartName, item: Item, zIndex: number) {

    super()

    this.partName = partName
    this.item = item
    this.zIndex = zIndex

    this.width = item.image.width
    this.height = item.image.height

    this.setImage(spritesSheet, item.image)

  }

}


class CanvasBattleEngine extends CanvasEngine {

  pov!: any
  mech1!: CanvasMech
  mech2!: CanvasMech
  animationsStack: BattleAnimation[] = []


  override render (ctx: CanvasRenderingContext2D, time: number): void {
    TWEEN.update(time)
    super.render(ctx, time)
  }


  setBattle (battle: Battle, povPlayerID: BattlePlayer['id']): void {

    this.pov = povPlayerID

    this.mech1 = new CanvasMech(battle.p1)
    this.mech2 = new CanvasMech(battle.p2)

    this.root.addChild(this.mech1, this.mech2)

    this.mech1.init()
    this.mech2.init()

    const dir = this.mech1.player.position > this.mech2.player.position ? -1 : 1

    this.mech1.scaleX = 0.2 * dir
    this.mech2.scaleX = this.mech1.scaleX * -1

  }


  private playAnimation (animation: BattleAnimation): void {

    const mechJumpHeight = 70
    const stompLegRaiseHeight = 20
    const knockbackDuration = 200
    const jumpDuration = 400

    const attacker = animation.playerID === this.mech1.player.id ? this.mech1 : this.mech2
    const defender = animation.playerID === this.mech1.player.id ? this.mech2 : this.mech1
    const attackerVisualPositionX = attacker.getVisualPositionX()
    const defenderVisualPositionX = defender.getVisualPositionX()


    try {

      switch (animation.name) {

        case 'cooldown': {
          this.nextAnimation()
          break
        }


        case 'move': {
  
          const attackerVisualPositionX = attacker.getVisualPositionX()
          const defenderVisualPositionX = defender.getVisualPositionX()
  
          // Move horizontally
          new TWEEN.Tween(attacker)
            .to({ x: attackerVisualPositionX }, jumpDuration * 2)
            .start()
            .onUpdate(() => {
              const value = attacker.player.id === this.pov ? 1 : -1
              const dir = (attacker.x > defenderVisualPositionX ? -value : value)
              this.mech1.scaleX = 0.2 * dir
              this.mech2.scaleX = this.mech1.scaleX * -1
            })
          
          // Jump
          new TWEEN.Tween(attacker)
            .to({ y: attacker.y - mechJumpHeight }, jumpDuration)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start()
            .onComplete(() => {
  
              // Fall
              new TWEEN.Tween(attacker)
                .to({ y: attacker.y + mechJumpHeight }, jumpDuration)
                .easing(TWEEN.Easing.Quadratic.In)
                .start()
                .onComplete(() => this.nextAnimation())
  
            })
          
          break
        }


        case 'stomp': {
  
          const leg = attacker.parts[2]!
  
          // Raise leg
          new TWEEN.Tween(leg)
            .to({ y: leg.y - stompLegRaiseHeight }, 500)
            .start()
            .onComplete(() => {
  
              // Lower leg
              new TWEEN.Tween(leg)
                .to({ y: leg.y + stompLegRaiseHeight }, 200)
                .easing(TWEEN.Easing.Quintic.In)
                .start()
                .onComplete(() => {
  
                  // Push defender
                  if (defender.x !== defenderVisualPositionX) {
                    new TWEEN.Tween(defender)
                      .to({ x: defenderVisualPositionX }, knockbackDuration)
                      .easing(TWEEN.Easing.Quadratic.Out)
                      .start()
                      .onComplete(() => this.nextAnimation())
                  }
  
                })
              
            })
  
          break
  
        }
  
  
        case 'useWeapon': {
  
          const weapon = attacker.player.items[animation.weaponIndex!]!
  
          if ('advance' in weapon.stats || 'retreat' in weapon.stats) {

            // Jump
            new TWEEN.Tween(attacker)
              .to({ y: attacker.y - mechJumpHeight }, jumpDuration)
              .easing(TWEEN.Easing.Quadratic.Out)
              .start()

            // Move horizontaly
            new TWEEN.Tween(attacker)
              .to({ x: attackerVisualPositionX }, 1000)
              .easing(TWEEN.Easing.Sinusoidal.Out)
              .start()
              .onComplete(() => {

                new TWEEN.Tween(defender)
                  .to({ x: defenderVisualPositionX }, knockbackDuration)
                  .easing(TWEEN.Easing.Quadratic.Out)
                  .start()
    
                new TWEEN.Tween(attacker)
                  .to({ y: attacker.y + mechJumpHeight }, jumpDuration)
                  .easing(TWEEN.Easing.Quadratic.In)
                  .start()
                  .onComplete(() => this.nextAnimation())

              })
  
          } else {
  
            new TWEEN.Tween(attacker)
              .to({ x: attackerVisualPositionX }, knockbackDuration)
              .easing(TWEEN.Easing.Quadratic.Out)
              .start()

            new TWEEN.Tween(defender)
              .to({ x: defenderVisualPositionX }, knockbackDuration)
              .easing(TWEEN.Easing.Quadratic.Out)
              .start()
              .onComplete(() => this.nextAnimation())
  
          }
          
          break
        }
        
  
        case 'toggleDrone': {
  
          const drone = attacker.parts[9]!
  
          const droneActivePosition = attacker.getActiveDronePosition()
          const droneInactivePosition = attacker.getInactiveDronePosition()
  
          const from = attacker.player.droneActive ? droneInactivePosition : droneActivePosition
          const to = attacker.player.droneActive ? droneActivePosition : droneInactivePosition
  
          Object.assign(drone, from)
  
          drone.opacity = 1
  
          new TWEEN.Tween(drone)
            .to(to, 300)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start()
            .onComplete(() => this.nextAnimation())
  
          break
  
        }
  
  
        case 'charge': {
  
          const chargeHitInset = 50
  
          // Charge towards opponent
          new TWEEN.Tween(attacker)
            .to({ x: attackerVisualPositionX + chargeHitInset }, 1000)
            .easing(TWEEN.Easing.Quadratic.In)
            .start()
            .onComplete(() => {
  
              // Bounce back
              new TWEEN.Tween(attacker)
                .to({ x: attackerVisualPositionX }, knockbackDuration)
                .easing(TWEEN.Easing.Quadratic.Out)
                .start()
              
              // Push defender
              if (defender.x !== defenderVisualPositionX) {
                new TWEEN.Tween(defender)
                  .to({ x: defenderVisualPositionX }, knockbackDuration)
                  .easing(TWEEN.Easing.Quadratic.Out)
                  .start()
                  .onComplete(() => this.nextAnimation())
              }
  
            })
  
          break
        }
  
  
        case 'teleport': {
  
          // Disappear
          new TWEEN.Tween(attacker)
            .to({ opacity: 0 }, 200)
            .easing(TWEEN.Easing.Quadratic.In)
            .start()
            .onComplete(() => {
  
              attacker.x = attackerVisualPositionX
  
              // Appear
              new TWEEN.Tween(attacker)
                .to({ opacity: 1 }, 200)
                .easing(TWEEN.Easing.Quadratic.In)
                .start()
                .onComplete(() => this.nextAnimation())
            
            })
  
          break
        }
  
  
        case 'hook': {

          const distance = Math.abs(this.mech1.player.position - this.mech2.player.position)
          
          new TWEEN.Tween(defender)
            .to({ x: defenderVisualPositionX }, distance / Battle.MAX_POSITION_INDEX * 5000)
            .start()
            .onComplete(() => this.nextAnimation())
          
          break
        }
  
        
        default:
          console.warn('Unhandled animation:', animation)
          attacker.adjust()
          defender.adjust()
          this.nextAnimation()
          break
  
      }

    } catch (err: any) {

      console.error('Failed to execute animation:', animation, err)

    }

  }


  pushAnimation (animation: BattleAnimation): void {

    this.animationsStack.push(animation)

    if (this.animationsStack.length === 1) {
      this.playAnimation(animation)
    }

  }


  private nextAnimation (): void {

    this.animationsStack.shift()

    if (this.animationsStack.length) {

      this.playAnimation(this.animationsStack[0])

    } else {

      // Take the moment to snap the mechs to their correct position just in case

      this.mech1.adjust()
      this.mech2.adjust()

    }

  }

}



// Data

const engine = new CanvasBattleEngine()
let spritesSheet: CanvasImage = new CanvasImage('https://dummyimage.com/360x360/ff00ff/fff')

itemsPackData.subscribe(value => {
  if (value) {
    spritesSheet = new CanvasImage({ image: value.spritesSheet })
  }
})



// Functions

export function setCanvas (canvas: HTMLCanvasElement) {

  console.log("Setting canvas")

  engine.setCanvas(canvas)
  engine.root.width = canvas.width
  engine.root.height = canvas.height
  engine.start()

}


export function setBattle (battle: Battle, povPlayerID: BattlePlayer['id']) {
  engine.root.clear()
  engine.animationsStack = []
  engine.setBattle(battle, povPlayerID)
  battle.onCallAnimation = action => {
    engine.pushAnimation(action)
  }
}
