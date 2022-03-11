<script lang="ts">

import * as router from 'svelte-spa-router'
import Header from '../components/Header.svelte'
import MechCard from '../components/MechCard.svelte'
import * as MechsManager from '../mechs/MechsManager'
import { addPopup } from '../managers/PopupManager'
import { itemsPackData, orientation, currentMech } from '../stores'
import Mech from '../mechs/Mech'
import SvgIcon from '../components/SvgIcon/SvgIcon.svelte'



// State

let mechs = [] as Mech[]
let selectedMechs = [] as Mech[]
$: activeMech = $currentMech ? new Mech($currentMech) : null



// Stores

itemsPackData.subscribe(value => {

  if (value === null) {
    mechs = []
    $currentMech = null
  } else {
    mechs = MechsManager.getMechs().reverse().map(json => new Mech(json))
    $currentMech = mechs.length ? MechsManager.getLastMech() : null
  }

})



// Events

function onSelectMech (mech: Mech): void {
  MechsManager.setLastMech(mech.id)
  $currentMech = mech.toJSONModel()
  router.pop()
}


function onChangeName (mech: Mech, name: string): void {
  mech.name = name.trim()
  if ($currentMech && mech.id === $currentMech.id) {
    $currentMech.name = name.trim()
  }
  MechsManager.saveMech(mech.toJSONModel())
}


function onDeleteMech (id: string): void {

  MechsManager.deleteMech(id)

  mechs = mechs.filter(mech => mech.id !== id)

  if (activeMech && id === activeMech.id) {
    if (mechs.length === 0) {
      $currentMech = MechsManager.createMechForCurrentPack()
      router.pop()
    } else {
      $currentMech = mechs[0].toJSONModel()
    }
  }

}


function onCreateMech (): void {
  const mech = new Mech(MechsManager.createMechForCurrentPack())
  const json = mech.toJSONModel()
  MechsManager.saveMech(json)
  MechsManager.setLastMech(mech.id)
  $currentMech = json
  router.replace('/workshop')
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

          MechsManager.importMechs(data)
          mechs = MechsManager.getMechs().map(json => new Mech(json))

        }
      })

      reader.readAsDataURL(file);
    }
  })

  input.click()

}


function onClickExportMechs (): void {

  if (selectedMechs.length) {

    MechsManager.exportMechs(selectedMechs.map(mech => mech.toJSONModel()))
    
  } else {

    addPopup({
      title: 'Export Mechs',
      message: 'No mechs selected, export all of them instead?',
      options: {
        Yes () {
          MechsManager.exportMechs(MechsManager.getMechs())
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
    activeMech = mech
    $currentMech = mech.toJSONModel()
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

    {#if activeMech}

      <MechCard
        mech={activeMech}
        scale={0.6}
        onSetActive={onSelectMech}
        onChangeName={onChangeName}
        onDelete={onDeleteMech}
        style="width:100%; flex:1; margin:0"
      />

      <div class="buttons-container">
        <button
          class="classic-box"
          on:click={() => {
            if (activeMech) {
              onDeleteMech(activeMech.id)
            }
          }}>
          Delete
        </button>
        <button
          class="classic-box"
          on:click={() => {
            if (activeMech) {
              onSelectMech(activeMech)
            }
          }}>
          Select
        </button>
      </div>

    {:else}

      <div class="classic-box no-active-mech">
        No active mech!
      </div>

    {/if}

  </div>

  <div class="pack-info">
    <div>Pack: {$itemsPackData !== null ? $itemsPackData.name : '[No Items Pack loaded!]'}</div>
    <div>Mechs: {mechs.length}</div>
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


  <div class="mechs-container">
    {#if mechs.length}
      {#each mechs as mech}
        <MechCard
          mech={mech}
          scale={0.5}
          active={$currentMech !== null && mech.id === $currentMech.id}
          selected={selectedMechs.includes(mech)}
          onToggleSelected={onToggleSelected}
          onSetActive={onSetActive}
          onChangeName={onChangeName}
          onDelete={onDeleteMech}
          style={
            $orientation === 'portrait'
            ? 'width: calc(50% - 0.25em); margin: 0;'
            : ''
          }
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
  grid-template-columns: 30% 70%;
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

.current-mech-view > .buttons-container {
  width: 100%;
  height: 2em;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5em;
}

.current-mech-view > .buttons-container > button {
  width: 50%;
  height: 100%;
}

.current-mech-view > .buttons-container > button:first-of-type {
  --color: var(--color-error);
}

.current-mech-view > .buttons-container > button:last-of-type {
  --color: var(--color-success);
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


.mechs-container {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  overflow-x: hidden;
  overflow-y: scroll;
  padding-bottom: 0.2em;
  gap: 0.6em;
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

  .mechs-container {
    padding: 0.5em;
    gap: 0.5em;
  }

  .current-mech-view {
    display: none;
  }

}

</style>
