# INCIDENT REPORT — Notes

Working state, dimensions, standards, and open questions. Maintained
as we go. Intentions and pinned rulings live in INTENTIONS.md.

## House dimensions (the game as built, layout v3.1)

- Shell 12 × 9m: x −6..6, z −4.5..4.5. Floors 3.0m apart (the game's
  current spacing — Adam's model standard is 2.5; see open questions):
  basement floor y −3, main y 0, upstairs y 3. Garage attached on the east:
  x 6..12, z −4.5..1.5.
- Upstairs: Clarissa's Room 5×4 (x −6..−1, z −4.5..−0.5); Breanna's
  Room 5×5 (x −6..−1, z −0.5..4.5); Hall 2×2 (x −1..1, z −1.5..0.5);
  Bathroom 7×3 (x −1..6, z −4.5..−1.5); Darleen's Room 7×4 (x −1..6,
  z 0.5..4.5); stair band x 1..6, z −1.5..0.5 (two 3m runs + 2×2
  half-landing against the east wall).
- Main floor: Kitchen 5×5, Living Room 5×4, Hall/Entry 2×9, Mudroom/
  Laundry, Dining Room, the stair band stacked over the basement
  flight. Basement: one open room under the shell.
- 16 doors with leaves, every one lockable from the inside.

## Adam's model standards (Blockbench)

How Adam builds the house model; readers and builders conform to
these, not the other way round.

- **Scale: Adam models at 1 grid unit = 1m.** Blockbench's own
  convention is 16 units = 1m (a Minecraft block, 16×16 pixels), so
  its glTF export divides every coordinate by 16 — readers multiply
  file values by 16 to recover Adam's metres. Verified against the
  files: the footprint reads exactly 9×12 and the walls exactly 2.5.
  Whole-metre grid.
- **Walls and floors are 0.1m thick** (Adam's standard practice,
  2026-11-11).
- **Floor height 2.4m; wall height per floor 2.5m** — the 2.5 module
  is the 2.4 ceiling plus the 0.1 floor slab, so floor-to-floor is
  2.5 in Adam's standard and each half-flight drops 1.25 (Adam,
  2026-11-11; his words: "I think… subject to an off-by-one error" —
  the exports' walls read exactly 2.5, so the standard stands as
  written).
- **Compass:** in the model, +x is north and +z is east. The game
  rotates the model into its shell without mirroring: game x = model
  z; game z = model x + 0.5.
- **Naming:** the top floor sits in a `TopFloor` group; floor pieces
  are `FloorPart`; door frames are `Dooway`, `Dooway2`, …; the closet
  partition is `ClosetWall`; exterior walls carry their compass names
  (e.g. `EWall`).
- **Overlaps are expected.** Blockbench doesn't do CSG, so pieces
  overlap to stick together, and runs are often built from abutted
  slices (a loop-cut look — many cubes doing one cube's job).
  Consolidating overlaps and slices into clean boxes is the reader's
  job, not Adam's. Only coplanar overlaps matter in-game (they
  flicker); those get stripped when the model is loaded.
- Verticals: the walls obey the 2.5 standard exactly in every export.
  The STAIR verticals are the wobbly layer — model__2's flights
  implied a floor-to-floor of ~3.9 (drops of ~1.95 per half), while
  TopFloor.gltf's stairs are built from individual steps totalling
  exactly 2.5 (halves ~1.25, risers ~0.2): the standard, in the file.
  Plan geometry (x/z) remains the reliable layer in the older
  exports.

## Where it stands (2026-11-11)

- Layout v3.1 is LIVE (merge #4):
  https://incidentreport.nomadthegrey71.workers.dev
  Adam's phone playtest is the pending acceptance.
- v3.1's closet arrangement is known to be wrong against Adam's model
  (see open questions) — the correction rides on the model work below.

## The model pipeline

- Adam models the house in Blockbench and exports .gltf/.glb.
- The "Incident Report - Models" chat reads each export (real vertex
  buffers — accessor min/max are unreliable), consolidates it per the
  standards above, and returns a geometry spec plus feel numbers
  (stair slope, tightest headroom, hall and door widths).
- Direction under consideration: load the .glb in-game as the house's
  visual / layout source ("for the floor layout at least") instead of
  hand-translating the model into code — one pipeline, paid once
  (estimated at a couple of hours), after which a layout iteration is
  a re-export and a file swap. Prototype not yet commissioned.
  Collision, door leaves and locks, and items stay game-side either
  way.
- Current read in flight: `TopFloor.gltf` (Adam's latest rendition of
  the top floor + staircase, 2026-11-11).

## Working agreements

- All pushes go to the `WIP` branch (exact case). Main changes only
  through a WIP→main merge, only on Adam's explicit word.
- One logical landing = one push; docs travel alone.
- Verify pushed content byte-identical at origin — a tool's OK is
  advisory only.
- Before a push or merge puts an approval card in front of Adam, the
  change is stated in plain words in chat first.
- Every build request gets an honest guesstimate up front.

## Open questions

- **Final top-floor closet arrangement** — awaiting the Models read of
  `TopFloor.gltf`. The earlier model__2 read said: two compartments
  over the stair band, both floored at upstairs height — the hall-side
  one is the hall ("landing") closet with no door painted; the far
  compartment is Darleen's, entered from her room through Dooway5.
  v3.1 built them swapped, with no far compartment and no Dooway5.
- **Floor-to-floor spacing** — Adam's standard is 2.5 (see model
  standards); the game currently builds 3.0, and TopFloor.gltf's
  stairs now match his 2.5. Open: does the game adopt 2.5? One
  consequence needs Adam's eye: at 2.5, a closet floor over the
  half-landing leaves only 1.25 above the landing — while his
  description of the real closet ("bump only if well in excess of
  six feet") implies ~1.9 of clearance at that spot, which neither
  2.5 nor the game's 3.0 gives (the oversized model__2 stair drawing
  did). Either the real house's floors are taller than his 2.5
  standard, or the real closet doesn't extend over the landing. The
  TopFloor read plus Adam's ruling settle it.
- **The reconfigure export** (`model__2___1.gltf`) shrank the house
  (far end z=6→4) and compressed the stairs (2m runs, 2×1 landing)
  against Adam's own pins, and left the closet strip overshooting the
  east wall. Treated as an iteration, not the layout.
- **Next gameplay step** (proposed, not commissioned): the first
  pick-uppable object (bat or kitchen skillet), then the incident
  itself — stalker, bonk, 911 call, report card.
