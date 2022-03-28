<script lang="ts">

import StatBlocks from './StatBlocks.svelte'
import SvgIcon from './SvgIcon/SvgIcon.svelte'



export let setup: number[]
export let text: string = ''

</script>



<div class="mech-summary no-select global-box" style={$$props.style}>

  {#if text}
    <div class="header">

      <SvgIcon
        name="mech"
        color="var(--color-text)"
        style="width: 1.5em; height: 1.5em;"
      />

      <span>{text}</span>

    </div>
  {/if}

  <div class="blocks">
    <StatBlocks source={setup} />
  </div>

</div>



<style>

.mech-summary {
  position: relative;
  display: flex;
  justify-content: center;
  flex-direction: column;
  padding: 0.5em;
}


.header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 0.5em;
}

.header span {
  margin-left: 0.5em;
}


.blocks {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  width: 100%;
  gap: 0.5em;
}

</style>
