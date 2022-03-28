<script lang="ts">

import separateDecimals from '../utils/separateDecimals'
import tooltip from './Tooltip/useTooltip'
import * as StatsManager from '../stats/StatsManager'
import { userData } from '../stores/userData'



// Types

import type Item from '../items/Item'
import type { StatKey } from '../stats/StatFormats'



// State

export let source: Item['id'] | Item['id'][] | Item['stats']


$: stats = getStats(source, $userData.settings.arenaBuffs)
$: entries = Object.entries(stats) as [StatKey, number | number[]][]
$: instructions = entries.map(([key]) => StatsManager.getStatInstruction(key))



// Functions

function getColorForWeight (weight: number | number[]): string {
  // We are accepting arrays solely because
  // svelte doesn't let me wanna use the
  // "as ..." operator in the html. But no
  // it can never come as an array.
  return (
    weight > 1009 ? 'var(--color-error)'   :
    weight > 1000 ? '#ff8844'              :
    weight > 999  ? 'var(--color-accent)'  :
    weight > 994  ? 'var(--color-success)' :
    'inherit'
  )
}


function getStats (statsSource: typeof source, arenaBuffs: boolean): Item['stats'] {

  if (typeof statsSource === 'number') {
    return (
      arenaBuffs
      ? StatsManager.getBuffedItemStats(statsSource)
      : StatsManager.getItemStats(statsSource)
    )
  }

  if (Array.isArray(statsSource)) {
    return (
      arenaBuffs
      ? StatsManager.getBuffedMechSummary(statsSource)
      : StatsManager.getMechSummary(statsSource)
    )
  }

  return statsSource

}

</script>


{#each entries as [key, value], i}
  <div
    class="stat-block"
    style={$$props.style}
    use:tooltip={instructions[i].name}
  >

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
  background-image: linear-gradient(90deg, #00000000, var(--color-secondary));
  border-radius: var(--ui-radius);
  width: 100%;
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
