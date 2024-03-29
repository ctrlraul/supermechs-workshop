<script lang="ts">

import Mech from '../mechs/Mech'
import Logger from '../utils/Logger'
import * as ItemsManager from '../items/ItemsManager'



// Types

import type { AttachmentPoint, TorsoAttachment } from '../items/Item'
import type Item from '../items/Item'

interface Part {
  item: Item
  name: (
    'torso' | 'leg1'  | 'leg2' | 'side1' | 'side2' |
    'side3' | 'side4' | 'top1' | 'top2'  | 'drone'
  )
  zIndex: number
  x: number
  y: number
}



// Props

export let setup: number[]
export let droneActive: boolean = true
export let scale: number = 1
/** Set to 0 to disable */
export let outlineThickness = 2



// Data

const logger = new Logger('MechCanvas')

let canvas: HTMLCanvasElement | null = null
let errorMessage = ''

$: ctx = canvas ? canvas.getContext('2d')! : null
$: tryToRender(canvas, ctx, setup)



// Functions

function tryToRender (canvas: HTMLCanvasElement | null, ctx: CanvasRenderingContext2D | null, itemIDs: number[]): void {

  if (!canvas) {
    return
  }

  if (!ctx) {
    logger.error('Canvas rendering context 2D is not supported in this browser!')
    return
  }

  try {
    render(canvas, ctx, itemIDs)
  } catch (err: any) {
    logger.error('Failed to render mech:', err)
    errorMessage = 'Failed to render mech: ' + err.message
  }

}


function render (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, itemIDs: number[]): void {

  // Clear the canvas

  ctx.clearRect(0, 0, canvas.width, canvas.height)


  // No torso, no render.

  if (itemIDs[Mech.TORSO_INDEX] === 0) {
    return
  }

  


  // Attach parts

  const parts = createParts(itemIDs)

  attachParts(parts)

  const formation = getImageFormation(parts)

  // Shift all parts to remove the negative coords

  for (const part of parts) {
    if (part) {
      part.x = part.x - formation.shift.x
      part.y = part.y - formation.shift.y
    }
  }


  // Prepare the canvas

  canvas.width = formation.width * scale
  canvas.height = formation.height * scale


  // Render time!
  
  const sortedParts = parts
    .filter(Boolean) // Remove nulls
    .sort((a, b) => a!.zIndex - b!.zIndex) as Part[]

  if (outlineThickness === 0) {

    // Render without outline

    for (const part of sortedParts) {
      renderPart(ctx, part)
    }

  } else {

    // Render with outline

    canvas.width += outlineThickness * 2
    canvas.height += outlineThickness * 2

    ctx.shadowColor = '#000000'
    ctx.shadowBlur = 0

    for (const part of sortedParts) {

      part.x += outlineThickness
      part.y += outlineThickness

      for (let x = -1; x < 2; x++) {
        ctx.shadowOffsetX = x * outlineThickness
        for (let y = -1; y < 2; y++) {
          ctx.shadowOffsetY = y * outlineThickness
          renderPart(ctx, part)
        }
      }
    }

  }

}


function renderPart (ctx: CanvasRenderingContext2D, part: Part): void {
  ItemsManager.renderSprite(
    ctx,
    part.item,
    part.x,
    part.y,
    scale
  )
}


/** Assumes you're passing an array with the right length (10) */
function createParts (itemIDs: number[]): (Part | null)[] {

  // Slice to keep only the items we will use
  const items = ItemsManager.ids2items(itemIDs).slice(0, Mech.DRONE_INDEX + 1)

  // Add second leg
  items.splice(1, 0, items[1])
  
  // Positioning configuraion
  const zIndexes = [5, 6, 4, 8, 1, 9, 2, 7, 3, 0]
  const names: Part['name'][] = [
    'torso', 'leg1', 'leg2', 'side1', 'side2',
    'side3', 'side4', 'top1', 'top2', 'drone'
  ]

  // Dew it
  return items.map((item, i) => {

    if (item) {
      return {
        item,
        name: names[i],
        zIndex: zIndexes[i],
        x: 0,
        y: 0,
      }
    }

    return null

  })

}


function attachParts (parts: (Part | null)[]) {

  // These are attached "manually" first 
  const skipAttaching = ['torso', 'leg1', 'drone']

  const torso = parts[0]!
  const leg1 = parts[1]
  const drone = parts[9]
  const torsoAttachment = torso.item.attachment as TorsoAttachment

  // If no legs, just place the torso on the bottom center
  if (leg1 === null) {

		torso.x = torso.item.width * -0.5
		torso.y = -torso.item.height

	} else {

    const leg1Attachment = leg1.item.attachment as AttachmentPoint
    
		leg1.x = (-leg1.item.width - (torsoAttachment!.leg2.x - torsoAttachment.leg1.x)) * 0.5
		leg1.y =  -leg1.item.height

		torso.x = leg1.x + leg1Attachment.x - torsoAttachment.leg1.x
		torso.y = leg1.y + leg1Attachment.y - torsoAttachment.leg1.y

	}

  // If has drone, set drone position. We
	// don't use attachment points for that
	if (droneActive && drone) {
		drone.x = torso.x - drone.item.width * 0.5
		drone.y = torso.y - drone.item.height - 20
	}

  // Attach the other parts
  for (let i = 0; i < parts.length; i++) {

    const part = parts[i]

    if (part !== null && !skipAttaching.includes(part.name)) {
      const partAttachment = part.item.attachment as AttachmentPoint
      const partName = part.name as keyof TorsoAttachment
      part.x = torso.x + torsoAttachment[partName].x - partAttachment.x
      part.y = torso.y + torsoAttachment[partName].y - partAttachment.y
    }

  }

}


/** This gets the minimum width and height for the
  * canvas. Use this after calling attachParts
  */
function getImageFormation (parts: ReturnType<typeof createParts>) {

  const topLeft = { x: Infinity, y: Infinity }
  const botRight = { x: -Infinity, y: -Infinity }

  for (const part of parts) {
    if (part) {
      topLeft.x = Math.min(topLeft.x, part.x)
      topLeft.y = Math.min(topLeft.y, part.y)
      botRight.x = Math.max(botRight.x, part.x + part.item.width)
      botRight.y = Math.max(botRight.y, part.y + part.item.height)
    }
  }

  return {
    width: botRight.x - topLeft.x,
    height: botRight.y - topLeft.y,
    shift: topLeft
  }

}

</script>



{#if errorMessage}
  <div style={$$props.style}>
    {errorMessage}
  </div>
{:else}
  <canvas bind:this={canvas} style={$$props.style}>
    Can't render mech! Your browser does not support canvas.
  </canvas>
{/if}



<style>

canvas {
  position: absolute;
  display: block;
  object-fit: contain;
  max-height: 100%;
  max-width: 100%;
}

div {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-error);
  max-height: 80%;
  max-width: 80%;
  height: 100%;
  width: 100%;
}

</style>
