<script lang="ts">

import Header from '../../components/Header.svelte'
import Toggle from './Toggle.svelte'
import { UserData, userData } from '../../stores/userData'
import { push } from 'svelte-spa-router'
import { isInMatchMaker, isWaitingResponse } from '../../stores/isInMatchMaker'
import { addPopup } from '../../managers/PopupManager'
// import { itemsPackStore } from '../../items/ItemsManager';



// Types

interface ToggleConfig {
  label: string
  key: keyof UserData['settings']
  description: string
  // disabled(): boolean
}



// Data

const togglesConfig: ToggleConfig[] = [{
  label: 'Arena buffs',
  key: 'arenaBuffs' as keyof UserData['settings'],
  description: 'Apply arena buffs to item and mech stats<br><br>Note: Always off for legacy item packs, otherwise always on in battles',
  // disabled: () => !!$itemsPackStore?.legacy,
}, {
  label: 'Advanced damage display',
  key: 'advancedDamageDisplay' as keyof UserData['settings'],
  description: 'Show average damage and damage spread instead of raw item damage in item stats',
  // disabled: () => !!$itemsPackStore?.legacy,
}, {
  label: 'Control computer\'s mech',
  key: 'controlOfflineOpponent' as keyof UserData['settings'],
  description: 'Control both mechs in battles versus computer',
  // disabled: () => false,
}, {
  label: 'Items pack auto-load',
  key: 'automaticallyLoadLastItemsPack' as keyof UserData['settings'],
  description: 'Automatically load the last items pack you used<br><br>Note: Only the default and packs loaded from links can be auto-loaded',
  // disabled: () => false,
}]



// Functions

function onClickChangeItemsPack (): void {

  if (!$isInMatchMaker && !$isWaitingResponse) {
    push('/')
    return
  }

  addPopup({
    title: 'Hold on!',
    message: "Can't change items pack while searching for a battle!",
    mode: 'error',
    options: {
      Ok () { this.remove() },
    }
  })

}

</script>



<main>

  <Header title="Settings" />

  <ul>

    {#each togglesConfig as config}
      <li class="global-box {false ? "disabled" : ""}">

        <header>
          <Toggle
            value={$userData.settings[config.key]}
            onToggle={value => $userData.settings[config.key] = value}
            disabled={false}
          />

          <span>{config.label}</span>
        </header>

        <div class="description-container">
          <div class="description">
            {@html config.description}
          </div>
        </div>

        {#if false}
          <div class="disabled-cover"></div>
        {/if}

      </li>
    {/each}

    <li class="global-box" on:click={onClickChangeItemsPack}>
      <button>Change Items Pack</button>

      <div class="description-container">
        <div class="description">
          Brings you back to the pack selecting screen
        </div>
      </div>
    </li>

  </ul>

</main>



<style>

main {
  display: grid;
  grid-template-rows: 2em 1fr;
  grid-template-areas:
    'header'
    '.';
  gap: 0.5em;
  max-height: var(--content-height);
  max-width: var(--content-width);
  height: 100%;
  width: 100%;
  padding: 0.5em;
}

ul {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-content: flex-start;
  gap: 0.5em;
  padding: 0 0.5em 0.5em 0;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
}

li {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 10em;
  padding: 0.5em;
}

li header,
ul button {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 0.5em;
}

li span {
  margin-left: 0.5em;
}

li .description-container {
  position: relative;
  display: block;
  width: 100%;
  flex: 1;
  background-color: #00000060;
  padding: inherit;
  border-radius: inherit;
  overflow-y: auto;
}

li .description-container .description {
  font-size: 0.85em;
}



li button {
  width: 100%;
  justify-content: start;
  padding: inherit;
}


.disabled {
  opacity: 0.5;
}



@media (max-width: 785px) {
  ul {
    grid-template-columns: 1fr 1fr;
  }
}



@media (max-width: 550px) {
  ul {
    grid-template-columns: 1fr;
  }
}

</style>
