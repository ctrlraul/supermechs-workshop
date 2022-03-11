<script lang="ts">
import SvgIcon from './SvgIcon/SvgIcon.svelte'


export let title: string
export let onGoBack: () => any
</script>



<header style={$$props.style}>

	<div class="title">{title}</div>

	{#if onGoBack}
		<button class="classic-box" on:click={onGoBack}>
			<SvgIcon name="cross" color="var(--color-text)" />
		</button>
	{/if}

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
