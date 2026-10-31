// Room 2: The Radio Room, the tower's first floor. Pure data.
export default {
  id: 'radio',
  name: 'The Radio Room',
  short: 'Radio Room',
  par: 900,
  badge: 'radio',
  start: { wall: 0 },
  walls: [
    { name: 'The Radio Desk', dir: 'N' },
    { name: 'The Workbench', dir: 'E' },
    { name: 'The Dynamo', dir: 'S' },
    { name: 'The Chart Wall', dir: 'W' },
  ],
  shell: {
    kind: 'round',
    r: 3.6,
    h: 3.1,
    style: 'tower',
    openings: [
      { wall: 0, x: 2.3, y: 1.35, w: 0.9, h: 1.3 },
      { wall: 2, x: -2.2, y: 1.35, w: 0.9, h: 1.3 },
      { wall: 1, x: -2.3, y: 1.35, w: 0.9, h: 1.3 },
    ],
  },
  env: { outside: 'sea', sky: 0x0a1220, fog: 0x0a1220, fogDensity: 0.012, ambient: 0x3a4d78, ambientI: 1.0, moon: { from: [8, 7, -3], color: 0x7d9bdc, i: 1.0 }, exposure: 1.0 },
  lights: [
    { id: 'hang', wall: 0, x: 0.2, y: 2.5, d: 1.6, color: 0xffb25c, i: 7.0, dist: 12, flicker: 0.15, shadow: true, fixture: 'hanging' },
    { id: 'radio', wall: 0, x: -0.1, y: 1.2, d: 0.9, color: 0x6fe0a8, i: 0.5, dist: 3, flicker: 0, showIf: ['fuseIn', { lock: 'breakers' }] },
    { id: 'bench', wall: 1, x: 0, y: 1.9, d: 0.9, color: 0xffc77a, i: 2.4, dist: 6, flicker: 0.1 },
    { id: 'dynamo', wall: 2, x: -0.5, y: 2.1, d: 1.0, color: 0xff9d52, i: 2.2, dist: 6, flicker: 0.2 },
  ],

  items: {
    torch: { name: 'Torch', desc: 'Heavy black torch stamped UV INSPECTION. The cell compartment is empty.' },
    battery: { name: 'Dry Cell', desc: 'A fat brass-capped cell. Still holds a charge.' },
    uv_torch: { name: 'Ultraviolet Torch', desc: 'A violet beam. Some inks only show under it.' },
    crank: { name: 'Crank Handle', desc: 'A cast handle with a square socket.', carry: true },
    copper_wire: { name: 'Copper Wire', desc: 'A stub of bright copper wire.' },
    blown_fuse: { name: 'Blown Fuse', desc: 'The element has burnt through. It is black inside the glass.' },
    fuse_fixed: { name: 'Mended Fuse', desc: 'Copper wire twisted across the contacts. It will hold.' },
    compass: { name: 'Brass Compass', desc: 'The keeper keeps it by the bench. Turn it over.', inspect: { back: 'Engraved on the back: STATION  K N P', note: 'callsign' } },
  },

  notes: {
    radiolog: {
      title: 'Radio log',
      hand: true,
      body: "To call the coast:\n\n1. Crank the dynamo.\n2. Breakers: radio circuit only. Never the lamp circuit as well.\n3. A good fuse in the radio.\n4. Key our call sign. It is engraved on my compass.\n\nThe coast answers on the paper tape with the night's countersign. The stair gate is set to it. The morse chart is on the wall.\n\nE.M.",
    },
    schedule: {
      title: 'Breaker schedule',
      hand: true,
      body: 'RADIO CIRCUIT: switches 2, 4 and 5.\nLAMP CIRCUIT: switches 1, 3 and 6.\n\nThe dynamo cannot carry both. Keep the rest OFF.',
    },
    morsechart: { title: 'Morse chart', art: 'morse', body: 'Copied from the chart on the wall.' },
    flagsObs: { title: 'Storm hoist', hand: true, body: 'The pennants over the bench, left to right: round flag, three-cornered flag, diamond flag.' },
    callsign: { title: 'Compass engraving', hand: true, body: 'STATION CALL SIGN:\nK  N  P' },
    tape: { title: 'Paper tape', art: 'tape', body: 'COAST STATION ANSWERS.\nCountersign, in morse:' },
  },

  combos: [
    { a: 'torch', b: 'battery', result: 'uv_torch', say: 'The torch hums. A violet beam.' },
    { a: 'blown_fuse', b: 'copper_wire', result: 'fuse_fixed', say: 'You twist the copper across the contacts.' },
  ],

  views: {
    radioview: { wall: 0, x: -0.1, y: 1.3, d: 1.7, ty: 1.15, fov: 42, wid: 0.75, name: 'The Radio' },
    toolboxview: { wall: 1, x: 0.2, y: 1.5, d: 1.6, ty: 0.95, fov: 42, wid: 0.65, name: 'The Toolbox' },
    pennantview: { wall: 1, x: 0, y: 2.2, d: 2.2, ty: 2.4, fov: 42, wid: 1.0, name: 'The Pennants' },
    breakerview: { wall: 2, x: 1.3, y: 1.4, d: 1.4, ty: 1.35, fov: 42, wid: 0.55, name: 'Breaker Board' },
    morseview: { wall: 3, x: 0.5, y: 1.65, d: 1.5, ty: 1.65, fov: 42, wid: 0.7, name: 'Morse Chart' },
    tableview: { wall: 3, x: -0.85, y: 1.6, d: 1.4, ty: 0.85, fov: 42, wid: 0.75, name: 'Chart Table' },
    pictureview: { wall: 3, x: -2.0, y: 1.65, d: 1.4, ty: 1.65, fov: 42, wid: 0.7, name: 'The Painting' },
  },

  things: [
    // ---- wall 0: the radio desk ----
    { id: 'opdesk', wall: 0, x: 0, d: 0.5, prop: 'opdesk', params: { w: 2.3 }, states: { open: 'torchTaken' } },
    {
      id: 'radio', name: 'Radio', wall: 0, x: -0.1, y: 0.78, d: 0.5, prop: 'radioset', states: { live: ['fuseIn', { lock: 'breakers' }], fuse: 'fuseIn' }, hit: [1.0, 0.75, 0.55, 0, 0.37, 0], view: 'wall:0',
      tap: [{ do: [{ go: 'radioview' }] }],
    },
    {
      id: 'radio_panel', name: 'Radio panel', wall: 0, x: -0.1, y: 1.05, d: 0.75, hit: [0.8, 0.5, 0.12], view: 'radioview', lock: 'morse',
      tap: [
        { if: { lock: 'morse' }, do: [{ readNote: 'tape' }] },
        { if: { not: 'fuseIn' }, say: 'Nothing. The fuse holder is empty or blown.' },
        { if: { not: { lock: 'breakers' } }, say: 'The valves are cold. No current is reaching the set.' },
      ],
    },
    {
      id: 'fuse_holder', name: 'Fuse holder', wall: 0, x: 0.23, y: 0.92, d: 0.8, hit: [0.17, 0.2, 0.12], view: 'radioview',
      tap: [
        { if: 'fuseIn', say: 'The mended fuse sits snug in its clips.' },
        { if: { got: 'blown_fuse' }, say: 'The holder is empty. A good fuse belongs here.' },
        { say: 'The glass fuse is black inside. Blown.', do: [{ give: 'blown_fuse', from: 'fuse_holder' }] },
      ],
      use: {
        fuse_fixed: [{ say: 'The fuse clips home. A faint hum starts in the set.', do: [{ take: 'fuse_fixed' }, { set: 'fuseIn' }, { sfx: 'fuse' }] }],
        blown_fuse: [{ say: 'It is burnt through. It will not work as it is.' }],
      },
    },
    {
      id: 'logbook', name: 'Radio log', wall: 0, x: -0.95, y: 0.78, d: 0.55, prop: 'logbook', hit: [0.4, 0.15, 0.3], view: 'wall:0',
      tap: [{ if: { note: 'radiolog' }, do: [{ readNote: 'radiolog' }] }, { do: [{ note: 'radiolog' }] }],
    },
    {
      id: 'deskdrawer', name: 'Drawer', wall: 0, x: 0.75, y: 0.58, d: 0.82, hit: [0.65, 0.2, 0.2], view: 'wall:0',
      tap: [
        { if: 'torchTaken', say: 'Pencils and a dead moth.' },
        { say: 'In the drawer: a heavy black torch.', do: [{ set: 'torchTaken' }, { give: 'torch', from: 'deskdrawer' }, { sfx: 'drawer' }] },
      ],
    },
    { id: 'headphones', wall: 0, x: 0.55, y: 0.78, d: 0.5, prop: 'headphones' },
    { id: 'opchair', wall: 0, x: -0.1, d: 1.1, ry: 175, prop: 'chair' },
    { id: 'tubeshelf', wall: 0, x: -1.7, y: 1.7, d: 0.12, prop: 'shelf', params: { w: 1.3, tubes: true } },
    { id: 'shipclock', wall: 0, x: 0.8, y: 2.25, d: 0.06, prop: 'wallclock', params: { r: 0.28 } },
    { id: 'cables', wall: 0, x: 1.25, y: 1.8, d: 0.05, prop: 'cables' },
    { id: 'opmat', wall: 0, x: 0, d: 1.5, prop: 'rug', params: { w: 2.0, d: 1.3, color: '#3b3f4f', stripe: '#b9894f' } },

    // ---- wall 1: the workbench ----
    { id: 'bench', wall: 1, x: 0, d: 0.5, prop: 'workbench', params: { w: 2.5 } },
    {
      id: 'toolbox', name: 'Toolbox', wall: 1, x: 0.2, y: 0.92, d: 0.5, prop: 'toolbox', states: { open: { lock: 'toolbox' } }, hit: [0.7, 0.4, 0.4, 0, 0.18, 0], view: 'wall:1',
      tap: [{ do: [{ go: 'toolboxview' }] }],
    },
    { id: 'toolbox_latch', name: 'Toolbox latch', wall: 1, x: 0.2, y: 1.05, d: 0.78, hit: [0.4, 0.2, 0.16], view: 'toolboxview', lock: 'toolbox', hideIf: { lock: 'toolbox' } },
    {
      id: 'box_crank', name: 'Crank handle', wall: 1, x: -0.05, y: 1.0, d: 0.5, prop: 'item', params: { item: 'crank', flat: true }, hit: [0.4, 0.3, 0.4], view: 'toolboxview', showIf: { lock: 'toolbox' }, hideIf: { got: 'crank' },
      tap: [{ do: [{ give: 'crank', from: 'box_crank' }, { say: 'A crank handle, wrapped in an oily rag.' }] }],
    },
    {
      id: 'box_wire', name: 'Copper wire', wall: 1, x: 0.45, y: 1.0, d: 0.5, prop: 'item', params: { item: 'copper_wire', flat: true }, hit: [0.35, 0.3, 0.35], view: 'toolboxview', showIf: { lock: 'toolbox' }, hideIf: { got: 'copper_wire' },
      tap: [{ do: [{ give: 'copper_wire', from: 'box_wire' }, { say: 'A coil of bright copper wire.' }] }],
    },
    {
      id: 'pennants', name: 'Pennants', wall: 1, x: 0, y: 2.45, d: 0.2, prop: 'pennants', hit: [2.2, 0.6, 0.3], view: 'wall:1',
      tap: [{ do: [{ go: 'pennantview' }, { set: 'sawFlags' }, { note: 'flagsObs', read: false }] }],
    },
    {
      id: 'benchdrawer', name: 'Bench drawer', wall: 1, x: -0.85, y: 0.62, d: 0.8, hit: [0.6, 0.2, 0.2], view: 'wall:1',
      tap: [
        { if: 'compassTaken', say: 'Nails, washers, a lost button.' },
        { say: 'In the bench drawer: a brass compass.', do: [{ set: 'compassTaken' }, { give: 'compass', from: 'benchdrawer' }, { sfx: 'drawer' }] },
      ],
    },
    { id: 'pegboard', wall: 1, x: -0.85, y: 1.6, d: 0.06, prop: 'pegboard' },
    { id: 'vise', wall: 1, x: 0.95, y: 0.92, d: 0.45, prop: 'vise' },
    { id: 'jerry1', wall: 1, x: 1.9, d: 0.5, prop: 'jerrycan' },
    { id: 'jerry2', wall: 1, x: 2.15, d: 0.7, ry: 25, prop: 'jerrycan' },
    { id: 'benchstool', wall: 1, x: -0.4, d: 1.3, prop: 'stool' },
    { id: 'benchlamp', wall: 1, x: -0.45, y: 0.92, d: 0.4, prop: 'oillamp' },

    // ---- wall 2: the dynamo ----
    {
      id: 'dynamo', name: 'Dynamo', wall: 2, x: -0.7, d: 0.7, prop: 'dynamo', states: { running: 'dynamoOn' }, hit: [1.2, 1.2, 0.9, 0, 0.6, 0], view: 'wall:2',
      tap: [{ if: 'dynamoOn', say: 'The dynamo hums steadily.' }, { say: 'A hand-cranked dynamo. The crank handle is missing.' }],
      use: { crank: [{ if: 'dynamoOn', say: 'It is already turning.' }, { say: 'You heave on the crank. The dynamo whines up to speed.', do: [{ set: 'dynamoOn' }, { sfx: 'dynamo' }] }] },
    },
    {
      id: 'breakerbox', name: 'Breaker board', wall: 2, x: 1.3, y: 1.4, d: 0.1, prop: 'breakerbox', states: { set: { lock: 'breakers' } }, hit: [0.6, 0.8, 0.2], view: 'wall:2',
      tap: [{ do: [{ go: 'breakerview' }] }],
    },
    {
      id: 'breaker_board', name: 'Switches', wall: 2, x: 1.3, y: 1.4, d: 0.3, hit: [0.55, 0.65, 0.15], view: 'breakerview', lock: 'breakers',
      tap: [
        { if: { lock: 'breakers' }, say: 'Switches 2, 4 and 5 are up. The radio circuit is live.' },
        { if: { not: 'dynamoOn' }, say: 'The board is dead. Nothing is feeding it.' },
      ],
    },
    { id: 'fueldrum', wall: 2, x: -2.0, d: 0.6, prop: 'barrel' },
    { id: 'pipes', wall: 2, x: 0.3, y: 2.2, d: 0.12, prop: 'pipes' },
    { id: 'ropecoil', wall: 2, x: 2.0, d: 0.5, prop: 'ropecoil' },
    { id: 'dynamat', wall: 2, x: 0, d: 1.5, prop: 'rug', params: { w: 1.8, d: 1.2, color: '#40362e', stripe: '#a67c52' } },

    // ---- wall 3: the chart wall ----
    {
      id: 'picture', name: 'Painting', wall: 3, x: -2.0, y: 1.7, d: 0.06, prop: 'framedpic', states: { open: { lock: 'picture' } }, hit: [0.9, 0.9, 0.14], view: 'wall:3', lock: 'picture',
      tap: [{ if: { lock: 'picture' }, say: 'The painting hangs open on its hinge.' }, { do: [{ go: 'pictureview' }] }],
    },
    { id: 'picture_lock', name: 'Painting', wall: 3, x: -2.0, y: 1.7, d: 0.14, hit: [0.8, 0.8, 0.1], view: 'pictureview', lock: 'picture', hideIf: { lock: 'picture' } },
    {
      id: 'battery_spot', name: 'Dry cell', wall: 3, x: -2.0, y: 1.7, d: 0.07, prop: 'item', params: { item: 'battery', flat: true }, hit: [0.4, 0.4, 0.3], view: 'pictureview', showIf: { lock: 'picture' }, hideIf: { got: 'battery' },
      tap: [{ do: [{ give: 'battery', from: 'battery_spot' }, { say: 'A dry cell, wrapped in waxed cloth.' }] }],
    },
    { id: 'charttable', wall: 3, x: -0.85, d: 0.55, prop: 'charttable', params: { w: 1.4 } },
    {
      id: 'sheet', name: 'Chart paper', wall: 3, x: -0.85, y: 0.82, d: 0.55, hit: [0.8, 0.12, 0.6], view: 'wall:3', lock: 'sheet',
      tap: [{ if: { lock: 'sheet' }, do: [{ readNote: 'schedule' }] }, { do: [{ go: 'tableview' }] }],
    },
    {
      id: 'sheet_close', name: 'Chart paper', wall: 3, x: -0.85, y: 0.84, d: 0.55, hit: [0.8, 0.08, 0.6], view: 'tableview', lock: 'sheet',
      tap: [
        { if: { lock: 'sheet' }, do: [{ readNote: 'schedule' }] },
        { if: { not: { has: 'uv_torch' } }, say: 'A sheet of chart paper. Blank, as far as you can see. Marks may be hiding in it.' },
      ],
      use: { uv_torch: [{ if: { lock: 'sheet' }, do: [{ readNote: 'schedule' }] }, { do: [{ lock: 'sheet' }] }], '*': [{ say: 'Nothing shows.' }] },
    },
    {
      id: 'morsechart', name: 'Morse chart', wall: 3, x: 0.5, y: 1.65, d: 0.05, prop: 'morseposter', hit: [0.9, 1.1, 0.1], view: 'wall:3',
      tap: [{ do: [{ go: 'morseview' }, { note: 'morsechart', read: false }] }],
    },
    { id: 'gate', name: 'Stair gate', wall: 3, x: 1.95, d: 0.1, prop: 'gate', states: { open: { lock: 'gate' } }, hit: [1.0, 2.3, 0.4, 0, 1.15, 0], view: 'wall:3', lock: 'gate' },
    { id: 'chartstool', wall: 3, x: -0.85, d: 1.35, prop: 'stool' },
    { id: 'globe', wall: 3, x: 0.15, y: 0.0, d: 0.9, prop: 'globe' },
  ],

  locks: {
    toolbox: {
      type: 'symbols', title: 'Toolbox',
      symbols: [{ id: 'circle', color: '#e0b020' }, { id: 'triangle', color: '#c0392b' }, { id: 'square', color: '#2f6fb0' }, { id: 'diamond', color: '#3d9a5a' }],
      solution: ['circle', 'triangle', 'diamond'],
      onSolve: [{ say: 'The latch springs. The lid lifts.' }],
    },
    breakers: {
      type: 'switches', title: 'Breaker board', labels: ['1', '2', '3', '4', '5', '6'], init: [1, 0, 1, 0, 0, 1], solution: [0, 1, 0, 1, 1, 0],
      onSolve: [{ say: 'The radio circuit is live.' }],
    },
    picture: { type: 'sliding', title: 'The painting', size: 3, seed: 11, onSolve: [{ say: 'The painting clicks and swings open. A hollow behind it.' }] },
    sheet: { type: 'reveal', title: 'Chart paper', onSolve: [{ say: 'Faint violet lines. A handwritten schedule.' }, { note: 'schedule' }] },
    morse: { type: 'morse', title: 'Telegraph key', solution: 'KNP', onSolve: [{ say: 'The set clatters. Paper creeps out of the slot.' }, { set: 'sent' }, { note: 'tape' }] },
    gate: { type: 'letters', title: 'Stair gate', n: 5, solution: 'SHORE', onSolve: [{ say: 'The gate swings back on the stair.' }, { set: 'gateOpen' }] },
  },

  steps: [
    { id: 'torch', thread: 'A', text: 'Find a torch', done: { got: 'torch' }, hints: ['The radio desk has a drawer.', 'Tap the drawer on the right of the desk.', 'Open the desk drawer and take the torch.'] },
    { id: 'battery', thread: 'A', text: 'Open the painting', done: { got: 'battery' }, hints: ['One picture on the chart wall looks like a puzzle.', 'The painting is a sliding picture. Put the pieces back in order.', 'Slide the tiles until the lighthouse is whole, then take the cell behind it.'] },
    { id: 'uv', thread: 'A', requires: ['torch', 'battery'], text: 'Make a light', done: { got: 'uv_torch' }, hints: ['The torch is dead and you found a battery.', 'Combine the torch with the dry cell.', 'Select the torch, then tap the battery.'] },
    { id: 'sheet', thread: 'A', requires: ['uv'], text: 'Reveal the writing', done: { lock: 'sheet' }, hints: ['The chart table holds a sheet that is not as blank as it looks.', 'Shine the ultraviolet torch over the paper.', 'Go close to the chart table, select the torch and sweep it over the sheet.'] },
    { id: 'toolbox', thread: 'B', text: 'Open the toolbox', done: { lock: 'toolbox' }, hints: ['The red toolbox is locked by coloured symbols.', 'Something hangs over the workbench that matches the toolbox lid.', 'Press circle, triangle, diamond: the order of the storm hoist pennants.'] },
    { id: 'dynamo', thread: 'C', requires: ['toolbox'], text: 'Start the dynamo', done: 'dynamoOn', hints: ['The dynamo is missing something.', 'The toolbox holds a crank handle. Use it on the dynamo.', 'Select the crank handle and tap the dynamo.'] },
    { id: 'breakers', thread: 'C', requires: ['dynamo', 'sheet'], text: 'Set the breakers', done: { lock: 'breakers' }, hints: ['The breaker board needs power and a plan.', 'The schedule you revealed lists the radio switches.', 'Switch 2, 4 and 5 up. 1, 3 and 6 down.'] },
    { id: 'fuse', thread: 'D', requires: ['toolbox'], text: 'Mend the fuse', done: { got: 'fuse_fixed' }, hints: ['The radio has a blown fuse, and you have copper wire.', 'Take the blown fuse from the radio and combine it with the wire.', 'Tap the fuse holder on the radio, then combine the fuse with the copper wire.'] },
    { id: 'fusein', thread: 'D', requires: ['fuse'], text: 'Refit the fuse', done: 'fuseIn', hints: ['The mended fuse belongs where the old one was.', 'Use the mended fuse on the radio.', 'Close up on the radio, select the fuse and tap the fuse holder.'] },
    { id: 'compass', thread: 'E', text: 'Learn the call sign', done: { note: 'callsign' }, hints: ['The radio log says where the call sign is written.', 'The compass is in the workbench. Inspect it and turn it over.', 'Open the compass in the inventory (inspect) and look at its back: K N P.'] },
    { id: 'send', thread: 'E', requires: ['breakers', 'fusein', 'compass'], text: 'Send the call sign', done: 'sent', hints: ['The radio is ready. Key the call sign in morse.', 'Use the morse chart on the wall to spell K, N, P.', 'K is dash dot dash, N is dash dot, P is dot dash dash dot.'] },
    { id: 'gate', thread: 'E', requires: ['send'], text: 'Open the stair gate', done: 'gateOpen', hints: ['The paper tape holds the countersign in morse.', 'Decode each group with the morse chart. Five letters.', 'The word is SHORE.'] },
  ],

  escape: 'gateOpen',

  walkthrough: [
    ['tap', 'logbook'],
    ['tap', 'deskdrawer'],
    ['lock', 'picture', 'solved'],
    ['tap', 'battery_spot'],
    ['combine', 'torch', 'battery'],
    ['use', 'uv_torch', 'sheet_close'],
    ['lock', 'sheet', true],
    ['tap', 'pennants'],
    ['lock', 'toolbox', ['circle', 'triangle', 'diamond']],
    ['tap', 'box_crank'],
    ['tap', 'box_wire'],
    ['use', 'crank', 'dynamo'],
    ['lock', 'breakers', [0, 1, 0, 1, 1, 0]],
    ['tap', 'fuse_holder'],
    ['combine', 'blown_fuse', 'copper_wire'],
    ['use', 'fuse_fixed', 'fuse_holder'],
    ['tap', 'benchdrawer'],
    ['learn', 'callsign'],
    ['lock', 'morse', '-.-/-./.--.'],
    ['lock', 'gate', 'SHORE'],
  ],
};
