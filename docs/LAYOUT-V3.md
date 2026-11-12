# LAYOUT v3 — Adam's plan (built 2026-11-10; v3.1 closet correction 2026-11-11)

Supersedes LAYOUT-V2.md. Source: Adam's Blockbench model of his kids'
house (the house he can walk in his head), read back from the .gltf
vertex data, confirmed by Adam's mental walk, plus his pins from the
same evening:

- The **half-landing butts the house wall** — no dead strip of floor
  beyond a landing, on any floor.
- The two half-flights are separated by a **solid wall, not a railing**
  — you turn around its end, on the landing.
- **Closets live over the lower half-flights**, where the space would
  otherwise be wasted. Darleen's closet is the one over the lower
  half-flight (Adam, 2026-11-11): its floor is the **squared-off**
  ceiling over that flight — flat, not sloped, so the space is used —
  with about 2m of headroom under it on the stairs (tight only if
  you're well in excess of six feet tall).
- Whole-metre grid throughout.

## The rotation

Adam's model axes (from his wall names): +x = north, +z = east, in a
9 × 12 shell. Rotated into the game's 12 × 9 shell with no mirroring:
his west→east runs along our west→east (our x), his south→north along
our back→front (our z). The stair landing ends up against our EAST
wall; the girls' rooms across our west end.

## Upstairs (his floor, as modelled)

| Room | Ours (x × z) | Size |
| --- | --- | --- |
| Clarissa's Room | −6..−1 × −4.5..−0.5 | 5 × 4 |
| Breanna's Room | −6..−1 × −0.5..4.5 | 5 × 5 |
| Hall | −1..1 × −1.5..0.5 | 2 × 2 |
| Landing (stair band) | 1..6 × −1.5..0.5 | 5 × 2 |
| Darleen's Closet | 1..3 × −0.5..0.5 | 1 × 2 |
| Bathroom | −1..6 × −4.5..−1.5 | 7 × 3 |
| Darleen's Room | −1..6 × 0.5..4.5 | 7 × 4 |

The walk, as Adam narrated it: up the stairs into the 2 × 2 hall —
left is the bathroom (the long room beside the band), straight ahead
the pair of doors (left Clarissa's, right Breanna's), right is
Darleen's room. Spawn is Darleen's room; the baseball bat lives in
her closet.

Darleen's closet sits over the lower half-flight at the hall end of
the band, on her side of the stairs — the run Adam's model drew
floored (the arriving run, on the other side, is the one drawn open).
Its door is off the hall, beside the stair mouth; Adam's model had
the space carved out with no door painted, and the build paints it.
Her room itself is a clean rectangle. (The v3 build put a second
closet in the far corner of her room — Marlowe's misread of the
model, removed in v3.1 on Adam's correction.)

## The stair band (both flights, one footprint)

Band: x 1..6, z −1.5..0.5. Mouths at x=1 off the hall; runs 3m long
(x 1..4); half-landing 2 × 2 (x 4..6) against the east wall. South run
z −1.5..−0.5, north run z −0.5..0.5, solid separator wall between
them at z=−0.5 (full stack height, stepped).

- UP flight: enters on the north run at main (Darleen's side),
  climbs east to the landing, returns on the south run, arrives at
  the upstairs hall. Descending, that north run is the lower
  half-flight — her closet floors over its low end.
- DOWN flight, stacked directly beneath (3m separation throughout):
  enters on the south run at main, descends east to its landing,
  returns on the north run, arrives in the basement.

(v3 had the two flights running the other way; v3.1 flips them to
match Adam's model — floored run on Darleen's side, open arriving
run on the bathroom side.)

## Main floor (re-cut around the band)

West rooms unchanged from v2 (Kitchen 5 × 5 SW, Living Room 5 × 4
NW). Hall / Entry narrows to 2 × 9 (x −1..1) with both stair mouths
open off its east side mid-house. Mudroom (5 × 3) sits south of the
band; Dining Room (5 × 4) north of it; the mudroom–garage door moved
to (6, −3) to stay in the mudroom. The dining–mudroom door from v2
is gone (the band is between them now); the loop runs dining → hall
→ mudroom. Garage unchanged.

## Basement

One open room, 12 × 9 (v2's walled Utility Corner is dropped — the
stacked shaft arrives at the band's west end and the open plan keeps
the arrival clear; the furnace/water heater are items in the open
room). The down flight's flanks are guarded where it crosses the
open basement.

## Open item — the model's fifth door ("Dooway5")

Adam's model draws a door off the stair band's far end into the back
of Darleen's room. It is **not built**: the half-landing sits 1.5m
below her floor, so a door there cannot be stepped through — it
fails the Frying Pan Test. Adam's 2026-11-11 answer explained
Darleen's closet (above), not this far-end door; it stays unbuilt
until its real form is known.

## Verification (2026-11-10)

- Build green (tsc + vite).
- Headless route test, 39 legs, 0 failures, 0 page errors: spawn in
  Darleen's room → her closet → hall → hall closet → down the up
  flight (north run, landing turn, south run) → main hall → kitchen
  (the fast route) → down flight to the basement → back up → up
  flight to the upstairs hall. Room names verified at every stop.
- Lock test, 11 checks, 0 failures: enter the bathroom, door shuts,
  E locks it from inside, exit through it from inside, it shuts
  locked behind, and a 4-second push from the hall side does not
  open it.
- Greybox renders the plan (16 rooms · 17 doors · 4 levels).
- On WIP at 9a3b614, all three code files byte-identical at origin.
  Not merged — awaits Adam's word and his phone playtest.

## Verification — v3.1 (2026-11-11)

- Route test re-run for the flipped stairs, 40 legs, 0 failures,
  0 page errors: spawn → her room → hall → Darleen's closet (over
  the lower half-flight) → down the up flight (south run, landing
  turn, north run) → main hall → kitchen → down flight (south run
  first) to the basement → back up → up the up flight (north run
  first) → upstairs hall.
- Lock test re-run, 11 checks, 0 failures.
- One real bug found and fixed on the way: the collision test
  treated the walker as a square, so the wall stub between the
  closet door and the stair arrival caught his "corner" and stopped
  an off-centre approach dead. The body is a true circle now —
  shoulders slide past jamb corners the way a person's do.
- Greybox renders the corrected plan (15 rooms · 16 doors · 4
  levels): Darleen's Closet 1 × 2 in the band, her room a clean
  7 × 4.
- On WIP at 21ccbe5, all three code files byte-identical at origin.
  Not merged — awaits Adam's word and his phone playtest.
