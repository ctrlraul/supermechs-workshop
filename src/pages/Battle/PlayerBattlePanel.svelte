<script lang="ts">

import type { BattlePlayer } from '../../battle/BattlePlayer'
import type { Battle } from '../../battle/Battle'
import { getStatInstruction } from '../../stats/StatsManager'
import ProgressBar from '../../components/ProgressBar.svelte'
import { BattleItem, getItemByID } from '../../items/ItemsManager'
import ItemImage from '../../components/ItemImage.svelte'
import tooltip from '../../components/Tooltip/useTooltip'
import SvgIcon from '../../components/SvgIcon/SvgIcon.svelte'
import ControlItemButton from './ControlItemButton.svelte'



export let player: BattlePlayer
export let battle: Battle
export let rtl = false



// State

const torso = getItemByID(player.items[0]!.id)!
const opponentName = battle.getOpponentForPlayerID(player.id).name
const turnIconURL = getStatInstruction('uses').imageURL
$: inspectableItems = [player.legs, ...player.weapons, ...player.utils].filter(Boolean) as BattleItem[]

let showItemsInspector = false
let focusedItem: BattleItem | null = null

$: isMyTurn = battle.attacker.id === player.id



// Functions

function getResTooltipText (type: string, amount: number, color: string) {

  const highlight = (text: string) => `<span style="color: ${color}; font-weight: 700;">${text}</span>`

  let text = 'no extra'

  if (amount !== 0) {
    text = amount > 0 ? amount + ' less' : amount * -1 + ' extra'
  }

  return `${amount} ${highlight(`${type} Resistance`)}\n(Takes ${text} ${highlight(type)} damage)`

}


function toggleItemsInspector (): void {
  showItemsInspector = !showItemsInspector
}

</script>



<div style={$$props.style} class="panel {rtl ? 'rtl' : ''}">


  <!-- Player Fnfo -->

  <div class="profile-picture-container">
    <ItemImage item={torso} style="width: 100%; height: 100%;" />
  </div>

  <div class="name">{player.name}</div>


  <!-- Stats -->

  <ProgressBar
    progress={player.stats.health / player.stats.healthCap}
    barColor="#e6aa44"
    style="grid-area:health"
    fraction={player.stats.healthCap}
    rtl={rtl}
  />

  <ProgressBar
    progress={player.stats.energy / player.stats.eneCap}
    barColor="rgb(68, 166, 230)"
    style="grid-area:energy"
    fraction={player.stats.eneCap}
    rtl={rtl}
    tooltipData={player.stats.eneReg + ' Energy Regeneration'}
  />

  <ProgressBar
    progress={player.stats.heat / player.stats.heaCap}
    barColor="rgb(212 56 56)"
    style="grid-area:heat"
    fraction={player.stats.heaCap}
    rtl={rtl}
    tooltipData={player.stats.heaCol + ' Cooling'}
  />

  <div class="resistances">

    <div use:tooltip={getResTooltipText('Physical', player.stats.phyRes, '#e6aa44')}>
      <img src="/assets/phy-shield.png" alt="Physical Resistance">
      <div class="value text-outline">{player.stats.phyRes}</div>
    </div>

    <div use:tooltip={getResTooltipText('Explosive', player.stats.expRes, 'rgb(212 56 56)')}>
      <img src="/assets/exp-shield.png" alt="Explosive Resistance">
      <div class="value text-outline">{player.stats.expRes}</div>
    </div>

    <div use:tooltip={getResTooltipText('Electric', player.stats.eleRes, 'rgb(68, 166, 230)')}>
      <img src="/assets/ele-shield.png" alt="Electric Resistance">
      <div class="value text-outline">{player.stats.eleRes}</div>
    </div>

  </div>


  <!-- Action Points -->

  <div class="turns" use:tooltip={isMyTurn ? `${battle.actionPoints} Action Points` : `${opponentName}'s turn!`}>
    <img src={turnIconURL} alt="Turn" style={isMyTurn && battle.actionPoints > 0 ? '' : 'filter:brightness(0.4)'}>
    <img src={turnIconURL} alt="Turn" style={isMyTurn && battle.actionPoints > 1 ? '' : 'filter:brightness(0.4)'}>
  </div>


  <!-- Items Inspector -->

  <div class="items-inspector-toggle">
    <button class="classic-box" on:click={toggleItemsInspector}>
      <SvgIcon name="SIDE_WEAPON" />
    </button>
  </div>

  {#if showItemsInspector}
    <div class="items-inspector">
      {#each inspectableItems as item}
        <ControlItemButton
          {item}
          {battle}
          style="font-size: 0.7em; cursor: unset"
          onHoverIn={() => focusedItem = item}
          onHoverOut={() => {
            if (focusedItem === item) {
              focusedItem = null
            }
          }}
        />
      {/each}
    </div>
  {/if}

  {#if focusedItem}
    <!-- <div class="focused-item-stats">
      <StatBlocks source={focusedItem.stats} style="width: 7em;"/>
    </div> -->
  {/if}


</div>



<style>

.panel {
  position: relative;
  display: grid;
  grid-template-rows: 1.5em 1.5em 1.5em 2.5em;
  grid-template-columns: 5em 7em 7em;
  grid-template-areas:
    'pfp name name'
    'pfp health health'
    'pfp energy heat'
    'turns res inspect';
  gap: 0.3em;
  font-weight: 600;
}

.panel.rtl {
  direction: rtl;
}


.panel.rtl > .profile-picture-container {
  transform: scaleX(-1)
}

.profile-picture-container {
  position: relative;
  width: calc(100% - 1em);
  height: calc(100% - 1em);
  margin: 0.5em;
  grid-area: pfp;
}


.name {
  position: relative;
  width: 100%;
  padding: 0 0.5em;
  margin: auto;
  grid-area: name;
}


.turns {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  grid-area: turns;
}


.turns > img {
  width: 1.5em;
  height: 1.5em;
}


.resistances {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  grid-area: res;
}

.resistances > div {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5em;
  height: 2.5em;
  text-align: center;
}

.resistances > div > img {
  position: absolute;
  display: block;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.resistances > div > .value {
  position: relative;
  direction: ltr;
}



.items-inspector-toggle {
  position: relative;
  display: flex;
  align-items: center;
  justify-items: flex-end;
  width: 100%;
  height: 100%;
}

.items-inspector-toggle > button {
  width: 2em;
  height: 2em;
  padding: 0.2em;
  fill: var(--color-text);
  transform: scaleX(-1);
}

.panel.rtl > .items-inspector-toggle > button {
  transform: unset;
}


.items-inspector {
  position: absolute;
  top: 100%;
  top: calc(100% + 0.3em);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3em;
  padding: 0.3em;
  max-width: 20em;
  background-color: var(--color-background-darker);
  border: 0.2em solid var(--color-background);
  border-radius: var(--ui-radius);
  z-index: 2;
}

.panel.rtl > .items-inspector {
  transform: scaleX(-1);
  direction: ltr;
}


/* .focused-item-stats {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  gap: 0.3em;
  padding: 0.3em;
  max-height: 10em;
  width: 15em;
  background-color: var(--color-background-darker);
  border: 0.2em solid var(--color-background);
  z-index: 1;
  font-size: 0.8em;
} */

</style>
