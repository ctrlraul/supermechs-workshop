import { CanvasObject } from '../CanvasRenderer'
import { cloneDeep } from 'lodash'
import { CanvasMechPart } from './CanvasMechPart'
import { getItemByID } from '../items/ItemsManager'
import Mech from '../mechs/Mech'



// Types

import type { BattlePlayer } from '../battle/BattlePlayer'
import type { AttachmentPoint, TorsoAttachment } from '../items/Item'
import { getVisualX } from '.'



// Class

export class CanvasMech extends CanvasObject {

  player: BattlePlayer
  stats: BattlePlayer['stats']
  parts: (CanvasMechPart | null)[] = []
  onStatsUpdate: (stats: BattlePlayer['stats']) => void = () => {}


  constructor (player: BattlePlayer) {

    super()

    this.player = player
    this.stats = cloneDeep(player.stats)
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

    const items = this.player.items.map(battleItem => {
      return battleItem ? getItemByID(battleItem.id) : null
    })

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
    const zIndexes = [5, 6, 4, 8, 1, 9, 2, 7, 3, 0]
    const names: CanvasMechPart['partName'][] = [
      'torso', 'leg1', 'leg2', 'side1',
      'side2', 'side3', 'side4', 'top1',
      'top2', 'drone'
    ]
  
    // Dew it
    return items.map((item, i) => {
      return item ? new CanvasMechPart(names[i], item, zIndexes[i]) : null
    })
  
  }
  

  private attachParts (parts: (CanvasMechPart | null)[]): void {

    // These are attached "manually" first 
    const skipAttaching: CanvasMechPart['partName'][] = ['torso', 'leg1', 'drone']
  
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


  updateStats (): void {
    Object.assign(this.stats, this.player.stats)
    this.onStatsUpdate(this.stats)
  }

}