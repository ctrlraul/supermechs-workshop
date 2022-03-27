<script lang="ts">

import { saveMech } from '../mechs/MechsManager'
import { currentMech, Orientations } from '../stores'
import MechCanvas from './MechCanvas.svelte'


import type Mech from '../mechs/Mech'


export let active: boolean = false
export let mech: Mech
export let onSetActive: (mech: Mech) => void
export let onDelete: (mechID: string) => void
export let onToggleSelected: null | ((mech: Mech) => void) = null
export let selected = false



const MAX_MECH_NAME_LENGTH = 32



function onRename (e: Event): void {

  const { value: newName } = e.target as HTMLInputElement

  mech.name = newName

  if ($currentMech !== null && mech.id === $currentMech.id) {
    $currentMech.name = newName
  }

  saveMech(mech.toJSONModel())

}

</script>



<button class="mech-card {active ? 'active' : ''}" style={$$props.style}>

  <div class="content">

    <div class="mech-container" on:click={() => onSetActive(mech)}>
      <MechCanvas
        setup={mech.toJSONModel().setup}
        style="width: 80%; max-height: 90%"
      />
    </div>

    <input
      type="text"
      placeholder="Unnamed Mech"
      spellCheck="false"
      max={MAX_MECH_NAME_LENGTH}
      value={mech.name}
      on:change={onRename}
    />

    <div class="buttons-container">
      <button class="global-box delete" on:click={() => onDelete(mech.id)}>Delete</button>
      <button class="global-box select" on:click={() => onSetActive(mech)}>Select</button>
    </div>

    {#if onToggleSelected}
      <input
        type="checkbox"
        checked={selected}
        on:input={() => onToggleSelected && onToggleSelected(mech)}
      />
    {/if}

  </div>

</button>



<style>

.mech-card {
  --size: calc(100% / 3 - 0.4em);
  position: relative;
  border-radius: var(--ui-radius);
  overflow: hidden;
  width: var(--size);
  cursor: pointer;
  background-color: var(--color-primary);
  border: 0.15em solid var(--color-primary);

  /* Aspect Ratio Hack */
  height: 0;
  padding-top: var(--size);
  transition: border-color 200ms;
}

.mech-card.active {
  transition: border-color 0ms;
  border-color: var(--color-accent);
  /* box-shadow: 0 0 0.3em var(--color-accent); */
}


.buttons-container {
  display: none;
}


.content {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 0.3em;
}


.mech-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
  flex: 1;
  border-radius: var(--ui-radius);
}


input[type=text] {
  position: relative;
  text-align: center;
  width: 100%;
  height: 1.5em;
  margin-top: 0.5em;
}


input[type=checkbox] {
  position: absolute;
  top: 0.5em;
  right: 0.5em;
  width: 1.5em;
  height: 1.5em;
}


@media (orientation: portrait) and (max-width: 767px) {

  .mech-card {
    width: calc(50% - 0.25em);
    padding-top: 60%;
  }

  .mech-container {
    height: 80%;
  }

  .buttons-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    align-content: center;
    flex-wrap: wrap;
    padding-top: 0.5em;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 20%;
  }

  .buttons-container > button {
    width: calc(50% - 0.25em);
    height: 100%;
  }

  .delete {
    background-color: var(--color-error);
  }

  .select {
    background-color: var(--color-accent);
  }

  input[type=checkbox] {
    bottom: calc(22%);
  }

}
</style>
