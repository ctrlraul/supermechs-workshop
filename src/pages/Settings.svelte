<script lang="ts">

import Header from '../components/Header.svelte'


const toggles = [{
  label: 'Advanced Damage Display',
  toggle: ''
}]

</script>



<main>

  <Header title="Settings" />

  <ul></ul>

</main>



<style>

main {
  max-height: var(--content-height);
  max-width: var(--content-width);
  height: 100%;
  width: 100%;
}

</style>
