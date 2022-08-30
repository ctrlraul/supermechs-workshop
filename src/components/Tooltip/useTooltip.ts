import { tooltip } from '../../stores'
import type Item from '../../items/Item'
import { get } from 'svelte/store'



export type TooltipData = string | Item | null | { summary: Item['stats'] }


// Just to avoid making a new instance of this
// function for every element that shows a tooltip
const clear = () => tooltip.set(null)

let currentNode: HTMLElement


export default function (node: HTMLElement, data: TooltipData) {

  const show = () => {
    currentNode = node
    tooltip.set(data)
  }

  node.addEventListener('mouseup', show)
  node.addEventListener('mouseover', show)
  node.addEventListener('mousedown', clear)
  node.addEventListener('mouseout', clear)

  return {
    update (newData: TooltipData) {
      data = newData
      if (get(tooltip) !== null && node === currentNode) {
        tooltip.set(data)
      }
    },
    destroy: clear,
  }

}
