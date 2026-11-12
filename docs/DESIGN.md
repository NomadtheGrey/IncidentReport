# INCIDENT REPORT — Design Record

Pinned means Adam said so. Draft means still open. Nothing in the Draft
section is a decision.

## PINNED

- **Title:** INCIDENT REPORT — "it's just vague enough... and specific
  enough." (Adam, 2026-11-09.) Earlier candidates (CAST IRON,
  DAD vs. STALKER, BONK., SEASONED, REASONABLE FORCE, WRONG HOUSE)
  are retired to this record.
- **The law:** THE FRYING PAN TEST — every solution must be something
  that would actually work in the real world; everything behaves like
  itself.
- **The skillet works.** A clean hit puts the stalker down; if he tries
  to get back up, whack him again. A dispatched stalker stays dispatched
  until the police arrive. The game may not cheat this.
- **No escalation gimmicks.** The "stalker comes back wearing a
  motorcycle helmet" idea is dead — movie logic. No costumes, no
  superhuman recoveries.
- **Extension-cord tie-up is legitimate** post-incident play.
- **Structure:** the *Bambi vs. Godzilla* ratio — long pompous opening
  credits, ~30 seconds of play, long joke closing credits, and a
  grade/report card (the titular Incident Report) to close the loop.
- **Perspective:** FIRST PERSON. (Adam, 2026-11-09.)
- **The house:** UPSTAIRS, MAIN FLOOR, BASEMENT, ATTACHED GARAGE.
  (Adam, 2026-11-09.)

## DRAFT — promising, not pinned

- **The aftermath is gameplay:** guarding a downed intruder until help
  arrives, possum-playing dread, and a REASONABLE FORCE grade — whack a
  downed man once too many and you're the defendant.
- **The cover-story branch:** tell the police the stalker ran away —
  "A 5'10" male wearing a black bedsheet, ran away out the back door" —
  while he is in fact tied up in the basement. The running gag: keeping
  him flips the homeowner into the villain, and the Report's Suspect
  line ends up pointing back at the homeowner.
- **Dark options the game acknowledges, then refuses or punishes:**
  drag him out back and dig a hole (the garage shovel's hover-text is
  "No." — digging a real hole takes hours and police ETA is minutes),
  the deep freezer ("murder with extra steps"), dragging him to the
  basement (180 lbs of dead weight, and stairs). Tone: farce, not gore.
- **The epilogue (Adam, 2026-11-12):** the digging isn't gone, it's
  POSTPONED. If the player chooses to "take care of the problem"
  after the situation is handled, the excessively long ending credits
  are interrupted by quiet cut scenes: the protagonist digging in the
  backyard with the shovel… back to credits… a heavy bag dumped into
  a hole… more credits… and finally a sunny day in the backyard, the
  protagonist drinking lemonade on a yard chair, over a bare patch.
  (The shovel swung as a club during the incident: still open.)
  Adam's add-on (same morning, tentative): the Report might even
  UPDATE THE GRADE after the epilogue — the report card returning
  amended once the credits finish their story.
- **Defence candidates** (Adam's list + brainstorm, 2026-11-09): cast
  iron skillet; heavy glass ashtray; tall floor lamp (as a club it
  passes the Test; as an electrified broken-bulb jab it FAILS — you
  would shock yourself — "That's not a taser. Just swing it.");
  fireplace poker; fire extinguisher; baseball bat; claw hammer;
  boiling water; letting the dog in from the backyard to do what a good
  guard dog does; barricading and calling 911; getting to the car and
  leaving. Leaving is a real solution and the Report should reward it.
- **Start (proposed default):** solo dweller, starts in bed upstairs;
  stalker enters through the garage side door, then the mudroom door.
- **Intruder spawn: a RANDOM ROOM (Adam, 2026-11-12).** Which rooms
  are eligible for the draw is not yet specified — open detail.
- **Intruder flavour: he creeps around EXAMINING THE HOUSEHOLD
  GOODIES, carrying a PILLOWCASE as his loot sack (Adam,
  2026-11-12).** The pillowcase model is tasked to the Models chat:
  box-built, origin at the fist grip so it can parent to his hand
  bone, a standard pillowcase ~0.51 × 0.76 m with a looted bulge at
  the bottom. The arc pairs with the crawl-away pin below: spawn
  random → creep + examine/loot → encounter → defended → knocked
  down → crawls away.
- **The intruder, once down, tries to CRAWL AWAY (Adam, 2026-11-12):**
  the Crawling clip is an ESCAPE, not a renewed attack — it happens
  if the player has "defended" himself (Adam's scare quotes; the
  report's language). Full intruder clip arc: Breathing Idle →
  Sneaking Forward (his walk) → Standing Melee Attack Horizontal →
  Writhing In Pain → Falling Down → Knocked Down → Crawling (away).
  Character files: the Badguy FBX set (7 clips) is with the Models
  chat for stitching into one GLB; Goodguy.glb (the homeowner, 9 Ara
  clips incl. Phone Call / Open Door / Pick Up) is complete and with
  Models for verification only.
- **Repeat incidents**, if any, must stay inside realism: different
  houses / situations, never a learning super-stalker.
- **Build shape (proposed):** tiny web / itch piece, writing-led — the
  smallest build on the pile.

## Things to find in the house (DRAFT list, started 2026-11-12)

Adam's call (2026-11-12): write the lists down. This is the findable
stuff, by room — brainstorm material, not pins; it grows and gets
pinned as the layout planning settles.

- **Kitchen:** cast iron skillet (on the stove), boiling pot, fire
  extinguisher, kitchen knives (they exist; the game stays honest
  about what using one means)
- **Living room:** heavy glass ashtray, fireplace poker, tall floor
  lamp (a club, never a taser)
- **Dining room:** (open — candlesticks? chairs?)
- **Upstairs bedrooms:** baseball bat (primary closet), clothes iron,
  phone (nightstand — the 911 call)
- **Bathroom:** plunger
- **Hall / entry:** (open)
- **Placements from the kids' house (Adam, 2026-11-12 — these win
  over the garage-first guesses):** the kitchen has a JUNK DRAWER
  among its drawers, holding tools such as the claw hammer (the
  kitchen cabinetry has to exist before the drawer can); the
  shovel hangs ON THE WALL IN THE BASEMENT STAIRS ("these kids
  never put things away right"); the extension cord is PLUGGED
  INTO A LAMP, and there is at least one lamp in the living room.
- **Garage:** (the shovel's hover-text is "No." — see the start
  section; hammer and cords moved out per the placements above)
- **Basement:** (open — freezer is scenery with an opinion)
- **Anywhere:** belts, duct tape (tie-up), lights, lockable doors
- **Outside:** the dog (let him in), the car (leave — a real ending)

## Mechanics we'll employ (DRAFT list, started 2026-11-12)

- **Everything in the house is OPTIONAL for the player (Adam,
  2026-11-12):** items sit in sensible places to be found and used
  at the player's discretion — the phone included. Nothing is a
  forced pickup; ignoring the phone and reaching for the skillet
  instead is a legitimate line, as is leaving.

- Walk, look (first person); one item per hand
- Pick up / put down / carry
- Swing what you're holding (the bonk obeys the Frying Pan Test)
- Lock and unlock doors (inside privacy locks); barricade
- Call 911 on the phone; the dispatcher conversation is gameplay
- Tie up a downed intruder (cords, belts, tape); guard him
- Drag — heavy, slow, honest about 180 lbs and stairs
- Lights on and off; open the door for the police
- Let the dog in; get in the car and leave
- The aftermath grades you: REASONABLE FORCE on the Report card

## House layout (draft v1, 2026-11-09)

NOTE (2026-11-12): superseded in detail by Adam's Blockbench model
(AllFloors) and his forthcoming layout scribbles — the floor layout
needs more planning on his part and stays open. Kept for the staging
ideas (the creaky stair, the sightlines, the basement-door staging).

Stacked stairs: the upstairs flight and the basement flight share a
wall, so sound carries vertically through the whole house.

### Upstairs — the player starts here
- Primary bedroom (start; phone on the nightstand, baseball bat in the
  closet — in first person, one item per hand matters)
- Spare bedroom, office / third bedroom
- Bathroom (lockable, small window — a barricade-and-call room)
- Landing: sees the front door below, NOT the kitchen.
  One creaky stair, third from the top.

### Main floor — the incident floor
A loop with no dead ends: Living → Dining → Kitchen → Hall → Living.
- Living room: glass ashtray, floor lamp, fireplace poker
- Kitchen: skillet on the stove, fire extinguisher, back door to the
  yard and the dog
- Dining room between living and kitchen
- Basement door off the hall, visible from the kitchen table (staging
  for the police scene)
- Mudroom / laundry between kitchen and garage

### Attached garage — his way in
- One car, overhead door (front), pedestrian door to the backyard
- Internal door to the mudroom — the plausible entry route
- Workbench, claw hammer, extension cords on a pegboard, the shovel
  in the corner ("No.")

### Basement — one way in, one way out
- Furnace / water heater, paint cans, holiday decorations, workbench,
  storage shelves, small high windows
- Chest freezer against the far wall
- A bad place to hide and a worse place to drag a man; the game says
  so honestly in the moment
