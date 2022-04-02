<script lang=ts>

import * as router from 'svelte-spa-router'
import * as SocketManager from '../../managers/SocketManager'
import SvgIcon from '../../components/SvgIcon/SvgIcon.svelte'
import Mech from '../../mechs/Mech'
import MechPicker from './MechPicker.svelte'
import MechCanvas from '../../components/MechCanvas.svelte'
import { items2ids, getItemsHash } from '../../items/ItemsManager'
import { onDestroy, onMount } from 'svelte'
import { battle } from '../../stores'
import { userData } from '../../stores/userData'
import { isInMatchMaker } from '../../stores/isInMatchMaker'
import { Battle } from '../../battle/Battle'
import { getRandomStartingPositions } from '../../battle/utils'
import { addPopup } from '../../managers/PopupManager'
import { checkSetup } from '../../battle/utils'
import { currentMech } from '../../stores/mechs'
import MatchMakingPopup from '../../components/MatchMakingPopup.svelte'



// State

let awaitingResponse = false
let pickOpponentMech = false
let playersOnline: number | null = null
let isConnected = SocketManager.socket.connected

$: {
  if ($isInMatchMaker || true) {
    awaitingResponse = false
  }
}



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

  if (awaitingResponse) {
    return
  }


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
      const message = [
        `We tried to reconnect ${attempts} time${attempts > 1 ? 's' : ''}!`,
        '',
        `Error: "${SocketManager.lastError.message}"`,
      ]

      if (attempts > 4) {
        message.push(
          '',
          'Please try again in a few minutes.'
        )
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


  // Show overlay

  awaitingResponse = true


  // Resolve action

  if ($isInMatchMaker) {

    SocketManager.matchMakerQuit()

  } else {

    const setup = items2ids($currentMech.setup)
    const itemsHash = getItemsHash(setup)

    SocketManager.matchMakerJoin($userData.name, $currentMech.name, setup, itemsHash)

  }

}


function onOfflineBattle (): void {

  if ($isInMatchMaker) {
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

  if (opponentMech === null) {
    pickOpponentMech = false
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
      mechName: $currentMech.name,
      position: pos1,
      setup: items2ids($currentMech.setup)
    },
    p2: {
      id: 'bot',
      name: 'Skynet',
      mechName: opponentMech.name,
      position: pos2,
      setup: items2ids(opponentMech.setup),
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

  {#if $currentMech !== null}

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

    <button class="global-box {(awaitingResponse || $isInMatchMaker) ? 'global-disabled' : ''}" on:mousedown={onOfflineBattle}>
      Battle VS Computer
    </button>

    <button class="global-box {awaitingResponse ? 'global-disabled' : ''} {$isInMatchMaker ? 'cancel' : ''}" on:mousedown={onOnlineBattle}>
      {#if $isInMatchMaker}
        Cancel
      {:else}
        Online Battle
      {/if}
    </button>
    
  </div>


  {#if pickOpponentMech}
    <MechPicker onPickMech={onPickOpponentMech} title="Pick opponent's mech" />
  {/if}

  {#if $isInMatchMaker}
    <MatchMakingPopup
      cancelButton={false}
      style="position: absolute; top: 0.5em"
    />
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
  height: 70%;
  width: 100%;
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

.buttons .cancel {
  background-color: var(--color-error);
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
