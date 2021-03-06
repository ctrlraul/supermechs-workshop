const times: number[] = []
const localStorageKey = '__dnuorgkcab__'
const lastBackground = localStorage.getItem(localStorageKey)


if (lastBackground !== null) {
  document.body.style.backgroundImage = `url(${lastBackground})`
  document.body.style.backgroundPosition = 'center'
  document.body.style.backgroundSize = 'cover'
}


export function backgroundChanger (element: HTMLElement): void {

  element.addEventListener('click', () => {

    const now = Date.now()

    times.push(now)

    if (times.length > 5) {
      times.length = 5
    }

    if (times.length === 5 && now - times[0] < 1000) {
      
      times.length = 0
      
      const backgroundURL = prompt('Background URL')

      if (backgroundURL !== null) {
        document.body.style.backgroundImage = `url(${backgroundURL})`
        document.body.style.backgroundPosition = 'center'
        document.body.style.backgroundSize = 'cover'
        localStorage.setItem(localStorageKey, backgroundURL)
      }

    }

  })

}
