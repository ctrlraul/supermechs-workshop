<script lang="ts">

import StatBlocks from './StatBlocks.svelte'
import SvgIcon from './SvgIcon/SvgIcon.svelte'
import { saveMech } from '../managers/UserDataManager'
import { items2ids } from '../items/ItemsManager'


import type Mech from '../mechs/Mech'


export let mech: Mech
export let showName = true



// Functions

function onRename (e: Event): void {

  const { value } = e.target as HTMLInputElement

  mech.name = value || 'Unnamed Mech'

  saveMech(mech)

}

</script>



<div class="mech-summary no-select global-box" style={$$props.style}>

  {#if showName}
    <div class="header">

      <SvgIcon
        name="mech"
        color="var(--color-text)"
        style="width: 1.5em; height: 1.5em;"
      />

      <input
        type="text"
        value={mech.name}
        on:change={onRename}
        placeholder="Unnamed Mech"
      />

    </div>
  {/if}

  <div class="blocks">
    <StatBlocks source={items2ids(mech.getItems())} />
  </div>

</div>



<style>

.mech-summary {
  position: relative;
  display: flex;
  justify-content: center;
  flex-direction: column;
  padding: 0.5em;
  margin-bottom: 0.5em;
  align-self: end;
}


.header {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5em;
}

.header input[type=text] {
  flex: 1;
  margin-left: 0.5em;
  padding: 0 0.2em;
}


.blocks {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  width: 100%;
  gap: 0.5em;
}

</style>
