import Socket from 'socket.io-client'
import Logger from '../utils/Logger'
import { get } from 'svelte/store'
import { userData } from '../stores/userData'
import { addPopup } from './PopupManager'



// Types

import type { BattleAction } from '../battle/Battle'


// Init

const production = !(/\d+\.\d+\.\d+\.\d+|localhost/).test(window.location.hostname)

export const socket = Socket(
  production
  ? 'https://supermechs-workshop-server.thearchives.repl.co'
  : window.location.hostname + ':3000',
  {
    query: {
      name: get(userData).name,
      clientVersion: 'gobsmacked!!!' // Arbitraty value, just has to match the server
    }
  }
)

export let connectErrorStreakCount = 0
export let lastError: Error = new Error('Server Offline')

const logger = new Logger()



socket.on('connect', () => {
  logger.log(`Connected as "${socket.id}"`)
  connectErrorStreakCount = 0
})

socket.on('connect_error', error => {

  lastError = error
  connectErrorStreakCount++

  if (!production) {
    socket.disconnect()
    logger.log('Disconnected the socket to avoid error spam in development')
  }

})

socket.on('server.message', data => {

  switch (data.code) {

    case 'OUTDATED_CLIENT':
      addPopup({
        title: 'Outdated client!',
        message: 'Your client is outdated! Please reload the page.',
        mode: 'error',
        options: {
          Later () { this.remove() },
          Reload () { location.reload() }
        }
      })
      break

    default:
      addPopup({
        title: data.code,
        message: data.message || JSON.stringify(data),
        mode: 'error',
        options: {
          Ok () { this.remove() }
        }
      })

  }

})



// Common connection-related methods

export function createAttachment (listeners: Record<string, (data: any) => void>) {

  let attached = false

  const attach = () => {
    attached = true
    for (const name in listeners) {
      socket.on(name, listeners[name])
    }
  }

  const detach = () => {
    attached = false
    for (const name in listeners) {
      socket.off(name, listeners[name])
    }
  }

  const isAttached = () => {
    return attached
  }

  return { attach, detach, isAttached }

}


export function tryToConnectManually (): Promise<void> {

  logger.log('Trying to connect manually...')

  return new Promise((resolve, reject) => {

    const onConnect = () => {
      socket.off('connect_error', onError)
      resolve()
    }
  
    const onError = () => {
      socket.off('connect', onConnect)
      reject()
    }
  
    socket.once('connect', onConnect)
    socket.once('connect_error', onError)

    socket.connect()

  })
}



// Battle methods

export function battleQuit (): void {
  socket.emit('battle.quit')
}


export function battleAction (action: BattleAction): void {
  socket.emit('battle.event', action)
}



// Statistics

export function playersOnlineListen (): void {
  socket.emit('playersonline.listen')
}


export function playersOnlineIgnore (): void {
  socket.emit('playersonline.ignore')
}
