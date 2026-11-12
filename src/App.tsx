import { useState } from 'react';
import ExplodedModel from './game/ExplodedModel';
import ModelWalk from './game/ModelWalk';

type View = 'title' | 'model' | 'exploded';

export default function App() {
  const [view, setView] = useState<View>('title');

  if (view === 'model' || view === 'exploded') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '0.6rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            borderBottom: '1px solid #333',
            flexWrap: 'wrap',
          }}
        >
          <strong style={{ letterSpacing: '0.15em' }}>
            {view === 'model' ? 'WALK THE MODEL' : 'THE HOUSE, EXPLODED'}
          </strong>
          <span style={{ opacity: 0.65, fontSize: '0.85rem' }}>
            {view === 'model'
              ? "First person inside Adam's Blockbench model — all three floors. You start in the primary bedroom, upstairs."
              : "Adam's Blockbench model with the floors lifted apart. Drag to orbit, scroll to zoom."}
          </span>
          <button
            onClick={() => setView('title')}
            style={{ marginLeft: 'auto', cursor: 'pointer', minHeight: 40, padding: '0 1rem' }}
          >
            Back to title
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          {view === 'model' ? <ModelWalk /> : <ExplodedModel />}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.6rem',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ letterSpacing: '0.35em', fontSize: '0.8rem', opacity: 0.7 }}>
        A FILM OF UNRELENTING TERROR
      </div>
      <h1 style={{ fontSize: '3rem', margin: 0, letterSpacing: '0.12em' }}>
        INCIDENT REPORT
      </h1>
      <div style={{ opacity: 0.75, fontStyle: 'italic' }}>
        Every solution in this house would work in a real house.
        That is the problem. For him.
      </div>
      <div style={{ display: 'flex', gap: '0.8rem', marginTop: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => setView('model')}
          style={{
            padding: '0.7rem 1.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            minHeight: 48,
          }}
        >
          Walk the model house
        </button>
        <button
          onClick={() => setView('exploded')}
          style={{
            padding: '0.7rem 1.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            minHeight: 48,
            opacity: 0.85,
          }}
        >
          Exploded view
        </button>
      </div>
    </div>
  );
}
