<script lang="ts">

import Header from '../../components/Header.svelte'
import tooltip from '../../components/Tooltip/useTooltip'
import Toggle from './Toggle.svelte'
import { UserData, userData } from '../../stores/userData'
import { push } from 'svelte-spa-router'


const togglesConfig = [{
  label: 'Arena Buffs',
  key: 'arenaBuffs' as keyof UserData['settings'],
  tooltip: 'Apply arena buffs to items and mechs.\nNote: This is always on in battle'
}, {
  label: 'Advanced Damage Display',
  key: 'advancedDamageDisplay' as keyof UserData['settings'],
  tooltip: 'Show average damage and randomness percentage instead of raw item damage'
}]

</script>



<main>

  <Header title="Settings" />

  <ul>

    {#each togglesConfig as config}
      <li class="global-box" use:tooltip={config.tooltip}>

        <Toggle
          value={$userData.settings[config.key]}
          onToggle={value => $userData.settings[config.key] = value}
        />

        <span>{config.label}</span>

      </li>
    {/each}

    <li class="global-box" on:click={() => push('/')}>
      <button>
        Change Items Pack
      </button>
    </li>

  </ul>

</main>



<style>

main {
  max-height: var(--content-height);
  max-width: var(--content-width);
  height: 100%;
  width: 100%;
}

ul {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5em;
  padding: 0.5em;
}

li {
  position: relative;
  display: flex;
  padding: inherit;
  align-items: center;
}

li span {
  margin-left: 0.5em;
}

li::after{
  content: '0';
  visibility: hidden;
}

li button {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 2.4em;
  justify-content: start;
  padding: inherit;
}

</style>
