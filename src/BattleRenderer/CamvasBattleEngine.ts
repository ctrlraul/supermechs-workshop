import { CanvasObject, CanvasEngine } from '../CanvasRenderer'
import { CanvasMech } from './CanvasMech'
import TWEEN from '@tweenjs/tween.js'



// Types

import type { BattlePlayer } from '../battle/BattlePlayer'
import type { Battle } from '../battle/Battle'



// Class

export class CanvasBattleEngine extends CanvasEngine {

  pov!: any
  mech1!: CanvasMech
  mech2!: CanvasMech
  mechsGfxContainer = new CanvasObject()


  override setCanvas (canvas: HTMLCanvasElement): void {

    this.canvas = canvas
    this.ctx = canvas.getContext('2d')

    this.root.width = canvas.width
    this.root.height = canvas.height

    this.adjust()
    
    if (!this.running) {
      this.start()
    }

  }


  override render (ctx: CanvasRenderingContext2D, time: number): void {
    TWEEN.update(time)
    this.mechsGfxContainer.renderChildren(ctx)
  }


  setBattle (battle: Battle, povPlayerID: BattlePlayer['id']): void {

    // Reset arena
    this.mechsGfxContainer.clear()

    this.pov = povPlayerID

    this.mech1 = new CanvasMech(battle.p1)
    this.mech2 = new CanvasMech(battle.p2)

    this.mechsGfxContainer.addChild(this.mech1, this.mech2)

    this.mech1.init()
    this.mech2.init()

    this.mech2.scaleX *= -1

    this.adjust()

  }


  adjust () {

    this.mechsGfxContainer.y = this.root.height - 10
    this.mechsGfxContainer.width = this.root.width
    this.mechsGfxContainer.height = 0

    this.mech1.adjust()
    this.mech2.adjust()

  }

}
