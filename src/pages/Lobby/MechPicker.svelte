<script lang="ts">

import SvgIcon from '../../components/SvgIcon/SvgIcon.svelte'
import MechCanvas from '../../components/MechCanvas.svelte'
import Mech from '../../mechs/Mech'
import { items2ids } from '../../items/ItemsManager'
import { clickOutside } from '../../utils/useClickOutside'
import { mechs } from '../../stores/mechs'

export let onPickMech: (mech: Mech | null) => void
export let title: string = 'Pick Mech'




$: fightableMechs = $mechs.filter(mech => {
  return mech.setup[Mech.TORSO_INDEX] && mech.setup[Mech.LEGS_INDEX]
})

</script>



<div class="global-darkscreen" use:clickOutside={() => onPickMech(null)}>
  <div class="contents global-box">

    <header>
      {title}
      <button class="quit" on:click={() => onPickMech(null)}>
        <SvgIcon name="cross" />
      </button>
    </header>

    <div class="mechs-list">
      {#each [...fightableMechs].reverse() as mech}
        <button class="mech-button" on:click={() => onPickMech(mech)}>
          <MechCanvas
            setup={items2ids(mech.setup)}
            outlineThickness={0}
            style="
              position: absolute;
              width: 90%;
              max-height: 80%;
              left: 5%;
              bottom: 0.2em;
            "
          />
          <div class="mech-name">
            {mech.name}
          </div>
        </button>
      {/each}
    </div>

  </div>
</div>



<style>

.contents {
  position: relative;
  width: 27em;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}


header {
  position: relative;
  width: 100%;
  height: 2.5em;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.35em 0 0.7em;
  background-color: var(--color-background-dark);
  font-size: 1.2em;
  border-top-left-radius: var(--ui-radius);
  border-top-right-radius: var(--ui-radius);
  box-shadow: 0 0.1em 1em -0.2em black;
  z-index: 1;
}


.quit {
  width: 1.8em;
  height: 1.8em;
  stroke: var(--color-text);
}


.mechs-list {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 1em;
  width: 100%;
  max-height: 20em;
  overflow-y: auto;
  padding: 1em;
  background-color: var(--color-primary-dark);
}


.mech-button {
  position: relative;
  width: 7.5em;
  height: 7.5em;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  overflow: hidden;
  border-radius: var(--ui-radius);
}

.mech-name {
  position: absolute;
  left: 0;
  top: 0.2em;
  width: 100%;
  height: 1.2em;
  font-size: 0.84em;
}



@media (orientation: portrait) {
  .contents {
    width: 18.5em;
    height: 80%;
  }
}

</style>
