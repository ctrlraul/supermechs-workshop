import { writable } from 'svelte/store';



// Types

import type { SlotName } from '../mechs/Mech';
import type Item from '../items/Item';

interface DragData {
  item: Item
  from: SlotName
}



// Store

export const dragging = writable<DragData | null>(null);
