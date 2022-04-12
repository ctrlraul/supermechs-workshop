<script lang=ts>

import SvgIcon from '../../components/SvgIcon/SvgIcon.svelte'
import MechCanvas from '../../components/MechCanvas.svelte'
import MechPicker from './MechPicker.svelte'
import Mech from '../../mechs/Mech'
import * as router from 'svelte-spa-router'
import * as SocketManager from '../../managers/SocketManager'
import { items2ids, getItemsHash } from '../../items/ItemsManager'
import { onDestroy, onMount } from 'svelte'
import { battle } from '../../stores'
import { userData } from '../../stores/userData'
import { Battle } from '../../battle/Battle'
import { getRandomStartingPositions } from '../../battle/utils'
import { addPopup } from '../../managers/PopupManager'
import { checkSetup } from '../../battle/utils'
import { currentMech } from '../../stores/mechs'
import { isInMatchMaker, isWaitingResponse, matchMakerJoin, matchMakerQuit } from '../../stores/isInMatchMaker'



// State

let pickOpponentMech = false
let playersOnline: number | null = null
let isConnected = SocketManager.socket.connected
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

  if (SocketManager.socket.disconnected) {

    if (SocketManager.outdatedClient) {
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

      const attempts = SocketManager.connectErrorStreakCount

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

    const setup = items2ids($currentMech.setup)
    const itemsHash = getItemsHash(setup)

    matchMakerJoin($userData.name, $currentMech.name, setup, itemsHash)

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

    pickOpponentMech = true

  }

}


function onGoBack (): void {
  router.replace('/workshop')
}


function onPickOpponentMech (opponentMech: Mech | null): void {

  if ($currentMech === null) {
    showNoMechSelectedPopup()
    return
  }

  if (opponentMech === null) {
    pickOpponentMech = false
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
      mech: opponentMech,
      position: pos2,
      ai: true
    },
    starterID: playerID,
    onUpdate: value => $battle = value,
    povPlayerID: playerID,
  })

  router.push('/battle')

}



// Socket shit

const socketAttachment = SocketManager.createAttachment({

  // Statistics

  'playersonline' (data: { count: number }): void {
    playersOnline = data.count
  },


  // Connection

  'disconnect' (): void {
    playersOnline = null
    isConnected = false
  },

  'connect' (): void {
    SocketManager.playersOnlineListen()
    isConnected = true
  }

})


onMount(() => {

  socketAttachment.attach()

  if (SocketManager.socket.connected) {
    SocketManager.playersOnlineListen()
  }

})

onDestroy(() => {

  socketAttachment.detach()

  if (SocketManager.socket.connected) {
    SocketManager.playersOnlineIgnore()
  }

})

</script>



<main>

  <div class="players-online">
    {#if isConnected}

      <span>Players online:</span>
      {#if playersOnline !== null}
        {playersOnline}
      {:else}
        <SvgIcon name="aim" class="spinner" style="width: 1em; height: 1em" />
      {/if}

    {:else}
      (Disconnected)
    {/if}
  </div>

  <button class="back-button" on:mousedown={onGoBack}>
    <SvgIcon name="cross" color="var(--color-text)" />
  </button>

  {#if $currentMech}

    <div class="mech-gfx-container">
      <MechCanvas setup={$currentMech.toJSONModel().setup} />
    </div>

    <label>
      <span>Name:</span>
      <input type="text" class="name" bind:value={$userData.name} />
    </label>

  {:else}

    <div class="no-active-mech">
      No active mech!
    </div>

  {/if}

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


  {#if pickOpponentMech}
    <MechPicker onPickMech={onPickOpponentMech} title="Pick opponent's mech" />
  {/if}

</main>



<style>

main {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: var(--content-width);
  height: 100%;
  max-height: var(--content-height);
  padding: 0.5em;
}


.players-online {
  position: absolute;
  left: 0.5em;
  top: 0.5em;
  display: flex;
  align-items: center;
}

.players-online span {
  margin-right: 0.3em;
}


.back-button {
  position: relative;
  width: 2em;
  height: 2em;
  align-self: end;
  margin: 0.5em;
}

.mech-gfx-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 80%;
  height: 70%;
}

.name {
  margin-top: 1em;
}


.no-active-mech {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
}


.buttons {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2em;
  gap: 1em;
}

.buttons > button {
  width: 10em;
  height: 2.5em;
}

.buttons > button.cancel {
  background-color: var(--color-error);
}

.buttons > button.cancel span {
  font-size: 0.9em;
}



@media (orientation: portrait) {
  .buttons {
    flex-direction: column;
    width: 100%;
    margin: 10% 0;
  }

  .buttons > button {
    width: 70%;
  }
}

</style>
