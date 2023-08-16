<script lang="ts">

import separateDecimals from '../utils/separateDecimals'
import tooltip from './Tooltip/useTooltip'
import * as StatsManager from '../stats/StatsManager'
import { userData } from '../stores/userData'
import { itemsPackStore } from '../items/ItemsManager'



// Types

import type Item from '../items/Item'
import type { StatKey } from '../stats/StatFormats'
import type { ItemStats } from '../items/Item'



// State

export let source: Item['id'] | Item['id'][] | Item['stats']


type StatEntry <K extends StatKey = StatKey> = [K, ItemStats[K]]


$: stats = getStats(source);
$: entries = Object.entries(stats) as StatEntry[]
$: instructions = entries.map(([key]) => StatsManager.getStatInstruction(key))
$: useAdvancedDamage = $userData.settings.advancedDamageDisplay



// Functions

function getTooltipText <K extends StatKey> (key: K, value: ItemStats[K]): string {

  if (key === 'weight') {

    const weight = value as number;

    if (weight > StatsManager.OVERLOAD_LIMIT) {
      return `Too heavy for battle!`;
    }

    if (weight > StatsManager.WEIGHT_LIMIT) {
      return 'Over-weighted!\nYou can still battle but your health is nerfed.'
    }

  }

  return StatsManager.getStatInstruction(key).name

}


function getStyleForWeight (value: number): string | null {

  if (value > StatsManager.OVERLOAD_LIMIT) {
    return 'color: var(--color-error);'
  }

  if (value > StatsManager.WEIGHT_LIMIT) {
    return 'color: #ff8844;'
  }

  if (value > 999) {
    return 'color: var(--color-accent);'
  }

  if (value > 994) {
    return 'color: var(--color-success);'
  }

  return null

}


function getStats (statsSource: typeof source): Item['stats'] {

  if (typeof statsSource === 'number') {
    return StatsManager.getSmartItemStats(statsSource);
  }

  if (Array.isArray(statsSource)) {
    return StatsManager.getSmartMechSummary(statsSource);
  }

  return statsSource

}


function getAverage (min: number, max: number): number {
  return (min + max) * 0.5
}


function getRandomnessText (min: number, max: number): string {
  const scale = (1 - min / max)
  return (scale * 100).toFixed(0)
}


function getRandomnessStyle (min: number, max: number): string {
  return `color: hsl(${min / max * 115}, 100%, 70%);`
}


function isDamageType (key: StatKey): boolean {
  return ['phyDmg', 'expDmg', 'eleDmg'].includes(key)
}

</script>


{#each entries as [key, value], i}

  <div
    class="stat-block"
    style={$$props.style}
    use:tooltip={getTooltipText(key, value)}
  >

    <img class="icon" src={instructions[i].imageURL} alt={key} />

    <div class="output-container">

      {#if Array.isArray(value)}

        {#if useAdvancedDamage && isDamageType(key) && !$itemsPackStore?.legacy}

          <output>
            {separateDecimals(Math.round(getAverage(...value)))}~
          </output>

          <output class="randomness" style={getRandomnessStyle(...value)}>
            {getRandomnessText(...value)}
          </output>

        {:else}

          <output>
            {value[0] == value[1] ? value[0] : value.map(separateDecimals).join('-')}
          </output>

        {/if}

      {:else}

        <output style={key === 'weight' ? getStyleForWeight(value) : null}>
          {separateDecimals(value)}
        </output>

      {/if}

    </div>

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


.icon {
  position: relative;
  display: block;
  width: 1.2rem;
  height: 1.2rem;
  margin-right: 0.5rem;
  object-fit: contain;
  image-rendering: -webkit-optimize-contrast;
}


.output-container {
  display: flex;
  align-items: center;
}


.randomness {
  font-size: 0.8em;
  margin-left: 0.5em;
}

.randomness::after {
  content: '%';
}

</style>
