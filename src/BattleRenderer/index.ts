import { Battle, BattleAnimation } from '../battle/Battle'
import { CanvasEngine, CanvasImage, CanvasObject } from '../CanvasRenderer'
import { ids2items, items2ids } from '../items/ItemsManager'
import Mech from '../mechs/Mech'
import { itemsPackData } from '../stores'
import TWEEN from '@tweenjs/tween.js'
import { CanvasFlyingText } from './CanvasFlyingText'



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
    this.scaleX = 0.4
    this.scaleY = 0.4

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
    this.x = getVisualX(this.player.position)
    this.y = 0
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


export class CanvasBattleEngine extends CanvasEngine {

  pov!: any
  mech1!: CanvasMech
  mech2!: CanvasMech
  mechsGfxContainer!: CanvasObject
  animationsStack: BattleAnimation[] = []


  override render (ctx: CanvasRenderingContext2D, time: number): void {
    TWEEN.update(time)
    this.mechsGfxContainer.renderChildren(ctx)
  }


  setBattle (battle: Battle, povPlayerID: BattlePlayer['id']): void {

    // Reset arena
    this.animationsStack = []
    this.mechsGfxContainer = new CanvasObject()
    this.mechsGfxContainer.y = this.root.height - 10
    this.mechsGfxContainer.width = this.root.width
    this.mechsGfxContainer.height = 0
    this.root.clear()
    this.root.addChild(this.mechsGfxContainer)


    // The other stuff

    this.pov = povPlayerID

    this.mech1 = new CanvasMech(battle.p1)
    this.mech2 = new CanvasMech(battle.p2)

    this.mechsGfxContainer.addChild(this.mech1, this.mech2)

    this.mech1.init()
    this.mech2.init()

    this.mech2.scaleX *= -1

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
  engine.setCanvas(canvas)
  engine.root.width = canvas.width
  engine.root.height = canvas.height
  engine.start()
}


export function setBattle (battle: Battle, povPlayerID: BattlePlayer['id']) {
  engine.setBattle(battle, povPlayerID)
}



const animationsStack: (() => void)[] = []



// Methods

export function getPlayerGfx (playerID: BattlePlayer['id']) {
  return engine.mech1.player.id === playerID ? engine.mech1 : engine.mech2
}


export function getVisualX (position: number): number {
  return (5 + position / Battle.MAX_POSITION_INDEX * 90) / 100 * engine.root.width
}


export function pushAnimation (animation: () => void): void {

  animationsStack.push(animation)

  if (animationsStack.length === 1) {
    animation()
  }

}


export function nextAnimation (): void {

  animationsStack.shift()

  if (animationsStack.length) {
    animationsStack[0]()
  }

}


export function showFlyingText (text: string, x: number, rgb: [number, number, number]): void {
  const flyingText = new CanvasFlyingText(text, rgb)
  flyingText.x = x
  flyingText.y = -50
  if (engine.mech2.player.id === engine.pov) {
    flyingText.scaleX = -1
  }
  engine.mechsGfxContainer.addChild(flyingText)
}
