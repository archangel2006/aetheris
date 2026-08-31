export type Hotspot = {
  id: string;
  title: string;
  kicker: string;
  body: string;
  position: [number, number, number];
  link?: { label: string; href: string };
};

export const HOTSPOTS: Hotspot[] = [
  {
    id: "windmill",
    title: "The Skymill",
    kicker: "Landmark 01",
    body: "Its blades don't grind grain — they comb the wind for stray thoughts. On quiet mornings the whole island hums a B-flat.",
    position: [2.05, 1.85, -0.4],
  },
  {
    id: "lighthouse",
    title: "Lantern of Low Tide",
    kicker: "Landmark 02",
    body: "There is no sea here, only sky. The keeper lights it anyway, in case something is out there looking for land.",
    position: [-2.2, 2.1, 1.1],
  },
  {
    id: "grove",
    title: "The Whisper Grove",
    kicker: "Landmark 03",
    body: "Seven trees, all the same age, none of them planted. Locals leave paper notes in the branches and never read them again.",
    position: [-0.6, 1.5, -2.2],
  },
  {
    id: "falls",
    title: "Edgewater",
    kicker: "Landmark 04",
    body: "The river runs off the rim and evaporates into cloud, which drifts back and rains on the island. A closed loop, mostly.",
    position: [1.35, 0.55, 2.15],
  },
  {
    id: "camp",
    title: "Ember Camp",
    kicker: "Easter egg",
    body: "Somebody is still awake down there. Click the fire again and it burns a little brighter — it likes the attention.",
    position: [0.15, 1.35, 1.55],
  },
  {
    id: "core",
    title: "The Anchor Stone",
    kicker: "Secret",
    body: "Beneath the roots hangs a single humming crystal. Remove it and the island becomes, briefly and spectacularly, a falling rock.",
    position: [0, -5.05, 0],
  },
  {
    id: "fox",
    title: "Sorrel, the Island Fox",
    kicker: "Companion",
    body: "She belongs to nobody and follows everybody. Click anywhere on the grass to drop an apple — she'll come running, and she always finishes it.",
    position: [-1.15, 1.55, 0.9],
  },
];

export const LAKE_ORIGIN: [number, number, number] = [16, -1.2, -9];

export const LAKE_HOTSPOTS: Hotspot[] = [
  {
    id: "lake",
    title: "Still Mere",
    kicker: "Isle 02 · Lake",
    body: "A freshwater bowl that never drains. Tap the water to scatter feed — the koi school within seconds, and the dragonflies complain.",
    position: [0, 1.5, 0],
  },
  {
    id: "reeds",
    title: "The Reedline",
    kicker: "Isle 02 · Terrain",
    body: "Reeds tall enough to hide in, lily pads wide enough to stand on. Nothing here is in a hurry.",
    position: [2.1, 1.1, 1.4],
  },
];

export const FOREST_ORIGIN: [number, number, number] = [-15, -0.6, -14];

export const FOREST_HOTSPOTS: Hotspot[] = [
  {
    id: "pinewatch",
    title: "Pinewatch",
    kicker: "Isle 03 · Woodland",
    body: "A pocket of dusk that never turns to night. The pines hold the cold light; one amber lantern argues with them.",
    position: [0, 2.6, 0],
  },
  {
    id: "bear",
    title: "The Warden",
    kicker: "Isle 03 · Resident",
    body: "He sleeps in the bank den, wakes on his own schedule, walks down to the stream, drinks, and goes back. Nobody has ever hurried him.",
    position: [-1.5, 1.4, -1.4],
  },
  {
    id: "deer",
    title: "The Skittish Three",
    kicker: "Isle 03 · Herd",
    body: "Two adults and a fawn. Click one and the whole family bolts a few paces — the fawn always a beat late.",
    position: [1.1, 1.3, 1.5],
  },
  {
    id: "lantern",
    title: "The Amber Note",
    kicker: "Isle 03 · Easter egg",
    body: "Lit from the same ember as the Home Isle campfire. The fireflies treat it as a rival and lose, nightly.",
    position: [0.9, 1.9, 1.85],
  },
];
