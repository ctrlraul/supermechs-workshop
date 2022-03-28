<script lang=ts>

import * as router from 'svelte-spa-router'
import MechGfx from '../../components/MechGfx.svelte'
import SvgIcon from '../../components/SvgIcon/SvgIcon.svelte'
import * as SocketManager from '../../managers/SocketManager'
import { items2ids, getItemsHash, matchItemsHash } from '../../items/ItemsManager'
import { onDestroy, onMount } from 'svelte'
import { battle } from '../../stores'
import { userData } from '../../stores/userData'
import { Battle } from '../../battle/Battle'
import { getRandomStartingPositions } from '../../battle/utils'
import Mech from '../../mechs/Mech'
import MechPicker from './MechPicker.svelte'
import { addPopup } from '../../managers/PopupManager'
import { checkSetup } from '../../battle/utils'
import { currentMech } from '../../stores/mechs'



// Types

interface MatchMaker_Validation {
  setup: number[]
  itemsHash: string
}



// State

let mech = $currentMech
let inMatchMaker = false
let awaitingResponse = false
let pickOpponentMech = false



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

  if (mech === null) {
    showNoMechSelectedPopup()
    return
  }


  // Make sure our mech is valid

  try {

    checkSetup(mech.setup)

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

  if (inMatchMaker) {

    SocketManager.emit('matchmaker.quit')

  } else {

    const setup = items2ids(mech.setup)

    SocketManager.emit('matchmaker.join', {
      name: $userData.name,
      mechName: mech.name,
      setup,
      itemsHash: getItemsHash(setup)
    })

  }

}


function onOfflineBattle (): void {

  let issue = ''

  if (mech === null) {
    showNoMechSelectedPopup()
    return
  }
  
  if (mech.setup[Mech.TORSO_INDEX] === null) {
    issue = 'a torso!'
  } else if (mech.setup[Mech.LEGS_INDEX] === null) {
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

  if (mech === null) {
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
      mechName: mech.name,
      position: pos1,
      setup: items2ids(mech.setup)
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

  'matchmaker.join.success': () => {
    awaitingResponse = false
    inMatchMaker = true
  },

  'matchmaker.join.error': (err: any) => {

    awaitingResponse = false

    if (err.message === 'Already match-making') {

      inMatchMaker = true

    } else {

      inMatchMaker = false

      addPopup({
        title: 'Failed to join match maker!',
        message: err.message,
        hideOnOffclick: true,
        mode: 'error',
        options: {
          Ok () { this.remove() }
        }
      })

    }

  },


  'matchmaker.quit.success': () => {
    awaitingResponse = false
    inMatchMaker = false
  },

  'matchmaker.quit.error': (_err: any) => {
    awaitingResponse = false
    inMatchMaker = false
  },

  'matchmaker.validation': (data: MatchMaker_Validation) => {

    const result = matchItemsHash(data.setup, data.itemsHash)

    SocketManager.emit('matchmaker.validation', { result })

  },


  'battle.start': (battleJSON: any) => {
    
    awaitingResponse = true
    inMatchMaker = false

    $battle = new Battle({
      online: true,
      starterID: battleJSON.starterID,
      p1: battleJSON.p1,
      p2: battleJSON.p2,
      onUpdate: value => $battle = value,
      povPlayerID: SocketManager.socket.id
    })

    router.push('/battle')

  },


  'disconnect': () => {
    if (inMatchMaker) {
      
      inMatchMaker = false

      addPopup({
        title: 'Lost connection!',
        message: `The server stopped vibing`,
        options: {
          Ok () { this.remove() }
        }
      })

    }
  }

})

onMount(() => socketAttachment.attach())
onDestroy(() => socketAttachment.detach())

</script>



<main>

  <button class="back-button" on:mousedown={onGoBack}>
    <SvgIcon name="cross" color="var(--color-text)" />
  </button>

  {#if mech}

    <div class="mech-gfx-container">
      <MechGfx setup={mech.setup} scale={0.8} />
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

    <button class="global-box" on:mousedown={onOfflineBattle}>
      Battle VS Computer
    </button>

    <button class="global-box" on:mousedown={onOnlineBattle}>
      Online Battle
    </button>
    
  </div>

  {#if inMatchMaker && !awaitingResponse}
    <div class="searching-for-battle">

      <div class="global-box contents">
        <div class="spinner-container">
          Searching for battle...
          <div class="spinner">
            <SvgIcon name="aim" />
          </div>
        </div>
  
        <button class="global-box" on:mousedown={onOnlineBattle}>
          Cancel
        </button>
      </div>
      
    </div>
  {/if}

  {#if awaitingResponse}
    <div class="awaiting-response-overlay">
      <div class="spinner">
        <SvgIcon name="aim" />
      </div>
    </div>
  {/if}


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


.searching-for-battle {
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1em;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: #000000a0;
}

.searching-for-battle > .contents {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1em;
  gap: 1em;
}

.searching-for-battle > .contents > .spinner-container {
  position: relative;
  display: flex;
  gap: 0.3em;
  font-size: 1.1em;
}

.searching-for-battle > .contents > button {
  width: 8em;
  height: 2em;
  background-color: var(--color-error);
}


.awaiting-response-overlay {
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: #000000a0;
  font-size: 2.4em;

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
