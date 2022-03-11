<script lang="ts">

import separateDecimals from '../utils/separateDecimals'
import tooltip from './Tooltip/useTooltip'
import * as StatsManager from '../stats/StatsManager'



// Types

import type Item from '../items/Item'
import type { StatKey } from '../stats/StatFormats'

export let source: Item['id'] | Item['id'][] | Item['stats']


$: stats = (
	typeof source === 'number'
	? StatsManager.getSmartItemStats(source)
	: Array.isArray(source)
		? StatsManager.getSmartMechSummary(source)
		: source
)
$: entries = Object.entries(stats) as [StatKey, number | number[]][]
$: instructions = entries.map(([key]) => StatsManager.getStatInstruction(key))


function getColorForWeight (weight: number | number[]): string {
	// We are accepting arrays solely because
	// svelte doesn't let me wanna use the
	// "as ..." operator in the html. But no
	// it can never come as an array.
  return (
    weight > 1015 ? 'var(--color-off)'  :
    weight > 1000 ? 'var(--color-bad)'  :
    weight > 999  ? 'var(--color-good)' :
    weight > 995  ? 'var(--color-on)'   :
    'inherit'
  );
}

</script>


{#each entries as [key, value], i}
	<div class="stat-block" style={$$props.style} use:tooltip={instructions[i].name}>

		<img src={instructions[i].imageURL} alt={key} />

		<output style="color: {key === 'weight' ? getColorForWeight(value) : ''}">
			{
				Array.isArray(value)
				? value.map(separateDecimals).join('-')
				: separateDecimals(value)
			}
		</output>

	</div>
{/each}



<style>
.stat-block {
	position: relative;
	display: flex;
  align-items: center;
  white-space: nowrap;
	width: calc(100% / 3);
	height: calc(100% / 3);
}

.stat-block > img {
  position: relative;
	display: block;
	width: 1.2rem;
	height: 1.2rem;
	margin-right: 0.5rem;
	object-fit: contain;
	image-rendering: -webkit-optimize-contrast;
}
</style>
