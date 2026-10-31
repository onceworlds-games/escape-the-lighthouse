// Room 1: The Keeper's Cottage. Pure data: the engine plays it, the stage draws it.
// Placement fields: wall (0 N, 1 E, 2 S, 3 W), x (along the wall, right of the viewer is +), d (out from the wall), y (up).
export default {
  id: 'cottage',
  name: "The Keeper's Cottage",
  short: 'Cottage',
  par: 600,
  badge: 'cottage',
  start: { wall: 2 },
  walls: [
    { name: 'The Door', dir: 'N' },
    { name: 'The Hearth', dir: 'E' },
    { name: 'The Bunk', dir: 'S' },
    { name: 'The Desk', dir: 'W' },
  ],
  shell: {
    kind: 'rect',
    w: 6.6,
    d: 5.8,
    h: 2.9,
    style: 'cottage',
    openings: [
      { wall: 3, x: 0, y: 1.3, w: 1.3, h: 1.0 },
      { wall: 2, x: 1.5, y: 1.3, w: 1.0, h: 1.0 },
    ],
  },
  env: { outside: 'cliff', sky: 0x0b1424, fog: 0x0a1220, fogDensity: 0.012, ambient: 0x3a4a6e, ambientI: 0.55, moon: { from: [-9, 7, 3], color: 0x7d9bdc, i: 1.1 }, exposure: 1.0 },
  lights: [
    { id: 'fire', wall: 1, x: 0, y: 0.55, d: 0.7, color: 0xff7a2a, i: 4.2, dist: 9, flicker: 1, shadow: true },
    { id: 'lamp', wall: 3, x: -0.45, y: 1.35, d: 0.6, color: 0xffb25c, i: 2.2, dist: 6, flicker: 0.25 },
    { id: 'door', wall: 0, x: 0, y: 2.3, d: 1.2, color: 0xffa860, i: 0.7, dist: 5, flicker: 0 },
  ],

  items: {
    matches: { name: 'Matchbox', desc: 'Safety matches, a little damp. Enough to light something.' },
    lantern: { name: 'Storm Lantern', desc: 'A hurricane lantern with scratched glass. Not lit.' },
    lantern_lit: { name: 'Lit Lantern', desc: 'A steady yellow flame behind the glass.', carry: true },
    screwdriver: { name: 'Screwdriver', desc: 'Flat blade, wooden handle worn smooth.', carry: true },
    oilcan: { name: 'Oil Can', desc: 'Rusty, but it sloshes. There is oil in it.' },
    door_key: { name: 'Iron Key', desc: 'Heavy and cold. An anchor is stamped on the bow.' },
  },

  notes: {
    letter: {
      title: "Elias's letter",
      hand: true,
      body: "Nell,\n\nThe surge took the yard gate, so I have locked the cottage door against it. The key is in my sea chest. The combination is the same as ever: I wrote it down in the desk.\n\nIf I am not back by midnight, light the lamp.\n\nElias Marren",
    },
    diary: {
      title: 'Torn diary page',
      hand: true,
      body: "The Marguerite went onto the Teeth at the very hour the mantel clock stopped. I have never wound it since.\n\nI set the chest to that hour. Hour first, then minutes. She is how I remember.\n\nE.M.",
    },
    clockObs: { title: 'Mantel clock', hand: true, body: 'Stopped. The hands show twenty-five to eleven: ten thirty-five.' },
    bottleObs: { title: 'Ship in a bottle', hand: true, body: 'A tiny brig. MARGUERITE is lettered on her stern.' },
  },

  combos: [{ a: 'lantern', b: 'matches', result: 'lantern_lit', say: 'A match flares. The lantern glows.' }],

  views: {
    clockview: { wall: 1, x: 0, y: 1.5, d: 1.6, ty: 1.55, fov: 42, wid: 0.95, name: 'The Mantel' },
    chestview: { wall: 2, x: 1.35, y: 0.95, d: 1.6, ty: 0.22, td: 0.6, fov: 42, wid: 0.75, name: 'The Sea Chest' },
    deskview: { wall: 3, x: 0, y: 1.5, d: 1.7, ty: 0.55, fov: 42, wid: 1.0, name: 'The Desk' },
  },

  things: [
    // ---- north wall: the door ----
    {
      id: 'door', name: 'Door', wall: 0, x: 0, d: 0, prop: 'door', params: { w: 1.15, h: 2.15 }, hit: [1.3, 2.2, 0.3, 0, 1.1, 0.1], lock: 'door',
      states: { open: 'doorOpen' },
      tap: [
        { if: { not: 'oiled' }, say: 'Locked tight. The keyhole is crusted with salt and rust.' },
        { say: 'Locked. It needs a key.' },
      ],
      use: {
        oilcan: [
          { if: { not: 'oiled' }, say: 'A few drops of oil into the keyhole. The rust lets go.', do: [{ set: 'oiled' }, { sfx: 'oil' }] },
          { say: 'The lock is already oiled.' },
        ],
      },
    },
    { id: 'hook_lantern', name: 'Storm lantern', wall: 0, x: -1.5, y: 1.45, d: 0.14, prop: 'item', params: { item: 'lantern', hang: true }, hit: [0.5, 0.6, 0.5], hideIf: { got: 'lantern' }, tap: [{ do: [{ give: 'lantern', from: 'hook_lantern' }, { say: 'A storm lantern, hung by the door.' }] }] },
    { id: 'coatrack', wall: 0, x: 1.7, d: 0.05, prop: 'coatrack' },
    { id: 'barometer', wall: 0, x: -2.45, y: 1.65, d: 0.04, prop: 'barometer' },
    { id: 'boots', wall: 0, x: 1.15, d: 0.45, prop: 'boots' },
    { id: 'lifebuoy', wall: 0, x: 2.5, y: 1.5, d: 0.05, prop: 'lifebuoy' },
    { id: 'doormat', wall: 0, x: 0, d: 0.95, prop: 'rug', params: { w: 1.5, d: 0.9, color: '#5b3a2a', stripe: '#b9894f' } },
    { id: 'shelf_n', wall: 0, x: -0.2, y: 2.5, d: 0.05, prop: 'shelf', params: { w: 2.2, tins: true } },
    { id: 'crate3', wall: 0, x: 2.3, d: 0.5, prop: 'crate', params: { w: 0.7 } },
    { id: 'stool', wall: 0, x: -2.3, d: 0.55, prop: 'stool' },

    // ---- east wall: the hearth ----
    { id: 'fireplace', wall: 1, x: 0, d: 0, prop: 'fireplace', params: { w: 2.1, h: 1.35 } },
    {
      id: 'clock', name: 'Mantel clock', wall: 1, x: 0.55, y: 1.42, d: 0.3, prop: 'mantelclock', hit: [0.4, 0.55, 0.3, 0, 0.27, 0], view: 'wall:1',
      tap: [{ do: [{ go: 'clockview' }] }],
    },
    {
      id: 'clockface', name: 'Clock face', wall: 1, x: 0.55, y: 1.73, d: 0.42, hit: [0.36, 0.36, 0.12], view: 'clockview',
      tap: [
        { if: 'sawClock', say: 'Ten thirty-five. The hands have not moved.' },
        { say: 'Roman numerals. The hands have stopped at ten thirty-five.', do: [{ set: 'sawClock' }, { note: 'clockObs', read: false }] },
      ],
    },
    {
      id: 'bottle', name: 'Ship in a bottle', wall: 1, x: -0.5, y: 1.42, d: 0.3, prop: 'bottle', hit: [0.42, 0.3, 0.2, 0, 0.12, 0], view: 'clockview',
      tap: [{ say: 'A tiny brig. MARGUERITE is lettered on her stern.', do: [{ note: 'bottleObs', read: false }] }],
    },
    { id: 'candles', wall: 1, x: 0.95, y: 1.42, d: 0.3, prop: 'candlestick' },
    { id: 'candles2', wall: 1, x: -0.95, y: 1.42, d: 0.3, prop: 'candlestick' },
    { id: 'seascape', wall: 1, x: 0, y: 2.05, d: 0.14, prop: 'painting', params: { w: 1.15, h: 0.75, art: 'sea' } },
    { id: 'armchair', wall: 1, x: 1.45, d: 1.25, ry: -35, prop: 'armchair' },
    { id: 'logbasket', wall: 1, x: -1.55, d: 0.45, prop: 'logbasket' },
    { id: 'poker', wall: 1, x: 1.25, d: 0.18, prop: 'poker' },
    {
      id: 'oilcan_floor', name: 'Oil can', wall: 1, x: -1.15, y: 0, d: 0.3, prop: 'item', params: { item: 'oilcan', floor: true }, hit: [0.4, 0.4, 0.4], hideIf: { got: 'oilcan' },
      tap: [{ do: [{ give: 'oilcan', from: 'oilcan_floor' }, { say: 'A rusty oil can, left by the hearth.' }] }],
    },
    { id: 'hearthrug', wall: 1, x: 0, d: 1.35, prop: 'rug', params: { w: 2.2, d: 1.5, color: '#6b2b2b', stripe: '#c9a063' } },

    // ---- south wall: the bunk ----
    { id: 'bed', wall: 2, x: -0.4, d: 0.6, prop: 'bed' },
    {
      id: 'underbed', name: 'Under the bed', wall: 2, x: -0.4, y: 0.18, d: 0.75, hit: [1.9, 0.34, 0.9],
      tap: [
        { if: { got: 'screwdriver' }, say: 'Dust and an old mouse nest.' },
        { say: 'Too dark to see under there. You would need a light.' },
      ],
      use: {
        lantern: [{ say: 'The lantern is not lit.' }],
        lantern_lit: [
          { if: { got: 'screwdriver' }, say: 'Only dust now.' },
          { say: 'In the lantern light: a screwdriver, lying in the dust.', do: [{ give: 'screwdriver', from: 'underbed' }] },
        ],
      },
    },
    {
      id: 'pillow', name: 'Pillow', wall: 2, x: -1.1, y: 0.62, d: 0.4, hit: [0.5, 0.2, 0.4],
      tap: [
        { if: { note: 'letter' }, do: [{ readNote: 'letter' }] },
        { say: 'A folded letter is under the pillow.', do: [{ note: 'letter' }] },
      ],
    },
    { id: 'pillowprop', wall: 2, x: -1.1, y: 0.5, d: 0.4, prop: 'pillow' },
    {
      id: 'chest', name: 'Sea chest', wall: 2, x: 1.35, d: 0.45, prop: 'chest', params: { w: 1.0, h: 0.55, dp: 0.55 }, hit: [1.1, 0.7, 0.7, 0, 0.35, 0],
      states: { open: 'chestOpen', unlocked: { lock: 'chest' } }, view: 'wall:2',
      tap: [{ do: [{ go: 'chestview' }] }],
    },
    {
      id: 'padlock', name: 'Padlock', wall: 2, x: 1.35, y: 0.5, d: 0.75, hit: [0.3, 0.3, 0.2], view: 'chestview', lock: 'chest', hideIf: { lock: 'chest' },
    },
    {
      id: 'chestkey', name: 'Iron key', wall: 2, x: 1.35, y: 0.36, d: 0.55, prop: 'item', params: { item: 'door_key', flat: true }, hit: [0.4, 0.3, 0.4], view: 'chestview', showIf: 'chestOpen', hideIf: { got: 'door_key' },
      tap: [{ do: [{ give: 'door_key', from: 'chestkey' }, { say: 'A heavy iron key lies on the oilskins.' }] }],
    },
    {
      id: 'bedside', name: 'Bedside table', wall: 2, x: -1.85, d: 0.3, prop: 'bedside', states: { open: 'bedsideOpen' }, hit: [0.55, 0.8, 0.5, 0, 0.4, 0],
      tap: [
        { if: 'bedsideOpen', say: 'Candle stub and a ring of dust.' },
        { say: 'The drawer sticks, then slides. A box of matches.', do: [{ set: 'bedsideOpen' }, { give: 'matches', from: 'bedside' }, { sfx: 'drawer' }] },
      ],
    },
    { id: 'bunkshelf', wall: 2, x: -0.4, y: 1.75, d: 0.12, prop: 'shelf', params: { w: 1.6, books: true } },
    { id: 'bunkpic', wall: 2, x: 0.5, y: 1.45, d: 0.06, prop: 'painting', params: { w: 0.55, h: 0.42, art: 'sea' } },
    { id: 'crate1', wall: 2, x: 2.4, d: 0.45, prop: 'crate', params: { w: 0.6 } },
    { id: 'crate2', wall: 2, x: 2.45, y: 0.42, d: 0.45, ry: 12, prop: 'crate', params: { w: 0.46 } },
    { id: 'bunkrug', wall: 2, x: -0.2, d: 1.5, prop: 'rug', params: { w: 1.3, d: 1.0, color: '#3d4f5f', stripe: '#b9894f' } },
    { id: 'curtain2', wall: 2, x: 1.5, y: 2.35, d: 0.08, prop: 'curtain', params: { w: 1.5, h: 1.2 } },

    // ---- west wall: the desk ----
    {
      id: 'desk', name: 'Writing desk', wall: 3, x: 0, d: 0.45, prop: 'desk', states: { open: 'drawerOpen' }, hit: [1.6, 0.95, 0.8, 0, 0.45, 0], view: 'wall:3',
      tap: [{ do: [{ go: 'deskview' }] }],
    },
    {
      id: 'desk_drawer', name: 'Desk drawer', wall: 3, x: 0, y: 0.68, d: 0.8, hit: [0.8, 0.2, 0.2], view: 'deskview',
      tap: [
        { if: 'drawerOpen', say: 'Empty now, except dust.' },
        { say: 'Jammed. The brass plate is held by two small screws.' },
      ],
      use: {
        screwdriver: [
          { if: 'drawerOpen', say: 'It is already open.' },
          { say: 'The screws come out. The drawer slides free.', do: [{ set: 'drawerOpen' }, { note: 'diary' }, { sfx: 'screws' }] },
        ],
      },
    },
    {
      id: 'desklamp', name: 'Oil lamp', wall: 3, x: -0.5, y: 0.8, d: 0.45, prop: 'oillamp', hit: [0.3, 0.45, 0.3, 0, 0.22, 0], view: 'deskview',
      tap: [{ say: 'The lamp burns low. Not enough oil to spare, and it is bolted down.' }],
    },
    { id: 'deskchair', wall: 3, x: 0.1, d: 1.3, ry: 160, prop: 'chair' },
    { id: 'books', wall: 3, x: 0.45, y: 0.8, d: 0.5, prop: 'bookstack' },
    { id: 'bookcase', wall: 3, x: -1.6, d: 0.2, prop: 'bookshelf', params: { w: 1.15, h: 2.05 }, view: 'wall:3', name: 'Bookshelf', tap: [{ say: 'Tide tables, hymn books, a seed catalogue. Nothing useful.' }], hit: [1.2, 2.1, 0.4, 0, 1.05, 0] },
    { id: 'calendar', name: 'Calendar', wall: 3, x: 1.5, y: 1.6, d: 0.04, prop: 'calendar', hit: [0.4, 0.55, 0.1], view: 'wall:3', tap: [{ say: 'October. Every square is crossed off up to the last storm.' }] },
    { id: 'photo', wall: 3, x: 1.2, y: 2.0, d: 0.04, prop: 'painting', params: { w: 0.5, h: 0.4, art: 'tower' } },
    { id: 'rug3', wall: 3, x: 0, d: 1.5, prop: 'rug', params: { w: 1.8, d: 1.2, color: '#4a3b2a', stripe: '#a67c52' } },
    { id: 'curtain3', wall: 3, x: 0, y: 2.4, d: 0.08, prop: 'curtain', params: { w: 1.6, h: 1.3 } },
  ],

  locks: {
    chest: { type: 'digits', n: 4, solution: '1035', title: 'Sea chest', onSolve: [{ set: 'chestOpen' }, { say: 'The padlock drops open. The lid groans up.' }] },
    door: { type: 'key', item: 'door_key', needs: 'oiled', stuck: 'The key goes in but will not turn. The lock is crusted solid.', msg: 'Locked. It needs a key.', onSolve: [{ set: 'doorOpen' }] },
  },

  steps: [
    { id: 'matches', thread: 'A', text: 'Find matches', done: { got: 'matches' }, hints: ['Something small might be near where you woke.', 'The table beside the bed has a drawer.', 'Tap the bedside table to open its drawer and take the matches.'] },
    { id: 'lantern', thread: 'A', text: 'Take the lantern', done: { got: 'lantern' }, hints: ['Something useful hangs near the door.', 'Look at the wall with the door. A lantern hangs on a hook.', 'Tap the lantern by the door to take it.'] },
    { id: 'lit', thread: 'A', requires: ['matches', 'lantern'], text: 'Light the lantern', done: { got: 'lantern_lit' }, hints: ['You have a lantern and something to light it with.', 'Select one item in the bar, then tap the other.', 'Tap the lantern, then tap the matches to light it.'] },
    { id: 'screwdriver', thread: 'A', requires: ['lit'], text: 'Search the dark', done: { got: 'screwdriver' }, hints: ['Somewhere in this room is too dark to search.', 'Under the bed is dark. A light might show what is there.', 'Select the lit lantern, then tap under the bed.'] },
    { id: 'diary', thread: 'A', requires: ['screwdriver'], text: 'Open the desk drawer', done: { note: 'diary' }, hints: ['The letter spoke of something written in the desk.', 'The desk drawer is held shut with screws.', 'Open the desk, select the screwdriver and tap the drawer.'] },
    { id: 'clock', thread: 'B', text: 'Study the mantel clock', done: 'sawClock', hints: ['The mantel above the fire holds a few things worth a closer look.', 'Tap the clock on the mantel, then its face.', 'The clock stopped at ten thirty-five.'] },
    { id: 'oilcan', thread: 'C', text: 'Find the oil can', done: { got: 'oilcan' }, hints: ['Something to loosen a rusted lock may be lying about.', 'Look near the fireplace, on the floor.', 'Tap the oil can on the floor left of the hearth.'] },
    { id: 'chest', thread: 'D', requires: ['diary', 'clock'], text: 'Open the sea chest', done: { lock: 'chest' }, hints: ['The diary page names the chest combination without saying the number.', 'It is the hour the mantel clock stopped: hour first, then minutes.', 'The padlock code is 1035.'] },
    { id: 'oiled', thread: 'C', requires: ['oilcan'], text: 'Oil the lock', done: 'oiled', hints: ['The front door lock looks seized.', 'Use the oil can on the door.', 'Select the oil can, then tap the door.'] },
    { id: 'key', thread: 'D', requires: ['chest'], text: 'Take the key', done: { got: 'door_key' }, hints: ['The open chest holds something.', 'Look inside the chest from close up.', 'Tap the iron key inside the chest.'] },
    { id: 'door', thread: 'D', requires: ['key', 'oiled'], text: 'Unlock the door', done: 'doorOpen', hints: ['You have the key and a freed lock.', 'Use the key on the door.', 'Select the iron key, then tap the door.'] },
  ],

  escape: 'doorOpen',

  walkthrough: [
    ['tap', 'bedside'],
    ['tap', 'hook_lantern'],
    ['combine', 'lantern', 'matches'],
    ['use', 'lantern_lit', 'underbed'],
    ['tap', 'pillow'],
    ['use', 'screwdriver', 'desk_drawer'],
    ['tap', 'clockface'],
    ['lock', 'chest', '1035'],
    ['tap', 'chestkey'],
    ['tap', 'oilcan_floor'],
    ['use', 'oilcan', 'door'],
    ['use', 'door_key', 'door'],
  ],
};
