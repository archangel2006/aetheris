# Diorama Dive

only requirement is 3d website fully 3d immaersive experience..be as creative as you want..we do not want basic q/a paths or multiple choice..it shoudl be an immerisve 3d experience.

Explorable Miniature WorldA tiny floating island, diorama, or planet you can rotate and zoom into, full of small interactive details.

Low-poly or stylized assets (easy to source/build, looks intentional not unfinished)

OrbitControls with zoom limits to keep framing tight

Hover/click hotspots revealing facts, easter eggs, or links

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/76afee0a-3012-4be0-bf00-e6803add6149).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development Setup & Running Locally

### Prerequisites
- Node.js (v18+ recommended) and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

### Quick Start

1. **Clone the repository:**
   ```sh
   git clone https://github.com/archangel2006/aetheris.git
   cd aetheris
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Start the local development server:**
   ```sh
   npm run dev
   ```
   Open `http://localhost:3000` (or the URL printed in your terminal) in your browser.

---

## Available Scripts

- `npm run dev` — Starts the local Vite dev server.
- `npm run build` — Builds the application for production (stored in `.output/`).
- `npm run preview` — Previews the production build locally.
- `npm run lint` — Runs ESLint checks across the codebase.

---

## How to Test Background Music & Audio

1. Ensure `music-track.mp3` is located in `public/music-track.mp3`.
2. Run `npm run dev` and open the web app in your browser.
3. **Autoplay & Interaction**:
   - The audio track automatically begins playing on mount or as soon as you click/tap anywhere on the screen (handling browser autoplay policies).
   - The audio will continuously loop seamlessly in the background.
4. **Mute Control**: Click the speaker icon in the top-right corner to mute or resume music.

