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

</script>



<div class="slot" style={$$props.style}>

  {#if item}
    <button on:click={() => onClear(index)} class="clear">
      <SvgIcon name="cross" />
    </button>
  {/if}

  <button on:click={() => onClick(index, type)} class="img-container classic-box" use:tooltip={item}>

    {#if item}

      <ItemImage {item} style="
        position: absolute;
        left: auto;
        top: auto;
        max-width: 86%;
        max-height: 86%;
      " />

    {:else}

      <SvgIcon
        name={type}
        color="var(--color-text)"
        style="
          transform: scaleX({rtl ? -1 : 1});
          position: absolute;
          left: auto;
          top: auto;
          width: 90%;
          height: 90%;
        "
      />
      
    {/if}

  </button>

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
  z-index: 1;
  border: none;
}

.clear {
  position: absolute;
  right: 0.2em;
  top: 0.2em;
  width: 1em;
  height: 1em;
  border: none;
  border-radius: 0 var(--ui-radius) 0 var(--ui-radius);
  background-color: var(--color-text);
  z-index: 2;
  opacity: 0.5;
  cursor: pointer;
  stroke: var(--color-background);
  transition:
    opacity 100ms ease-out,
    width 100ms ease-out,
    height 100ms ease-out,
    fill 100ms ease-out;
}

.clear:hover {
  opacity: 0.8;
  width: 1.4em;
  height: 1.4em;
  stroke: var(--color-error);
}

</style>