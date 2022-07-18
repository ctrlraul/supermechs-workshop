<script lang="ts">

import WideButton from '../components/WideButton.svelte'
import ProgressBar from '../components/ProgressBar.svelte'
import { push, pop, querystring } from 'svelte-spa-router'
import { importItemsPack } from '../items/ItemsManager'
import { ItemsPackData, itemsPackData } from '../stores'
import { addPopup } from '../managers/PopupManager'
import { getUsefulErrorMessage } from '../utils/getUsefulErrorMessage'
import { userData } from '../stores/userData'
import { isInMatchMaker } from '../stores/isInMatchMaker'
import { onMount } from 'svelte'



// Consts
// const defaultPackURL = 'https://gist.githubusercontent.com/ctrlraul/3b5669e4246bc2d7dc669d484db89062/raw'
const defaultPackURL = 'https://gist.githubusercontent.com/ctrlraul/22b71089a0dd7fef81e759dfb3dda67b/raw'
const discordTag = 'ctrl-raul#9419'
const forumProfile = 'https://community.supermechs.com/profile/20-raul/'



// Data

let loadingProgress = 0
let currentURL = ''
let saveURL = true



// Functions

function loadDefaultPack (): void {
  loadFromURL(defaultPackURL)
}


async function loadFromURL (url: string): Promise<void> {

  if (!url) {
    return
  }


  currentURL = url


  const popup = addPopup({
    title: 'Awaiting Response...',
    spinner: true
  })


  try {
  
    const itemsPack = await importItemsPack(url, progress => loadingProgress = progress)

    onPackImported(itemsPack)

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

        If you\'re having trouble contact me:
        Discord: ${discordTag}
        Forum: ${forumProfile}

        (Make sure to screenshot or copy this error message)

        Raul
      `,
      options: {
        Ok () { this.remove() }
      }
    })

  } finally {

    popup.remove()

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


function onPackImported (itemsPack: ItemsPackData): void {

  if (saveURL) {
    $userData.lastItemsPackURL = currentURL
  }

  loadingProgress = 0
  saveURL = true

  if (itemsPack.issues.length === 0) {

    itemsPackData.set(itemsPack)
    gotoNextRoute()

  } else {

    addPopup({
      title: `${itemsPack.issues.length} item(s) were not successfuly imported!`,
      message: itemsPack.issues,
      hideOnOffclick: true,
      options: {
        Ok () {
          itemsPackData.set(itemsPack)
          gotoNextRoute()
          this.remove()
        },
        Retry () {
          loadFromURL(currentURL)
          this.remove()
        }
      }
    })

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
  if (!$itemsPackData && $userData.settings.automaticallyLoadLastItemsPack && $userData.lastItemsPackURL) {
    loadFromURL($userData.lastItemsPackURL)
  }
})

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

      {#if $itemsPackData !== null}

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
