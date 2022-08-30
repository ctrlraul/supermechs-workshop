import { writable } from 'svelte/store';



// Data

export enum MatchMakerState {
  In,
  Awaiting,
  Out,
}

export const matchMakerState = writable(MatchMakerState.Out);
