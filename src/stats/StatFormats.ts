export type StatFormat = typeof StatFormats[number];
export type StatKey = StatFormat['key'];


const StatFormats = [{
	key: "weight",
	name: "Weight",
	type: "number",
	buff: null
}, {
	key: "health",
	name: "Health",
	type: "number",
	buff: {
		mode: "add",
		amount: 350
	}
}, {
	key: "eneCap",
	name: "Energy Capacity",
	type: "number",
	buff: {
		mode: "mul",
		amount: 1.2
	}
}, {
	key: "eneReg",
	name: "Energy Regeneration",
	type: "number",
	buff: {
		mode: "mul",
		amount: 1.2
	}
}, {
	key: "heaCap",
	name: "Heat Capacity",
	type: "number",
	buff: {
		mode: "mul",
		amount: 1.2
	}
}, {
	key: "heaCol",
	name: "Cooling",
	type: "number",
	buff: {
		mode: "mul",
		amount: 1.2
	}
}, {
	key: "bulletsCap",
	name: "Bullets Capacity",
	type: "number",
	buff: null
}, {
	key: "rocketsCap",
	name: "Rockets Capacity",
	type: "number",
	buff: null
}, {
	key: "phyRes",
	name: "Physical Resistance",
	type: "number",
	buff: {
		mode: "mul",
		amount: 1.4
	}
}, {
	key: "expRes",
	name: "Explosive Resistance",
	type: "number",
	buff: {
		mode: "mul",
		amount: 1.4
	}
}, {
	key: "eleRes",
	name: "Electric Resistance",
	type: "number",
	buff: {
		mode: "mul",
		amount: 1.4
	}
}, {
	key: "phyDmg",
	name: "Physical Damage",
	type: "range",
	buff: {
		mode: "mul",
		amount: 1.2
	}
}, {
	key: "phyResDmg",
	name: "Physical Resistance Damage",
	type: "number",
	buff: null
}, {
	key: "eleDmg",
	name: "Electric Damage",
	type: "range",
	buff: {
		mode: "mul",
		amount: 1.2
	}
}, {
	key: "eneDmg",
	name: "Energy Damage",
	type: "number",
	buff: {
		mode: "mul",
		amount: 1.2
	}
}, {
	key: "eneCapDmg",
	name: "Energy Capacity Damage",
	type: "number",
	buff: null
}, {
	key: "eneRegDmg",
	name: "Energy Regeneration Damage",
	type: "number",
	buff: null
}, {
	key: "eleResDmg",
	name: "Electric Resistance Damage",
	type: "number",
	buff: null
}, {
	key: "expDmg",
	name: "Explosive Damage",
	type: "range",
	buff: {
		mode: "mul",
		amount: 1.2
	}
}, {
	key: "heaDmg",
	name: "Heat Damage",
	type: "number",
	buff: {
		mode: "mul",
		amount: 1.2
	}
}, {
	key: "heaCapDmg",
	name: "Heat Capacity Damage",
	type: "number",
	buff: null
}, {
	key: "heaColDmg",
	name: "Cooling Damage",
	type: "number",
	buff: null
}, {
	key: "expResDmg",
	name: "Explosive Resistance Damage",
	type: "number",
	buff: null
}, {
	key: "walk",
	name: "Walking Distance",
	type: "number",
	buff: null
}, {
	key: "jump",
	name: "Jumping Distance",
	type: "number",
	buff: null
}, {
	key: "range",
	name: "Range",
	type: "range",
	buff: null
}, {
	key: "push",
	name: "Knockback",
	type: "number",
	buff: null
}, {
	key: "pull",
	name: "Pull",
	type: "number",
	buff: null
}, {
	key: "recoil",
	name: "Recoil",
	type: "number",
	buff: null
}, {
	key: "advance",
	name: "Advance",
	type: "number",
	buff: null
}, {
	key: "retreat",
	name: "Retreat",
	type: "number",
	buff: null
}, {
	key: "uses",
	name: "Uses",
	type: "number",
	buff: null
}, {
	key: "backfire",
	name: "Backfire",
	type: "number",
	buff: {
		mode: "mul",
		amount: 0.8
	}
}, {
	key: "heaCost",
	name: "Heat Generation",
	type: "number",
	buff: null
}, {
	key: "eneCost",
	name: "Energy Consumption",
	type: "number",
	buff: null
}, {
	key: "bulletsCost",
	name: "Bullets Usage",
	type: "number",
	buff: null
}, {
	key: "rocketsCost",
	name: "Rockets Usage",
	type: "number",
	buff: null
}] as const;


export default StatFormats;
