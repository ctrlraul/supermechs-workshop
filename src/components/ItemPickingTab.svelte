<script lang="ts">

import ItemInfo from './ItemInfo.svelte'
import ItemButton from './ItemButton.svelte'
import Header from './Header.svelte'
import { getStatInstruction } from '../stats/StatsManager'
import { clickOutside } from '../utils/useClickOutside'
import { getItemsByType } from '../items/ItemsManager'
import { chunk } from 'lodash'


export let type: Item['type']
export let currentItem: Item | null = null
export let selectItem: (itemID: Item['id']) => void



// Types

import type Item from '../items/Item'

interface Filter {
  query: string
  element: Item['element'] | null
}


// State

const isProbablyTouchDevice = window.matchMedia('(pointer: coarse)').matches
const phyDmgImgURL = getStatInstruction('phyDmg').imageURL
const expDmgImgURL = getStatInstruction('expDmg').imageURL
const eleDmgImgURL = getStatInstruction('eleDmg').imageURL

let inspectedItem: Item | null = null
let filter: Filter = { query: '', element: null }
$: itemToDisplay = inspectedItem || currentItem
$: itemsFiltered = getFilteredItemsList(filter)
$: itemGroups = getItemGroups(itemsFiltered)



// Events

function onOffClick (e: MouseEvent): void {

  try {

    const target = e.target as HTMLElement
    const selectNull = target.getAttribute('data-select-null')

    if (selectNull !== null || currentItem === null) {
      selectItem(0)
    } else {
      selectItem(currentItem.id)
    }

  } catch (err) {}

}


function onSelectItem (item: Item): void {
  if (isProbablyTouchDevice) {
    if (currentItem === null || item !== currentItem) {
      currentItem = item
    } else {
      selectItem(item.id)
    }
  } else {
    selectItem(item.id)
  }
}


function onSeach (e: Event): void {
  filter.query = (e.target as HTMLInputElement).value.toLowerCase()
}



// Functions

function toggleElementFilter (element: Item['element']): void {
  filter.element = element === filter.element ? null : element
}


function getFilteredItemsList (filter: Filter): Item[] {

  const items = getItemsByType(type)

  if (filter.query) {
    return items.filter(item => item.name.toLowerCase().includes(filter.query));
  }

  if (filter.element) {
    const elements: (Item['element'] | null)[] = ['COMBINED', filter.element]
    return items.filter(item => elements.includes(item.element))
  }

  return items

}


function getItemGroups (items: Item[]): Promise<Item[]>[] {
  return chunk(items, 10).map((group, i) => new Promise(resolve => {
    setTimeout(() => resolve(group), i * 30)
  }))
}

</script>



<div class="global-blur-sublings global-darkscreen" data-select-null use:clickOutside={onOffClick}>
  <div class="content" data-select-null use:clickOutside={onOffClick}>

    <Header
      title="Item Picking Tab"
      onGoBack={() => selectItem(0)}
      style="height: 2em;"
    />

    <div class="image-container global-box" use:clickOutside={onOffClick}>
      {#if itemToDisplay}
        <ItemButton
          item={itemToDisplay}
          active={false}
          style="width: 100%; height: 100%; padding: unset;"
          on:click={() => selectItem(itemToDisplay ? itemToDisplay.id : 0)}
        />
      {/if}
    </div>

    {#if itemToDisplay}
      <ItemInfo
        item={itemToDisplay}
        columns={3}
        style="
          grid-area: info;
          overflow-y: auto;
          max-height: 100%;
        "
      />
    {:else}
      <div class="info-placeholder global-box" style="grid-area: info;">
        Select an item!
      </div>
    {/if}


    <div class="items-list-container global-box" data-select-null>

      <div class="items-list-filters {filter.query ? 'hide-buttons' : ''}">

        <input type="text" placeholder="Search" on:input={onSeach} />

        <button
          class="global-box no-select {filter.element && filter.element !== 'PHYSICAL' ? 'global-disabled' : ''}"
          on:click={() => toggleElementFilter('PHYSICAL')}>
          <img src={phyDmgImgURL} alt="Physical"/>
        </button>

        <button
          class="global-box no-select {filter.element  && filter.element !== 'EXPLOSIVE' ? 'global-disabled' : ''}"
          on:click={() => toggleElementFilter('EXPLOSIVE')}>
          <img src={expDmgImgURL} alt="Explosive"/>
        </button>

        <button
          class="global-box no-select {filter.element && filter.element !== 'ELECTRIC' ? 'global-disabled' : ''}"
          on:click={() => toggleElementFilter('ELECTRIC')}>
          <img src={eleDmgImgURL} alt="Electric"/>
        </button>

      </div>

      {#if itemsFiltered.length}

        <div class="items-list">

          {#each itemGroups as group}
            {#await group then items}
              {#each items as item}
                <ItemButton
                  {item}
                  active={currentItem !== null && currentItem.id === item.id}
                  on:click={() => onSelectItem(item)}
                  on:mouseover={() => inspectedItem = item}
                  on:mouseout={() => inspectedItem = null}
                  on:focus={() => inspectedItem = item}
                  on:blur={() => { /* ffs svelte */ }}
                />
              {/each}
            {/await}
          {/each}

        </div>

      {:else}

        <div class="no-items-text">
          {filter.query ? 'No matches!' : 'No items loaded for this slot!'}
        </div>

      {/if}

    </div>

  </div>
</div>



<style>

.content {
  position: relative;
  display: grid;
  grid-template-rows: 2em 1fr 11.5em;
	grid-template-columns: 18em 1fr;
  grid-template-areas:
    'header header'
    'item-image items'
    'info items';
  gap: 0.5em;
  width: 100%;
  height: 100%;
  max-width: var(--content-width);
  max-height: var(--content-height);
}


.image-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  grid-area: item-image;
}


.info-placeholder {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  max-height: 100%;
}



.items-list-container {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: var(--ui-radius);
  overflow: hidden;
  grid-area: items;
}


.items-list-filters {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 2em 2em 2em;
  gap: 0.5em;
  padding: 0.5em;
  background-color: var(--color-secondary);
}

.items-list-filters.hide-buttons {
  grid-template-columns: 1fr;
}

.items-list-filters.hide-buttons button {
  display: none;
}


.items-list-filters button {
  width: 2em;
  height: 2em;
}

.items-list-filters button img {
  width: 90%;
  height: 90%;
}


.items-list {
  position: relative;
  display: flex;
  align-content: flex-start;
  flex-wrap: wrap;
  padding: 0.5em;
  overflow-y: auto;
  overflow-x: hidden;
  gap: 1.4%;
  flex: 1;
}


.no-items-text {
  position: relative;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}


@media (orientation: portrait) {

  .content {
    grid-template-rows: 2em 10em 11.5em 1fr;
    grid-template-columns: 1fr;
    grid-template-areas:
      'header'
      'item-image'
      'info'
      'items';
    max-width: unset;
    max-height: unset;
  }

}

</style>
