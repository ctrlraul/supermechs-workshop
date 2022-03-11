<script lang="ts">

import type Item from '../items/Item'
import StatBlocks from './StatBlocks.svelte'

export let item: Item

const colorForTag: Record<string, string> = {
	custom: '#44eebb',
	unreleased: '#ee44dd',
	premium: '#eeaa44',
	require_jump: '#ee5511',
	melee: '#ae9aff',
}

</script>



<div class="item-info classic-box {$$props.class}" style={$$props.style}>

	<div>{item.name}</div>
	<span class="kind">({item.kind.replace(/_/g, ' ')})</span>

	{#if item.tags.length}
		<div class="tags">
			{#each item.tags as tag}
				<span style="color: {colorForTag[tag] || 'inherit'}">
					{tag.replace(/_/g, ' ')}
				</span>
			{/each}
		</div>
	{/if}

	<div class="separator"></div>

	<div class="stats">
		<StatBlocks source={item.id} style="width: 50%; height: 1.4em"/>
	</div>

</div>



<style>

.item-info {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.kind {
	color: var(--color-text-dark);
	font-size: 0.8em;
}

.tags {
	font-size: 0.75em;
}

.tags > span {
	margin-left: 0.5em;
}

.tags > span:first-of-type {
	margin-left: 0;
}

.kind,
.tags > span {
	text-transform: capitalize;
}

.separator {
	position: relative;
	width: 100%;
	height: 0.1em;
  background-color: var(--color-border);
	margin: 0.5em 0;
}

.stats {
	position: relative;
	display: flex;
	flex-wrap: wrap;
  padding: 0 0.6em;
}

</style>