<script lang="ts">

import StatBlocks from './StatBlocks.svelte'


import type Item from '../items/Item'


export let item: Item
export let columns = 2


const hasAnyTag = Object.values(item.tags).includes(true)
const displayTags: [keyof Item['tags'], string][] = [
 ['custom', '#44eebb'],
 ['premium', '#eeaa44'],
 ['require_jump', '#ee5511']
]


</script>



<div class="item-info global-box no-select" style={$$props.style}>

  <header>

    <div>{item.name}</div>
    <span class="kind">({item.kind.replace(/_/g, ' ')})</span>

    {#if hasAnyTag}
      <div class="tags">
        {#each displayTags as [tag, color]}
          {#if item.tags[tag]}
            <span style="color: {color};">{tag.replace(/_/g, ' ')}</span>
          {/if}
        {/each}
      </div>
    {/if}

  </header>

  <div class="stats" style="grid-template-columns:{' 1fr'.repeat(columns)};">
    <StatBlocks source={item.id} />
  </div>

</div>



<style>

.item-info {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: var(--ui-radius);
  overflow: hidden;
}


header {
  position: relative;
  padding: 0.5em;
  background-color: var(--color-secondary);
  width: 100%;
  text-align: center;
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

.stats {
  position: relative;
  display: grid;
  gap: 0.5em;
  width: 100%;
  padding: 0.5em;
}

</style>