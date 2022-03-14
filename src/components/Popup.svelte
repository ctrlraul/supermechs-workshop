<script lang="ts">

import SvgIcon from './SvgIcon/SvgIcon.svelte'
	
import type { PopupData } from '../managers/PopupManager'


export let data: PopupData


function onOffClick (e: Event): void {
	if (data.hideOnOffclick && (e.currentTarget === e.target)) {
		data.remove()
	}
}

</script>



<div class="container" on:click={onOffClick}>
	<div class="classic-box {data.mode}">

		<div class="title">{data.title}</div>

		{#if data.message}
			<div class="message">
				{#if Array.isArray(data.message)}

					{#each data.message as line}
						<div>{line}<br/></div>
					{/each}

				{:else}

					{data.message}

				{/if}
			</div>
		{/if}
		

		{#if Object.keys(data.options).length}
			<div class="buttons">

				{#each Object.entries(data.options) as [text, handler]}

					<button on:click={handler.bind(data)}>{text}</button>
          
				{/each}

			</div>
		{/if}

		{#if data.spinner}
			<div class="spinner">
				<SvgIcon name="aim" />
			</div>
		{/if}

	</div>
</div>



<style>

.container {
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: #000000aa;
  z-index: var(--z-index-popup);
}

.container > div {
	--color: var(--color-text);
	position: relative;
	display: flex;
	flex-direction: column;
	width: 24rem;
	max-height: 16rem;
	padding: 0.7rem 1rem;
	border-left: 0.2rem solid var(--color);
	border-right: 0.2rem solid var(--color);
	box-shadow: 0 0 1rem #000000;
}

.container > div.error {
	--color: var(--color-error);
}

.container > div.warn {
	--color: var(--color-warn);
}

.container > div.success {
	--color: var(--color-success);
}


.title {
	font-size: 1.2rem;
	text-align: center;
}

.message {
	margin-top: 1rem;
	overflow-x: hidden;
	overflow-y: auto;
	font-size: 0.8em;
	padding: 0.4rem;
	background-color: #00000088;
	border-radius: var(--ui-radius);
}

.buttons {
	position: relative;
	display: flex;
	justify-content: space-between;
	margin-top: 1rem;
	width: 100%;
	height: 2rem;
}

.buttons button {
	position: relative;
	width: 30%;
	height: 100%;
	background-color: var(--color-text);
	color: var(--color-background-dark);
	border-radius: var(--ui-radius);
	font-weight: 700;
}

.spinner {
	position: absolute;
	right: 0.5em;
	top: 0.5em;
}

</style>
