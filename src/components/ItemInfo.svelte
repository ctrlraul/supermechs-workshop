<script lang="ts">

import StatBlocks from './StatBlocks.svelte'


import type Item from '../items/Item'


export let item: Item


const hasAnyTag = Object.values(item.tags).includes(true)
const displayTags: [keyof Item['tags'], string][] = [
 ['custom', '#44eebb'],
 ['premium', '#eeaa44'],
 ['require_jump', '#ee5511']
]


</script>



<div class="item-info global-box no-select" style={$$props.style}>

  <div>{item.name}</div>
  <span class="kind">({item.kind.replace(/_/g, ' ')})</span>

  {#if hasAnyTag}
    <div class="tags">
      {#each displayTags as [tag, color]}
        <span style="color: {color};">{tag.replace(/_/g, ' ')}</span>
      {/each}
    </div>
  {/if}

  <div class="separator"></div>

  <div class="stats">
    <StatBlocks source={item.id} />
  </div>

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