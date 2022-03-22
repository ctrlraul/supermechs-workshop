<script lang="ts">

import StatBlocks from '../../components/StatBlocks.svelte'
import SvgIcon from '../../components/SvgIcon/SvgIcon.svelte'



export let setup: number[]

</script>



<div class="mech-summary no-select">
  <div class="wrapper global-box">

    <div class="header">

      <SvgIcon
        name="mech"
        color="var(--color-text)"
        style="width: 1.5em; height: 1.5em;"
      />

      Mech Stats Summary

    </div>

    <div class="blocks">
      <StatBlocks source={setup} />
    </div>

  </div>
</div>



<style>

.mech-summary {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
  height: 100%;
  grid-area: summary;
  padding-bottom: 0.2em;
}

.wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  max-width: 20em;
  width: 100%;
  padding: 0.5em;
}

.header {
  display: flex;
  justify-content: center;
  gap: 0.5em;
  align-items: center;
}

.blocks {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  width: 100%;
  gap: 0.5em;
}




@media (orientation: portrait) {

  .mech-summary {
    position: absolute;
    left: 0;
    bottom: 30%;
    width: 100%;
    height: 6em;
  }

}

</style>