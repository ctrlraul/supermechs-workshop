<script lang="ts">

import EquippedItemSlot from './EquippedItemSlot.svelte'
import ItemPickingTab from '../../components/ItemPickingTab.svelte'
import SvgIcon from '../../components/SvgIcon/SvgIcon.svelte'
import tooltip from '../../components/Tooltip/useTooltip'
import MechCanvas from '../../components/MechCanvas.svelte'
import MechSummary from '../../components/MechSummary.svelte'
import MatchMakingPopup from '../../components/MatchMakingPopup.svelte'
import { SlotConfig, SLOTS_CONFIG } from './slotsConfig'
import { push, location as routerLocation } from 'svelte-spa-router'
import { addPopup } from '../../managers/PopupManager'
import { getURLQuery } from '../../utils/getURLQuery'
import { backgroundChanger } from '../../utils/useBackgroundChanger'
import { userData } from '../../stores/userData'
import { currentMech } from '../../stores/mechs'
import { getItemByID, items2ids } from '../../items/ItemsManager'
import { saveMech } from '../../managers/UserDataManager'
import { isInMatchMaker } from '../../stores/isInMatchMaker'



// Types

import type Item from '../../items/Item'
import type { MechJSON } from '../../mechs/Mech'



// State

const PATREON_URL = 'https://www.patreon.com/ctrlraul'
const slotAreas = 'abcdefghijklmnopqrst'

let focusedSlotConfig: SlotConfig | null = null

$: hasItemsEquipped = !!$currentMech && $currentMech.getItems().some(Boolean)

// Update mech URL whenever $currentMech changes
$: {
  if ($currentMech !== null) {
    updateMechURL()
  }
}



// Functions

function updateMechURL () {

  const query = getURLQuery()

  query.delete('mech')

  if ($currentMech !== null && hasItemsEquipped) {

    // Remove Non-ASCII characters, very useful to get rid of emojis
    const URLSafeName = $currentMech.name.replace(/[^\x00-\x7F]/g, '')

    const mechData: Partial<MechJSON> = {
      name: URLSafeName || 'Mech Mc.Mecher',
      pack_key: $currentMech.packKey,
      setup: items2ids($currentMech.getItems())
    }

    const ascii = btoa(JSON.stringify(mechData))

    query.set('mech', ascii)

  }

  const string = query.toString()
  let path = '#' + $routerLocation

  if (string) {
    path += '?' + string
  }

  window.history.replaceState({}, '', path)

}



// Events

function onClearSlot (config: SlotConfig): void {
  if ($currentMech) {
    $currentMech.slots[config.name] = null
    saveMech($currentMech)
  }
}


function onClickSlot (config: SlotConfig): void {
  focusedSlotConfig = config
}


function onSelectItem (itemID: Item['id']): void {

  if (!$currentMech || !focusedSlotConfig) {
    return
  }


  $currentMech.slots[focusedSlotConfig.name] = getItemByID(itemID)

  saveMech($currentMech)

  focusedSlotConfig = null

}


function onClickDismountMech (): void {

  if (hasItemsEquipped) {
    addPopup({
      title: 'Dismount Mech',
      message: 'Are you sure?',
      mode: 'error',
      options: {
        Yes () {
          this.remove()
          if ($currentMech) {
            $currentMech.clearSlots()
            $currentMech = $currentMech
            saveMech($currentMech)
            updateMechURL()
          }
        },
        Cancel () { this.remove() },
      }
    })
  }

}


function toggleArenaBuffs (): void {
  $userData.settings.arenaBuffs = !$userData.settings.arenaBuffs
}


function openPatreon (): void {

  const newWindow = window.open(PATREON_URL, '_blank')

  if (newWindow !== null) {
    newWindow.focus()
  }

}


function onClickBattle (): void {

  let issue = ''

  if ($currentMech === null) {
    issue = 'a mech!'
  } else if (!$currentMech.slots.torso) {
    issue = 'a torso!'
  } else if (!$currentMech.slots.legs) {
    issue = 'legs!'
  }

  if (issue) {

    addPopup({
      title: 'Hold on!',
      message: `You can't battle without ` + issue,
      mode: 'error',
      options: {
        Ok () {
          this.remove()
        }
      }
    })

  } else {

    push('/lobby')

  }

}

</script>



{#if $currentMech && focusedSlotConfig}
  <ItemPickingTab
    type={focusedSlotConfig.type}
    currentItem={$currentMech.slots[focusedSlotConfig.name]}
    selectItem={onSelectItem}
  />
{/if}

<main class={focusedSlotConfig ? 'blur' : ''}>

  <div class="mech-container" use:backgroundChanger>
    {#if $currentMech !== null}
      <MechCanvas setup={items2ids($currentMech.getItems())} style="max-width: 70%; max-height: 85%;" />
    {/if}
  </div>

  <div class="slots">
    {#each SLOTS_CONFIG as config, i}
      <EquippedItemSlot
        {config}
        item={$currentMech ? $currentMech.slots[config.name] : null}
        onClear={onClearSlot}
        onClick={onClickSlot}
        style="grid-area: {slotAreas[i]}"
      />
    {/each}
  </div>

  <div class="mech-summary-container">
    {#if $currentMech !== null}
      <MechSummary mech={$currentMech} style="flex: 1; max-width: 20em" />
    {/if}
  </div>

  <div class="buttons">

    <button
      class="global-box {$userData.settings.arenaBuffs ? 'arena-buffs-on' : ''}"
      on:click={toggleArenaBuffs}
      use:tooltip={'Toggle arena buffs'}
    >
      <SvgIcon name="arena_buffs" />
    </button>

    <button class="global-box" on:click={() => push('/mechs')} use:tooltip={'Mechs Manager'}>
      <SvgIcon name="mech" color="var(--color-text)" />
    </button>

    <button class="global-box" on:click={onClickBattle} use:tooltip={'Battle!'}>
      <SvgIcon name="swords" color="var(--color-text)" />
    </button>

    <button class="global-box {hasItemsEquipped ? '' : 'global-disabled'}" on:click={onClickDismountMech} use:tooltip={'Dismount Mech'}>
      <SvgIcon name="trash" color="var(--color-error)" />
    </button>

    <button class="global-box" on:click={() => push('/settings')} use:tooltip={'Settings'}>
      <SvgIcon name="cog" color="var(--color-text)" />
    </button>

    <button class="global-box" on:click={openPatreon} use:tooltip={'Help me continue working on SuperMechs Workshop!'}>
      <SvgIcon name="patreon_logo" color="#FF424D" />
    </button>

  </div>


  {#if $isInMatchMaker}
    <div class="match-making-popup-container">
      <MatchMakingPopup />
    </div>
  {/if}


</main>



<style>

main {
  position: relative;
  display: grid;
  grid-template-areas:
    'slots mech'
    'slots summary';
  grid-template-rows: 1fr 8em;
  grid-template-columns: 16em 1fr;
  max-height: var(--content-height);
  max-width: var(--content-width);
  height: 100%;
  width: 100%;
}


.slots {
  position: relative;
  display: grid;
  grid-template-rows: 3fr 3fr 3fr 2fr 2fr 2fr;
  grid-template-columns: 25fr 8fr 17fr 17fr 8fr 25fr;
  grid-template-areas:
    'a a b b c c'
    'd d e e f f'
    'g g h h i i'
    'j j k k l l'
    'm n n o o p'
    'q r r s s t';
  gap: 0.5em;
  width: 100%;
  height: 100%;
  padding: 0.5em;
  grid-area: slots;
}


.mech-summary-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0 0.5em;
  grid-area: summary;
}


.buttons {
  position: absolute;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5em;
  right: 0.5em;
  top: 0.5em;
  grid-area: buttons;
}

.buttons > button {
  width: 2.2em;
  height: 2.2em;
  padding: 0.3em;
  fill: var(--color-text-dark);
}

.buttons > button:hover,
.buttons > button:focus {
  fill: var(--color-primary);
}

.buttons > button.arena-buffs-on {
  fill: var(--color-success);
}

.mech-container {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  height: 100%;
  grid-area: mech;
}


.match-making-popup-container {
  position: absolute;
  left: 54%;
  top: 0.5em;
  font-size: 0.8em;
}


@media (orientation: portrait) {

  main {
    display: block;
  }


  .slots {
    position: absolute;
    bottom: 0;
    height: 30%;
    grid-template-rows: 3fr 3fr 2fr;
    grid-template-columns: 25fr 8fr 17fr 17fr 8fr 25fr 25fr 8fr 17fr 17fr 8fr 25fr;
    grid-template-areas:
      'd d e e f f a a b b c c'
      'g g h h i i j j k k l l'
      'm n n o o p q r r s s t';
  }


  .mech-summary-container {
    position: absolute;
    left: 0;
    align-items: flex-end;
    bottom: 30.5%;
    height: unset;
  }


  .buttons > button {
    padding: 0.2em;
  }


  .mech-container {
    position: absolute;
    bottom: calc(30% + 8.25em);
    height: 50%;
  }

  .match-making-popup-container {
    left: 0.5em;
    font-size: 1em;
  }

}

</style>
