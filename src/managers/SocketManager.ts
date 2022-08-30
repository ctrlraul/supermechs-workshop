import Socket from 'socket.io-client'
import Logger from '../utils/Logger'
import { get } from 'svelte/store'
import { userData } from '../stores/userData'
import { addPopup } from './PopupManager'
import { isInProduction } from '../lib/isInProduction';



// Types

import type { BattleAction } from '../battle/Battle'

interface LobbyJoinData {
  name: string;
  mech: {
    name: string;
    setup: number[];
    hash: string;
  };
}



// Init

const logger = new Logger()

let socket: ReturnType<typeof Socket>
let outdatedClient: boolean
let connectionErrorsStreak: number



// Methods

export function init (): void {

  if (socket) {
    throw new Error('Already initialized!')
  }

  logger.log('Initializing')

  const extraHeaders = {
    'x-player-name': get(userData).name,
    'x-client-version': '3' // Arbitraty value, just has to match the server
  }

  socket = Socket(getServerURL(), { extraHeaders })
  outdatedClient = false
  connectionErrorsStreak = 0

  const emit = socket.emit;
  const on = socket.on;

  socket.emit = function (...args) {
    logger.log('=>', ...args);
    return emit.apply(socket, args);
  };

  socket.on = function (ev, listener) {
    const proxy = (...listenerArgs: any[]) => {
      logger.log('<=', ev, ...listenerArgs);
      listener(...listenerArgs);
    };
    return on.apply(socket, [ev, proxy]);
  };


  // Global event listeners

  socket.on('connect', () => {
    logger.log(`Connected as "${socket.id}"`)
    connectionErrorsStreak = 0
  })
  
  socket.on('disconnect', () => {
    logger.log(`Disconnected`)
  })
  
  socket.on('connect_error', error => {
  
    logger.log('Connection error:', error)
  
    connectionErrorsStreak++
  
    if (!isInProduction) {
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

}


export function isConnected(): boolean {
  return socket && socket.connected
}


export function isClientOutdated (): boolean {

  if (!socket) {
    throw new Error('Not initialized!')
  }

  return outdatedClient

}


export function getConnectionErrorsStreak (): number {

  if (!socket) {
    throw new Error('Not initialized!')
  }

  return connectionErrorsStreak

}


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


export function getSocket (): typeof socket {

  if (!socket) {
    throw new Error('Not initialized!')
  }

  return socket

}



// Lobby

export function lobbyJoin (data: LobbyJoinData): void {
  socket.emit('lobby.join', data);
}


export function lobbyExit(): void {
  socket.emit('lobby.exit')
}


export function lobbyJoinMatchMaker(): void {
  socket.emit('lobby.joinMatchMaker');
}


export function lobbyExitMatchMaker(): void {
  socket.emit('lobby.exitMatchMaker');
}


export function lobbyVerifyOpponent(valid: boolean): void {
  socket.emit('lobby.verifyOpponent', { valid });
}



// Battle methods

export function battleQuit (): void {
  socket.emit('battle.quit')
}


export function battleAction (action: BattleAction): void {
  socket.emit('battle.event', action)
}



// Private utils

function getServerURL (): string {

  if (isInProduction) {
    return 'https://supermechs-workshop-server.thearchives.repl.co'
  }
  
  return window.location.hostname + ':3000'

}
