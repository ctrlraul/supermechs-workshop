<script lang="ts">

import * as SocketManager from './managers/SocketManager'
import * as IsInMatchMaker from './stores/isInMatchMaker'
import * as UserData from './stores/userData'
import Router, { replace, location } from 'svelte-spa-router'
import wrap from 'svelte-spa-router/wrap'
import Popup from './components/Popup.svelte'
import Tooltip from './components/Tooltip/Tooltip.svelte'
import SvgIcon from './components/SvgIcon/SvgIcon.svelte'
import PatreonNotification from './components/PatreonNotification.svelte'
import { onMount } from 'svelte'
import { itemsPackData } from './stores'
import { loadStatImages } from './stats/StatsManager'
import { isInProduction } from './lib/isInProduction';



// Pages

import ItemPacks from './pages/ItemPacks.svelte'
import Workshop from './pages/Workshop/Workshop.svelte'
import Mechs from './pages/Mechs.svelte'
import Lobby from './pages/Lobby.svelte'
import Battle from './pages/Battle/Battle.svelte'
import Settings from './pages/Settings/Settings.svelte'



// Types

import type { RouteDefinition } from 'svelte-spa-router'



// Data

const MINUTES_BEFORE_PATREON_NOTIFICATION = 60

let didLoadStats = false
let showPatreonNotification = false


const routes: RouteDefinition = {

  '/': ItemPacks,

  '/workshop': wrap({
    component: Workshop,
    conditions: itemsPackLoaded,
  }),

  '/mechs': wrap({
    component: Mechs,
    conditions: itemsPackLoaded,
  }),

  '/lobby': wrap({
    component: Lobby,
    conditions: itemsPackLoaded,
  }),

  '/battle': wrap({
    component: Battle,
    conditions: () => {
      return itemsPackLoaded() || !isInProduction
    }
  }),

  '/settings': Settings,

  // Redirect 404 to workshop
  '*': wrap({
    component: Workshop,
    conditions: itemsPackLoaded,
  }),

}


// LocalStorageHandler.loadLocalData()


onMount(async () => {

  // This doesn't really fail as of now
  await loadStatImages()
  didLoadStats = true

  UserData.init()
  SocketManager.init()
  IsInMatchMaker.init()

  setTimeout(() => {
    showPatreonNotification = true
  }, MINUTES_BEFORE_PATREON_NOTIFICATION * 60000)

})



function itemsPackLoaded (): boolean {

  if ($itemsPackData !== null) {
    return true
  }

  return false

}


function conditionsFailed () {

  if ($itemsPackData) {

    replace('/workshop')

  } else {

    let redirectPath = '/'
  
    redirectPath += '?returnTo=' + $location
    
    replace(redirectPath)

  }

}

</script>



{#if didLoadStats}

  <Tooltip/>

  <Popup/>
  
  <div class="pages">
    <Router routes={routes} on:conditionsFailed={conditionsFailed}/>
  </div>

  {#if showPatreonNotification && Math.random() === 0}
    <PatreonNotification onHide={() => showPatreonNotification = false} />
  {/if}

{:else}
  <div class="loading">

    <img src="/assets/images/logo-stencil.svg" alt="logo" />
    
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
