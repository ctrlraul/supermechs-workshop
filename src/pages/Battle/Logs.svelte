<script lang="ts">

import { onMount } from 'svelte'
import type { Battle } from '../../battle/Battle'
import SvgIcon from '../../components/SvgIcon/SvgIcon.svelte'
import { addPopup } from '../../managers/PopupManager'
import copyTextToClipboard from '../../utils/copyTextToClipboard'



export let battle: Battle | null;
export let playerID: String

let copyingText = false
let textCopied = false
let logLinesContainer: HTMLUListElement


const playerColor = '#d7c66b'
const opponentColor = '#db8766'

const styleForType = {
  action: {
    color: '#8fcb72',
    icon: 'exclamation'
  },
  error: {
    color: '#db5f5f',
    icon: 'warning'
  },
  info: {
    color: '#7391c9',
    icon: 'i'
  },
} as const



onMount(() => logLinesContainer.scrollTop = logLinesContainer.scrollHeight)



// Functions

async function copyLogs () {

  if (copyingText) {
    return
  }

  copyingText = true

  try {

    await copyTextToClipboard(generateLogsString())

    textCopied = true

    setTimeout(() => textCopied = false, 250)

  } catch (err: any) {

    addPopup({
      title: 'Failed to copy battle logs!',
      message: err.message,
      mode: 'error',
      options: {
        Ok () { this.remove() }
      }
    })

  }

  copyingText = false

}


function generateLogsString () {

  if (!battle) {
    return '';
  }
  
  const prefixes = {
    info: '[i]',
    action: '[!]',
    error: '[E]',
  }

  const lines = battle.logs.map(log =>
    prefixes[log.type] + ' ' + log.message.replace(/\*/g, '')
  )

  return lines.join('\n')

}

</script>



<div class="global-darkscreen" style="z-index: 10">
  <div class="content global-box">
    <header>
      <span>Battle Logs</span>
      <div class="buttons">
        <button class="global-box copy {copyingText ? 'global-disabled' : ''} {textCopied ? 'copied' : ''}" on:click={copyLogs}>
          Copy
        </button>
        <button class="global-box" on:click>
          <SvgIcon name="cross" color="var(--color-text)" />
        </button>
      </div>
    </header>
    <ul bind:this={logLinesContainer}>
      {#each battle ? battle.logs : [] as log}
        <li>
          <SvgIcon
            name={styleForType[log.type].icon}
            color={styleForType[log.type].color}
            style="position: relative; top: 0.15em; width: 1em; height: 1em;"
          />
          <span style="color: #aaaaaa">{@html log.message.replace(/\*([^*]+)\*/g, `<span style="color: ${log.actorID === playerID ? playerColor : opponentColor}">$1</span>`)}</span>
        </li>
      {/each}
    </ul>
  </div>
</div>



<style>

.content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--color-secondary);
  width: calc(var(--content-width) - 3em);
  height: calc(var(--content-height) - 3em);
  max-height: 90%;
  max-width: 90%;
  overflow: hidden;
}


header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5em;
}

header > span {
  font-size: 1.6em;
  margin-left: 0.23em;
}

header > .buttons {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1em;
}

header > .buttons > button {
  width: 2em;
  height: 2em;
}

header > .buttons > .copy {
  width: unset;
  padding: 0 0.5em;
  transition: background-color 250ms;
}

header > .buttons > .copied {
  transition: background-color 0ms;
  background-color: var(--color-success);
}


ul {
  flex: 1;
  width: 100%;
  padding: 0.5em;
  background: #00000080;
  list-style: none;
  overflow-x: auto;
}


li {
  padding-bottom: 0.3em;
  border-bottom: 0.1em solid #00000040;
}

</style>
