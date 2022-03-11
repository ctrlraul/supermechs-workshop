<script lang="ts">

import { onMount } from 'svelte'
import MechCanvas from '../../components/MechCanvas.svelte'
import { items2ids } from '../../items/ItemsManager'
import Mech from '../../mechs/Mech'
import { createMechForCurrentPack, getMechs, saveMech, setLastMech } from '../../mechs/MechsManager'
import * as Stores from '../../stores'

export let onPickMech: (mech: Mech) => void
export let title: string = 'Pick Mech'
export let allowCreating: boolean = false


$: mechs = [] as Mech[]
let itemsPackData: Stores.ItemsPackData | null = null



onMount(() => {
  if (itemsPackData !== null) {
    mechs = getFightableOpponentMechs()
  }
})


Stores.itemsPackData.subscribe(value => {
  
  if (value !== null) {
    mechs = getFightableOpponentMechs()
  } else {
    mechs = []
  }

  itemsPackData = value
  
})


// Utils

function getFightableOpponentMechs (): Mech[] {
  return (
    getMechs()
      // So mechs recently created show up first
      .reverse()
      // Keep only mechs with torso and legs
      .filter(mech => mech.setup[Mech.TORSO_INDEX] && mech.setup[Mech.LEGS_INDEX])
      // Map to Mech instances
      .map(mech => new Mech(mech))
  )
}



// Events

function onCreateNewMech (): void {
  const mech = new Mech(createMechForCurrentPack())
  setLastMech(mech.id)
  saveMech(mech.toJSONModel())
  onPickMech(mech)
}

</script>



<div class="mech-picker">
  <div class="contents classic-box">

    <header>
      {title}
      {#if allowCreating}
        <button class="create-new-mech" on:click={onCreateNewMech}>
          Create New Mech
        </button>
      {/if}
    </header>

    <div class="mechs-list">
      {#each mechs as mech}
        <button class="mech-button" on:click={() => onPickMech(mech)}>
          <MechCanvas
            setup={items2ids(mech.setup)}
            style="
              position: absolute;
              width: 90%;
              max-height: 80%;
              left: 5%;
              bottom: 0.2em;
            "
          />
          <div class="mech-name">
            {mech.name}
          </div>
        </button>
      {/each}
    </div>

  </div>
</div>



<style>

.mech-picker {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000000a0;
  z-index: 30;
}


.contents {
  position: relative;
  width: 27em;
  display: flex;
  flex-direction: column;
}


header {
  position: relative;
  width: 100%;
  height: 2.5em;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.35em 0 0.7em;
  background-color: var(--color-background-dark);
  font-size: 1.2em;
  border-top-left-radius: var(--ui-radius);
  border-top-right-radius: var(--ui-radius);
  box-shadow: 0 0.1em 1em -0.2em black;
  z-index: 1;
}


.mechs-list {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 1em;
  width: 100%;
  max-height: 20em;
  overflow-y: auto;
  padding: 1em;
}


.mech-button {
  position: relative;
  width: 7.5em;
  height: 7.5em;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  background-color: var(--color-background-dark);
  overflow: hidden;
  border-radius: var(--ui-radius);
}

.mech-name {
  position: absolute;
  left: 0;
  top: 0.2em;
  width: 100%;
  height: 1.2em;
  font-size: 0.84em;
}


.create-new-mech {
  position: relative;
  width: 8em;
  height: 2em;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background);
  font-size: 0.85em;
  border-radius: var(--ui-radius);
}


@media (orientation: portrait) {
  .contents {
    width: 18.5em;
    height: 80%;
  }
}

</style>
