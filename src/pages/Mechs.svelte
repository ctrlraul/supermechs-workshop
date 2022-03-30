<script lang="ts">

import * as router from 'svelte-spa-router'
import * as UserDataManager from '../managers/UserDataManager'
import Header from '../components/Header.svelte'
import MechCard from '../components/MechCard.svelte'
import Mech from '../mechs/Mech'
import SvgIcon from '../components/SvgIcon/SvgIcon.svelte'
import MechCanvas from '../components/MechCanvas.svelte'
import MechSummary from '../components/MechSummary.svelte'
import { addPopup } from '../managers/PopupManager'
import { itemsPackData } from '../stores'
import { currentMech, mechs } from '../stores/mechs'
import { items2ids } from '../items/ItemsManager'



// State

let selectedMechs = [] as Mech[]



// Events

function onSelectMech (mech: Mech): void {
  UserDataManager.setCurrentMechID(mech.id)
  router.pop()
}


function onDeleteMech (id: string): void {
  UserDataManager.deleteMechInCurrentPackByID(id)
}


function onCreateMech (): void {

  const mech = UserDataManager.createMechForCurrentPack(true)

  UserDataManager.setCurrentMechID(mech.id)

}


function onClickImportMechs (): void {

  interface HTMLInputEvent extends Event {
    target: HTMLInputElement & EventTarget;
  }

  const input = document.createElement('input')

  input.type = 'file'

  input.addEventListener('change', event => {

    const e = event as HTMLInputEvent

    if (e.target && e.target.files) {

      const file = e.target.files[0]
      const reader = new FileReader()

      reader.addEventListener('load', event => {

        if (typeof event.target?.result === 'string') {

          const base64 = event.target.result.split(',')[1]
          let data

          try {
            data = JSON.parse(atob(base64))
          } catch (error) {
            console.error('Failed to import mechs', error)
            return
          }

          UserDataManager.importMechs(data)

        }
      })

      reader.readAsDataURL(file)
    }
  })

  input.click()

}


function onClickExportMechs (): void {

  if (selectedMechs.length) {

    UserDataManager.exportMechs(selectedMechs)
    
  } else {

    addPopup({
      title: 'Export Mechs',
      message: 'No mechs selected, export all of them instead?',
      options: {
        Yes () {
          UserDataManager.exportMechs($mechs)
          this.remove()
        },
        Cancel () {
          this.remove()
        }
      }
    })

  }

}


function onToggleSelected (mech: Mech): void {
  if (selectedMechs.includes(mech)) {
    selectedMechs.splice(selectedMechs.indexOf(mech), 1);
    selectedMechs = [...selectedMechs];
  } else {
    selectedMechs = [...selectedMechs, mech];
  }
}


function onSetActive (mech: Mech): void {
  if ($currentMech && mech.id === $currentMech.id) {
    onSelectMech(mech)
  } else {
    $currentMech = mech
  }
}

</script>



<main>

  <Header
    title="Mechs Manager"
    onGoBack={() => router.replace('/workshop')}
    style="grid-area: header"
  />

  <div class="current-mech-view">

    {#if $currentMech !== null}

      {#if $currentMech.setup[Mech.TORSO_INDEX] !== null}

        <div class="mech-view-container">
          <MechCanvas
            setup={items2ids($currentMech.setup)}
            style="max-width: 90%; max-height: 100%"
          />
        </div>

      {:else}

        <SvgIcon
          name="mech"
          color="var(--color-secondary)"
          style="max-width: 60%; max-height: 60%; margin: auto"
        />

      {/if}

      <MechSummary
        mech={$currentMech}
        showName={false}
        style="width: 100%" 
      />

    {:else}

      <div class="classic-box no-active-mech">
        Select a mech!
      </div>

    {/if}

  </div>

  <div class="pack-info">
    <div>Pack: {$itemsPackData !== null ? $itemsPackData.name : '[No Items Pack loaded!]'}</div>
    <div>Mechs: {$mechs.length}</div>
  </div>


  <div class="extra-buttons">
    <button class="classic-box" on:click={onCreateMech}>
      Create New Mech
    </button>

    <button class="classic-box" on:click={onClickImportMechs}>
      Import
    </button>

    <button
      class="classic-box"
      on:click={onClickExportMechs}
      style={selectedMechs.length ? '' : 'opacity: 0.5; cursor: not-allowed'}>
      Export
    </button>
  </div>


  <div class="mechs-list">
    {#if $mechs.length}
      {#each [...$mechs].reverse() as mech}
        <MechCard
          active={$currentMech !== null && mech.id === $currentMech.id}
          mech={mech}
          onSetActive={onSetActive}
          onDelete={onDeleteMech}
          onToggleSelected={onToggleSelected}
          selected={selectedMechs.includes(mech)}
        />
      {/each}
    {:else}
      <div class="no-mechs">
        No mechs!
        <button on:click={onCreateMech}>
          <SvgIcon name="plus" color="var(--color-text)" />
        </button>
      </div>
    {/if}
  </div>

</main>



<style>

main {
  display: grid;
  grid-template-rows: 3em 1fr 3em 5em;
  grid-template-columns: 33% 67%;
  grid-template-areas:
    'header header'
    'current-mech mechs-list'
    'pack-info mechs-list'
    'buttons mechs-list';
  width: 100%;
  height: 100%;
  max-width: var(--content-width);
  max-height: var(--content-height);
}


.current-mech-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  padding: 0.5em;
  padding-top: 0;
  gap: 0.5em;
  grid-area: current-mech;
}


.mech-view-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
  flex: 1;
}


.pack-info {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  grid-area: pack-info;
}


.mechs-list {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5em;
  padding-bottom: 0.5em;
  padding-right: 0.5em;
  overflow-x: hidden;
  overflow-y: scroll;
  grid-area: mechs-list;
}

.extra-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  align-content: center;
  gap: 0.5em;
  padding: 0.5em;
  flex-wrap: wrap;
  grid-area: buttons;
}

.extra-buttons > button {
  width: calc(50% - 0.25rem);
  height: calc(50% - 0.25rem);
}

.extra-buttons > button:first-of-type {
  width: 100%;
}


.no-mechs {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1em;
  width: 100%;
  height: 100%;
  background-color: var(--color-background);
  border-radius: var(--ui-radius);
  font-size: 1.4em;
}

.no-mechs > button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background-dark);
  width: 4em;
  height: 4em;
  border-radius: inherit;
  padding: 0.6em;
}


.no-active-mech {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}



@media (orientation: portrait) {

  main {
    grid-template-rows: 3em 4em 1fr 7em;
    grid-template-columns: 1fr;
    grid-template-areas:
      'header'
      'pack-info'
      'mechs-list'
      'buttons';
  }

  .mechs-list {
    grid-template-columns: 1fr 1fr;
    padding-left: 0.5em;
  }

  .current-mech-view {
    display: none;
  }

}

</style>
