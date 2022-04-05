<script lang="ts">

import type { TorsoAttachment, AttachmentPoint } from '../items/Item'
import type Item from '../items/Item'
import type { BattleItem } from '../items/ItemsManager'
import { getItemByID } from '../items/ItemsManager'
import ItemImage from './ItemImage.svelte'



// Props

export let scale = 1
export let setup: (Item | BattleItem | null)[]
export let droneActive = true
export let outline = false



// Types

interface Part <T extends Item['attachment'] = Item['attachment']> {
	x: number
	y: number
	name: string
	zIndex: number
	attachment: T
	item: Item
}

function createPart <T extends Item['attachment'] = Item['attachment']> (item: Item | BattleItem, name: string, zIndex: number): Part<T> {

	// Get the actual item if got battle item
	const actualItem = 'index' in item ? getItemByID(item.id) : item

	if (actualItem === null) {
		throw new Error('Fuckery!')
	}

	return {
		x: 0,
		y: 0,
		name,
		zIndex,
		attachment: actualItem.attachment as T,
		item: actualItem
	}

}



// Functions

function getPartsData (): Part[] {

	const visibleItems = getVisibleItems()
	const parts = createParts(visibleItems)

	attachParts(parts)

	// @ts-ignore
	return parts.filter(Boolean)

}


function getVisibleItems (): (Item | BattleItem | null)[] {

	// Only keep items which are visible in the mech
	const visibleItems = setup.slice(0, 9)

	// If drone it's disabled we remove it from the setup
	if (!droneActive) {
		visibleItems.splice(8, 1, null)
	}

	// We also need two legs rather than one
	visibleItems.splice(2, 0, setup[1])

	return visibleItems

}


function createParts (items: (Item | BattleItem | null)[]): (Part | null)[] {

	const names = ['torso', 'leg1', 'leg2', 'side1', 'side2', 'side3', 'side4', 'top1', 'top2', 'drone']
	const zIndexes = [5, 6, 4, 8, 1, 9, 2, 7, 3, 0]
	const parts: (Part | null)[] = []

	for (let i = 0; i < names.length; i++) {

		const item = items[i]

		if (item) {
			parts.push(createPart(item, names[i], zIndexes[i]))
		} else {
			parts.push(null)
		}

	}

	return parts

}


function attachParts (parts: (Part | null)[]): void {

	const torso = parts[0] as Part<TorsoAttachment>
	const leg1 = parts[1] as Part<AttachmentPoint>
	const drone = parts[9]
	const preAttachedPartsNames = ['torso', 'leg1', 'drone']


	if (!leg1) {
		torso.x = -torso.item.width / 2
		torso.y = -torso.item.height
	} else {
		leg1.x = (-leg1.item.width - (torso.attachment.leg2.x - torso.attachment.leg1.x)) / 2
		leg1.y = -leg1.item.height
		torso.x = leg1.x + leg1.attachment.x - torso.attachment.leg1.x
		torso.y = leg1.y + leg1.attachment.y - torso.attachment.leg1.y
	}


	// If has drone, set drone position. We
	// don't use attachment points for that
	if (drone) {
		drone.x = torso.x - drone.item.width - 25
		drone.y = torso.y - drone.item.height / 2
	}


	// Now we set the position of every other part
	for (const part of parts) {

		if (!part || preAttachedPartsNames.includes(part.name)) {
			continue // Already attached
		}

		const partAttachment = part.attachment as AttachmentPoint
		const name = part.name as keyof TorsoAttachment

		part.x = torso.x + torso.attachment[name].x - partAttachment.x
		part.y = torso.y + torso.attachment[name].y - partAttachment.y

	}
}


function getScale (width = window.innerWidth, height = window.innerHeight): number {
	const dif = Math.abs(width - height)
	return Math.sqrt(width + height - dif) / 50
}


// Data

$: partsData = setup[0] ? getPartsData() : []


</script>


{#if setup[0]}
	<div
		class="mech-gfx"
		style="transform: scale({getScale() * scale}); {$$props.style || ''}"
		>

		{#each partsData as part}
			<div
				class={part.name + ' ' + (outline ? 'outline' : '')}
				style="left: {part.x}px; top: {part.y}px; z-index: {part.zIndex}">

				<ItemImage item={part.item} style="
					width: {part.item.width}px;
					height: {part.item.height}px;
				"/>
				
			</div>
		{/each}

	</div>
{/if}



<style>

.mech-gfx {
	position: relative;
	display: block;
}

.mech-gfx > div {
	position: absolute;
	filter: drop-shadow(0 0.3rem 0.5rem #000000) drop-shadow(0 0 0 #000000);
}

</style>