interface Options {
  src?: string
  region?: Rectangle
  image?: HTMLCanvasElement
}

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}



const preCache: Record<string, Promise<HTMLCanvasElement>> = Object.create(null)
const cache: Record<string, HTMLCanvasElement> = Object.create(null)



export class CanvasImage {


  // Static props

  static NULL_REGION: Rectangle = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  }

  



  // Props

  data: HTMLCanvasElement | null = null
  state: 'loading' | 'error' | 'complete' = 'loading'



  // Constructor

  constructor (src: string)
  constructor (options: Options)
  constructor (src: string | Options) {

    const options = typeof src === 'string' ? { src } : src

    
    if (!options.src && !options.image) {
      throw new Error('image or src required')
    }

    if (options.src && options.image) {
      throw new Error('image and src are mutually exclusive')
    }
    

    if (options.image) {
      this.data = options.image
      this.state = 'complete'
    }


    if (options.src) {
      this.load(options.src, options.region)
        .then(data => {
          this.data = data
          this.state = 'complete'
        })
        .catch(() => {
          this.state = 'error'
        })
    }

  }



  // Functions

  private load (src: string, region?: Rectangle): Promise<HTMLCanvasElement> {

    if (src in preCache) {
      return preCache[src]
    }

    const promise: Promise<HTMLCanvasElement> = new Promise((resolve, reject) => {

      if (src in cache) {

        resolve(cache[src])

      } else {

        // Create dummy

        const image = new Image()


        // Create listeners

        const onload = () => {
          remove()
          cache[src] = this.createData(image, region)
          resolve(cache[src])
        }
    
        const onerror = (e: ErrorEvent) => {
          remove()
          reject(e.error)
        }


        // Utility
    
        const remove = () => {
          delete preCache[src]
          image.removeEventListener('load', onload)
          image.removeEventListener('error', onerror)
        }
  
    
        // Add listeners

        image.addEventListener('load', onload)
        image.addEventListener('error', onerror)


        // Let it rip

        image.src = src

      }

    })

    preCache[src] = promise

    return promise

  }


  private createData (image: HTMLImageElement, region?: Rectangle) {

    const data = document.createElement('canvas')
    const ctx = data.getContext('2d')!

    if (region === undefined) {
      region = {
        x: 0,
        y: 0,
        width: image.naturalWidth,
        height: image.naturalHeight 
      }
    }

    data.width = region.width
    data.height = region.height

    ctx.drawImage(
      image,
      region.x,
      region.y,
      region.width,
      region.height,
      0,
      0,
      data.width,
      data.height,
    )

    return data

  }

}
