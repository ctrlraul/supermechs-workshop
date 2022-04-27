<script lang="ts">

import SvgIcon from './SvgIcon/SvgIcon.svelte'
import { popup } from '../managers/PopupManager'



// Functions

function onOffClick (e: Event): void {
  if ($popup && $popup.hideOnOffclick && (e.currentTarget === e.target)) {
    $popup.remove()
  }
}

</script>



{#if $popup}
  <div class="popup global-blur-sublings global-darkscreen" on:click={onOffClick}>
    <div class="global-box {$popup.mode}">

      <div class="title">{$popup.title}</div>


      {#if $popup.message.length}
        <div class="message">
          {#each $popup.message as line}
            {line}<br/>
          {/each}
        </div>
      {/if}


      {#if $popup.options.size}
        <div class="buttons">
          {#each Array.from($popup.options) as [text, handler]}
            <button on:click={handler.bind($popup)}>
              {text}
            </button>
          {/each}
        </div>
      {/if}


      {#if $popup.spinner}
        <div class="spinner">
          <SvgIcon name="aim" />
        </div>
      {/if}

    </div>
  </div>
{/if}



<style>

.popup {
  z-index: var(--z-index-popup);
}

.popup > div {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 24rem;
  max-height: 16rem;
  padding: 0.7rem 1rem;
  border-left: 0.2rem solid var(--color-text);
  border-right: 0.2rem solid var(--color-text);
  box-shadow: 0 0 1rem #000000;
}

.error {
  border-color: var(--color-error) !important;
}

.warn {
  border-color: var(--color-warn) !important;
}

.success {
  border-color: var(--color-success) !important;
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
  height: 2em;
  max-height: 2em;
  min-height: 2em;
}

.buttons button {
  position: relative;
  width: 30%;
  height: 100%;
  background-color: var(--color-text);
  color: var(--color-primary);
  border-radius: var(--ui-radius);
  font-weight: 700;
}

.spinner {
  position: absolute;
  right: 0.5em;
  top: 0.5em;
}

</style>
