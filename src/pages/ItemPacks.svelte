<script lang="ts">

import * as ItemsManager from '../items/ItemsManager'
import { itemsPackStore, rawItemsPackStore } from '../items/ItemsManager'
import WideButton from '../components/WideButton.svelte'
import ProgressBar from '../components/ProgressBar.svelte'
import Logger from '../utils/Logger';
import { push, pop, querystring } from 'svelte-spa-router'
import { PopupData, addPopup } from '../managers/PopupManager'
import { getUsefulErrorMessage } from '../utils/getUsefulErrorMessage'
import { userData } from '../stores/userData'
import { isInMatchMaker } from '../stores/isInMatchMaker'
import { onMount } from 'svelte'



const logger = new Logger("Item Packs Screen");
const defaultPackURL = 'https://gist.githubusercontent.com/ctrlraul/3b5669e4246bc2d7dc669d484db89062/raw'



// Data

let loadingProgress = 0
let currentURL = ''
let saveURL = true
let alreadyLoaded = true


ItemsManager.itemsPackStore.subscribe(itemsPack => {

  if (!itemsPack) {
    alreadyLoaded = false;
    return;
  }

  // Means we're returning to this page to change
  // the pack, so don't instantly go to workshop
  if (alreadyLoaded) {
    return;
  }

  if (saveURL) {
    $userData.lastItemsPackURL = currentURL
  }

  saveURL = true;

  if (itemsPack.issues.length === 0) {

    gotoNextRoute()

  } else {

    addPopup({
      title: `${itemsPack.issues.length} issues found!`,
      message: itemsPack.issues,
      hideOnOffclick: true,
      options: {
        Ok () {
          gotoNextRoute();
          this.remove();
        },
        Retry () {
          loadingProgress = 0;
          loadFromURL(currentURL);
          this.remove();
        }
      }
    })

  }

});



// Functions

function loadDefaultPack (): void {
  loadFromURL(defaultPackURL)
}


async function loadFromURL (url: string): Promise<void> {

  if (!url) {
    return
  }

  currentURL = url

  let awaitingResponsePopup: PopupData | null = addPopup({
    title: url == $userData.lastItemsPackURL ? 'Importing last pack...' : 'Awaiting Response...',
    spinner: true
  });

  const setProgress = (progress: number) => {
    if (awaitingResponsePopup) {
      awaitingResponsePopup.remove();
      awaitingResponsePopup = null;
    }
    loadingProgress = progress;
  }


  try {
  
    await ItemsManager.importItemsPack(url, setProgress);

  } catch (err: any) {

    console.error(err)

    let errMessage = getUsefulErrorMessage(err)

    if (!Array.isArray(errMessage)) {
      errMessage = [errMessage.message]
    }

    addPopup({
      title: 'Could not load this pack!',
      mode: 'error',
      message: `
        Error:
        ${errMessage.join('\n')}
      `,
      options: {
        Ok () { this.remove() }
      }
    })

  }

}


function loadFromFile (e: Event): void {

  const target = e.target as HTMLInputElement

  if (target && target.files) {

    $userData.lastItemsPackURL = null

    const file = target.files[0]

    try {
      saveURL = false
      loadFromURL(URL.createObjectURL(file))
    } catch (err: any) {
      alert(`Failed to load pack: ${err.message}`)
    }

  }
}


function gotoNextRoute () {

  const urlParams = new URLSearchParams($querystring)

  if (urlParams.has('returnTo')) {
    push(urlParams.get('returnTo')!)
  } else {
    push('/workshop')
  }

}



// Lifecycle

onMount(() => {
  // Try to load last items pack if there is no pack already loaded
  if (!$itemsPackStore && $userData.settings.automaticallyLoadLastItemsPack && $userData.lastItemsPackURL) {

    if ($userData.lastItemsPackURL != "https://gist.githubusercontent.com/ctrlraul/22b71089a0dd7fef81e759dfb3dda67b/raw") {
      logger.log("Importing last pack...");
      loadFromURL($userData.lastItemsPackURL);
    }

  }
})

</script>


<main>

  {#if $rawItemsPackStore}

    <div class="global-box items-pack-info">

      <header style="display: flex">
        <span class="name">{$rawItemsPackStore.name}</span>
        <span class="items-count">{$rawItemsPackStore.items.length} items</span>
      </header>

      {#if $rawItemsPackStore.description != ""}
        <div class="description">
          {$rawItemsPackStore.description}
        </div>
      {/if}

      <ProgressBar progress={loadingProgress} />

    </div>

  {:else}

    <h1>Select Items Pack</h1>

    <div class="buttons">

      {#if !$isInMatchMaker}

        <WideButton
          text="Default"
          span="(Recommended)"
          on:click={loadDefaultPack}
        />

        <WideButton
          text="Import From URL"
          on:click={() => loadFromURL(prompt('URL to Items Pack JSON') || '')}
        />

        <WideButton text="Import From File">
          <input
            class="file-input-on-button"
            type="file"
            on:change={loadFromFile}
          />
        </WideButton>

      {/if}

      {#if $itemsPackStore !== null}

        <WideButton
          text="Cancel"
          style="background-color: var(--color-error)"
          on:click={pop}
        />

      {:else if $isInMatchMaker}

        How did we get there?

      {/if}

    </div>
  {/if}

</main>



<style>

main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.buttons {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: 2em;
}

.file-input-on-button {
  position: absolute;
  display: block;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: inherit;
}

.items-pack-info {
  display: flex;
  flex-direction: column;
  width: 24rem;
  padding: 1em;
}

.items-pack-info header .name {
  flex: 1;
  font-weight: 700;
  font-size: 125%;
}

.items-pack-info header .items-count {
  color: var(--color-success);
  text-align: right;
}

.items-pack-info > .description {
  padding: 0.5rem;
  margin: 1rem 0;
  background-color: #00000040;
  border-radius: inherit;
}

</style>
