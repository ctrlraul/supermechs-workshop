<script lang="ts">

import SvgIcon from './SvgIcon/SvgIcon.svelte'
import { matchMakerQuit } from '../stores/isInMatchMaker'

</script>



<div class="global-box searching-for-battle" style={$$props.style}>
  <SvgIcon name="aim" class="spinner" />
  <span>Searching for battle...</span>
  <button on:click={matchMakerQuit}>Cancel</button>
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
