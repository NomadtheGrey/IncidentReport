# LAYOUT v3 — Adam's plan (built 2026-11-10)

Supersedes LAYOUT-V2.md. Source: Adam's Blockbench model of his kids'
house (the house he can walk in his head), read back from the .gltf
vertex data, confirmed by Adam's mental walk, plus his pins from the
same evening:

- The **half-landing butts the house wall** — no dead strip of floor
  beyond a landing, on any floor.
- The two half-flights are separated by a **solid wall, not a railing**
  — you turn around its end, on the landing.
- **Closets live over the lower half-flights**, where the space would
  otherwise be wasted.
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
| Hall Closet | 1..3 × −1.5..−0.5 | 1 × 2 |
| Bathroom | −1..6 × −4.5..−1.5 | 7 × 3 |
| Darleen's Room | −1..6 × 0.5..4.5 | 7 × 4 |
| Darleen's Closet | 4..6 × 0.5..2.5 | 2 × 2 |

The walk, as Adam narrated it: up the stairs into the 2 × 2 hall —
left is the bathroom (the long room beside the band), straight ahead
the pair of doors (left Clarissa's, right Breanna's), right is
Darleen's room. Spawn is Darleen's room; the baseball bat lives in
her closet.

The hall closet sits over the up flight's lower half-flight, off the
hall beside the stair mouth. Adam's model had the space carved out
with no door painted; the build paints the door (at the hall end of
the band's south side). Darleen's closet is the nook at the far end
of her room, likewise over a lower half-flight.

## The stair band (both flights, one footprint)

Band: x 1..6, z −1.5..0.5. Mouths at x=1 off the hall; runs 3m long
(x 1..4); half-landing 2 × 2 (x 4..6) against the east wall. South run
z −1.5..−0.5, north run z −0.5..0.5, solid separator wall between
them at z=−0.5 (full stack height, stepped).

- UP flight: enters on the south run at main, climbs east to the
  landing, returns on the north run, arrives at the upstairs hall.
- DOWN flight, stacked directly beneath (3m separation throughout):
  enters on the north run at main, descends east to its landing,
  returns on the south run, arrives in the basement.

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
fails the Frying Pan Test. Adam has been asked what that door really
is in the kids' house; if it has a real form, it goes in then.

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
