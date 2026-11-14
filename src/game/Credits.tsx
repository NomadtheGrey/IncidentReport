import { useEffect, useRef, useState } from 'react';

// The stupidly long opening credits (Adam, 2026-11-14; the
// structure is Bambi vs. Godzilla: pompous credits, thirty
// seconds of incident, joke credits, the Report). This is the
// OPENING roll only — the closing roll and the Report card
// hang off the incident loop and come with it.
//
// The copy below is a DRAFT for Adam's pin pass: every card is
// data, so lines and dwell times are one-line edits. Default
// dwell 6.5 s; the whole roll runs about four minutes, which
// is the joke. Any click / tap / key skips: one gag card, then
// straight into the house.

type Card = { lines: string[]; dwell?: number; big?: boolean };

const CREDITS: Card[] = [
  { lines: ['NOMAD THE GREY', 'presents'], dwell: 7000 },
  { lines: ['a film of tremendous importance'], dwell: 6000 },
  { lines: ['INCIDENT REPORT'], dwell: 9000, big: true },
  { lines: ['starring', 'THE HOMEOWNER', 'as himself'] },
  { lines: ['THE INTRUDER', 'as the problem'] },
  { lines: ['THE CAST IRON SKILLET', 'as itself'] },
  { lines: ['featuring', 'THE CLAW HAMMER', 'in a drawer'] },
  { lines: ['THE SHOVEL', 'who declined to dig'] },
  { lines: ['THE EXTENSION CORD', 'plugged into a lamp, as is traditional'] },
  { lines: ['and', 'THE DOG', 'as security'] },
  { lines: ['Director of Photography', 'a security camera nobody checks'] },
  { lines: ['Lighting by', 'whoever remembered the switch', 'at the top of the stairs'] },
  { lines: ['Set Design', 'a family, over twenty years,', 'one flat surface at a time'] },
  { lines: ['The junk drawer was not emptied', 'for this production.', 'Nothing was emptied.', "That's the point."] },
  { lines: ['Catering', 'leftovers'] },
  { lines: ['Costume Design', 'whatever he was wearing at 2 a.m.'] },
  { lines: ["The Intruder's wardrobe", 'was provided by the Intruder.', 'He brought his own pillowcase.'] },
  { lines: ['Sound Design', 'a house, settling'] },
  { lines: ['Music', "none. It's 2 a.m. Be quiet."] },
  { lines: ['Stunt Coordination', 'the Frying Pan Test:', "if it wouldn't work in real life,", "it isn't in this film"] },
  { lines: ['Legal Department', 'everything that follows', 'was self-defence, allegedly'] },
  { lines: ['No animals were harmed in this film.', 'One intruder was, repeatedly,', 'and only after warnings', 'the film will establish were adequate.'] },
  { lines: ['Filmed entirely on location', 'in a real house.', 'The stairs are stacked.', 'The doors lock from the inside.'] },
  { lines: ['This film is dedicated to everyone', 'who has ever gone to check a noise', 'holding the wrong household item.'] },
  { lines: ['Runtime advisory:', 'the incident itself takes thirty seconds.', 'The paperwork is the feature.'] },
  { lines: ['and now', 'the incident'], dwell: 7000 },
];

const SKIP_CARD: Card = {
  lines: ['You have skipped the credits.', 'This will be noted in the report.'],
  dwell: 2000,
};

export default function Credits({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const doneRef = useRef(false);

  const card = skipped ? SKIP_CARD : CREDITS[idx];

  useEffect(() => {
    const t = setTimeout(() => {
      if (skipped) {
        if (!doneRef.current) { doneRef.current = true; onDone(); }
      } else if (idx + 1 < CREDITS.length) {
        setIdx(idx + 1);
      } else if (!doneRef.current) {
        doneRef.current = true;
        onDone();
      }
    }, card.dwell ?? 6500);
    return () => clearTimeout(t);
  }, [idx, skipped, card, onDone]);

  useEffect(() => {
    const skip = () => { if (!doneRef.current) setSkipped(true); };
    window.addEventListener('pointerdown', skip);
    window.addEventListener('keydown', skip);
    return () => {
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
    };
  }, []);

  return (
    <div
      style={{
        height: '100%',
        background: '#000',
        color: '#e8e2d4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      <style>{`
        @keyframes creditFade {
          0% { opacity: 0; }
          14% { opacity: 1; }
          84% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      <div
        key={skipped ? 'skip' : idx}
        style={{
          textAlign: 'center',
          padding: '2rem',
          animation: `creditFade ${card.dwell ?? 6500}ms ease-in-out forwards`,
        }}
      >
        {card.lines.map((line, i) => (
          <div
            key={i}
            style={
              card.big
                ? { fontSize: '2.6rem', letterSpacing: '0.18em', margin: '0.4rem 0' }
                : i === 0 && card.lines.length > 2
                  ? { fontSize: '0.85rem', letterSpacing: '0.3em', opacity: 0.65, textTransform: 'uppercase', margin: '0.35rem 0' }
                  : { fontSize: '1.45rem', letterSpacing: '0.06em', margin: '0.35rem 0' }
            }
          >
            {line}
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '1rem',
          right: '1.2rem',
          fontSize: '0.75rem',
          opacity: 0.35,
          letterSpacing: '0.12em',
        }}
      >
        click or press any key to skip — coward
      </div>
    </div>
  );
}
