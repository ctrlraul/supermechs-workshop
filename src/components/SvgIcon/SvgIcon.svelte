<script lang="ts">

import icons from './icons'


export let name: keyof typeof icons
export let width = "100%"
export let height = "100%"
export let color = 'inherit'


const { viewBox, svg } = icons[name]

</script>



<svg
	fill={color}
	stroke={color}
	style={$$props.style}
	class={$$props.class}
	{width}
	{height}
	{viewBox}>
	{@html svg}
</svg>
