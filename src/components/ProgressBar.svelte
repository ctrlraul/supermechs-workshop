<script lang="ts">
import tooltip, { TooltipData } from './Tooltip/useTooltip'



/**
 * Number between 0 and 1, where 0 means 0% and 1 means 100%.
 */
export let progress: number;
export let label = '';
export let barColor = '';
export let fraction = 0;
export let rtl = false;
export let tooltipData: TooltipData = null


$: text = (() => {

  if (label) {
    return label;
  }

  if (fraction) {
    return Math.round(progress * fraction) + ' / ' + fraction;
  }

  return Number((progress * 100).toFixed()) + '%';

})();


</script>



<div class="progress-bar" style={$$props.style} use:tooltip={tooltipData}>

	<div style="
    width: {Math.max(0, Math.min(100, progress * 100))}%;
    background-color: {barColor};
    {rtl ? 'left: unset; right: 0;' : ''}
  "></div>

	<span class="text-outline">{text}</span>

</div>



<style>

.progress-bar {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  background-color: #000000;
  border-radius: var(--ui-radius);
  overflow: hidden;
}


div {
  position: absolute;
  left: 0;
  top: 0;
  width: 0%;
  height: 100%;
  background-color: var(--color-text);
  z-index: 1;
  transition: width 100ms;
}

span {
  /* -webkit-text-stroke: 0.1rem #000000;
  -webkit-text-fill-color: #ffffff; */
  z-index: 2;
  direction: ltr;
}

</style>
