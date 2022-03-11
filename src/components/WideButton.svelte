<script lang="ts">
export let text: string
export let span = ''
</script>


<button on:click class="classic-box">

	{text}

	{#if span}
		<span>{span}</span>
	{/if}

	<slot></slot>

</button>


<style>
button {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	width: 90%;
	max-width: 16em;
	padding: 0.4em 0;
	font-family: inherit;
	font-size: inherit;
	cursor: pointer;
	margin: 0.5em;
}

button span {
	position: relative;
	display: block;
	font-size: 0.8em;
	color: var(--color-text-dark);
}
</style>
