import Socket from 'socket.io-client'
import Logger from '../utils/Logger'
import { get } from 'svelte/store'
import { userData } from '../stores/userData'
import type { BattleAction } from '../battle/Battle'



// Init

const production = !(/\d+\.\d+\.\d+\.\d+|localhost/).test(window.location.hostname)

export const socket = Socket(
  production
  ? 'https://supermechs-workshop-server.thearchives.repl.co'
  : window.location.hostname + ':3000',
  {
    query: {
      name: get(userData).name
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



// Common connection-related methods

export function createAttachment (listeners: Record<string, (data: any) => void>) {

  const attach = () => {
    for (const name in listeners) {
      socket.on(name, listeners[name])
    }
  }

  const detach = () => {
    for (const name in listeners) {
      socket.off(name, listeners[name])
    }
  }

  return { attach, detach }

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



// Match Maker methods

export function matchMakerJoin (name: string, mechName: string, setup: number[], itemsHash: string): void {
  socket.emit('matchmaker.join', { name, mechName, setup, itemsHash })
}


export function matchMakerQuit (): void {
  socket.emit('matchmaker.quit')
}


export function matchMakerValidation (valid: boolean): void {
  socket.emit('matchmaker.validation', { result: valid })
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
