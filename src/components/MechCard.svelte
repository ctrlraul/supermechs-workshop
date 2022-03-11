<script lang="ts">

import { saveMech } from '../mechs/MechsManager'
import MechCanvas from './MechCanvas.svelte'

import type Mech from '../mechs/Mech'
import type { Orientations } from '../stores'


export let active: boolean = false
export let mech: Mech
export let onSetActive: (mech: Mech) => void
export let onDelete: (mechID: string) => void
export let orientation: Orientations = 'landscape'
export let onToggleSelected: null | ((mech: Mech) => void) = null
export let selected = false



const MAX_MECH_NAME_LENGTH = 32

$: saveMech(mech.toJSONModel())

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
      placeholder="(no name)"
      spellCheck="false"
      max={MAX_MECH_NAME_LENGTH}
      bind:value={mech.name}
    />

    {#if orientation === 'portrait'}
      <div class="buttons-container">
        <button class="classic-box" on:click={() => onDelete(mech.id)}>Delete</button>
        <button class="classic-box" on:click={() => onSetActive(mech)}>Equip</button>
      </div>
    {/if}

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
  background-color: var(--color-background);

  /* Aspect Ratio Hack */
  height: 0;
  padding-top: var(--size);
}

.mech-card.active {
  background: var(--color-border);
}


.content {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}


.mech-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
  flex: 1;
}


input[type=text] {
  position: relative;
  text-align: center;
  width: 100%;
  height: 1.5em;
  color: inherit;
  border-radius: 0;
  font-family: inherit;
  font-size: inherit;
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
    padding-top: calc(50% - 0.25em);
  }

  .mech-container {
    height: 80%;
  }

  .buttons-container {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    align-content: center;
    gap: 0.5em;
    flex-wrap: wrap;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 20%;
  }

  .buttons-container > button {
    width: calc(50% - 0.75rem);
    height: calc(100% - 0.5rem);
  }

  input[type=checkbox] {
    bottom: calc(22%);
  }
}
</style>
