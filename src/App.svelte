<script lang="ts">

import Router, { replace } from 'svelte-spa-router'
import wrap from 'svelte-spa-router/wrap'
import Popup from './components/Popup.svelte'
import Tooltip from './components/Tooltip/Tooltip.svelte'
import { onMount } from 'svelte'
import { importItemsPack } from './items/ItemsManager'
import { addPopup } from './managers/PopupManager'
import { battle, itemsPackData } from './stores'
import { loadStatImages } from './stats/StatsManager'
import { userData } from './stores/userData'



// Pages

import ItemPacks from './pages/ItemPacks.svelte'
import Workshop from './pages/Workshop/Workshop.svelte'
import Mechs from './pages/Mechs.svelte'
import Lobby from './pages/Lobby/Lobby.svelte'
import Battle from './pages/Battle/Battle.svelte'
import SvgIcon from './components/SvgIcon/SvgIcon.svelte'



// Types

import type { RouteDefinition } from 'svelte-spa-router'



// Data

let didLoadStats = false


// LocalStorageHandler.loadLocalData()


onMount(async () => {

  // This doesn't really fail as of now
  await loadStatImages()
  didLoadStats = true

})



function needsItemsPack (): boolean {

  if ($itemsPackData !== null) {
    return true
  }


  if ($userData.lastItemsPackURL !== null) {

    const popup = addPopup({
      title: 'Loading last items pack...',
      hideOnOffclick: false,
      spinner: true
    })


    importItemsPack($userData.lastItemsPackURL, () => {})
      .then(result => {
        popup.remove()
        itemsPackData.set(result.data)
      })
      .catch(err => {

        popup.replace({
          title: 'Failed to load items pack!',
          message: err.message,
          mode: 'error',
          options: {
            Ok () { this.remove() }
          }
        })

        replace('/')

      })

    return true

  }

  return false

}


const routes: RouteDefinition = {

  '/': ItemPacks,

  '/workshop': wrap({
    component: Workshop,
    conditions: needsItemsPack,
  }),

  '/mechs': wrap({
    component: Mechs,
    conditions: needsItemsPack,
  }),

  '/lobby': wrap({
    component: Lobby,
    conditions: needsItemsPack,
  }),

  '/battle': wrap({
    component: Battle,
    conditions: () => needsItemsPack() && $battle !== null,
  }),

  // Redirect 404 to workshop
  '*': wrap({
    component: Workshop,
    conditions: needsItemsPack,
  }),

}


function conditionsFailed () {
  replace('/')
}

</script>



{#if didLoadStats}

  <Tooltip/>

  <Popup/>
  
  <div class="pages">
    <Router routes={routes} on:conditionsFailed={conditionsFailed}/>
  </div>

{:else}
  <div class="loading">

    <img src="/assets/images/logo-white.svg" alt="logo" />
    
    <div class="spinner-container">
      <SvgIcon name="aim" class="spinner" color="var(--color-text)" />
    </div>

  </div>
{/if}



<style>

img {
  margin-top: 1em;
  width: 5em;
  height: 5em;
}

.spinner-container {
  position: absolute;
  left: 0;
  bottom: 3em;
  display: flex;
  justify-content: center;
  width: 100%;
}

.pages {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.loading {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 7em;
  align-items: center;
  justify-content: space-between;
  font-family: Arial, Helvetica, sans-serif;
  font-weight: 700;
}

</style>
