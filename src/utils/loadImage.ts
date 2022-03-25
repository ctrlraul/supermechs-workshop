export function loadImage (url: string): Promise<HTMLImageElement> {

  return new Promise((resolve, reject) => {

    const image = document.createElement('img')

    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', ({ error }) => reject(error))

    image.src = url

  })

}
