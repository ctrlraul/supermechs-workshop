<script lang="ts">

import ItemInfo from './ItemInfo.svelte'
import SvgIcon from './SvgIcon/SvgIcon.svelte'
import ItemImage from './ItemImage.svelte'
import ItemButton from './ItemButton.svelte'
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
$: itemToDisplay = inspectedItem || currentItem
let filter: Filter = { query: '', element: null }
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
    return items.filter(item => {
      const words = item.name.toLowerCase().split(' ')
      return words.some(word => word.startsWith(filter.query))
    })
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



<div class="item-picking-tab global-blur-sublings global-darkscreen" data-select-null use:clickOutside={onOffClick}>
  <div class="content" data-select-null use:clickOutside={onOffClick}>

    <header data-select-null use:clickOutside={onOffClick}>
      <input type="text" placeholder="Search" on:input={onSeach} />
      <div class="item-filters" style={filter.query ? 'filter: contrast(0.75) brightness(0.25);' : ''}>
        <button
          class="global-box no-select"
          style="{!filter.element || (filter.element === 'PHYSICAL') ? '' : 'opacity:0.5'}"
          on:click={() => toggleElementFilter('PHYSICAL')}>
          <img src={phyDmgImgURL} alt="Physical"/>
        </button>
        <button
          class="global-box no-select"
          style="{!filter.element || (filter.element === 'EXPLOSIVE') ? '' : 'opacity:0.5'}"
          on:click={() => toggleElementFilter('EXPLOSIVE')}>
          <img src={expDmgImgURL} alt="Explosive"/>
        </button>
        <button
          class="global-box no-select"
          style="{!filter.element || (filter.element === 'ELECTRIC') ? '' : 'opacity:0.5'}"
          on:click={() => toggleElementFilter('ELECTRIC')}>
          <img src={eleDmgImgURL} alt="Electric"/>
        </button>
      </div>
      <button on:click={() => selectItem(0)} class="global-box">
        <SvgIcon name="cross" color="var(--color-text)" />
      </button>
    </header>

    <div class="image-container" use:clickOutside={onOffClick}>
      {#if itemToDisplay}
        <ItemImage item={itemToDisplay} style="
          position: relative;
          display: block;
          max-width: 80%;
          max-height: 80%;
        "/>
      {/if}
    </div>

    {#if itemToDisplay}
      <ItemInfo
        item={itemToDisplay}
        style="
          grid-area: info;
          overflow-y: auto;
          max-height: 100%;
          margin: 0.4em;
        "
      />
    {:else}
      <div class="info-placeholder global-box">
        Select an item!
      </div>
    {/if}

    <div class="items-list global-box" data-select-null>

      {#if itemsFiltered.length}

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
        
      {:else}

        <div class="no-items-text">
          No items loaded for this slot! :(
        </div>

      {/if}
      

    </div>

  </div>
</div>



<style>

.item-picking-tab {
  z-index: var(--z-index-tab);
}

.item-picking-tab > .content {
  position: relative;
  display: grid;
  grid-template-rows: 3em 1fr 14em;
	grid-template-columns: 15em 1fr;
  grid-template-areas:
    'header header'
    'item-image items'
    'info items';
  width: 100%;
  height: 100%;
  max-width: var(--content-width);
  max-height: var(--content-height);
}


header {
  position: relative;
  display: flex;
  grid-area: header;
  padding: 0.5em;
}


header > input[type=text] {
  position: relative;
  width: 16em;
  height: 2em;
}


header > button {
  margin-left: auto;
  width: 2em;
  height: 2em;
}

.item-filters {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 1em;
}

.item-filters > button {
  margin-right: 0.5em;
  width: 2em;
  height: 2em;
}

.item-filters > button > img {
  width: 90%;
    height: 90%;
}


.image-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0.5em;
  grid-area: item-image;
  overflow: hidden;
}


.info-placeholder {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  max-height: 100%;
  margin: 0.4em;
}


.items-list {
  position: relative;
  display: flex;
  align-content: flex-start;
  flex-wrap: wrap;
  overflow-y: scroll;
  overflow-x: hidden;
  padding: 0.4em;
  gap: 1.4%;
  grid-area: items;
  margin: 0.4em;
}


.no-items-text {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}


@media (orientation: portrait) {

  .item-picking-tab > .content {
    grid-template-rows: 5.5em 15em 1fr;
    grid-template-columns: 1fr 1.2fr;
    grid-template-areas:
      'header header'
      'item-image info'
      'items items';
    max-width: unset;
    max-height: unset;
  }

  header {
    flex-direction: column;
    flex-wrap: wrap;
    justify-content: space-between;
    padding: 0.5em;
  }

  header > .item-filters {
    margin: 0;
    justify-content: start;
  }

}

</style>
