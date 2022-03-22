<script lang="ts">

import ItemImage from './ItemImage.svelte'


import type Item from '../items/Item'


export let item: Item
export let active: boolean



const elementColors: Record<Item['element'], string> = {
  PHYSICAL: '#301500',
  EXPLOSIVE: '#440000',
  ELECTRIC: '#001530',
  COMBINED: '#151515',
}

// const tierColors: Record<string, string> = {
//   C: '#888888',
//   R: '#0088ff',
//   E: '#774488',
//   L: '#ff9900',
//   M: '#ff5522',
//   D: '#ffddff',
// }


$: activeClass = active ? 'active' : ''
$: backgroundImage = `radial-gradient(#000000, ${elementColors[item.element]})`

</script>



<button class="item-block {activeClass}"
  on:mouseover
  on:mouseout
  on:focus
  on:blur
  on:click
  style="background-image: {backgroundImage};"
>

  <ItemImage
    {item}
    style="
      position: absolute;
      left: 5%;
      top: 5%;
      width: 90%;
      height: 90%;
      z-index: 1;
    "
  />

</button>



<style>

.tier-indicator {
  position: absolute;
  transform: rotate(45deg);
  right: -0.6em;
  top: -0.6em;
  display: block;
  width: 1em;
  height: 1em;
  background-color: green;
  opacity: 0.6;
}

.item-block {
  --size: calc(11.2% - 0.3em);
  box-sizing: content-box;
  position: relative;
  display: inline-block;
  width: var(--size);
  height: 0;
  padding: 0;
  padding-top: var(--size);
  background-color: var(--color-primary-dark);
  border: 0.15em solid #ffffff30;
  border-radius: var(--ui-radius);
  overflow: hidden;
}

.item-block:hover, 
.item-block:focus,
.active {
  border-color: var(--color-accent);
  box-shadow: 0 0 0.3em var(--color-accent);
}


.premium-p {
  position: absolute;
  right: 0;
  top: 0;
}


@media (orientation: portrait) {
  .item-block {
    --size: calc(15.5% - 0.3em);
  }
}

</style>