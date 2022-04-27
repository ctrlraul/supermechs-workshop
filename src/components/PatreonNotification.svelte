<script lang="ts">

import { addPopup } from '../managers/PopupManager'



export let onHide: () => void



const PATREON_URL = 'https://www.patreon.com/ctrlraul'



function onClickYes (): void {
  addPopup({
    title: 'Thank you!',
    mode: 'success',
    message: `
      Hey! You might be able to help Workshop continue working!

      I'm a solo developer working on Workshop Unlimited, and as much as I love working on it, it takes too much of my time to fix bugs and add new features, time that I should be investing in my professional life.

      So if you want to support me and help me continue working on it, consider becoming my Patron, alternatively, I'll have to show ADs in future or just not work on it anymore.

      By the way, Patrons' suggestions are prioritized, so if you want a feature, that's a way to get me to implement it.

      If you want to contact me directly:
      My forum profile: https://community.supermechs.com/profile/20-raul/
      My Discord tag (Faster reply): ctrl-raul#9419
    `,
    options: {
      'Go to Patreon' () {

        this.remove()

        const newWindow = window.open(PATREON_URL, '_blank')

        if (newWindow !== null) {
          newWindow.focus()
        }

        onHide()

      },
      'Not now' () {
        this.remove()
        onHide()
      },
    }
  })
}


function onClickNo (): void {

  addPopup({
    title: 'Sorry to hear!',
    mode: 'error',
    message: `
      If you have suggestions on how I can improve it, please contact me via:

      My forum profile: https://community.supermechs.com/profile/20-raul/
      My Discord tag (Faster reply): ctrl-raul#9419 
    `,
    options: {
      'Maybe Later' () {
        this.remove()
        onHide()
      },
    }
  })

  onHide()

}

</script>



<div class="patreon-notification">

  <div class="content global-box">

    <span>Are you enjoying this app?</span>

    <span class="buttons">
      <button class="button-yes" on:click={onClickYes}>Yes</button>
      <button class="button-no" on:click={onClickNo}>No</button>
    </span>

  </div>

</div>



<style>

.patreon-notification {
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  height: 0;
}


.content {
  display: flex;
  align-items: center;
  padding: 0.5em;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}


.buttons {
  position: relative;
  display: grid;
  grid-template-areas: '. .';
  gap: 0.5em;
  margin-left: 1em;
  stroke: var(--color-text);
}

.buttons button {
  height: 1.5em;
  width: 2em;
}


.button-yes {
  background-color: var(--color-accent);
}

.button-no {
  background-color: var(--color-error);
}

</style>
