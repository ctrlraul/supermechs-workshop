import * as router from 'svelte-spa-router'
import * as SocketManager from '../managers/SocketManager'
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



// Store

export const isInMatchMaker = writable(false)

const socketAttachment = SocketManager.createAttachment({

  'disconnect' (): void {

    if (get(isInMatchMaker)) {
      
      isInMatchMaker.set(false)

      addPopup({
        title: 'Lost connection!',
        message: `The server stopped vibing`,
        options: {
          Ok () { this.remove() }
        }
      })

    }

  },


  'matchmaker.validation' (data: MatchMakerValidationData): void {
    const valid = matchItemsHash(data.setup, data.itemsHash)
    SocketManager.matchMakerValidation(valid)
  },


  'battle.start' (battleJSON: any): void {
    
    isInMatchMaker.set(false)

    battle.set(new Battle({
      online: true,
      starterID: battleJSON.starterID,
      p1: battleJSON.p1,
      p2: battleJSON.p2,
      onUpdate: value => battle.set(value),
      povPlayerID: SocketManager.socket.id
    }))

    router.push('/battle')

  },

})



// Keep track of socket listeners

isInMatchMaker.subscribe(is => {
  if (is) {
    if (!socketAttachment.attached) {
      socketAttachment.attach()
    }
  } else {
    if (socketAttachment.attached) {
      socketAttachment.detach()
    }
  }
})
