import Socket from 'socket.io-client'
import Logger from '../utils/Logger'
import { get } from 'svelte/store'
import { userData } from '../stores/userData'
import { isInMatchMaker } from '../stores/isInMatchMaker'
import type { BattleAction } from '../battle/Battle'
import { addPopup, PopupData } from './PopupManager'



// Init

const production = !(/\d+\.\d+\.\d+\.\d+|localhost/).test(window.location.hostname)

export const socket = Socket(
  production
  ? 'https://supermechs-workshop-server.thearchives.repl.co'
  : window.location.hostname + ':3000',
  {
    query: {
      name: get(userData).name,
      clientVersion: '1'
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

socket.on('server.error', (error: any) => {

  let title: PopupData['title'] = 'Unknown Error'
  let message: PopupData['message'] = ''
  const options: PopupData['options'] = {
    Ok () {
      this.remove()
    }
  }

  switch (error.code) {

    case 'OUTDATED_CLIENT':
      title = 'Outdated client!'
      message = 'Please reload the page'
      options.Reload = function () {
        location.reload()
      }
      break

  }

  addPopup({
    title,
    message,
    options,
    mode: error
  })

})



// Common connection-related methods

export function createAttachment (listeners: Record<string, (data: any) => void>) {

  const attach = () => {
    attachment.attached = true
    for (const name in listeners) {
      socket.on(name, listeners[name])
    }
  }

  const detach = () => {
    attachment.attached = false
    for (const name in listeners) {
      socket.off(name, listeners[name])
    }
  }

  const attachment = { attach, detach, attached: false }

  return attachment

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

  interface Result {
    error: { message: string } | null
  }

  const data = { name, mechName, setup, itemsHash }

  socket.emit('matchmaker.join', data, (result: Result) => {
    
    if (result.error !== null && result.error.message !== 'Already match-making') {

      addPopup({
        title: 'Failed to join match maker!',
        message: result.error.message,
        hideOnOffclick: true,
        mode: 'error',
        options: {
          Ok () { this.remove() }
        }
      })

      return

    }

    isInMatchMaker.set(true)

  })

}


export function matchMakerQuit (): void {

  interface Result {
    error: { message: string } | null
  }

  socket.emit('matchmaker.quit', {}, (result: Result) => {

    // Regardless of result set it to false
    isInMatchMaker.set(false)

    if (result.error !== null) {
      logger.error(result.error.message)
    }

  })

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
