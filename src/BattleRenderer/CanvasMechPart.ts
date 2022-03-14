import { CanvasImage, CanvasObject } from '../CanvasRenderer'
import { itemsPackData } from '../stores'



// Types

import type Item from '../items/Item'

type PartName = 'torso' | 'leg1' | 'leg2' | 'side1' | 'side2' | 'side3' | 'side4' | 'top1' | 'top2' | 'drone'



// Data

let spritesSheet: CanvasImage = new CanvasImage('https://dummyimage.com/360x360/ff00ff/fff')

itemsPackData.subscribe(value => {
  if (value) {
    spritesSheet = new CanvasImage({
      image: value.spritesSheet
    })
  }
})



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

    this.width = item.image.width
    this.height = item.image.height

    this.setImage(spritesSheet, item.image)

  }

}
