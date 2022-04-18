<script lang="ts">

import MechCanvas from './MechCanvas.svelte'
import { items2ids } from '../items/ItemsManager'



// Types

import type Mech from '../mechs/Mech'
import SvgIcon from './SvgIcon/SvgIcon.svelte'



// Props

export let title: string
export let mechs: Mech[]
export let multiple = false
export let onPick: (mechs: Mech[]) => void



// State

let selectedMechs: Mech[] = []



// Functions

function selectMech (mech: Mech): void {

  if (!multiple) {
    onPick([mech])
    return
  }

  const index = selectedMechs.indexOf(mech)

  if (index !== -1) {
    selectedMechs.splice(index, 1)
  } else {
    selectedMechs.push(mech)
  }

  selectedMechs = selectedMechs

}


function selectAll (): void {
  if (selectedMechs.length === mechs.length) {
    selectedMechs = []
  } else {
    selectedMechs = [...mechs]
  }
}


function done (): void {
  onPick(selectedMechs)
}

</script>



<div class="mech-picker global-darkscreen">

  <div class="content global-box global-main-content">

    <header>
      <span>{title}</span>
      <button class="quit-button" on:click={() => onPick([])}>
        <SvgIcon name="cross" color="var(--color-text)" />
      </button>
    </header>

    <ul class="mechs-list">
  
      {#each [...mechs].reverse() as mech}
  
        <li
          class={selectedMechs.includes(mech) ? 'active' : ''}
          on:click={() => selectMech(mech)}>

          <span>{mech.name}</span>

          <MechCanvas
            setup={items2ids(mech.getItems())}
            droneActive
            outlineThickness={0}
            style="bottom: 0.3em; height: 10em; width: 100%;"
          />

        </li>
  
      {/each}
  
    </ul>
  
    {#if multiple}
      <footer>
        <button on:click={selectAll}>
          Select All
        </button>
        <button on:click={done}>
          Done
        </button>
      </footer>
    {/if}

  </div>

</div>



<style>

.content {
  position: relative;
  display: grid;
  overflow: hidden;
  padding: 0.5em;
}


header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5em;
}

header span {
  font-size: 1.3em;
}


.quit-button {
  width: 2em;
  height: 2em;
}


.mechs-list {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 0.5em;
  padding-right: 0.5em;
  align-content: flex-start;
  overflow-y: scroll;
}

.mechs-list li {
  position: relative;
  display: grid;
  grid-template-rows: 1.2em 10em;
  list-style: none;
  background-color: var(--color-primary-dark);
  padding: 0.5em;
  border-radius: var(--ui-radius);
  border: 0.2em solid var(--color-primary-dark);
  transition: border-color 200ms;
  cursor: pointer;
}

.mechs-list li:focus,
.mechs-list li.active {
  border-color: var(--color-accent);
}

.mechs-list li span {
  width: 100%;
  text-align: center;
}


footer {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 3em;
  padding-top: 0.5em;
}

footer button {
  height: 100%;
  padding: 0 1em;
}



@media (max-width: 799px) {
  .mechs-list {
    grid-template-columns: 1fr 1fr 1fr;
  }
}



@media (max-width: 630px) {
  .mechs-list {
    grid-template-columns: 1fr 1fr;
  }
}



@media (max-width: 400px) {
  .mechs-list {
    grid-template-columns: 1fr;
  }
}

</style>
