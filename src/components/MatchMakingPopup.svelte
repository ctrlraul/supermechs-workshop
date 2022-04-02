<script lang="ts">

import SvgIcon from './SvgIcon/SvgIcon.svelte'
import { matchMakerQuit } from '../managers/SocketManager'
import { isInMatchMaker } from '../stores/isInMatchMaker'



// Props

export let cancelButton = true



// Functions

function quitMatchMaker (): void {
  matchMakerQuit()
  $isInMatchMaker = false
}

</script>



<div class="match-maker-notification global-box" style={$$props.style}>

  <span>
    <SvgIcon
      name="aim"
      class="spinner"
      style="width: 1em; height: 1em; margin-right: 0.5em;"
    />
    Searching for battle
  </span>

  {#if cancelButton}
    <button class="global-box" on:click={quitMatchMaker}>
      Cancel
    </button>
  {/if}

</div>



<style>

.match-maker-notification {
  position: relative;
  display: flex;
  padding: 0.5em;
}

.match-maker-notification span {
  display: flex;
  align-items: center;
}

.match-maker-notification button {
  background-color: var(--color-error);
  padding: 0.1em 0.3em;
  margin-left: 1em;
}

</style>