<script lang="ts">
import type Item from '../../items/Item'
import ItemImage from '../../components/ItemImage.svelte'
import SvgIcon from '../../components/SvgIcon/SvgIcon.svelte'
import tooltip from '../../components/Tooltip/useTooltip'


export let item: Item | null
export let index: number
export let type: Item['type']
export let rtl = false
export let onClear: (index: number) => void
export let onClick: (index: number, type: Item['type']) => void



// Functions

function onSelect (): void {
  onClick(index, type)
}

function onClickClear (): void {
  onClear(index)
}

</script>



<div class="slot" style={$$props.style}>

  <button
    class="img-container global-box {item ? item.element : ''}"
    on:click={onSelect}
    use:tooltip={item}
  >

    {#if item}

      <ItemImage
        {item}
        style="
          position: absolute;
          left: auto;
          top: auto;
          max-width: 87%;
          max-height: 87%;
        "
      />

    {:else}

      <SvgIcon
        name={type}
        color="var(--color-text)"
        style="
          position: absolute;
          left: auto;
          top: auto;
          width: 90%;
          height: 90%;
          {rtl ? 'transform: scaleX(-1);' : ''}
        "
      />
      
    {/if}

  </button>

  {#if item}
    <button class="clear" on:click={onClickClear}  use:tooltip={'Clear Slot'}>
      <SvgIcon name="cross" />
    </button>
  {/if}

</div>



<style>

.slot {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}


.img-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(100% - 0.4em);
  height: calc(100% - 0.4em);
  border: 0.15em solid var(--color-primary);
  z-index: 1;
  transition: background-color 200ms, border-color 200ms;
}

.img-container:hover, 
.img-container:focus {
  transition: unset;
  border-color: var(--color-accent);
  box-shadow: 0 0 0.3em var(--color-accent);
}


.PHYSICAL,
.EXPLOSIVE,
.ELECTRIC,
.COMBINED {
  border-color: #ffffff20;
  background-image: radial-gradient(#000000, #151515)
}
.PHYSICAL { 
  background-image: radial-gradient(#000000, #301500)
}
.EXPLOSIVE { 
  background-image: radial-gradient(#000000, #440000)
}
.ELECTRIC { 
  background-image: radial-gradient(#000000, #001530)
}


.clear {
  position: absolute;
  right: 0.35em;
  top: 0.35em;
  width: 1em;
  height: 1em;
  border-radius: 0 0 0 var(--ui-radius);
  background-color: #ffffff20;
  stroke: var(--color-error);
  z-index: 2;
  /* opacity: 0.5; */
  cursor: pointer;
  stroke: var(--color-text);
  transition:
    opacity 200ms cubic-bezier(0, 0, 0, 1),
    width 200ms cubic-bezier(0, 0, 0, 1),
    height 200ms cubic-bezier(0, 0, 0, 1),
    stroke 200ms cubic-bezier(0, 0, 0, 1);
}

.clear:hover,
.clear:focus {
  opacity: 1;
  width: 1.4em;
  height: 1.4em;
  stroke: var(--color-error);
  transition: unset;
}

</style>