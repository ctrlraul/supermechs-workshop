import { Num, Rec, Str, Lit, Opt, Arr, Uni } from 'typeye'



// Raw item v1 typeye

const RawAttachmentPointTe = Rec({ x: Num, y: Num })

const RawTorsoAttachmentTe = Rec({
  leg1: RawAttachmentPointTe,
  leg2: RawAttachmentPointTe,
  side1: RawAttachmentPointTe,
  side2: RawAttachmentPointTe,
  side3: RawAttachmentPointTe,
  side4: RawAttachmentPointTe,
  top1: RawAttachmentPointTe,
  top2: RawAttachmentPointTe,
})

const RawTypeV1Te = Uni(
  Lit('TORSO'), Lit('LEGS'), Lit('SIDE_WEAPON'),
  Lit('TOP_WEAPON'), Lit('DRONE'), Lit('CHARGE_ENGINE'), 
  Lit('TELEPORTER'), Lit('GRAPPLING_HOOK'), Lit('MODULE')
)

const RawElementV1Te = Uni(
  Lit('PHYSICAL'), Lit('EXPLOSIVE'),
  Lit('ELECTRIC'), Lit('COMBINED')
)

const RawStatsV1Te = Rec({
  weight: Num,
  health: Num,
  eneCap: Num,
  eneReg: Num,
  heaCap: Num,
  heaCol: Num,
  phyRes: Num,
  expRes: Num,
  eleRes: Num,
  bulletsCap: Num,
  rocketsCap: Num,
  phyResDmg: Num,
  expResDmg: Num,
  heaDmg: Num,
  heaCapDmg: Num,
  heaColDmg: Num,
  eleResDmg: Num,
  eneDmg: Num,
  eneCapDmg: Num,
  eneRegDmg: Num,
  walk: Num,
  jump: Num,
  push: Num,
  pull: Num,
  recoil: Num,
  advance: Num,
  retreat: Num,
  uses: Num,
  backfire: Num,
  heaCost: Num,
  eneCost: Num,
  bulletsCost: Num,
  rocketsCost: Num,
  phyDmg: Arr(Num, Num),
  expDmg: Arr(Num, Num),
  eleDmg: Arr(Num, Num),
  range: Arr(Num, Num),
})

const RawItemV1Te = Rec({

  id: Num,

  // Meta
  name: Str,
  transform_range: Str,
  unlock_level: Num,
  gold_price: Num,
  tokens_price: Num,

  // Stats
  type: RawTypeV1Te,
  element: RawElementV1Te,
  stats: RawStatsV1Te,
  tags: Opt(Arr(Uni(Lit('legacy'), Lit('melee'), Lit('custom')))),
  
  // Graphic
  width: Num,
  height: Num,

  /** URL */
  image: Str,

  attachment: Opt(Uni(
    RawAttachmentPointTe,
    RawTorsoAttachmentTe
  ))

})



// Items pack v1 typeye

export const ItemsPackV1Te = Rec({

  version: Opt(Lit('1')),

  config: Rec({
    key: Str,
    name: Str,
    description: Str,
    base_url: Str
  }),

  items: Arr(RawItemV1Te)

})
