import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' from day one: the game must boot from any subfolder
// (itch.io embed, GitHub Pages project path), not just a domain root.
// A root-absolute base was the BioForge itch blank-box lesson (2026-10-24).
export default defineConfig({
  base: './',
  plugins: [react()],
});
