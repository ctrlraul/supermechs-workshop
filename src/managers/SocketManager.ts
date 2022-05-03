import Socket from 'socket.io-client'
import Logger from '../utils/Logger'
import { get } from 'svelte/store'
import { userData } from '../stores/userData'
import { addPopup } from './PopupManager'



// Types

import type { BattleAction } from '../battle/Battle'


// Init

const production = !(/\d+\.\d+\.\d+\.\d+|localhost/).test(window.location.hostname)
const initHeaders = new Headers({})

export const socket = Socket(
  production
  ? 'https://supermechs-workshop-server.thearchives.repl.co'
  : window.location.hostname + ':3000',
  {
    extraHeaders: {
      'x-player-name': get(userData).name,
      'x-client-version': 'gobsmacked!!!' // Arbitraty value, just has to match the server
    }
  }
)


export let outdatedClient = false
export let connectErrorStreakCount = 0

const logger = new Logger()



socket.on('connect', () => {
  logger.log(`Connected as "${socket.id}"`)
  connectErrorStreakCount = 0
})

socket.on('disconnect', () => {
  logger.log(`Disconnected`)
})

socket.on('connect_error', error => {

  logger.log('Connection error:', error)

  connectErrorStreakCount++

  if (!production) {
    socket.disconnect()
    logger.log('Disconnected the socket to avoid error spam in development')
  }

})

socket.on('server.message', data => {

  switch (data.code) {

    case 'OUTDATED_CLIENT':
      outdatedClient = true
      logger.log('Client is outdated')
      socket.disconnect()
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

  return new Promise((resolve, reject) => {

    logger.log('Trying to reconnect manually...')

    const onConnect = () => {
      socket.off('connect_error', onError)
      resolve()
    }
  
    const onError = (err: Error) => {
      socket.off('connect', onConnect)
      reject(err)
    }
  
    socket.once('connect', onConnect)
    socket.once('connect_error', onError)

    socket.connect()

  })

}


export function addOutdatedClientPopup (): void {
  addPopup({
    title: 'Outdated client!',
    message: `
      SuperMechs Workshop has been updated recently, but your browser is still using the old version!

      Old versions can't safely connect to the server.

      Click "Reload" to restart the page, hopefully your browser will load the newer version.
    `,
    mode: 'error',
    options: {
      Later () { this.remove() },
      Reload () { location.reload() }
    }
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
