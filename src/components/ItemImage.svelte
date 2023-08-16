<script lang="ts">

import { onMount } from 'svelte'
import * as ItemsManager from '../items/ItemsManager'



// Types

import type Item from '../items/Item'



// State

export let item: Item | ItemsManager.BattleItem

let canvas: HTMLCanvasElement

$: usableItem = ItemsManager.getItemByID(item.id)
$: {
  if (usableItem) {
    updateImage(usableItem);
  }
}



// Functions

function updateImage (item: Item) {
  if (canvas) {
    const ctx = canvas.getContext('2d')!
    canvas.width = item.width
    canvas.height = item.height
    ItemsManager.renderSprite(ctx, item);
  }
}


// Lifecycle

onMount(() => {
  if (usableItem) {
    updateImage(usableItem);
  }
})

</script>



<canvas style={$$props.style} bind:this={canvas} class={item.name}></canvas>



<style>

canvas {
  object-fit: contain;
  -o-object-fit: contain;
}

</style>