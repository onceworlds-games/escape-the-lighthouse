// Room 3: The Lamp Room, the top of the tower. Pure data.
export default {
  id: 'lamp',
  name: 'The Lamp Room',
  short: 'Lamp Room',
  par: 1000,
  badge: 'lamp',
  start: { wall: 0 },
  walls: [
    { name: 'The Lamp', dir: 'N' },
    { name: 'The East Gallery', dir: 'E' },
    { name: 'The Stores', dir: 'S' },
    { name: "The Keeper's Desk", dir: 'W' },
  ],
  shell: { kind: 'lantern', r: 3.4, h: 3.4, style: 'lamp', openings: [] },
  env: { outside: 'sea', ship: true, sky: 0x08101c, fog: 0x0a1220, fogDensity: 0.010, ambient: 0x34456a, ambientI: 0.65, moon: { from: [8, 8, 4], color: 0x8aa6e6, i: 1.1 }, exposure: 1.0 },
  lights: [
    { id: 'desk', wall: 3, x: 0.3, y: 1.7, d: 0.7, color: 0xffb25c, i: 2.6, dist: 8, flicker: 0.2, shadow: true },
    { id: 'stores', wall: 2, x: 0, y: 2.4, d: 0.9, color: 0xffb25c, i: 1.2, dist: 6, flicker: 0.1 },
    { id: 'burner', wall: 0, x: 0, y: 1.9, d: 1.7, color: 0xfff0c0, i: 5, dist: 12, flicker: 0.05, showIf: 'burnerLit' },
  ],

  items: {
    gear_large: { name: 'Large Gear', desc: 'A big brass wheel. Its teeth are worn but sound.' },
    gear_mid: { name: 'Mid Gear', desc: 'The middle wheel of the station clock. Same pattern as the lamp clockwork.' },
    gear_small: { name: 'Small Gear', desc: 'A little pinion. Oiled, ready to run.' },
    mantle: { name: 'Gas Mantle', desc: 'Fragile as ash. It glows white when the burner lights it.' },
    fuel_can: { name: 'Fuel Can', desc: 'A dented can with a long spout. Empty.' },
    fuel_can_full: { name: 'Full Fuel Can', desc: 'Heavy with paraffin. It smells sharp.' },
  },

  notes: {
    keeperlog: {
      title: "Keeper's lighting log",
      hand: true,
      body: "To light the lamp:\n\n1. Fill the tank with paraffin and fit a mantle.\n2. Wind the clockwork so the lens turns. The case catch is keyed to the safe channel on the chart: follow it leg by leg from the anchor.\n3. Set the focusing rings to the posts: OUTER ring to the EAST post, MIDDLE to the SOUTH post, INNER to the WEST post. Each post carries its sign.\n4. Light the burner. Then the lever.\n\nThe spares cabinet holds the big wheel and the small one. The middle wheel I lent to the station clock; it is the same pattern.\n\nE.M.",
    },
    plaqueObs: { title: 'Bronze plaque', hand: true, body: 'THIS LIGHT FIRST SHONE IN THE YEAR 1891.' },
    spareTag: { title: 'Spares tag', hand: true, body: 'SPARES.\nKeypad: the year she first shone.' },
    channelObs: { title: 'Safe channel chart', art: 'channel', body: 'From the anchor, north through the Teeth.' },
    postEast: { title: 'East post', hand: true, body: 'A brass plate: an ANCHOR.' },
    postSouth: { title: 'South post', hand: true, body: 'A brass plate: a WAVE.' },
    postWest: { title: 'West post', hand: true, body: 'A brass plate: a STAR.' },
  },

  combos: [],

  views: {
    baseview: { wall: 0, x: 0, y: 1.2, d: 3.3, ty: 0.75, fov: 42, wid: 0.85, name: 'The Clockwork' },
    lensview: { wall: 0, x: 0, y: 1.8, d: 3.6, ty: 1.9, fov: 42, wid: 1.0, name: 'The Lens' },
    plaqueview: { wall: 1, x: -1.3, y: 1.6, d: 1.4, ty: 1.55, fov: 42, wid: 0.45, name: 'Plaque' },
    eastview: { wall: 1, x: 1.78, y: 1.7, d: 1.4, ty: 1.7, fov: 42, wid: 0.4, name: 'East Post' },
    southview: { wall: 2, x: 0, y: 1.7, d: 1.4, ty: 1.7, fov: 42, wid: 0.4, name: 'South Post' },
    westview: { wall: 3, x: -1.78, y: 1.7, d: 1.4, ty: 1.7, fov: 42, wid: 0.4, name: 'West Post' },
    cabinetview: { wall: 2, x: -1.1, y: 1.4, d: 1.5, ty: 1.15, fov: 42, wid: 0.75, name: 'The Spares Cabinet' },
    chartview: { wall: 3, x: 1.5, y: 1.75, d: 1.5, ty: 1.75, fov: 42, wid: 0.75, name: 'Channel Chart' },
    deskview3: { wall: 3, x: 0.3, y: 1.5, d: 1.6, ty: 0.9, fov: 42, wid: 0.8, name: "The Keeper's Desk" },
  },

  things: [
    // ---- wall 0: the lamp ----
    { id: 'lampbase', wall: 0, x: 0, d: 1.7, prop: 'lampbase', states: { open: { lock: 'casehatch' }, geared: { lock: 'gearbox' }, wound: 'wound', tank: 'tankFilled', mantle: 'mantleIn', lit: 'burnerLit', focused: { lock: 'rings' }, beam: 'lampLit' } },
    {
      id: 'base_tap', name: 'Clockwork case', wall: 0, x: 0, y: 0.5, d: 1.45, hit: [1.2, 1.0, 0.5], view: 'wall:0',
      tap: [{ do: [{ go: 'baseview' }] }],
    },
    {
      id: 'hatch', name: 'Case catch', wall: 0, x: 0, y: 0.7, d: 1.3, hit: [0.5, 0.5, 0.15], view: 'baseview', lock: 'casehatch', hideIf: { lock: 'casehatch' },
    },
    {
      id: 'gearbox', name: 'Gear train', wall: 0, x: 0, y: 0.7, d: 1.35, hit: [0.8, 0.6, 0.2], view: 'baseview', lock: 'gearbox', showIf: { lock: 'casehatch' },
      tap: [{ if: { lock: 'gearbox' }, say: 'The gear train meshes, waiting for a hand on the crank.' }],
    },
    {
      id: 'winder', name: 'Winding socket', wall: 0, x: 0.55, y: 0.5, d: 1.3, hit: [0.25, 0.25, 0.2], view: 'baseview', showIf: { lock: 'casehatch' },
      tap: [{ if: 'wound', say: 'Wound tight. The lens turns slowly.' }, { say: 'A square winding socket. It needs a crank.' }],
      use: {
        crank: [
          { if: 'wound', say: 'The spring is already wound.' },
          { if: { not: { lock: 'gearbox' } }, say: 'The crank spins freely. The gears are not all in place.' },
          { say: 'You wind the clockwork. The great lens begins to turn.', do: [{ set: 'wound' }, { sfx: 'wind' }] },
        ],
      },
    },
    {
      id: 'burner', name: 'Burner', wall: 0, x: 0, y: 1.45, d: 1.7, hit: [0.6, 0.7, 0.6], view: 'wall:0',
      tap: [
        { if: 'burnerLit', say: 'The mantle burns white. It only needs the lever.' },
        { if: { not: 'tankFilled' }, say: 'The reservoir is dry.' },
        { if: { not: 'mantleIn' }, say: 'The burner has no mantle.' },
        { say: 'Fuel and mantle are ready. It needs a flame.' },
      ],
      use: {
        fuel_can_full: [
          { if: 'tankFilled', say: 'The tank is full.' },
          { say: 'You pour the paraffin into the reservoir.', do: [{ take: 'fuel_can_full' }, { give: 'fuel_can' }, { set: 'tankFilled' }, { sfx: 'pour' }] },
        ],
        fuel_can: [{ say: 'The can is empty.' }],
        mantle: [
          { if: 'mantleIn', say: 'A mantle is already fitted.' },
          { say: 'You fit the mantle over the burner, gently.', do: [{ take: 'mantle' }, { set: 'mantleIn' }] },
        ],
        lantern_lit: [
          { if: 'burnerLit', say: 'It is already burning.' },
          { if: { not: 'tankFilled' }, say: 'There is no fuel to light.' },
          { if: { not: 'mantleIn' }, say: 'Without a mantle it would only smoke.' },
          { say: 'The mantle catches and flares white.', do: [{ set: 'burnerLit' }, { sfx: 'ignite' }] },
        ],
      },
    },
    {
      id: 'lensrings', name: 'Focusing rings', wall: 0, x: 0, y: 2.3, d: 1.7, hit: [1.4, 0.5, 1.4], view: 'wall:0', lock: 'rings',
      tap: [{ if: { lock: 'rings' }, say: 'The three rings are set. The lens is in focus.' }],
    },
    {
      id: 'lever', name: 'Lamp lever', wall: 0, x: 1.1, y: 0.95, d: 1.25, prop: 'lever', states: { down: 'lampLit' }, hit: [0.4, 0.7, 0.4, 0, 0.1, 0], view: 'wall:0',
      tap: [
        { if: 'lampLit', say: 'The light is turning.' },
        { if: { not: 'burnerLit' }, say: 'The lever is stiff. The lamp has no flame.' },
        { if: { not: 'wound' }, say: 'The lever will not move: the clockwork is not wound.' },
        { if: { not: { lock: 'rings' } }, say: 'The lever catches. The lens is out of focus.' },
        { say: 'You throw the lever. The lens takes the flame and the beam swings out.', do: [{ set: 'lampLit' }, { sfx: 'lamp' }] },
      ],
    },
    { id: 'hatchfloor', wall: 0, x: -2.1, d: 1.2, prop: 'floorhatch' },

    // ---- wall 1: the east gallery ----
    {
      id: 'plaque', name: 'Plaque', wall: 1, x: -1.3, y: 1.6, d: 0.1, prop: 'plaque', hit: [0.6, 0.45, 0.14], view: 'wall:1',
      tap: [{ do: [{ go: 'plaqueview' }, { set: 'sawPlaque' }, { note: 'plaqueObs', read: false }] }],
    },
    {
      id: 'plate_east', name: 'East post plate', wall: 1, x: 1.78, y: 1.7, d: 0.1, prop: 'plate', params: { sign: 'anchor' }, hit: [0.5, 0.5, 0.14], view: 'wall:1',
      tap: [{ do: [{ go: 'eastview' }, { set: 'sawEast' }, { note: 'postEast', read: false }] }],
    },
    { id: 'telescope', name: 'Telescope', wall: 1, x: 0.3, d: 0.8, prop: 'telescope', hit: [0.6, 1.5, 0.8, 0, 0.8, 0], view: 'wall:1', tap: [{ say: 'Through the glass: a ship with one lantern lit, steering straight for the Teeth.' }] },
    { id: 'gallerydoor', wall: 1, x: -0.4, d: 0.05, prop: 'gallerydoor' },
    { id: 'tempbench', wall: 1, x: 2.3, d: 0.5, prop: 'barrel', params: { small: true } },

    // ---- wall 2: the stores ----
    {
      id: 'cabinet', name: 'Spares cabinet', wall: 2, x: -1.1, d: 0.35, prop: 'cabinet', states: { open: 'cabinetOpen' }, hit: [1.1, 1.8, 0.6, 0, 0.9, 0], view: 'wall:2',
      tap: [{ do: [{ go: 'cabinetview' }] }],
    },
    { id: 'cab_keypad', name: 'Keypad', wall: 2, x: -0.8, y: 1.15, d: 0.7, hit: [0.3, 0.4, 0.14], view: 'cabinetview', lock: 'cabinet', hideIf: { lock: 'cabinet' } },
    {
      id: 'cab_tag', name: 'Paper tag', wall: 2, x: -1.4, y: 1.35, d: 0.68, prop: 'tag', hit: [0.25, 0.3, 0.14], view: 'cabinetview',
      tap: [{ do: [{ note: 'spareTag', read: false }, { say: 'SPARES. Keypad: the year she first shone.' }] }],
    },
    {
      id: 'cab_gear_large', name: 'Large gear', wall: 2, x: -1.4, y: 0.95, d: 0.45, prop: 'item', params: { item: 'gear_large', flat: true }, hit: [0.4, 0.4, 0.3], view: 'cabinetview', showIf: 'cabinetOpen', hideIf: { got: 'gear_large' },
      tap: [{ do: [{ give: 'gear_large', from: 'cab_gear_large' }] }],
    },
    {
      id: 'cab_gear_small', name: 'Small gear', wall: 2, x: -1.0, y: 0.95, d: 0.45, prop: 'item', params: { item: 'gear_small', flat: true }, hit: [0.3, 0.3, 0.3], view: 'cabinetview', showIf: 'cabinetOpen', hideIf: { got: 'gear_small' },
      tap: [{ do: [{ give: 'gear_small', from: 'cab_gear_small' }] }],
    },
    {
      id: 'cab_mantle', name: 'Gas mantle', wall: 2, x: -0.65, y: 0.95, d: 0.45, prop: 'item', params: { item: 'mantle', flat: true }, hit: [0.3, 0.3, 0.3], view: 'cabinetview', showIf: 'cabinetOpen', hideIf: { got: 'mantle' },
      tap: [{ do: [{ give: 'mantle', from: 'cab_mantle' }, { say: 'A spare mantle in a paper sleeve. Handle it gently.' }] }],
    },
    {
      id: 'fuelshelf', name: 'Fuel can', wall: 2, x: 0.7, y: 0.0, d: 0.5, prop: 'item', params: { item: 'fuel_can', floor: true }, hit: [0.4, 0.5, 0.4], view: 'wall:2', hideIf: { got: 'fuel_can' },
      tap: [{ do: [{ give: 'fuel_can', from: 'fuelshelf' }, { say: 'A dented fuel can with a long spout.' }] }],
    },
    {
      id: 'barrel', name: 'Paraffin barrel', wall: 2, x: 1.6, d: 0.5, prop: 'barrel', hit: [0.8, 1.0, 0.8, 0, 0.5, 0], view: 'wall:2',
      tap: [{ say: 'A barrel of paraffin, tap at the bottom. You need something to carry it.' }],
      use: {
        fuel_can: [{ say: 'You fill the can from the barrel tap.', do: [{ take: 'fuel_can' }, { give: 'fuel_can_full' }, { sfx: 'pour' }] }],
        fuel_can_full: [{ say: 'The can is full already.' }],
      },
    },
    {
      id: 'plate_south', name: 'South post plate', wall: 2, x: 0, y: 1.7, d: 0.1, prop: 'plate', params: { sign: 'wave' }, hit: [0.5, 0.5, 0.14], view: 'wall:2',
      tap: [{ do: [{ go: 'southview' }, { set: 'sawSouth' }, { note: 'postSouth', read: false }] }],
    },
    { id: 'coil3', wall: 2, x: 2.4, d: 0.5, prop: 'ropecoil' },

    // ---- wall 3: the keeper's desk ----
    { id: 'desk3', wall: 3, x: 0.3, d: 0.55, prop: 'desk', params: { w: 1.7 } },
    {
      id: 'keeperlog', name: "Keeper's log", wall: 3, x: 0.0, y: 0.8, d: 0.55, prop: 'logbook', hit: [0.45, 0.15, 0.35], view: 'wall:3',
      tap: [{ if: { note: 'keeperlog' }, do: [{ readNote: 'keeperlog' }] }, { do: [{ note: 'keeperlog' }] }],
    },
    {
      id: 'wallclock', name: 'Station clock', wall: 3, x: -0.95, y: 2.0, d: 0.06, prop: 'wallclock', params: { r: 0.42 }, hit: [0.9, 0.9, 0.16], view: 'wall:3',
      tap: [{ if: { got: 'gear_mid' }, say: 'The clock is gutted now. It never ran anyway.' }, { say: 'A big station clock, long stopped. Its back plate is held on with screws.' }],
      use: {
        screwdriver: [
          { if: { got: 'gear_mid' }, say: 'There is nothing left inside.' },
          { say: 'You undo the back plate. Inside, a brass gear that looks very familiar.', do: [{ give: 'gear_mid', from: 'wallclock' }, { sfx: 'screws' }] },
        ],
      },
    },
    {
      id: 'chart3', name: 'Channel chart', wall: 3, x: 1.7, y: 1.75, d: 0.06, prop: 'channelchart', hit: [0.8, 1.0, 0.14], view: 'wall:3',
      tap: [{ do: [{ go: 'chartview' }, { set: 'sawChart' }, { note: 'channelObs', read: false }] }],
    },
    {
      id: 'plate_west', name: 'West post plate', wall: 3, x: -1.78, y: 1.7, d: 0.1, prop: 'plate', params: { sign: 'star' }, hit: [0.5, 0.5, 0.14], view: 'wall:3',
      tap: [{ do: [{ go: 'westview' }, { set: 'sawWest' }, { note: 'postWest', read: false }] }],
    },
    { id: 'deskchair3', wall: 3, x: 0.3, d: 1.4, ry: 170, prop: 'chair' },
    { id: 'deskoil', wall: 3, x: 0.7, y: 0.8, d: 0.5, prop: 'oillamp' },
  ],

  locks: {
    cabinet: { type: 'keypad', title: 'Spares cabinet', solution: '1891', max: 4, onSolve: [{ set: 'cabinetOpen' }, { say: 'The keypad chimes. The cabinet door swings out.' }] },
    casehatch: { type: 'arrows', title: 'Case catch', solution: 'URULU', onSolve: [{ say: 'The catch drops. The case opens on the gear train.' }] },
    gearbox: {
      type: 'slots', title: 'Gear train',
      slots: [{ id: 'a', item: 'gear_large', label: 'Large' }, { id: 'b', item: 'gear_mid', label: 'Middle' }, { id: 'c', item: 'gear_small', label: 'Small' }],
      onSolve: [{ say: 'The last gear meshes. The train is whole.' }],
    },
    rings: {
      type: 'rings', title: 'Focusing rings', rings: 3, positions: 8, symbols: ['anchor', 'star', 'wave', 'shell', 'bell', 'fish', 'sun', 'key'], init: [4, 1, 6], solution: [0, 2, 1],
      onSolve: [{ say: 'The rings lock into focus. The lens gleams.' }],
    },
  },

  steps: [
    { id: 'plaque', thread: 'A', text: 'Read the plaque', done: 'sawPlaque', hints: ['A bronze plaque hangs on the east side.', 'Tap the plaque by the east gallery door.', 'It says the light first shone in 1891.'] },
    { id: 'cabinet', thread: 'A', requires: ['plaque'], text: 'Open the spares cabinet', done: { lock: 'cabinet' }, hints: ['The south cabinet has a four digit keypad and a tag.', 'The tag says the code is the year she first shone.', 'The keypad code is 1891.'] },
    { id: 'clockgear', thread: 'B', text: 'Take the clock wheel', done: { got: 'gear_mid' }, hints: ['The keeper wrote that he lent a wheel to the station clock.', 'The clock on the keeper desk wall has screws on its back.', 'Use the screwdriver on the station clock.'] },
    { id: 'chart', thread: 'C', text: 'Read the channel chart', done: 'sawChart', hints: ['A chart hangs on the desk wall.', 'Tap the framed chart and look at the dotted track.', 'The track runs up, right, up, left, up from the anchor.'] },
    { id: 'case', thread: 'C', requires: ['chart'], text: 'Open the clockwork case', done: { lock: 'casehatch' }, hints: ['The clockwork case has an arrow catch.', 'Follow the safe channel leg by leg from the anchor.', 'Press up, right, up, left, up.'] },
    { id: 'gears', thread: 'C', requires: ['cabinet', 'clockgear', 'case'], text: 'Fit the three gears', done: { lock: 'gearbox' }, hints: ['The open case wants three gears.', 'You should have a big one, a small one and the clock wheel.', 'Select each gear and tap the gear train.'] },
    { id: 'wound', thread: 'C', requires: ['gears'], text: 'Wind the clockwork', done: 'wound', hints: ['The gears are in. Something still has to turn them.', 'The crank from the radio room fits the winding socket.', 'Select the crank and tap the winding socket.'] },
    { id: 'tank', thread: 'D', text: 'Fill the burner tank', done: 'tankFilled', hints: ['The burner is dry.', 'Fill the empty fuel can from the paraffin barrel, then pour it in.', 'Take the can, use it on the barrel, then use the full can on the burner.'] },
    { id: 'burning', thread: 'D', requires: ['tank', 'cabinet'], text: 'Light the burner', done: 'burnerLit', hints: ['The burner needs a mantle and a flame.', 'Take the mantle from the cabinet and fit it. Your lantern is still lit.', 'Use the mantle on the burner, then the lit lantern.'] },
    { id: 'posts', thread: 'E', text: 'Read the three posts', done: ['sawEast', 'sawSouth', 'sawWest'], hints: ['The lighting log mentions signs on the posts.', 'There is a plate on the east, south and west posts.', 'East: anchor. South: wave. West: star.'] },
    { id: 'rings', thread: 'E', requires: ['posts'], text: 'Focus the lens', done: { lock: 'rings' }, hints: ['The lens has three rings.', 'Outer ring to the east sign, middle to south, inner to west.', 'Outer: anchor. Middle: wave. Inner: star.'] },
    { id: 'lamp', thread: 'E', requires: ['wound', 'burning', 'rings'], text: 'Throw the lever', done: 'lampLit', hints: ['Everything is ready.', 'The brass lever at the foot of the lamp.', 'Tap the lever.'] },
  ],

  escape: 'lampLit',

  walkthrough: [
    ['tap', 'plaque'],
    ['tap', 'cab_tag'],
    ['lock', 'cabinet', '1891'],
    ['tap', 'cab_gear_large'],
    ['tap', 'cab_gear_small'],
    ['tap', 'cab_mantle'],
    ['use', 'screwdriver', 'wallclock'],
    ['tap', 'chart3'],
    ['lock', 'casehatch', 'URULU'],
    ['place', 'gearbox', 'a', 'gear_large'],
    ['place', 'gearbox', 'b', 'gear_mid'],
    ['place', 'gearbox', 'c', 'gear_small'],
    ['use', 'crank', 'winder'],
    ['tap', 'fuelshelf'],
    ['use', 'fuel_can', 'barrel'],
    ['use', 'fuel_can_full', 'burner'],
    ['use', 'mantle', 'burner'],
    ['use', 'lantern_lit', 'burner'],
    ['tap', 'plate_east'],
    ['tap', 'plate_south'],
    ['tap', 'plate_west'],
    ['lock', 'rings', [0, 2, 1]],
    ['tap', 'lever'],
  ],
};
