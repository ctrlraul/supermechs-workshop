import Logger from '../utils/Logger'
import { writable } from 'svelte/store'



// Types

interface UserData {
  name: string
}



// Functions

function loadUserData () {

  try {

    const json = localStorage.getItem(LOCAL_STORAGE_KEY)

    if (json === null) {
      logger.log('No local user data found, the default value will be used')
      return
    }

    const data = JSON.parse(json)

    userData.set(data)

    logger.log('Successfuly loaded local user data:', data)
  
  } catch (err: any) {

    logger.error('Failed to load local user data:', err.message)

  }

}


function saveUserData (data: UserData): void {

  try {

    const json = JSON.stringify(data)

    localStorage.setItem('superMechsWorkshop-userData', json)

  } catch (err: any) {

    logger.error('Failed to save user data: ' + err.message)

  }

}



// Consts

const LOCAL_STORAGE_KEY = 'superMechsWorkshop-userData'
const DEFAULT_USER_DATA: UserData = {
  name: 'Unnamed Pilot',
}



// Data

const logger = new Logger()
const userData = writable<UserData>(DEFAULT_USER_DATA)

loadUserData() // Auto-load user data

userData.subscribe(saveUserData) // Auto-save user data



// Exports

export { userData }
