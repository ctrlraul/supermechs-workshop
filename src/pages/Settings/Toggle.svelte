<script lang="ts">

export let value: boolean
export let onToggle: (value: boolean) => void

</script>



<div class="toggle">

  <input
    type="checkbox"
    checked={value}
    on:change={() => onToggle(!value)}
  >

  <div class="thumb"></div>

</div>



<style>

.toggle {
  position: relative;
  display: inline;
  background-color: var(--color-secondary);
  width: 2.8em;
  height: 1.4em;
  border-radius: var(--ui-radius);
  overflow: hidden;
  transition: background-color 200ms;
}

.toggle:hover {
  transition: background-color 0ms;
  background-color: var(--color-accent);
}

.toggle .thumb {
  position: absolute;
  left: 0;
  top: 0;
  width: 50%;
  height: 100%;
  background-color: var(--color-error);
  border-radius: inherit;
  transition: background-color 200ms, left 200ms;
}

.toggle input[type="checkbox"] {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  opacity: 0;
  cursor: pointer;
}

.toggle input[type="checkbox"]:checked ~ .thumb {
  left: 50%;
  background-color: var(--color-success);
}

</style>