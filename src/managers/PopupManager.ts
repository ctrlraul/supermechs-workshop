import { writable } from 'svelte/store';



// Types

interface PopupArgs {
	title: string
	message?: string | string[]
	hideOnOffclick?: boolean
	/** Each function in this object will be a button.
	 *  The popup is hiden automatically after clicking any option. */
	options?: Record<string, (this: PopupData) => void>
	mode?: 'info' | 'error' | 'warn' | 'success'
	spinner?: boolean
}


export interface PopupData {
  title: string
  message: string | string[]
  hideOnOffclick: boolean
  options: Record<string, () => void>
  mode: 'info' | 'error' | 'warn' | 'success'
  spinner: boolean
  replace: (args: PopupArgs) => void
  remove: () => void
}



// Data

export const popup = writable<PopupData | null>(null)

const stack: Record<number, PopupData> = {}

let currentPopupID: number | null = null
let popupsCreated = 0



// Methods

export function addPopup (args: PopupArgs): PopupData {

  const id = popupsCreated++
  const data = createPopupData(id, args)

  stack[id] = data

  if (currentPopupID === null) {
    setPopup(id)
  }

  return data

}


function removeCurrentPopup (): void {

  const nextID = Object.keys(stack)[0]

  setPopup(nextID === undefined ? null : Number(nextID))

}


function setPopup (id: number | null): void {

  if (id === null) {

    currentPopupID = null
    popup.set(null)

  } else {

    currentPopupID = id
    popup.set(stack[id])

  }
  
}


function createRemover (id: number): PopupData['remove'] {

  return () => {

    delete stack[id]

    if (currentPopupID === id) {
      removeCurrentPopup()
    }

  }

}


function createReplacer (id: number): PopupData['replace'] {

  return (args: PopupArgs) => {

    stack[id] = createPopupData(id, args)

    if (currentPopupID === id) {
      popup.set(stack[id])
    }

  }

}


function createPopupData (id: number, args: PopupArgs): PopupData {

  const data: PopupData = {
    title: args.title,
    message: args.message || '',
    hideOnOffclick: !!args.hideOnOffclick,
    options: args.options || {},
    mode: args.mode || 'info',
    spinner: !!args.spinner,
    remove: createRemover(id),
    replace: createReplacer(id),
  }

  return data

}
