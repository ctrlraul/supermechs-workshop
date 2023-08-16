import { CanvasObject } from '../CanvasRenderer'
import * as ItemsManager from '../items/ItemsManager'



// Types

import type Item from '../items/Item'

type PartName = 'torso' | 'leg1' | 'leg2' | 'side1' | 'side2' | 'side3' | 'side4' | 'top1' | 'top2' | 'drone'



// Class

export class CanvasMechPart extends CanvasObject {

  partName: PartName
  item: Item
  zIndex: number

  constructor (partName: PartName, item: Item, zIndex: number) {

    super()

    this.partName = partName
    this.item = item
    this.zIndex = zIndex

    this.width = item.width
    this.height = item.height

    // this.setImage(ItemsManager.spritesSheet, item.image)

  }

}
