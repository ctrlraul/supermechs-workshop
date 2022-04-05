<script lang="ts">

import * as router from 'svelte-spa-router'
import WideButton from '../components/WideButton.svelte'
import ProgressBar from '../components/ProgressBar.svelte'
import { importItemsPack } from '../items/ItemsManager'
import { itemsPackData } from '../stores'
import { addPopup } from '../managers/PopupManager'
import { getUsefulErrorMessage } from '../utils/getUsefulErrorMessage'
import { userData } from '../stores/userData'



// Consts
// const defaultPackURL = 'https://gist.githubusercontent.com/ctrlraul/3b5669e4246bc2d7dc669d484db89062/raw'
const defaultPackURL = 'https://gist.githubusercontent.com/ctrlraul/22b71089a0dd7fef81e759dfb3dda67b/raw'
const discordTag = 'ctrl-raul#9419'
const forumProfile = 'https://community.supermechs.com/profile/20-raul/'



// Data

let loadingProgress = 0



// Events

function loadDefaultPack (): void {
  loadFromURL(defaultPackURL)
}


async function loadFromURL (url: string, saveURL = true): Promise<void> {

  if (!url) {
    return
  }


  const popup = addPopup({
    title: 'Awaiting Response...',
    spinner: true
  })


  try {
  
    const result = await importItemsPack(url, progress => loadingProgress = progress)

    itemsPackData.set(result.data)

  } catch (err: any) {

    console.error(err)

    let errMessage = getUsefulErrorMessage(err)

    if (!Array.isArray(errMessage)) {
      errMessage = [errMessage.message]
    }

    addPopup({
      title: 'Could not load this pack!',
      message: [
        `Error:`,
        ...errMessage,
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

    loadingProgress = 0
    popup.remove()

    if (itemsPackData !== null && saveURL) {
      $userData.lastItemsPackURL = url
    }

  }

}


function loadFromFile (e: Event): void {

  const target = e.target as HTMLInputElement

  if (target && target.files) {

    $userData.lastItemsPackURL = null

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
