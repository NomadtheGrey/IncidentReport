# INCIDENT REPORT — Notes

Working state, dimensions, standards, and open questions. Maintained
as we go. Intentions and pinned rulings live in INTENTIONS.md.

- **Pickup v1: E interacts (Adam's direction, 2026-11-13).** E is contextual, resolved in order: the hand item at the centre of the view within 2.4 m of the player (pick up, or swap — the held one drops at his feet), then a door in lock range (the pre-existing lock/unlock, unchanged), then putting down what he holds. Pickupables: skillet, pot, claw-hammer, fire-extinguisher, baseball-bat, plunger, shovel (all `box: false` pieces, so no colliders move). The held piece rides the camera as a viewmodel in FP and his right hand in TP (position from the WeaponR bone, facing from his body); its floor band is suspended while held so it shows on every floor; its look target follows it when dropped and is restored on exit. Prompts: a centre chip ("E — Pick up / Swap for / Put down X") plus a touch button on phones. Animations: 'Pick up (ground)' / 'Put down / drop (ground)' one-shots. Drive-verified end to end (prompt → pickup → TP hand → swap → drop → door-lock regression). Grip poses (GRIP_FP / GRIP_TP tables) are first-pass, tuned by eye next.

- **Third-person camera TLC (Adam, 2026-11-13): wall fade + wheel zoom.** In TP, the house pieces the camera-to-Goodguy line crosses now fade to a ghost (opacity 0.15) and ease back when clear — his pick over jamming the camera inside the player's room; the bathroom tilt-down case that prompted it now shows him through the faded wall. House materials are cloned per piece at load so one wall can fade alone. First person never fades. The mouse wheel also trims the TP boom (1.2–4.5 m, default 3.0). Verified by staged drives (bathroom fade + living-room control + wheel readout 3.0 → 2.3).

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
- **Colour + fix integration (2026-11-12, on WIP):** Models'
  colour pass is IN — all eight furniture .gltf files replaced
  with the coloured exports (real materials: porcelain, chrome,
  sage-painted vanity, walnut bedroom set, mirror glass in a dark
  walnut frame; the objects/dog/pillowcase colours ride along in
  Models' files for when those pieces enter the game). The
  pillowcase itself is in the project: public/models/
  pillowcase.gltf (+ pillowcase.bbmodel at the project root).
  Furniture backs moved to the measured wall faces (see the
  playtest note above) — mirror visible, tub rim restored,
  headboards proud of the walls. Basement lighting added: a
  point inside the stair shaft over the landing, one on the
  basement's east side, and the basement points raised — the
  floor is inspectable now; a main-floor shaft-top point too.
  NOT in this landing: the floor colours — Models' coloured
  AllFloors was built from the PRE-TRIM export (its top divider
  still spans the landing), so a re-run against the trimmed
  model is with Models; it integrates when it lands. Also from
  Models (2026-11-12): both characters verified — the intruder
  stitch (ch28-stitched.glb, 7 clips, 1.763 m) and the homeowner
  (Goodguy.glb, 9 clips, 1.760 m) are sound and metre-true.
- **Markers model + stairs fixes (2026-11-12, on WIP):** Adam
  re-exported the house (Drive, 283,791 B) — the BASEMENT divider
  is now trimmed like the top one (ends at its landing's edge),
  and the model carries 18 furniture LOCATION MARKERS (*Loc nodes
  under a Locators group, main floor: kitchen cabinets + drawers
  + sink east, dining table 3.0×1.5 with 8 chairs west, couches,
  curio, entertainment center). House geometry otherwise
  identical (1,616 tris, same bounds). The loaders (walkthrough +
  exploded view) now hide the markers and exclude them from
  collision. The hall<->stairwell door LEAF IS REMOVED (Adam's
  pin; it also stood on the only route to the basement stairs).
  Adam reported being blocked on the basement stairs in the #7
  build: the flight itself drive-tests clean, tread by tread
  (grounds −0.10…−0.70 stepping down the south lane), so the
  block was the dark shaft + the leaf + lane confusion at the
  up-flight's underside — the #7 shaft lighting, this leaf
  removal, and the already-landing shaft-top light address it;
  Adam's next walk is the verdict. The landing "gap" in his
  snip is the trim itself: the divider box both walled the
  landing and sealed the turn — one box, both jobs; the turn
  being open IS the gap. Floors re-run (Models) now targets this
  markers export; the locator map also says the kitchen is the
  EAST main-floor room (SinkLoc/CabinetsLoc), so the provisional
  linoleum belongs there, not in the west (dining) room.
- **Floor colours IN (2026-11-12, on WIP):** Models' re-run swapped
  in — flat floor materials by room on the markers model (hardwood
  #9A7350 living areas + dining, linoleum #B5B8A4 upstairs bathroom
  + the EAST main-floor kitchen, concrete #8E8E8C basement).
  Verified in the renderer: kitchen floor reads pale, dining room
  reads wood-brown; locator tris ride through identical (264) and
  stay hidden. (An early probe script had a flipped axis and
  briefly accused the file of the old west-linoleum mistake — the
  rendered view cleared it; probes are advisory, the renderer is
  the arbiter.)
- **Main-floor furniture IN (2026-11-12, on WIP):** Models' batch
  built from Adam's *Loc markers, placed on them (backs on the
  measured wall faces): dining table 3.0×1.5 + 8 chairs ringed
  facing it; couches (3-seat west wall, 2-seat north wall) +
  entertainment center + curio in the living/entry area; kitchen
  cabinet runs south + east with the sink centred on SinkLoc and
  the JUNK DRAWER as the south run's west-end module (modelled
  ajar), wall cabinets above both runs. The walkthrough's
  furniture loader gained a per-piece floor height for these.
  Screenshot-verified room by room. HUD zone names still predate
  Adam's geography (the "Kitchen" label sits over the dining
  room) — renames wait on his library scribbles.
- **Upstairs leaves re-hung (2026-11-12, on WIP):** Adam spotted
  doors poking through ceilings. Cause: the five upstairs leaves
  were hung at floorY 2.5 — the slab's underside datum — while
  the walking surface is the slab top, 2.6. Every upstairs leaf
  sank 0.1 into the floor, its bottom edge sitting exactly in the
  ceiling plane of the rooms below. All five now hang at 2.6 like
  the basement leaf always did (−2.4). Screenshot-verified: the
  bathroom leaf's foot meets the floor cleanly.
- **The basement-stairs "missing enclosure" (Adam's report,
  2026-11-12):** measured the markers export piece by piece in
  Adam's own coords — the shaft's outer enclosure walls (both
  sides, his z 2..6), the end wall, and the divider (z 2..4, ending
  at the landing, z 4..6) are all IN the file and render. No piece
  in the export crosses the basement landing. If Adam's Blockbench
  project now shows a wall across that landing stretch, it changed
  after the 13:50 export — a re-export is the fix, and DEV will
  swap it in and prove the wall renders.
- **Floor lamp placed (2026-11-12, on WIP):** Adam remembered the
  lamp after the furniture batch — the living room's floor lamp
  (from the objects batch) now stands in the corner at the
  3-seat couch's north end. It's the extension cord's home: the
  cord is pinned as plugged into this lamp when item logic lands.
- **Day-one items scattered (2026-11-12, on WIP):** all 13
  remaining objects placed — skillet + pot on the kitchen
  counter, claw hammer in the ajar junk drawer, duct tape beside
  it, extinguisher at the run's end, extension cord coiled at
  the lamp's base, ashtray on the dining table, poker by the
  entertainment center, phone on Darleen's nightstand, iron on
  her dresser, bat beside her bed, plunger by the toilet, and
  the shovel leaning on the basement-landing wall (the loader
  gained a per-piece lean). Screenshot-verified except the
  shovel, whose stairwell defeated the camera angles tried —
  Adam's own walk is its check. Props carry no colliders.
- **Adam's model queue (2026-11-12):** floor transition
  dividers not yet modelled (his piece — every linoleum edge
  gets one); ceiling fans, electrical outlets and other
  believability details to come from him.
- **Believability set placed (2026-11-12, on WIP):** Models
  built 13 pieces in one evening batch; DEV placed the
  knowable ones — 5 ceiling fans (living, dining, three
  bedrooms), 4 smoke detectors, range + fridge in the kitchen,
  furnace + water heater in the basement, towel rail, hall
  thermostat, 8 door switches, 15 outlets. Fans, fridge,
  furnace/heater and plates are screenshot-verified. HELD for
  Adam's markers: washer + dryer (laundry location unknown),
  vent covers and curtains (window positions). The south
  kitchen run has NO range gap — DEV's brief wrongly claimed
  one (a screenshot misread, owned): the range currently sets
  into the run's solid cabinets and is visually swallowed;
  Models has been asked for a gap-cut run variant (lx
  2.87..3.63, cut faces capped) and the range spec already
  waits at that span. UPDATE, same evening: the gap variant
  landed and is swapped in — the range now sits in a true
  opening with capped neighbours, screenshot-verified
  (cooktop, oven front, clearance both sides). Resolved. A window opening exists in the kitchen's
  south wall above that stretch (seen in renders; unmarked —
  Adam's window markers will confirm).
- **The Goodguy is in (2026-11-13, on WIP):** the homeowner
  model (characters/goodguy/Goodguy.glb, 1.76 m, nine clips)
  is loaded by the new src/game/playerCharacter.ts and wired
  to the walkthrough controller: locomotion clips crossfade
  from the controller's real ground speed (Idle/Walk/Run),
  approaching a closed door triggers 'Open door', and the
  lock toggle triggers 'Use / press'. Pickup, phone and
  slash clips wait for their mechanics. He is visible in the
  new THIRD-PERSON view (the 👁 button or the V key; first
  person stays the default and bodiless) — the third-person
  camera pulls 3 m back but clamps at the first wall, so it
  stays inside small rooms. Locomotion, facing, scale and
  the camera clamp are screenshot-verified; the door
  one-shot fires off the leaf-open transition.

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
- **Correction pass (2026-11-13, from Adam's playtest of the
  Goodguy build)**: the basement descent is fixed at its roots —
  collision now blocks only motion INTO an obstacle (sliding
  along a wall in the 0.9 m stair lanes used to glue the walker),
  and the shortened east kitchen run no longer boxes the landing.
  Doors answer only on their own floor (proximity, lock and HUD
  note all gated on the player's storey) — one root for the
  phantom bedroom lock and doors opening from other floors. HUD
  zones are floor-banded and relabelled to Adam's markers
  (Kitchen east, Dining west-south, Living west-north; the
  east-north room is 'East Room' until Adam names it); bedrooms
  carry no proper names (Master Bedroom, Bedroom 1, Bedroom 2).
  The homeowner's clips are layered — legs always walk, one-shots
  (door, lock) play on the upper body. Third person hides the
  floor bands above the player. The bathroom mirror is a real
  planar reflection. The back door (measured: the south wall's
  only opening, game x 3.10..3.90) has its counter run and wall
  cabinets cut, and the run's collision is split around the
  opening (the spec.boxes mechanism). Round props are honestly
  round (Models' Round Rule), the TV is dark, the poker is
  removed (no fireplace), and the hammer sits in the junk drawer.
- **Look tag (2026-11-13, Adam's ask)**: a centre dot + tag name
  what the view is centred on — items, furniture, fixtures and
  doors (with their locked state) — picked by a centre ray
  against spec-derived boxes, hidden by any wall in between.
- **Corridor-pass model swap (2026-11-13, Adam's export)**: his
  new AllFloors is in — floor colours re-applied with the
  standing colour pass, all 18 locators intact. What changed:
  Darleen's closet is DELETED (doorway sealed; its leaf, zone
  and door name are removed from the code) and the basement
  flight enclosure was rebuilt. Main-floor walls are unchanged;
  the upstairs hall is unchanged this pass (narrow doorways are
  Adam's next pass, by his word). Verified: stair profile probe
  descends both lanes tread by tread to the basement floor, the
  Basement Room and its doorway stand, kitchen untouched.
- **Lighting + pot fix (2026-11-13, Adam's playtest)**: NOT two
  models — Adam's doubled-walls report bisected three ways: the
  triangle census finds one house (a few dozen exact-duplicate
  floor-seam triangles in the basement, present in his older
  export too), the walkthrough loads the model exactly once, and
  a bare render of the file alone (flat light, nothing else in
  the scene) shows a single clean switchback. What he was seeing
  is the whole three-storey shaft at once — both flights,
  landings and dividers stacked in one open band, where
  Blockbench shows him one floor at a time — flattened into
  ghost layers by the lighting: eleven point lights (12 / 20
  intensity, physical falloff) clipped every nearby surface to
  the same white. Fix: ACES filmic tone mapping (exposure 1.05)
  and the point lights cut to 5.5 (main/upstairs) and 9
  (basement, which still needs the extra reach). The pot also
  really was levitating: it sat at the range piece's 0.92 max
  height, but the cooktop plate is at 0.81 in the piece (burners
  0.822) — the pot now sits at 0.92 world, on the burners.
- **De-dupe model swap (2026-11-13, Adam's export)**: his cleaned
  AllFloors is in — colours re-applied (the colour pass's bathroom
  zone follows the moved wall). The duplicate-wall census is
  nearly clean: the shaft's doubled StairsEnclosure/SWall pairs
  are gone and the upstairs exact-copy wall is single again. TWO
  exact-copy pieces remain (flagged to Adam): a main-floor wall
  metre and a 2 m lintel strip, both on the west cross-wall line
  (his x 0.00..0.10). This pass also WIDENED the stair band: the
  shaft's outer walls moved 0.2 m out on both sides (game z
  -1.65 / +0.75 lines), upstairs bathroom and master walls moved
  with them, and every upstairs door opening was widened to
  ~0.9 m. The code followed the geometry: all four upstairs
  leaves re-hung on the measured gaps (bathroom cz -1.65, master
  cz 0.75, Bedroom 1 cz -1.00 w 0.9, Bedroom 2 cz 0.13 w 0.95),
  five switch plates re-seated on the moved walls, and the
  Stairs/Bathroom/Master/Hall zones re-edged. Verified: stair
  profile probe descends both lanes to the basement floor,
  Basement Room doorway stands, doors sit in their openings.
  Note: the flights themselves are still 1.0 m wide in the now
  1.1 m lanes — a thin slot runs beside each flight; Adam's
  call whether the flights widen too.
- **Stair-widening model swap (2026-11-13, Adam's export)**:
  the flights now fill their widened lanes — all four runs
  measure wall-to-wall (up run 1 z -0.50..0.75, up run 2
  z -1.70..-0.50, down runs to the -1.6 / +0.7 faces) and both
  landings span the full band, so the slots beside the flights
  are closed. The upstairs floor-slab edges were also extended
  to meet the moved bathroom/master walls (the missing-face
  fill). Colours re-applied as usual. Verified: stair profile
  probe clean end to end, lane screenshots show no slot.
  Still open on Adam's side: the two exact-copy 'cube' pieces
  on the west cross-wall line (his x 0.00..0.10) are both still
  doubled in this export — parked until he finds them.
- **Entertainment center / TV split (2026-11-13, Models)**:
  Adam wanted them as two distinct models. The cabinet-only
  entertainment-center replaced the combined piece (same
  footprint and origin; its spec height is now the cabinet's
  0.55) and the TV stands as its own spec on the cabinet top
  (y 0.65), look-tagged 'TV'. Verified in a staged view: TV
  seated on the cabinet, tag reads TV.
