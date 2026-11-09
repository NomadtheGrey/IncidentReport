import { useState } from 'react';
import HouseGreybox from './game/HouseGreybox';

export default function App() {
  const [view, setView] = useState<'title' | 'house'>('title');

  if (view === 'house') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '0.6rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            borderBottom: '1px solid #333',
          }}
        >
          <strong style={{ letterSpacing: '0.15em' }}>THE HOUSE</strong>
          <span style={{ opacity: 0.65, fontSize: '0.85rem' }}>
            Greybox v1 — exploded view. Drag to orbit, scroll to zoom.
          </span>
          <button
            onClick={() => setView('title')}
            style={{ marginLeft: 'auto', cursor: 'pointer' }}
          >
            Back to title
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <HouseGreybox />
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
      <button
        onClick={() => setView('house')}
        style={{
          marginTop: '2rem',
          padding: '0.6rem 1.4rem',
          fontSize: '1rem',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        View the house
      </button>
    </div>
  );
}
