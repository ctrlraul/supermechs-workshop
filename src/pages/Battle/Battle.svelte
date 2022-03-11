<script lang="ts">


// No need to worry about $battle being null,
// there is a route guard to guarantee us it is not.


import * as router from 'svelte-spa-router'
import { battle } from '../../stores'
import PlayerBattlePanel from './PlayerBattlePanel.svelte'
import BattleControls from './BattleControls.svelte'
import * as SocketManager from '../../managers/SocketManager'
import Logs from './Logs.svelte'
import { onDestroy, onMount } from 'svelte'
import SvgIcon from '../../components/SvgIcon/SvgIcon.svelte'
import type { BattleAction } from '../../battle/Battle'
import { addPopup } from '../../managers/PopupManager'
import * as BattleRenderer from '../../BattleRenderer'



// State

let myID: string = $battle!.online ? SocketManager.socket.id : 'player'
let awaitingMove: boolean = false
let socketAttachmentID: number
let viewLogs = false

$: player = $battle!.getPlayerForID(myID)
$: opponent = $battle!.getOpponentForPlayerID(myID)
$: battleCanvas = null as HTMLCanvasElement | null



// Graphic

$: reverse = player.id === $battle!.p2.id



// Life

onMount(() => {
  
  if (battleCanvas) {
    battleCanvas.width = battleCanvas.offsetWidth
    battleCanvas.height = battleCanvas.offsetHeight
    BattleRenderer.setCanvas(battleCanvas)
  }
  
  BattleRenderer.setBattle($battle!, player.id)

})

onMount(() => {

  socketAttachmentID = SocketManager.attach({

    'battle.event.confirmation': (action: BattleAction) => {
      awaitingMove = false
      try {
        $battle!.pushAction(action)
      } catch (err: any) {
        addPopup({
          title: 'Error!',
          message: err.message,
          mode: 'error',
          options: {
            Ok () { this.remove() }
          }
        })
      }
    },

    'battle.event.error': (err: any) => {
      awaitingMove = false
      addPopup({
        title: 'Error!',
        message: err.message,
        mode: 'error',
        options: {
          Ok () { this.remove() }
        }
      });
    },

    'battle.opponent.quit': () => {
      if ($battle!.completion === null) {
        addPopup({
          title: 'Opponent has quit',
          message: 'They were too afraid!',
          options: {
            Ok () {
              router.pop()
              this.remove()
            }
          }
        })
      }
    },

    'disconnect': () => {
      router.pop()
      addPopup({
        title: 'Lost connection!',
        message: `Tip: Don't idle for too long`,
        options: {
          Ok () { this.remove() }
        }
      })
    }

  })

})

onDestroy(() => {
  
  SocketManager.detach(socketAttachmentID)

  if ($battle!.online) {
    SocketManager.emit('battle.quit')
  }

})



// Functions

async function handleBattleEvent (action: BattleAction): Promise<void> {

  if ($battle === null) {
    console.warn('No battle', event)
    return
  }

  const moveAuthor = $battle!.getPlayerForID(action.actorID)

  if ($battle.attacker.id !== moveAuthor.id) {
    console.warn(`Not ${moveAuthor.name}'s turn`)
    return
  }

  if ($battle.online) {

    awaitingMove = true

    try {

      // action.damageDealt = BattleUtils.getRandomDamageForEvent($battle, event)
      SocketManager.emit('battle.event', action)

    } catch (err: any) {

      addPopup({
        title: 'Failed to make move!',
        message: err.message,
      })

    }

  } else {
    $battle.pushAction(action)
  }

}


// events

function onQuit (): void {
  addPopup({
    title: 'Quit',
    message: 'Are you sure?',
    mode: 'error',
    options: {
      Yes () {
        router.pop()
        this.remove()
      },
      No () { this.remove() }
    }
  });
}

</script>



<main>

  {#if $battle !== null}

    <div class="player-panels">
      <PlayerBattlePanel battle={$battle} player={player} />
      <PlayerBattlePanel battle={$battle} player={opponent} rtl />
    </div>

    <div class="buttons">
      <button class="classic-box" on:mousedown={() => viewLogs = !viewLogs}>
        Logs
      </button>
      <button class="classic-box" on:mousedown={onQuit}>
        <SvgIcon name="off" color="var(--color-text)" />
      </button>
    </div>
  
  
    <div class="mechs-container" style="transform: scaleX({reverse ? -1 : 1})">
      <canvas bind:this={battleCanvas}>
        Canvas element is not supported in your browser
      </canvas>
    </div>
  
  
    <BattleControls
      player={player}
      handleBattleEvent={handleBattleEvent}
      blocked={awaitingMove}
      reverse={reverse}
    />
  
  
    {#if viewLogs}
      <Logs
        battle={$battle}
        playerID={player.id}
        on:click={() => viewLogs = !viewLogs}
      />
    {:else if $battle.completion}
      <div class="battle-complete">
        <div class="classic-box contents">
          <div class="title">{$battle.completion.winnerID === myID ? 'Victory!' : 'Defeat!'}</div>
          <button class="classic-box go-back-button" on:click={() => router.pop()}>
            Go Back
          </button>
          <button class="logs-button" on:click={() => viewLogs = !viewLogs}>
            Logs
          </button>
        </div>
      </div>
    {/if}
    
  {/if}

</main>


<style>

main {
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: var(--content-height);
  max-width: var(--content-width);
  height: 100%;
  width: 100%;
}


.player-panels {
  position: relative;
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0.5em;
}


main > .buttons {
  position: absolute;
  display: flex;
  width: 7em;
  gap: 0.5em;
  left: calc(50% - 3.5em);
  top: 0.5em;
}

main > .buttons > button {
  width: 3em;
  height: 3em;
  padding: 0.3em;
}


.mechs-container {
  position: relative;
  display: flex;
  align-items: flex-end;
  width: 100%;
  flex: 1;
  overflow: hidden;
}

.mechs-container > canvas {
  width: 100%;
  height: 100%;
}


.battle-complete {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000000a0;
  z-index: 10;
}

.battle-complete > .contents {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 13em;
  gap: 1em;
  padding-bottom: 1em;
}

.battle-complete > .contents > .title {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 2em;
  background-color: #00000080;
  font-size: 1.4em;
}

.battle-complete > .contents > .go-back-button {
  height: 2em;
  background-color: var(--color-text);
  color: var(--color-background);
  width: 80%;
  font-weight: bold;
  margin: 0.5em;
}

.battle-complete > .contents > .logs-button {
  font-size: 0.9em;
  color: inherit;
  background-color: unset;
}



@media (orientation: portrait) {

  .player-panels {
    flex-direction: column;
    gap: 1em;
    top: 4em;
  }

}

</style>