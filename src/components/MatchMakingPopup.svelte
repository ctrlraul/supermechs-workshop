<script lang="ts">

import SvgIcon from './SvgIcon/SvgIcon.svelte'
import * as SocketManager from '../managers/SocketManager'

</script>



<div class="global-box searching-for-battle" style={$$props.style}>
  <SvgIcon name="aim" class="spinner" />
  <span>Searching for battle...</span>
  <button on:click={() => SocketManager.lobbyExitMatchMaker()}>Cancel</button>
</div>



<style>

.searching-for-battle {
  position: relative;
  display: flex;
  padding: 0.5em;
}

.searching-for-battle span {
  margin: 0 0.5em;
}

.searching-for-battle button {
  background-color: var(--color-error);
  padding: 0 0.5em;
}

</style>
