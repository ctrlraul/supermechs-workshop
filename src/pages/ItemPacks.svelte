<script lang="ts">
import * as router from 'svelte-spa-router'
import { importItemsPack } from '../items/ItemsManager'
import WideButton from '../components/WideButton.svelte'
import ProgressBar from '../components/ProgressBar.svelte'
import * as LocalStorageHandler from '../managers/LocalStorageHandler'
import { itemsPackData } from '../stores'
import { addPopup } from '../managers/PopupManager'
import { onMount } from 'svelte';



// Consts
// const defaultPackURL = 'https://gist.githubusercontent.com/ctrl-raul/3b5669e4246bc2d7dc669d484db89062/raw'
const defaultPackURL = 'https://gist.githubusercontent.com/ctrl-raul/22b71089a0dd7fef81e759dfb3dda67b/raw'
const discordTag = 'ctrl-raul#9419'
const forumProfile = 'https://community.supermechs.com/profile/20-raul/'



// Data

let loadingProgress = 0

onMount(() => {

  if ($itemsPackData !== null) {
    return
  }

  const lastPackURL = LocalStorageHandler.get('last-items-pack-url')

  if (lastPackURL) {
    loadFromURL(lastPackURL)
  }

})



// Events

function loadDefaultPack (): void {
  loadFromURL(defaultPackURL)
}


async function loadFromURL (url: string, saveURL = true): Promise<void> {

  if (!url) {
    return
  }


  try {

    const popup = addPopup({
      title: 'Awaiting Response...',
      spinner: true
    })

    const response = await fetch(url)
    const pack = await response.json()

    const onProgress = (progress: number) => {
      loadingProgress = progress
    }

    await importItemsPack(pack, onProgress)

    popup.remove()

    loadingProgress = 0

    router.push('/workshop')

  } catch (err: any) {

    if (err.message === 'Failed to fetch' && window.navigator.onLine === false) {
      err.message = 'No internet connection'
    }

    addPopup({
      title: 'Could not load this pack!',
      message: [
        `Error: ${err.message}`,
        '',
        'If you\'re having trouble contact me:',
        `Discord: ${discordTag}`,
        `Forum: ${forumProfile}`,
        '',
        '(Make sure to screenshot or copy this error message)',
        '',
        'Raul.'
      ],
      options: {
        Ok () { this.remove() }
      }
    })

  } finally {

    if (itemsPackData !== null && saveURL) {
      LocalStorageHandler.set('last-items-pack-url', url)
    }

  }

}


function loadFromFile (e: Event): void {

  const target = e.target as HTMLInputElement

  if (target && target.files) {

    const file = target.files[0]

    try {
      loadFromURL(URL.createObjectURL(file), false)
    } catch (err: any) {
      alert(`Failed to load pack: ${err.message}`)
    }

  }
}

</script>


<main>

  {#if loadingProgress > 0 && $itemsPackData}

    <div class="classic-box items-pack-info">

      <h3 class="name">
        {$itemsPackData.name}
        <span>({$itemsPackData.items.length} items)</span>
      </h3>

      <div class="separator"></div>

      <div class="description">
        {$itemsPackData.description}
      </div>

      <ProgressBar progress={loadingProgress} />

    </div>

  {:else}

    <h1>Select Items Pack</h1>

    <div class="buttons">

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

      {#if $itemsPackData !== null}
        <WideButton text="Cancel" on:click={() => router.pop()} />
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
  width: 24rem;
  padding: 1em;
}

.items-pack-info > .name {
  width: 100%;
  text-align: center;
}

.items-pack-info > .name > span {
  color: var(--color-success);
  margin-left: 1rem;
}

.items-pack-info > .description {
  padding: 1rem;
}

</style>
