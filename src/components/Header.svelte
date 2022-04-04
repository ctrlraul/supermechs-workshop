<script lang="ts">

import SvgIcon from './SvgIcon/SvgIcon.svelte'
import { pop } from 'svelte-spa-router'


export let title: string
export let onGoBack: () => any = pop

</script>



<header style={$$props.style}>

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
  height: 3em;
}

header > .title {
  font-size: 1.8em;
}

header > button {
  position: absolute;
  right: 0.2em;
  width: 2em;
  height: 2em;
}

</style>
