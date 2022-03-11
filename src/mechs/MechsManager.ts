import type { MechJSON } from './Mech'
import * as LocalStorageHandler from '../managers/LocalStorageHandler'
import downloadJSON from '../utils/downloadJSON'
import { randomString } from '../utils/randomStringFactory'
import * as Stores from '../stores'
import { get } from 'svelte/store'
import { addPopup } from '../managers/PopupManager'



// Types

interface MechsExportJSON {
	version: number
  mechs: {
		[ItemsPackKey: string]: {
			name: string
			setup: number[]
		}[]
  }
}



// Data

const mechs: MechJSON[] = []



// Private functions


/**
 * Loads the mechs from local storage to the "mechs" variable
 */
export function loadMechsForCurrentPack (): void {

	const itemsPackData = get(Stores.itemsPackData)

	if (itemsPackData === null) {
		throw new Error('No items pack loaded')
	}

	mechs.length = 0

	const data = LocalStorageHandler.get('mechs')

	if (itemsPackData.key in data) {
		mechs.push(...Object.values(data[itemsPackData.key]))
	}

}



// Methods

export function getMechs (): MechJSON[] {
	return [...mechs]
}


export function saveMech (mech: MechJSON): void {

	const data = LocalStorageHandler.get('mechs')

	if (!(mech.pack_key in data)) {
		data[mech.pack_key] = {}
	}

	data[mech.pack_key][mech.id] = mech

	LocalStorageHandler.set('mechs', data)

	loadMechsForCurrentPack()

}


export function getLastMech (): MechJSON {

	const itemsPackData = get(Stores.itemsPackData)

	if (itemsPackData === null) {
		throw new Error('No items pack loaded')
	}


	const lastMechID = LocalStorageHandler.get('last-mech-id')


	// Try to find the last mech by it's ID

	for (const mech of mechs) {
		if (mech.id === lastMechID) {
			return mech
		}
	}


	// Otherwise just return the first mech loaded

	if (mechs.length) {
		setLastMech(mechs[0].id)
		return mechs[0]
	}


	// And if there are no mechs loaded, make a new one

	const mech = createMechForCurrentPack()
	setLastMech(mech.id)
	mechs.push(mech)

	return mech

}


export function setLastMech (mechID: MechJSON['id']): void {
	LocalStorageHandler.set('last-mech-id', mechID)
}


/** Deletes the mech from local storage and from manager's memory */
export function deleteMech (mechID: MechJSON['id']): void {

	const index = mechs.findIndex(mech => mech.id === mechID)

	if (index >= 0) {
		mechs.splice(index, 1)
		saveMechs()
	} else {
		throw new Error(`No loaded mech found with id: ${mechID}`)
	}

}


export function exportMechs (mechJSONs: MechJSON[]): void {

	const mechsExportJson: MechsExportJSON = {
		version: 1,
		mechs: {}
	}

	for (const json of mechJSONs) {

		const mechExportData: MechsExportJSON['mechs'][string][0] = {
			name: json.name,
			setup: json.setup
		}

		if (json.pack_key in mechsExportJson.mechs) {
			mechsExportJson.mechs[json.pack_key].push(mechExportData)
		} else {
			mechsExportJson.mechs[json.pack_key] = [mechExportData]
		}

	}

	downloadJSON(mechsExportJson, 'mechs')

}


/** Returns the mechs imported, automatically saves them. */
export function importMechs (mechsExportJSON: MechsExportJSON): MechJSON[] {

	const importedMechs: MechJSON[] = []

	try {

		const data = LocalStorageHandler.get('mechs', {})

		for (const packKey in mechsExportJSON.mechs) {

			if (!(packKey in data)) {
				data[packKey] = {}
			}

			for (const mechExport of mechsExportJSON.mechs[packKey]) {

				const mech = {
					id: createMechID(),
					pack_key: packKey,
					name: mechExport.name,
					setup: mechExport.setup
				}

				data[packKey][mech.id] = mech

				importedMechs.push(mech)

			}
		}

		LocalStorageHandler.set('mechs', data)
		loadMechsForCurrentPack()

	} catch (err: any) {

		addPopup({
			title: 'Failed to import mechs!',
			message: err.message,
			mode: 'error',
			options: {
				Ok () { this.remove() }
			}
		})

	}

	return importedMechs

}


export function createMechForCurrentPack (from?: MechJSON): MechJSON {

	const itemsPackData = get(Stores.itemsPackData)

	if (itemsPackData === null) {
		throw new Error('No items pack loaded')
	}
	
	const mech: MechJSON = {
		id: createMechID(),
		name: 'Mech ' + randomString(4),
		pack_key: itemsPackData.key,
		setup: Array(20).fill(0)
	}

	if (from) {
		Object.assign(mech, from)
	}

	return mech

}


export function importMechFromURLQuery (query: URLSearchParams): MechJSON | null {

  const data = query.get('mech')

	if (data === null) {
		return null
	}

	const mech = createMechForCurrentPack(JSON.parse(atob(data)))

	return mech

}



// Private utils

function createMechID (): MechJSON['id'] {
	return randomString(16)
}


function saveMechs (): void {

	const itemsPackData = get(Stores.itemsPackData)

	if (itemsPackData === null) {
		throw new Error('No items pack loaded')
	}

	const data = LocalStorageHandler.get('mechs')
	const mechsJSON: Record<string, MechJSON> = {}

	for (const mech of mechs) {
		mechsJSON[mech.id] = mech
	}
	
	data[itemsPackData.key] = mechsJSON

	LocalStorageHandler.set('mechs', data)

	loadMechsForCurrentPack()

}


/**
 * @param mech The mech to be checked
 * @returns Whether there is a mech with the same setup and same items pack key in the local storage.
 */
export function hasMech (mech: MechJSON): boolean {

	const data = LocalStorageHandler.get('mechs')

	if (mech.pack_key in data) {
		for (const savedMech of Object.values(data[mech.pack_key])) {
			if (mech.setup.every((itemID, i) => savedMech.setup[i] === itemID)) {
				return true
			}
		}
	}

	return false

}
