import { CanvasObject } from './CanvasObject'



export class CanvasEngine {

  root = new CanvasObject()
  canvas: HTMLCanvasElement | null = null
  ctx: CanvasRenderingContext2D | null = null
  

  protected running = false


  start (): void {

    this.running = true

    const render = (time: number) => {

      if (this.canvas === null || this.ctx === null) {
        return
      }

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

      this.render(this.ctx, time)

      if (this.running) {
        requestAnimationFrame(render)
      }

    }

    requestAnimationFrame(render)

  }

  stop (): void {
    this.running = false
  }


  setCanvas (canvas: HTMLCanvasElement): void {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
  }


  render (ctx: CanvasRenderingContext2D, _time: number) {
    this.root.renderChildren(ctx)
  }


  loadImage (src: string): Promise<CanvasImageSource> {

    return new Promise((resolve, reject) => {

      const image = new Image()

      const onload = () => {
        removeListeners()
        resolve(image)
      }

      const onerror = (e: ErrorEvent) => {
        removeListeners()
        reject(e.error)
      }

      const removeListeners = () => {
        image.removeEventListener('load', onload)
        image.removeEventListener('error', onerror)
      }

      image.addEventListener('load', onload)
      image.addEventListener('error', onerror)

      image.src = src

    })

  }

}