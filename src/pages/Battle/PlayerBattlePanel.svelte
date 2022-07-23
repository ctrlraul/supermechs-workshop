<script lang="ts">

import ProgressBar from '../../components/ProgressBar.svelte'
import ItemImage from '../../components/ItemImage.svelte'
import tooltip from '../../components/Tooltip/useTooltip'
import SvgIcon from '../../components/SvgIcon/SvgIcon.svelte'
import ItemButton from './Controls/ItemButton.svelte'
import { getStatInstruction } from '../../stats/StatsManager'
import { BattleItem, getItemByIdOrThrow } from '../../items/ItemsManager'
import { getPlayerGfx } from '../../BattleRenderer'
import { BattlePlayer } from '../../battle/BattlePlayer'



// Types 

import type { Battle } from '../../battle/Battle'



// State

export let player: BattlePlayer | null;
export let battle: Battle | null;
export let rtl = false

const turnIconURL = getStatInstruction('uses').imageURL;

const visualInfo = (
  player && battle
  ? {
    torso: getItemByIdOrThrow(player.slots.torso!.id),
    opponentName: battle.getOpponentForPlayerID(player.id).name,
    playerGfx: getPlayerGfx(player.id),
  }
  : null
)

// const torso = getItemByIdOrThrow(player.slots.torso!.id)
// const opponentName = battle.getOpponentForPlayerID(player.id).name
// const playerGfx = getPlayerGfx(player.id)

let showItemsInspector = false;
let focusedItem: BattleItem | null = null;
let stats: BattlePlayer['stats'] = (
  visualInfo
  ? visualInfo.playerGfx.stats
  : BattlePlayer.getDummyStats()
);

$: inspectableItems = (
  player
  ? [player.slots.legs!, ...player.weapons, ...player.utils]
  : []
);

$: isMyTurn = player && battle && player.id === battle.attacker.id;


if (visualInfo) {
  visualInfo.playerGfx.onStatsUpdate = value => stats = value;
}



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



<div style={$$props.style} class="panel {player && player.admin ? 'admin' : ''} {rtl ? 'rtl' : ''}">


  <!-- Player Fnfo -->

  <div class="profile-picture-container">
    {#if visualInfo}
      <ItemImage item={visualInfo.torso} style="width: 100%; height: 100%;" />
    {/if}
  </div>

  <div class="names">
    <span class="player-name">
      {player ? player.name : 'User Name'}
    </span>
    <span class="mech-name">
      <SvgIcon
        name="mech"
        color="var(--color-accent)" 
        style="width: 1em; height: 1em;"
      />
      {player ? player.mechName : 'Mech Name'}
    </span>
  </div>


  <!-- Stats -->

  <ProgressBar
    progress={stats.health / stats.healthCap}
    barColor="#e6aa44"
    style="grid-area:health"
    fraction={stats.healthCap}
    rtl={rtl}
  />

  <ProgressBar
    progress={stats.energy / stats.eneCap}
    barColor="rgb(68, 166, 230)"
    style="grid-area:energy"
    fraction={stats.eneCap}
    rtl={rtl}
    tooltipData={stats.eneReg + ' Energy Regeneration'}
  />

  <ProgressBar
    progress={stats.heat / stats.heaCap}
    barColor="rgb(212 56 56)"
    style="grid-area:heat"
    fraction={stats.heaCap}
    rtl={rtl}
    tooltipData={stats.heaCol + ' Cooling'}
  />

  <div class="resistances">

    <div use:tooltip={getResTooltipText('Physical', stats.phyRes, '#e6aa44')}>
      <img src="/assets/images/phy-shield.png" alt="Physical Resistance">
      <div class="value text-outline">{stats.phyRes}</div>
    </div>

    <div use:tooltip={getResTooltipText('Explosive', stats.expRes, 'rgb(212 56 56)')}>
      <img src="/assets/images/exp-shield.png" alt="Explosive Resistance">
      <div class="value text-outline">{stats.expRes}</div>
    </div>

    <div use:tooltip={getResTooltipText('Electric', stats.eleRes, 'rgb(68, 166, 230)')}>
      <img src="/assets/images/ele-shield.png" alt="Electric Resistance">
      <div class="value text-outline">{stats.eleRes}</div>
    </div>

  </div>


  <!-- Action Points -->

  <div class="turns" use:tooltip={`${battle ? battle.actionPoints : '?'} Action Points`}>
    <img src={turnIconURL} alt="Turn" style={isMyTurn && battle && battle.actionPoints > 0 ? '' : 'filter:brightness(0.4)'}>
    <img src={turnIconURL} alt="Turn" style={isMyTurn && battle && battle.actionPoints > 1 ? '' : 'filter:brightness(0.4)'}>
  </div>


  <!-- Items Inspector -->

  <div class="items-inspector-toggle">
    <button class="global-box" on:click={toggleItemsInspector} on:blur={() => showItemsInspector = false}>
      <SvgIcon name="SIDE_WEAPON" />
    </button>
  </div>

  {#if showItemsInspector}
    <div class="items-inspector">
      {#each inspectableItems as item}
        <ItemButton
          {item}
          {battle}
          style="font-size: 0.7em; cursor: unset"
          setFocusedItem={item => focusedItem = item}
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
  flex: 1;
  grid-template-rows: 2.2em 1.4em 1.4em 2.5em;
  grid-template-columns: 5fr 7fr 7fr;
  grid-template-areas:
    'pfp names names'
    'pfp health health'
    'pfp energy heat'
    'turns res inspect';
  gap: 0.3em;
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


.names {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  padding: 0 0.5em;
  grid-area: names;
}

.player-name {
  font-size: 1.1em;
}

.admin .player-name {
  color: #ff8800;
}

.mech-name {
  position: relative;
  display: flex;
  align-items: center;
  font-size: 0.9em;
  color: var(--color-accent);
  gap: 0.4em;
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
  font-weight: 600;
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
  background-color: var(--color-primary-dark);
  border: 0.15em solid var(--color-primary);
  border-radius: var(--ui-radius);
  z-index: 2;
}

.panel.rtl > .items-inspector {
  transform: scaleX(-1);
  direction: ltr;
}

</style>
