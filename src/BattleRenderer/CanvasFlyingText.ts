import { CanvasObject } from '../CanvasRenderer'
import TWEEN from '@tweenjs/tween.js'



export class CanvasFlyingText extends CanvasObject {

  isFirstRender = true
  text: string
  fillStyle: string
  strokeStyle: string

  constructor (text: string, rgb: [number, number, number]) {
    super()
    this.text = text
    this.fillStyle = `rgb(${rgb.join(',')})`
    this.strokeStyle = `rgb(${rgb.map(x => x * 0.3).join(',')})`
  }

  override render (ctx: CanvasRenderingContext2D): void {

    if (this.isFirstRender) {

      this.isFirstRender = false

      new TWEEN.Tween(this)
        .to({ y: this.y - 50 }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => this.remove())
        .start()

    }

    if (this.opacity === 0) {
      return
    }
    
    ctx.save()

    ctx.translate(this.globalX, this.globalY)
    ctx.scale(this.globalScaleX, this.globalScaleY)
    
    ctx.globalAlpha = this.opacity
    ctx.fillStyle = this.fillStyle
    ctx.strokeStyle = this.strokeStyle
    ctx.lineWidth = 4
    ctx.textAlign = 'center'
    ctx.font = '1.6em monospace'
    ctx.strokeText(this.text, 0, 0)
    ctx.fillText(this.text, 0, 0)

    ctx.restore()

    this.renderChildren(ctx)

  }

}
