<script lang="ts">


import StatBlocks from './StatBlocks.svelte'
// import SvgIcon from './SvgIcon/SvgIcon.svelte'
// import { Tags } from '../items/ItemsManager'

import type Item from '../items/Item'


export let item: Item

const colorForTag: Record<string, string> = {
  custom: '#44eebb',
  unreleased: '#ee44dd',
  premium: '#eeaa44',
  require_jump: '#ee5511',
  melee: '#ae9aff',
}

// $: isPremium = item.tags.includes(Tags.PREMIUM)

</script>



<div class="item-info global-box no-select {$$props.class}" style={$$props.style}>

  <div>{item.name}</div>
  <span class="kind">({item.kind.replace(/_/g, ' ')})</span>

  {#if item.tags.length}
    <div class="tags">
      {#each item.tags as tag}
        <span style="color: {colorForTag[tag] || 'inherit'}">
          {tag.replace(/_/g, ' ')}
        </span>
      {/each}
    </div>
  {/if}

  <div class="separator"></div>

  <div class="stats">
    <StatBlocks source={item.id} />
  </div>

  <!-- {#if isPremium}
    <SvgIcon
      name="star"
      style="
        position: absolute;
        right: 0.25em;
        top: 0.25em;
        z-index: 2;
        width: 0.8em;
        height: 0.8em;
        fill: rgb(238, 170, 68);
      "
    />
  {/if} -->

</div>



<style>

.item-info {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5em;
}

.kind {
  color: var(--color-text-dark);
  font-size: 0.8em;
}

.tags {
  font-size: 0.75em;
}

.tags > span {
  margin-left: 0.5em;
}

.tags > span:first-of-type {
  margin-left: 0;
}

.kind,
.tags > span {
  text-transform: capitalize;
}

.separator {
  position: relative;
  width: 100%;
  height: 0.1em;
  background-color: var(--color-secondary);
  margin: 0.5em 0;
}

.stats {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  gap: 0.5em;
}

</style>