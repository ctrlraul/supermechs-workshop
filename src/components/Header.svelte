<script lang="ts">

import SvgIcon from './SvgIcon/SvgIcon.svelte'
import { pop } from 'svelte-spa-router'
import { matchMakerState, MatchMakerState } from '../stores/matchMakerState'
import { lobbyExitMatchMaker } from '../managers/SocketManager'


export let title: string
export let onGoBack: () => any = pop
export let hideMatchMakingPopup: boolean = false

</script>



<header style={$$props.style}>

  {#if $matchMakerState === MatchMakerState.In && !hideMatchMakingPopup}
    <div class="global-box searching-for-battle">
      <SvgIcon name="aim" class="spinner" />
      <span>Searching for battle...</span>
      <button on:click={lobbyExitMatchMaker}>Cancel</button>
    </div>
  {/if}

  <div class="title">{title}</div>

  <button class="global-box" on:click={onGoBack}>
    <SvgIcon name="cross" color="var(--color-text)" />
  </button>

</header>



<style>

header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  grid-area: header;
}

header > .title {
  font-size: 1.8em;
}

header > button {
  position: absolute;
  right: 0em;
  width: 2em;
  height: 2em;
}


.searching-for-battle {
  position: absolute;
  left: 0.5em;
  top: 0.5em;
  display: flex;
  align-items: center;
  height: 2em;
  padding: 0 0.5em;
}

.searching-for-battle span {
  margin: 0 0.5em;
}

.searching-for-battle button {
  background-color: var(--color-error);
  padding: 0 0.5em;
}

</style>
