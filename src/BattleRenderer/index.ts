import { Battle } from '../battle/Battle'
import { CanvasFlyingText } from './CanvasFlyingText'
import { CanvasBattleEngine } from './CamvasBattleEngine'



// Types

import type { BattlePlayer } from '../battle/BattlePlayer'



// Data

const animationsStack: (() => void)[] = []
const engine = new CanvasBattleEngine()



// Methods

export function setCanvas (canvas: HTMLCanvasElement) {
  engine.setCanvas(canvas)
}



export function setBattle (battle: Battle, povPlayerID: BattlePlayer['id']) {
  animationsStack.length = 0
  engine.setBattle(battle, povPlayerID)
}



export function getPlayerGfx (playerID: BattlePlayer['id']) {
  return engine.mech1.player.id === playerID ? engine.mech1 : engine.mech2
}



export function getVisualX (position: number): number {
  return (5 + position / Battle.MAX_POSITION_INDEX * 90) / 100 * engine.root.width
}



export function pushAnimation (animation: () => void): void {

  animationsStack.push(animation)

  if (animationsStack.length === 1) {
    animation()
  }

}



export function nextAnimation (): void {

  animationsStack.shift()

  if (animationsStack.length) {
    animationsStack[0]()
  }

}



export function showFlyingText (text: string, x: number, rgb: [number, number, number]): void {

  const flyingText = new CanvasFlyingText(text, rgb)

  flyingText.x = x
  flyingText.y = -50

  if (engine.mech2.player.id === engine.pov) {
    flyingText.scaleX = -1
  }

  engine.mechsGfxContainer.addChild(flyingText)

}
