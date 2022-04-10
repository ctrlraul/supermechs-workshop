import Logger from '../utils/Logger'
import * as router from 'svelte-spa-router'
import { socket } from '../managers/SocketManager'
import { matchItemsHash } from '../items/ItemsManager'
import { get, writable } from 'svelte/store'
import { battle } from '../stores'
import { Battle } from '../battle/Battle'
import { addPopup } from '../managers/PopupManager'



// Types

interface MatchMakerValidationData {
  setup: number[]
  itemsHash: string
}



// Data

const logger = new Logger()

export const isInMatchMaker = writable(false)
export const isWaitingResponse = writable(false)



// Methods

export function matchMakerJoin (name: string, mechName: string, setup: number[], itemsHash: string): void {

  interface Result {
    error: { message: string } | null
  }

  isWaitingResponse.set(true)

  const data = { name, mechName, setup, itemsHash }

  socket.emit('matchmaker.join', data, (result: Result) => {

    isWaitingResponse.set(false)

    if (result.error === null) {

      isInMatchMaker.set(true)

    } else {

      addPopup({
        title: 'Failed to join match maker!',
        message: result.error.message,
        hideOnOffclick: true,
        mode: 'error',
        options: {
          Ok () { this.remove() }
        }
      })

    }

  })

}


export function matchMakerQuit (): void {

  interface Result {
    error: { message: string } | null
  }

  isWaitingResponse.set(true)

  socket.emit('matchmaker.quit', {}, (result: Result) => {
    
    // The client doesn't care, set matchmaking to false regardless
    isInMatchMaker.set(false)
    isWaitingResponse.set(false)

    if (result.error !== null) {
      logger.error(result.error.message)
    }

  })

}


export function matchMakerValidation (valid: boolean): void {
  socket.emit('matchmaker.validation', { result: valid })
}



// Socket listeners

socket.on('disconnect', () => {

  if (!get(isInMatchMaker)) {
    return
  }

  isInMatchMaker.set(false)

  addPopup({
    title: 'Lost connection!',
    message: `The server stopped vibing`,
    options: {
      Ok () { this.remove() }
    }
  })

})


socket.on('matchmaker.validation', (data: MatchMakerValidationData) => {

  const valid = matchItemsHash(data.setup, data.itemsHash)

  matchMakerValidation(valid)

})


socket.on('battle.start', (battleJSON: any) => {
    
  isInMatchMaker.set(false)

  battle.set(new Battle({
    online: true,
    starterID: battleJSON.starterID,
    p1: battleJSON.p1,
    p2: battleJSON.p2,
    onUpdate: value => battle.set(value),
    povPlayerID: socket.id
  }))

  router.push('/battle')

})
