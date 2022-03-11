import Socket from 'socket.io-client'
import Logger from '../utils/Logger'



// Init

const serverURL = (
  (/\d+\.\d+\.\d+\.\d+|localhost/).test(window.location.hostname)
  ? window.location.hostname + ':3000'
  : 'https://supermechs-workshop-server.thearchives.repl.co'
)

export const socket = Socket(serverURL)

const connectErrorStreakCountMax = 3
export let connectErrorStreakCount = 0
export let lastError: Error = new Error('Server Offline')

const attachments: Record<number, Record<string, (data: any) => void>> = {}
let currentAttachmentID = 0

const logger = new Logger('SocketManager')



socket.on('connect', () => {
  logger.log('Connected as', socket.id)
  connectErrorStreakCount = 0
})

socket.on('connect_error', error => {
  lastError = error
  connectErrorStreakCount++
  if (connectErrorStreakCount >= connectErrorStreakCountMax) {
    socket.disconnect()
    logger.log('Gave up on connecting')
  }
})



// Functions

export function attach (listeners: Record<string, (data: any) => void>): number {
  
  const id = ++currentAttachmentID

  attachments[id] = listeners

  for (const name in listeners) {
    socket.on(name, listeners[name])
  }

  return id

}


export function detach (id: number): void {
  
  const listeners = attachments[id]

  for (const name in listeners) {
    socket.off(name)
  }

  delete attachments[id]

}


export function emit (...args: Parameters<typeof socket['emit']>) {
  return socket.emit(...args)
}



export function tryToConnectManually (): Promise<void> {

  logger.log('Trying to connect manually.')

  return new Promise((resolve, reject) => {

    const onConnect = () => {
      socket.off('connect_error', onError)
      logger.log('connected')
      resolve()
    }
  
    const onError = () => {
      socket.off('connect', onConnect)
      logger.log('connect error!')
      reject()
    }
  
    socket.once('connect', onConnect)
    socket.once('connect_error', onError)

    socket.connect()

  })
}
