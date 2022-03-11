import type { Battle } from "./Battle";



export function fireDrone (battle: Battle, damage: number): void {

  const { drone } = battle.attacker

  if (drone === null) {
    throw new Error(`Failed to fire drone: ${battle.attacker.name} does not have a drone equipped`)
  }

	battle.dealDamagesAndTakeBackfire(drone, damage)
	battle.updatePositions(drone)
	battle.countItemUsage(drone)

	if (drone.stats.uses && drone.timesUsed === drone.stats.uses) {
		// Uses are refilled when the drone is
		// toggled on, so no need to do it here
		battle.attacker.droneActive = false
	}

	battle.pushLog(`*${battle.attacker.name}*'s *${drone.name}* fired! (${damage} damage)`)

	battle.onCallAnimation({
		playerID: battle.attacker.id,
		name: 'useWeapon',
		weaponIndex: battle.attacker.items.indexOf(drone)
	})

}


/**
 * Force player to cooldown and returns whether they shutdown (double cooled down)
 */
export function forceCooldown (battle: Battle): boolean {

	const attacker = battle.attacker
	const double = attacker.stats.heat - attacker.stats.heaCol! > attacker.stats.heaCap;
	const amount = attacker.stats.heaCol! * (double ? 2 : 1)
	const previousHeat = attacker.stats.heat

	attacker.stats.heat = Math.max(0, attacker.stats.heat - amount)

	battle.pushLog(`*${attacker.name}* was forced to *${double ? 'double' : ''} cooldown* (-${previousHeat - attacker.stats.heat} heat)`)

	battle.onCallAnimation({
		playerID: battle.attacker.id,
		name: 'cooldown',
	})

	return double
	
}


export function regenEnergy (battle: Battle): void {
	battle.attacker.stats.energy = Math.min(
		battle.attacker.stats.eneCap,
		battle.attacker.stats.energy + battle.attacker.stats.eneReg
	)
}
