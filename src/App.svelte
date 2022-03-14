<script lang="ts">

import Router, { replace } from 'svelte-spa-router'
import wrap from 'svelte-spa-router/wrap'
import { onMount } from 'svelte'
import { importItemsPack } from './items/ItemsManager'
import * as LocalStorageHandler from './managers/LocalStorageHandler'
import { addPopup } from './managers/PopupManager'
import Popup from './components/Popup.svelte'
import Tooltip from './components/Tooltip/Tooltip.svelte'
import { battle, itemsPackData } from './stores'
import { loadStatImages } from './stats/StatsManager'



// Pages

import ItemPacks from './pages/ItemPacks.svelte'
import Workshop from './pages/Workshop/Workshop.svelte'
import Mechs from './pages/Mechs.svelte'
import Lobby from './pages/Lobby/Lobby.svelte'
import Battle from './pages/Battle/Battle.svelte'



// Types

import type { RouteDefinition } from 'svelte-spa-router'



// Data

let didLoadStats = false


LocalStorageHandler.loadLocalData();

onMount(async () => {

  // This doesn't really fail as of now
  await loadStatImages()
  didLoadStats = true

})



function needsItemsPack (): boolean {

  if ($itemsPackData !== null) {
    return true
  }

  const packURL = LocalStorageHandler.get('last-items-pack-url')

  if (packURL) {

    const popup = addPopup({
      title: 'Loading last items pack...',
      hideOnOffclick: false,
      spinner: true
    })

    fetch(packURL)
      .then(response => response.json())
      .then(pack => {

        importItemsPack(pack, () => {})
          .then(popup.remove.bind(popup))
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
    SuperMechs Workshop
    <img src="/assets/logo.png" alt="logo" />
  </div>
{/if}



<style>

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
  font-size: 2vw;
}

.loading > img {
  width: 5em;
  height: 5em;
}

</style>
