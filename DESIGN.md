# Escape the Lighthouse

## Hook
A point-and-click escape room in three chapters, played from a fixed eye in the middle of each room. You woke in the keeper's
cottage, the door is locked, a ship is heading for the rocks and the lamp is dark. Search, take, inspect, combine, solve, climb,
and light the lamp.

## Resembles / what is different
Classic escape-room games (Rusty Lake, The Room, Escape Simulator). Different in what a player notices in the first minute: a
real-time 3D room with a storm outside the windows, lamplight and moon shadows, and a puzzle state machine that is pure data, so
rooms are files.

## Art direction
**A keeper's cottage and tower on a stormy night.** Oiled oak, brass instruments, painted iron, plaster stained by damp, oil
lamps and a fire against a cold blue storm. Low-poly furnishing built from bevelled primitives with canvas-painted materials, warm
point lights, one moon light through the windows, rain, lightning that lights the room for a frame, thunder after it.

Palette: night `#0b1424`, storm blue `#1c2d4a`, lamplight `#ffb25c`, fire `#ff7a2a`, brass `#b88a3a`, oak `#3e2616`, paper `#e8dcc0`,
signal red `#b3322a`, verdigris `#3e8f78`.

Type: Cormorant Garamond bold for names and notes, Barlow Condensed for numerals and labels, Caveat for handwriting.

Signature: brass-ring inventory slots and the journal of paper notes. Locks are drawn as the metal and wood they are.

## Interface
Fixed camera turns between four walls (arrows, A/D, swipe or drag past the edge); dragging pans a little inside a wall. Tapping a
thing eases the camera into a close-up; Back, Esc, S or swipe down returns. Phones in portrait pull the camera back so a wall
still fits. A tap draws a ring on the target; after 60 s of idle, interactable things twinkle. Inventory along the bottom: tap to
select, tap a thing to use it, tap another item to combine (a snap, or a shake); long-press, double-tap, I or the lens button
opens the item in a rotatable 3D view where some items hide clues (the compass's engraved back). Notes keep every paper found
and every observation. Hints: nudge, pointer, answer for the most-progressed open thread, a 60 s cooldown, counted. Timer per
room, stars (3: under par with no hints; 2: at most 2 hints; 1: done), best times, auto-save after every change.

## Architecture
- `src/engine`: pure puzzle state machine (`game.js`), lock rules (`locks.js`), morse (`morse.js`). No three.js, no DOM.
- `src/data/*.js`: one file per room: things (props, placement, rules), items, notes, combos, locks, steps with three hint tiers,
  views, a `walkthrough` used by tests. Adding a room is adding a data file and listing it in `data/index.js`.
- `src/render`: stage (renderer, camera, picking, lights, finale), shell (walls with window cut-outs), props, items, weather, art.
- `src/ui`: DOM HUD and the eleven lock panels.
- Tests: `node --test` plays each room from start to escape, fuzzes action orders for dead ends, checks every hint, save/load.

## Puzzle graphs
Rules: 8-12 steps per room, two or three threads open at once, clues are in the room and fair, hotspots generous, the log in each
tower room says what to do without saying where things are.

### Room 1: The Keeper's Cottage (gentle, about 10 minutes)
Threads: A light and the desk, B the clock, C the lock, D the chest to the door.
```
matches (bedside) --+
                    +-> lantern lit -> screwdriver (dark under the bed) -> desk drawer -> diary page --+
lantern (door hook) +                                                                                 +-> chest padlock (1035) -> key --+
mantel clock: stopped at 10:35 ----------------------------------------------------------------------+                                 +-> door
oil can (hearth) -> oil the seized lock ----------------------------------------------------------------------------------------------+
```
Aha: the diary says the chest is set to the hour the clock stopped; the clock face is read in a close-up. Teaches taking, using an
item on a thing, combining, a dark place that needs a light, a dial lock and a key lock.

### Room 2: The Radio Room (about 15 minutes)
Threads: A light (torch + dry cell -> ultraviolet torch -> hidden schedule), B toolbox, C power, D fuse, E signal.
```
desk drawer: torch --+
painting (sliding) -> dry cell --+-> UV torch -> chart sheet reveals breaker schedule (2,4,5) --+
pennants "STORM HOIST": circle, triangle, diamond -> toolbox -> crank + copper wire              |
   crank -> dynamo ------------------------------------------------------------------------------+-> breakers set
   blown fuse (radio) + wire -> mended fuse -> back in the radio ----------------------------------+
bench drawer: compass, turned over: K N P (inspect view) ---+                                   |
                                                            +-> send K N P in morse (chart on wall) <- radio live
radio prints the countersign on tape: S H O R E (decode with the chart) -> stair gate (letters)
```
Aha moments: the blank sheet under the violet light; the compass's back; reading dots and dashes with the wall chart. Locks:
sliding tiles, reveal, symbols, switches, morse, letters.

### Room 3: The Lamp Room (about 15 minutes)
Threads: A plaque and cabinet, B clock wheel, C case and gears, D fuel and flame, E posts and rings.
```
plaque 1891 -> spares cabinet keypad -> large gear, small gear, mantle
station clock (screwdriver from room 1) -> middle gear
chart: safe channel U R U L U -> clockwork case catch (arrows) -> gear train: place three gears -> wind with the crank (room 2)
fuel can + paraffin barrel -> pour into the tank; mantle on the burner; light it with the lantern (room 1)
three post plates: anchor (E), wave (S), star (W) -> focusing rings outer, middle, inner -> in focus
lever (needs burner lit, clockwork wound, rings in focus) -> the lamp sweeps, the ship turns away
```
Carried between rooms: lit lantern, screwdriver, crank handle. Locks: keypad, arrows, gear sockets, rings.

## The first minute
You wake facing the bunk, the fire crackling, rain on the glass. The pillow letter and the drawer beside you are the first two
taps. The title is the cottage alive behind the logo with one button.

## Decisions
- Solo, no rooms. Progress saves under `progress`; records (best time, stars) persist across new games.
- Hotspots are generous (box proxies plus a pick radius); only tiny props need a close-up.
- Observations ("the clock stopped at 10:35") are written to the journal for friendliness; the puzzle is connecting them.
- Leaderboard `fastest-escape` (whole game seconds, lower is better) only when no hints were used.
- Quality: low drops shadows and spot lights, a lower render scale and fewer rain lines.
