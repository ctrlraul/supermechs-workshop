<script lang="ts">

import ItemInfo from './ItemInfo.svelte'
import SvgIcon from './SvgIcon/SvgIcon.svelte'
import ItemImage from './ItemImage.svelte'
import { itemsPackData } from '../stores'
import { getStatInstruction } from '../stats/StatsManager'


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



// Events

function onOffClick (e: MouseEvent): void {

  try {

    // @ts-ignore
    const selectNull = e.target!.getAttribute('data-select-null')

    if (selectNull) {
      selectItem(0)
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

  const items = ($itemsPackData ? $itemsPackData.items.filter(item => item.type === type) : []) as Item[]

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

</script>



<div class="item-picking-tab global-blur-sublings global-darkscreen" data-select-null on:click={onOffClick}>
  <div class="content" data-select-null>

    <header>
      <input type="text" placeholder="Search" on:input={onSeach} />
      <div class="item-filters" style={filter.query ? 'filter: contrast(0.75) brightness(0.25);' : ''}>
        <button
          class="classic-box"
          style="{!filter.element || (filter.element === 'PHYSICAL') ? '' : 'opacity:0.5'}"
          on:click={() => toggleElementFilter('PHYSICAL')}>
          <img src={phyDmgImgURL} alt="Physical"/>
        </button>
        <button
          class="classic-box"
          style="{!filter.element || (filter.element === 'EXPLOSIVE') ? '' : 'opacity:0.5'}"
          on:click={() => toggleElementFilter('EXPLOSIVE')}>
          <img src={expDmgImgURL} alt="Explosive"/>
        </button>
        <button
          class="classic-box"
          style="{!filter.element || (filter.element === 'ELECTRIC') ? '' : 'opacity:0.5'}"
          on:click={() => toggleElementFilter('ELECTRIC')}>
          <img src={eleDmgImgURL} alt="Electric"/>
        </button>
      </div>
      <button on:click={() => selectItem(0)} class="classic-box">
        <SvgIcon name="cross" color="var(--color-text)" />
      </button>
    </header>

    <div class="image-container">
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
      <div class="info-placeholder classic-box">
        Select an item!
      </div>
    {/if}

    <div class="items-list classic-box" data-select-null>

      {#if itemsFiltered.length}

        {#each itemsFiltered as item}
          <button
            class={currentItem && item.id === currentItem.id ? 'active' : ''}
            on:mouseover={() => inspectedItem = item}
            on:mouseout={() => inspectedItem = null}
            on:click={() => onSelectItem(item)}
            on:focus={() => { /* ffs svelte */ }}
            on:blur={() => { /* ffs svelte */ }}>
            <ItemImage {item} style="
              position: absolute;
              left: 5%;
              top: 5%;
              width: 90%;
              height: 90%;
              z-index: 1;
            "/>
          </button>
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

.item-filters {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 1em;
}

.item-filters > button {
  width: 2em;
  height: 2em;
  margin-right: 0.5em;
}

.item-filters > button > img {
  width: 100%;
  height: 100%;
}

header > button {
  width: 2em;
  height: 2em;
  margin-left: auto;
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
  justify-content: center;
  flex-wrap: wrap;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.4em;
  gap: 1.4%;
  grid-area: items;
  margin: 0.4em;
}

.items-list > button {
  --size: 11.2%;
  position: relative;
  display: inline-block;
  width: var(--size);
  height: 0;
  padding: 0;
  padding-top: var(--size);
  will-change: visibility;
  background: var(--color-background-dark);
}

.items-list > button.active {
  background: var(--color-border);
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
    grid-template-rows: 5.5em 14em 1fr;
    grid-template-columns: 1fr 1fr;
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

  .item-picking-tab > .content > .items-list > button {
    --size: 15.5%;
  }

}

</style>
