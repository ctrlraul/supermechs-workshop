<script lang=ts>

import * as router from 'svelte-spa-router'
import * as SocketManager from '../managers/SocketManager'
import SvgIcon from '../components/SvgIcon/SvgIcon.svelte'
import MechCanvas from '../components/MechCanvas.svelte'
import MechPicker from '../components/MechPicker.svelte'
import Header from '../components/Header.svelte'
import Mech from '../mechs/Mech'
import { items2ids, getItemsHash } from '../items/ItemsManager'
import { onDestroy, onMount } from 'svelte'
import { battle } from '../stores'
import { userData } from '../stores/userData'
import { Battle } from '../battle/Battle'
import { getRandomStartingPositions } from '../battle/utils'
import { addPopup } from '../managers/PopupManager'
import { checkSetup } from '../battle/utils'
import { currentMech, mechs } from '../stores/mechs'
import { isInMatchMaker, isWaitingResponse, matchMakerJoin, matchMakerQuit } from '../stores/isInMatchMaker'



// Types

interface LobbyPlayer {
  name: string
  id: string
  isInMatchMaker: boolean
  admin: boolean
}


interface ProfileData {
  name: string
  mech: {
    name: string
    setup: number[]
  }
  itemsHash: string
}



// State

let showMechPicker: boolean = false
let pickingOpponent: boolean = false
let playersInLobby: LobbyPlayer[] = []
let isConnected = SocketManager.isConnected()
let showProfile: boolean = false
let currentProfileHash: string = ""
$: canOfflineBattle = !$isInMatchMaker && !$isWaitingResponse



// Functions

function showNoMechSelectedPopup (): void {
  addPopup({
    title: 'No mech selected!',
    message: 'Return to workshop to build one.',
    mode: 'error',
    options: {
      Ok () {
        router.replace('/workshop')
        this.remove()
      }
    }
  })
}


/** Returns the mechs that can fight, includes invalid mechs. */
function getFightableMechs (mechs: Mech[]): Mech[] {
  return mechs.filter(mech => {
    return mech.slots.torso && mech.slots.legs
  })
}



// events

async function onOnlineBattle (): Promise<void> {

  // Make sure we're using a mech

  if ($currentMech === null) {
    showNoMechSelectedPopup()
    return
  }


  // Make sure our mech is valid

  try {

    checkSetup($currentMech.setup)

  } catch (err: any) {

    addPopup({
      title: `Can't use invalid mech in online battles!`,
      message: err.message,
      mode: 'error',
      hideOnOffclick: true,
      options: {
        Ok () { this.remove() }
      }
    })

    return

  }


  // Make sure we're connected to server

  if (!SocketManager.isConnected()) {

    if (SocketManager.isClientOutdated()) {
      SocketManager.addOutdatedClientPopup()
      return
    }

    let canceled = false

    const tryingToConnectPopup = addPopup({
      title: 'Trying to connect to server',
      message: 'Please wait up to 10 seconds...',
      hideOnOffclick: false,
      spinner: true,
      options: {
        Cancel () {
          canceled = true
          this.remove()
        }
      }
    })

    try {

      await SocketManager.tryToConnectManually()

      if (canceled) {
        return
      }

    } catch (err: any) {

      if (canceled) {
        return
      }

      const attempts = SocketManager.getConnectionErrorsStreak()

      let message = `
        We tried to reconnect ${attempts} time${attempts === 1 ? '' : 's'}!

        Error: "${err.message}"
      `

      if (attempts > 4) {
        message += '\nPlease try again in a few minutes.'
      }

      addPopup({
        mode: 'error',
        title: 'Failed to connect to server',
        message,
        options: {
          Ok () { this.remove() },
          Retry () {
            this.remove()
            onOnlineBattle()
          }
        }
      })

      return

    } finally {

      tryingToConnectPopup.remove()

    }

  }


  // Resolve action

  if ($isInMatchMaker) {

    matchMakerQuit()

  } else {

    const data = getProfileData()

    matchMakerJoin(data.name, data.mech.name, data.mech.setup, data.itemsHash)

  }

}


function onOfflineBattle (): void {

  if (!canOfflineBattle) {

    addPopup({
      title: 'Hold on!',
      message: "Can't play offline battles while searching for an online battle!",
      mode: 'error',
      options: {
        Ok () { this.remove() },
      }
    })

    return

  }


  let issue = ''

  if ($currentMech === null) {
    showNoMechSelectedPopup()
    return
  }
  
  if ($currentMech.setup[Mech.TORSO_INDEX] === null) {
    issue = 'a torso!'
  } else if ($currentMech.setup[Mech.LEGS_INDEX] === null) {
    issue = 'legs!'
  }

  if (issue) {

    addPopup({
      title: 'Hold on!',
      message: `You can't battle without ` + issue,
      mode: 'error',
      options: {
        Ok () {
          this.remove()
        }
      }
    })

  } else {

    showMechPicker = true
    pickingOpponent = true

  }

}


function onPickMech (mech: Mech[]): void {

  showMechPicker = false

  if (mech.length === 0) {
    return
  }

  if (!pickingOpponent) {
    $currentMech = mech[0]
    return
  }

  if ($currentMech === null) {
    showNoMechSelectedPopup()
    return
  }

  const [pos1, pos2] = getRandomStartingPositions()
  const playerID = 'player'

  $battle = new Battle({
    online: false,
    p1: {
      id: playerID,
      name: $userData.name,
      mech: $currentMech,
      position: pos1,
    },
    p2: {
      id: 'bot',
      name: 'Skynet',
      mech: mech[0],
      position: pos2,
      ai: !$userData.settings.controlOfflineOpponent
    },
    starterID: playerID,
    onUpdate: value => $battle = value,
    povPlayerID: playerID,
  })

  router.push('/battle')

}


function toggleProfile (): void {

  showProfile = !showProfile
  pickingOpponent = false

  if (!$userData.name) {
    $userData.name = 'Unnamed Pilot';
  }

  const data = getProfileData()
  const hash = JSON.stringify(data)

  // If is about to change profile, prepare the
  // current hash to check if it changed later
  if (showProfile) {
    currentProfileHash = hash
    return
  }
  
  // Done changing profile, time to actually
  // check if something changed before updating
  if (hash !== currentProfileHash) {
    SocketManager.getSocket().emit('profile.update', data)
  }

}


function getProfileData (): ProfileData {

  const data: ProfileData = {
    name: $userData.name,
    mech: {
      name: '',
      setup: []
    },
    itemsHash: ''
  }

  if ($currentMech) {

    data.mech.name = $currentMech.name
    data.mech.setup = items2ids($currentMech.setup)
    data.itemsHash = getItemsHash(data.mech.setup)
    
  }

  return data

}


function getColorForPlayer(player: LobbyPlayer): string {

  if (player.admin) {
    return 'var(--color-error)'
  }

  if (player.id === SocketManager.getSocket().id) {
    return 'var(--color-success)'
  }

  return 'var(--color-text)'

}



// Socket shit

const socketAttachment = SocketManager.createAttachment({

  // Statistics

  'lobby.players' (data: { players: LobbyPlayer[] }): void {
    playersInLobby = data.players
  },

  'lobby.players.joined' (data: { player: LobbyPlayer }): void {

    const index = playersInLobby.findIndex(player => player.id === data.player.id)

    if (index > -1) {
      playersInLobby[index] = data.player
    } else {
      playersInLobby[playersInLobby.length] = data.player
    }
    
  },

  'lobby.players.exited' (data: { id: string }): void {
    playersInLobby = playersInLobby.filter(player => player.id !== data.id)
  },

  'lobby.players.matchmaker' (data: { id: string, isInMatchMaker: boolean }): void {
    const index = playersInLobby.findIndex(player => player.id === data.id)
    playersInLobby[index].isInMatchMaker = data.isInMatchMaker
  },

  'profile.update' (data: { id: string, name: string }): void {
    const index = playersInLobby.findIndex(player => player.id === data.id)
    playersInLobby[index].name = data.name
  },


  // Connection

  'disconnect' (): void {
    playersInLobby = []
    isConnected = false
  },

  'connect' (): void {
    SocketManager.lobbyJoin()
    isConnected = true
  }

})


onMount(() => {

  socketAttachment.attach()

  if (SocketManager.isConnected()) {
    SocketManager.lobbyJoin()
  }

})

onDestroy(() => {

  socketAttachment.detach()

  if (SocketManager.isConnected()) {
    SocketManager.lobbyExit()
  }

})

</script>



<main>

  <Header title="Lobby" hideMatchMakingPopup />


  <div class="mech-gfx-container">
    {#if $currentMech}
      <MechCanvas setup={$currentMech.toJSONModel().setup} />
    {/if}
  </div>


  <div class="buttons">

    <button
      class="global-box {canOfflineBattle ? '' : 'global-disabled'}"
      on:mousedown={onOfflineBattle}
    >
      Battle VS Computer
    </button>

    <button
      class="global-box {$isInMatchMaker ? 'cancel' : ''} {$isWaitingResponse ? 'global-disabled' : ''}"
      on:mousedown={onOnlineBattle}
    >

      {#if $isInMatchMaker}
        <span>Searching for battle</span>
        <SvgIcon name="aim" class="spinner" style="margin-left: 0.5em"/>
      {:else}
        Online Battle
      {/if}

    </button>
    
  </div>


  <div class="players-list global-box">

    <header>
      <span style="margin-left: 0.5em">{$userData.name}</span>
      <button class="profile-button global-box" on:click={toggleProfile}>
        <SvgIcon name="pencil" color="var(--color-text)" />
      </button>
    </header>

    {#if isConnected && playersInLobby.length}
    
      <div class="list-container">
        <ul>

          {#each playersInLobby as player}

            <li style="color: {getColorForPlayer(player)}">

              <span>{player.name}</span>

              {#if player.isInMatchMaker}
                <SvgIcon name="aim" class="spinner" />
              {/if}

            </li>
            
          {/each}
          
        </ul>
      </div>
    
    {:else}

      <div class="center">
        {#if !isConnected}

          <span style="opacity: 0.5">Disconnected</span>

        {:else}

          <span>Connecting</span>
          <SvgIcon
            name="aim"
            class="spinner"
            style="width: 1em; height: 1em; margin: 0.5em"
          />

        {/if}
      </div>

    {/if}

  </div>


  {#if showProfile}
    <div class="global-darkscreen" on:click={e => e.target === e.currentTarget && toggleProfile()}>
      <div class="profile global-box">
        <header>
          <span>Profile</span>
          <button class="global-box" on:click={toggleProfile}>
            <SvgIcon name="cross" />
          </button>
        </header>
        <div class="sections">
          <section>
            <span>Name</span>
            <input
              type="text"
              bind:value={$userData.name}
              maxlength="32"
              placeholder="Unnamed Pilot"
            >
          </section>
          <section>
            <span>Mech</span>
            <div class="mech-container">
              {#if $currentMech}
                <MechCanvas setup={$currentMech.toJSONModel().setup} />
              {/if}
            </div>
            <button on:click={() => showMechPicker = !showMechPicker}>Change Mech</button>
          </section>
        </div>
      </div>
    </div>
  {/if}


  {#if showMechPicker}
    <MechPicker
      title={pickingOpponent ? "Select opponent's mech" : "Select mech"}
      onPick={onPickMech}
      mechs={getFightableMechs($mechs)}
    />
  {/if}

</main>



<style>

main {
  display: grid;
  grid-template-rows: 3em 1fr 2.5em;
  grid-template-columns: 1fr 16em;
  grid-template-areas:
    'header header'
    'mech players'
    'buttons players';
  width: 100%;
  height: 100%;
  max-width: var(--content-width);
  max-height: var(--content-height);
  padding: 0.5em;
}


.mech-gfx-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
  height: 90%;
  grid-area: mech;
  margin-top: auto;
}


.buttons {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  grid-area: buttons;
}

.buttons button {
  width: 10em;
  height: 2.5em;
}

.buttons button.cancel {
  background-color: var(--color-error);
}

.buttons button.cancel span {
  font-size: 0.9em;
}

.buttons button:first-of-type {
  margin-right: 0.5em;
}


.players-list {
  position: relative;
  display: grid;
  grid-template-rows: 3em 1fr;
  overflow: hidden;
  grid-area: players;
}

.players-list header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0.5em;
  background-color: var(--color-secondary);
}

.players-list header button {
  position: relative;
  width: 2em;
  height: 2em;
  padding: 0.25em;
}

.players-list .list-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.players-list ul {
  position: relative;
  list-style: none;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.players-list ul li {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.5em;
  width: 100%;
  height: 2em;
  overflow: hidden;
  white-space: nowrap;
}

.players-list ul li:nth-child(even) {
  background-color: #00000030;
}

.players-list .center {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}


.profile {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 20em;
  max-width: 90%;
  overflow: hidden;
}

.profile header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0.5em;
  background-color: var(--color-secondary);
}

.profile header span {
  margin-left: 0.5em;
}

.profile header button {
  width: 2em;
  height: 2em;
  stroke: var(--color-text);
}

.profile .sections {
  position: relative;
  display: grid;
  padding: 0.5em;
  gap: 0.5em;
}

.profile section {
  display: grid;
  gap: 0.5em;
}

.profile input {
  margin-bottom: 0.5em;
}

.profile .mech-container {
  position: relative;
  display: flex;
  width: 100%;
  height: 10em;
  justify-content: center;
}

.profile button {
  width: 100%;
  height: 2em;
}



@media (orientation: portrait) {

  main {
    gap: 0.5em;
    grid-template-rows: 3em 1fr 2.5em 0.8fr;
    grid-template-columns: 1fr;
    grid-template-areas:
      'header'
      'mech'
      'buttons'
      'players';
  }

  .buttons button {
    flex: 1;
  }

}

</style>
