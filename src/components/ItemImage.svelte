<script lang="ts">

import { onMount } from 'svelte'
import type Item from '../items/Item'
import { BattleItem, getItemByIdOrThrow, renderItem } from '../items/ItemsManager'


export let item: Item | BattleItem

let canvas: HTMLCanvasElement

$: usableItem = getItemByIdOrThrow(item.id)


// I know this looks weird but chill
onMount(() => updateImage(usableItem))
$: { updateImage(usableItem) }


function updateImage (item: Item) {
  if (canvas) {
    const ctx = canvas.getContext('2d')!
    canvas.width = item.width
    canvas.height = item.height
    renderItem(ctx, item, 0, 0, item.width, item.height)
  }
}

</script>



<canvas style={$$props.style} bind:this={canvas} class={item.name}></canvas>



<style>

canvas {
  object-fit: contain;
  -o-object-fit: contain;
}

</style>