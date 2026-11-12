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

## Where it stands (2026-11-12)

- Layout v3.1 is LIVE (merge #4):
  https://incidentreport.nomadthegrey71.workers.dev
  Adam's phone playtest is the pending acceptance.
- v3.1's closet arrangement is known to be wrong against Adam's model
  (see open questions) — the correction rides on the model work below.
- **AllFloors.gltf passed the Models sanity check (2026-11-11)** and
  is IN THE GAME on WIP (commit 787df20): the title screen's "Walk
  the model house" loads the model itself, with collision extracted
  from its own triangles and 7 door leaves hung on the measured
  openings (Clarissa's, Breanna's, Bathroom, Darleen's, Darleen's
  closet, the hall-wall door, the basement room door — all lockable
  from the inside). Fully drive-tested headlessly: a complete loop
  (closets, both staircases both directions, kitchen/archway/living
  circulation, basement room) with zero errors. MERGED 2026-11-12
  (merge #5, main 8244983) and LIVE — bundle index-Cm3gTlqc.js,
  model asset serving. NOTE: the merge did NOT auto-build (Adam's
  GitHub-App repo selection wasn't sufficient); the build was
  triggered manually, as with #4 — auto-build cause still open.
- The model was RE-BASED in AllFloors: y=0 is the ground. Walking
  surfaces (slab tops): basement −2.4, main +0.1, upstairs +2.6.
- **The upstairs is FURNISHED on WIP (2026-11-12, not yet merged):**
  Models' trappings batch 1 (public/models/furniture/) is placed in
  the model walkthrough — bathroom set (vanity, mirror, toilet,
  bathtub) along the south wall; Darleen's king bed + two
  nightstands + dresser; full bed + nightstand + dresser in each of
  Clarissa's and Breanna's rooms. Each piece carries a footprint
  collider (the mirror is visual only). The walkthrough spawn moved
  to (4.6, 1.6) so the player doesn't start inside the king bed.
  Verified by targeted drives: every piece loads (20 colliders = 7
  doors + 13 pieces), renders in place, and blocks at its face
  (beds and fixtures plateau-tested). The full-route robot suite
  was NOT re-run on this build — it wedges on its own stale-key
  weakness under machine load (Adam's call, 2026-11-12: ship it to
  WIP without the suite). Adam's phone playtest after a merge is
  the acceptance.
- **Merge #6 LIVE (2026-11-12):** the furnished upstairs merged
  (PR #6, main 971ad13) and is serving — bundle index-B0knTNB9.js.
  AUTO-BUILD ROOT CAUSE FOUND the same day (API-verified): the
  build trigger's path_excludes contained a bare "*" alongside
  the intended "*.md" entries, which excluded every file and
  silently vetoed every push build. Adam removed the "*" in the
  dashboard (verified via API); the next merge should build
  itself. The "cause still open" note above is superseded.
- **Adam's playtest of #6 (2026-11-12) found:** the mirror never
  rendered and the bathtub read as sunk with its far lip missing —
  one cause: the model's wall faces sit 0.1 inside the room
  boundary lines (walls built into the rooms), and the furniture
  backs were placed on the boundary lines, sinking pieces 0.1
  into the walls. Fix queued: backs to the measured faces. The
  basement stair shaft also reads near-black (sealed enclosure,
  little game light) — a shaft light is queued. The models
  themselves were praised; a colour pass (multi-colour per piece)
  plus floor colours by room went to the Models chat.
- **Title cleanup (2026-11-12, on WIP):** the "Walk the house"
  button and the code-built house views are retired (Adam: its
  layout "isn't even close"); the title now offers "Walk the model
  house" and an "Exploded view" rebuilt on Adam's model itself —
  the three floor bands lifted apart (src/game/ExplodedModel.tsx,
  clipping-plane bands + orbit). src/game/house.ts,
  FirstPersonHouse.tsx and HouseGreybox.tsx are deleted; the
  layout data they carried is superseded by the model + the
  LAYOUT docs.
- **Divider trimmed — model updated (2026-11-12, on WIP):** Adam
  trimmed the rogue StairsEnclosure in Blockbench and re-exported
  AllFloors.gltf (Drive, 238,275 bytes; same 1,616 tris, same
  bounds). Verified by triangle probe: the TOP floor's divider now
  ends at the landing's west edge (game x 4) — the switchback turn
  is genuinely open, and the walkthrough's load-side separator
  clamp is a no-op there. The BASEMENT twin (BasementStairs-
  Enclosure) still crosses its landing as drawn; the clamp still
  covers it, exactly as before. Adam's call whether to trim that
  one too.

## The model pipeline

- Adam models the house in Blockbench and exports .gltf/.glb.
- The "Incident Report - Models" chat reads each export (real vertex
  buffers — accessor min/max are unreliable), consolidates it per the
  standards above, and returns a geometry spec plus feel numbers
  (stair slope, tightest headroom, hall and door widths).
- Direction TAKEN (2026-11-11/12): the .gltf is loaded in-game as
  the house itself (see "Where it stands") — one pipeline, paid once,
  and a layout iteration is now a re-export and a file swap.
  Collision is extracted from the model's own triangles at load;
  door leaves and locks stay game-side, hung on the measured
  openings. Two load-side accommodations, both collision-only (the
  model renders exactly as drawn):
  - The stair divider boxes (below) have their collision trimmed at
    the landings so the switchback turn can be made.
  - The collision body stands on the lower surface when stepping
    down, and is 1.6m tall — the model's tightest headroom (under
    the closet wall's lower edge on the north lane) is ~1.7m.

## Working agreements

- All pushes go to the `WIP` branch (exact case). Main changes only
  through a WIP→main merge, only on Adam's explicit word.
- One logical landing = one push — and since 2026-11-12 the .md
  files ride IN the same push as the code they document (Adam's
  ruling), so a landing is a single merge, docs included.
- Verify pushed content byte-identical at origin — a tool's OK is
  advisory only.
- Before a push or merge puts an approval card in front of Adam, the
  change is stated in plain words in chat first.
- Every build request gets an honest guesstimate up front.

## The model house (AllFloors, measured 2026-11-11)

- The basement is NOT one open room in the model: a walled-off room
  sits under the living room, entered through a 1.0m door; the only
  stair-exit passage is at game x 1..2 in the shaft's north wall.
- Main-floor circulation as drawn: a wall along game z 0.55 cuts the
  hall strip, so west-side north↔south traffic goes through the
  living room and the 2m kitchen archway; the kitchen is open to the
  hall along the game x −1 line; the band mouth's two halves connect
  only via the stairs or the full loop (a divider stub stands in the
  mouth, kept as drawn).
- Closets per the model: hall closet game x 1..2 (open from the
  hall, no door), Darleen's closet 1×1 at game x 2..3 through
  Doorway5. The walkthrough follows the model.
- No garage in the model; no exterior doors cut yet (front would go
  at game (0, 4.5), back at game (−3, −4.5)).

## Open questions

- **The divider crosses both landings (found 2026-11-11).** The
  `StairsEnclosure` box (MainFloor group) is one piece running the
  shaft's full 6m (Adam's z 0→6) on the divider line; across the
  half-landing (z 4→6) it stands ~1.1m above the landing floor, so
  as drawn the switchback turn is sealed. `BasementStairsEnclosure`
  does the same one floor down. The walkthrough trims its collision
  at the landings; whether Adam trims the boxes back to z 4 in a
  future model pass is his call.
- **Final top-floor closet arrangement** — ANSWERED by AllFloors
  (see "The model house" above); v3.1's swapped build is superseded
  wherever the model house is used.
- **Floor-to-floor spacing** — Adam's standard is 2.5 (see model
  standards); the code-built house (v3.1) builds 3.0, but the model
  walkthrough walks at the model's own 2.5 because the model
  dictates it. Still open in principle for the code house; moot
  wherever the model house is used.
- **The reconfigure export** (`model__2___1.gltf`) shrank the house
  (far end z=6→4) and compressed the stairs (2m runs, 2×1 landing)
  against Adam's own pins, and left the closet strip overshooting the
  east wall. Treated as an iteration, not the layout.
- **Door pins (Adam, 2026-11-12)**: NO doors at the stairs (stair-
  head doorway and both mouths stay open), NO door in the 2m
  archway, and NO door in the 1.0m hall↔stairwell opening — the
  leaf hung there in the walkthrough comes OUT in the next build.
  There IS a door at the basement stairs (Adam: "so people won't
  fall downstairs without opening the door first") — RESOLVED
  2026-11-12: the door sits at the TOP of the basement stairs and
  is accessed from the kitchen. The two stacked staircases do NOT
  connect directly (Adam: stacked because it's the natural,
  space-saving arrangement, but the main floor separates them) —
  in the walkthrough the next build puts a leaf across the
  basement flight's entry, where it currently flows open.
- **Texture pass (Adam, 2026-11-12 — planned, after his room
  scribbles)**: walls, floors, ceilings get real textures for
  flavour. Floors: HARDWOOD SLATS in most rooms, with throw rugs;
  LINOLEUM TILES in bathrooms and the kitchen. Carpet exists
  somewhere (his carpet↔linoleum floor-divider piece) — which
  rooms are carpet is still to pin. LINOLEUM RULE (Adam,
  2026-11-12): linoleum never ends bare — every edge gets a
  transition strip/divider, because a bare edge gets torn. The
  divider piece belongs at every linoleum boundary, not just
  against carpet. Room identity drives the
  floor assignment, so this waits on the geography settling.
- **Main-floor geography (Adam's walk, 2026-11-12 — his labels
  govern; read-back sent, correction pending)**: coming down from
  upstairs you land in the LIVING ROOM (east side); through the
  wide doorway is the DINING ROOM; through that, the KITCHEN;
  the basement stairs sit in front of the kitchen doorway. The
  walkthrough's HUD labels predate this (they call the east room
  "Dining Room" and the north-west room "Living Room") and get
  renamed to Adam's on his confirmation. He also says the stair
  dividing wall "should really be a banister" (scope vs the solid
  separator pin being confirmed) and plans to model a small floor
  divider piece marking where carpet meets linoleum.
- **Exterior doors** — not cut in the model. Adam cuts them in
  Blockbench, or they get added at load; his choice.
- **Next gameplay step** (proposed, not commissioned): the first
  pick-uppable object (bat or kitchen skillet), then the incident
  itself — stalker, bonk, 911 call, report card.
