export function loadImage (url: string): Promise<HTMLImageElement> {

  return new Promise((resolve, reject) => {

    const image = document.createElement('img')

    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', () => {

      // The error event gives no information about why it failed, so we re-try
      // the request, this time using fetch, which yields useful info on error.

      fetch(url)
        .then(res => {

          let message: string

          if (res.ok) {
            // Failed to load with the image element, but succeeded
            // in the fetch request, what could even cause this?
            message = 'Unknown error'
          } else {
            message = `Error 404 (${res.statusText})`
          }

          reject(new Error(message))

        })
        .catch(reject)

    })

    image.src = url

  })

}
