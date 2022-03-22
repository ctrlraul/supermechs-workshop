export function clickOutside (element: HTMLElement, handler: (e: MouseEvent, currentTarget: HTMLElement) => void) {

  const listener = (e: MouseEvent) => {
    if (e.target === element) {
      handler(e, element)
    }
  }

  window.addEventListener('click', listener)

  return {
    destroy () {
      window.removeEventListener('click', listener)
    }
  }

}
