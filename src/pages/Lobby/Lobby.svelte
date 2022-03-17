<script lang=ts>

import * as router from 'svelte-spa-router'
import MechGfx from '../../components/MechGfx.svelte'
import SvgIcon from '../../components/SvgIcon/SvgIcon.svelte'
import { getLastMech, getMechs, saveMech } from '../../mechs/MechsManager'
import * as SocketManager from '../../managers/SocketManager'
import { items2ids } from '../../items/ItemsManager'
import { onDestroy, onMount } from 'svelte'
import * as Stores from '../../stores'
import { currentMech, itemsPackData } from '../../stores'
import { Battle } from '../../battle/Battle'
import { getRandomStartingPositions } from '../../battle/utils'
import Mech from '../../mechs/Mech'
import MechPicker from './MechPicker.svelte'
import { addPopup } from '../../managers/PopupManager'
import { checkSetup } from '../../battle/utils'



// State

let mech: Mech | null = $currentMech ? new Mech($currentMech) : null
let inMatchMaker = false
let awaitingResponse = false
let pickOpponentMech = false



// Stores

// Update the mech when the items pack changes
$: {
  if ($itemsPackData && getMechs().length) {
    mech = new Mech(getLastMech())
  } else {
    mech = null
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

function onRename (e: Event): void {
  mech!.name = (e.target as HTMLInputElement).value
  saveMech(mech!.toJSONModel())
}


function onOnlineBattle (): void {

  try {

    checkSetup(mech!.setup)

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


  if (SocketManager.socket.disconnected) {

    addPopup({
      title: 'Unable to connect to server!',
      message: [
        `We tried to connect ${SocketManager.connectErrorStreakCount} times. Try again later.`,
        '',
        `Last error: "${SocketManager.lastError.message}"`
      ],
      mode: 'error',
      options: {
        'Ok' () { this.remove() },
        'Try again now' () {

          let canceled = false

          this.replace({
            title: 'Trying to connect to server',
            message: 'Please wait...',
            hideOnOffclick: false,
            spinner: true,
            options: {
              Cancel () {
                canceled = true
                this.remove()
              }
            }
          })

          SocketManager.tryToConnectManually()
            .catch()
            .finally(() => {
              if (!canceled) {
                if (SocketManager.socket.connected) {
                  this.remove()
                }
                onOnlineBattle()
              }
            })

        }
      }
    })

    return
  }

  if (mech === null) {
    showNoMechSelectedPopup()
    return
  }

  awaitingResponse = true

  if (inMatchMaker) {

    SocketManager.emit('matchmaker.quit')

  } else {

    SocketManager.emit('matchmaker.join', {
      name: mech.name,
      setup: items2ids(mech.setup),
    })

  }

}


function onOfflineBattle (): void {

  if (mech === null) {
    showNoMechSelectedPopup()
    return
  }

  pickOpponentMech = true
  
}


function onGoBack (): void {
  router.replace('/workshop')
}


function onPickOpponentMech (opponentMech: Mech | null): void {

  if (opponentMech === null) {
    pickOpponentMech = false
    return
  }

  const [pos1, pos2] = getRandomStartingPositions()
  const playerID = 'player'

  Stores.battle.set(

    new Battle({
      online: false,
      p1: {
        id: playerID,
        name: mech!.name,
        position: pos1,
        setup: items2ids(mech!.setup)
      },
      p2: {
        id: 'bot',
        name: 'Skynet',
        position: pos2,
        setup: items2ids(opponentMech.setup),
        ai: true
      },
      starterID: playerID,
      onUpdate: battle => Stores.battle.set(battle),
      povPlayerID: playerID,
    })

  )

  router.push('/battle');

}



// Socket shit

let socketAttachmentID: number

onMount(() => {

  socketAttachmentID = SocketManager.attach({

    'matchmaker.join.success': () => {
      awaitingResponse = false
      inMatchMaker = true
    },

    'matchmaker.join.error': (err: any) => {
      awaitingResponse = false
      addPopup({
        title: 'Failed to join match maker!',
        message: err.message,
        hideOnOffclick: true,
        mode: 'error',
        options: {
          Ok () { this.remove() }
        }
      })
    },

    
    'matchmaker.quit.success': () => {
      awaitingResponse = false
      inMatchMaker = false
    },
    
    'matchmaker.quit.error': (err: any) => {
      console.warn('Failed to quit matchmaker:', err)
      awaitingResponse = false
      inMatchMaker = false
    },
    

    'battle.start': (battleJSON: any) => {
      const battle = new Battle({
        online: true,
        starterID: battleJSON.starterID,
        p1: battleJSON.p1,
        p2: battleJSON.p2,
        onUpdate: battle => Stores.battle.set(battle),
        povPlayerID: SocketManager.socket.id
      })
      console.log('battle:', battle)
      Stores.battle.set(battle)
      router.push('/battle')
    },

  })

})

onDestroy(() => {
  SocketManager.detach(socketAttachmentID)
})

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
      <span>Mech Name:</span>
      <input
        type="text"
        class="name"
        value={mech.name}
        on:change={onRename}
      />
    </label>
  
  {:else}

    <div class="no-active-mech">
      No active mech!
    </div>

  {/if}

  <div class="buttons">

    <button class="classic-box" on:mousedown={onOfflineBattle}>
      Battle VS Computer
    </button>

    <button class="classic-box" on:mousedown={onOnlineBattle}>
      Online Battle
    </button>
    
  </div>

  {#if inMatchMaker && !awaitingResponse}
    <div class="searching-for-battle">

      <div class="classic-box contents">
        <div class="spinner-container">
          Searching for battle...
          <div class="spinner">
            <SvgIcon name="aim" />
          </div>
        </div>
  
        <button class="classic-box" on:mousedown={onOnlineBattle}>
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
  background: none;
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
