import { CanvasImage, Rectangle } from './CanvasImage'



export class CanvasObject {


  private _x = 0
  private _y = 0

  globalX = 0
  globalY = 0

  width = 64
  height = 32

  private _scaleX = 1
  private _scaleY = 1
  globalScaleX = 1
  globalScaleY = 1

  parent: CanvasObject | null = null
  children: CanvasObject[] = []

  image: CanvasImage | null = null
  region: Rectangle = CanvasImage.NULL_REGION
  opacity = 1


  render (ctx: CanvasRenderingContext2D): void {

    if (this.opacity === 0) {
      return
    }

    ctx.save()

    ctx.translate(this.globalX, this.globalY)
    ctx.scale(this.globalScaleX, this.globalScaleY)
    
    ctx.globalAlpha = this.opacity

    if (this.image && this.image.data && this.image.state === 'complete') {

      ctx.drawImage(
        this.image.data,
        this.region.x,
        this.region.y,
        this.region.width,
        this.region.height,
        0,
        0,
        this.width,
        this.height
      )

    } else {

      ctx.beginPath()
      ctx.strokeStyle = '#00FF00'
      ctx.fillStyle = '#00FF0030'
      ctx.rect(this.globalX, this.globalY, this.width * this.globalScaleX, this.height * this.globalScaleY)
      ctx.moveTo(this.globalX, this.globalY)
      ctx.lineTo(this.globalX + this.width * this.globalScaleX, this.globalY + this.height * this.globalScaleY)
      ctx.fill()
      ctx.stroke()
      ctx.closePath()

    }

    ctx.restore()

    this.renderChildren(ctx)

  }

  renderChildren (ctx: CanvasRenderingContext2D): void {
    for (const child of this.children) {
      child.render(ctx)
    }
  }


  addChild (...children: CanvasObject[]): void {
    for (const child of children) {

      if (child.parent !== null) {
        child.remove()
      }

      this.children.push(child)
      
      child.parent = this
      child.updateGlobalX()
      child.updateGlobalY()
      child.updateGlobalScaleX()
      child.updateGlobalScaleY()

    }
  }

  removeChild (...children: CanvasObject[]): void {
    for (const child of children) {
      
      const index = this.children.indexOf(child)

      if (index === -1) {
        throw new Error(`Not a child of this object`)
      }

      this.children.splice(index, 1)

      child.parent = null
      child.updateGlobalX()
      child.updateGlobalY()
      child.updateGlobalScaleX()
      child.updateGlobalScaleY()

    }
  }

  remove (): void {
    if (this.parent !== null) {
      this.parent.removeChild(this)
    } else {
      throw new Error(`No parent`)
    }
  }

  clear (): void {
    this.removeChild(...this.children)
  }


  set x (value: number) {
    this._x = value
    this.updateGlobalX()
    for (const child of this.children) {
      child.updateGlobalX()
    }
  }

  get x (): number {
    return this._x
  }


  set y (value: number) {
    this._y = value
    this.updateGlobalY()
    for (const child of this.children) {
      child.updateGlobalY()
    }
  }

  get y (): number {
    return this._y
  }


  updateGlobalX (): void {
    this.globalX = this.parent ? this.parent.globalX + this._x * this.parent.scaleX : this._x
  }

  updateGlobalY (): void {
    this.globalY = this.parent ? this.parent.globalY + this._y * this.parent.scaleY : this._y
  }

  setImage (image: CanvasImage, region?: Rectangle) {

    this.image = image

    if (region) {
      this.region = region
    } else {
      this.region.x = 0
      this.region.y = 0
      this.region.width = image.data!.width
      this.region.height = image.data!.height
    }

  }


  set scaleX (value: number) {
    this._scaleX = value
    this.updateGlobalScaleX()
    for (const child of this.children) {
      child.updateGlobalX()
      child.updateGlobalScaleX()
    }
  }

  get scaleX (): number {
    return this._scaleX
  }

  updateGlobalScaleX (): void {
    this.globalScaleX = this.parent ? this.parent.globalScaleX * this.scaleX : this.scaleX
  }


  set scaleY (value: number) {
    this._scaleY = value
    this.updateGlobalScaleY()
    for (const child of this.children) {
      child.updateGlobalY()
      child.updateGlobalScaleY()
    }
  }

  get scaleY (): number {
    return this._scaleY
  }

  updateGlobalScaleY (): void {
    this.globalScaleY = this.parent ? this.parent.globalScaleY * this.scaleY : this.scaleY
  }


  get root (): CanvasObject {
    return this.parent ? this.parent.root : this
  }

}
