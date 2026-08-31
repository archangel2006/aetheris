import { useMemo, useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Float,
  Html,
  Sparkles,
  Stars,
} from "@react-three/drei";
import * as THREE from "three";
import {
  HOTSPOTS,
  LAKE_HOTSPOTS,
  LAKE_ORIGIN,
  FOREST_HOTSPOTS,
  FOREST_ORIGIN,
  type Hotspot,
} from "./data";
import { Fox, Islander, Apple, BirdFlock, type Obstacle } from "./Creatures";
import LakeIsland from "./LakeIsland";
import ForestIsland from "./ForestIsland";
import AmbientMusic from "./AmbientMusic";

/* ---------------------------------- utils --------------------------------- */

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const C = {
  grass: "#7fc26b",
  grassDark: "#4f9a55",
  rock: "#8a6f5c",
  rockDark: "#5e4b3f",
  trunk: "#7a4f36",
  leaf: "#43a06a",
  leafAlt: "#6dc27f",
  wood: "#c48b57",
  stone: "#d7cbb8",
  water: "#7fd6e8",
  ember: "#ff9d4d",
  crystal: "#8fe4ff",
};

/* ---------------------------------- island --------------------------------- */

function IslandBody() {
  const rockGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(3.05, 5.2, 9, 5);
    const pos = g.attributes['position'] as THREE.BufferAttribute;
    const r = rng(7);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const f = y < 2.5 ? 0.45 : 0.05;
      pos.setX(i, pos.getX(i) + (r() - 0.5) * f);
      pos.setY(i, pos.getY(i) + (r() - 0.5) * f * 0.6);
      pos.setZ(i, pos.getZ(i) + (r() - 0.5) * f);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const grassGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(3.1, 3.0, 0.7, 9, 1);
    const pos = g.attributes['position'] as THREE.BufferAttribute;
    const r = rng(21);
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, pos.getY(i) + (r() - 0.5) * 0.22);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group>
      <mesh geometry={rockGeo} position={[0, -1.9, 0]} rotation={[Math.PI, 0.3, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={C.rock} flatShading roughness={1} />
      </mesh>
      <mesh geometry={grassGeo} position={[0, 0.75, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={C.grass} flatShading roughness={0.9} />
      </mesh>
      {/* soft mounds */}
      {([
        [-1.4, 1.0, -1.2, 1.1],
        [1.7, 1.0, -0.9, 0.9],
        [0.3, 1.0, -1.9, 0.8],
      ] as const).map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} scale={[s, s * 0.45, s]} castShadow receiveShadow>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={C.grassDark} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Path() {
  const pts = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.0, 1.12, 0.9),
        new THREE.Vector3(-0.8, 1.16, 1.3),
        new THREE.Vector3(0.4, 1.16, 1.2),
        new THREE.Vector3(1.4, 1.14, 0.2),
        new THREE.Vector3(1.9, 1.12, -0.5),
      ]).getPoints(28),
    []
  );
  return (
    <group>
      {pts.map((p, i) => (
        <mesh key={i} position={[p.x, p.y - 0.02, p.z]} rotation={[-Math.PI / 2, 0, i]} receiveShadow>
          <circleGeometry args={[0.16, 6]} />
          <meshStandardMaterial color={C.stone} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Tree({ position, scale = 1, seed = 1 }: { position: [number, number, number]; scale?: number; seed?: number }) {
  const r = useMemo(() => rng(seed * 13 + 5), [seed]);
  const tilt = useMemo(() => (r() - 0.5) * 0.2, [r]);
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = tilt + Math.sin(clock.elapsedTime * 1.1 + seed) * 0.03;
  });
  return (
    <group position={position} scale={scale} ref={ref}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.12, 0.7, 6]} />
        <meshStandardMaterial color={C.trunk} flatShading roughness={1} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.85 + i * 0.34, 0]} rotation={[0, i * 0.6, 0]} castShadow>
          <coneGeometry args={[0.55 - i * 0.14, 0.55, 6]} />
          <meshStandardMaterial color={i % 2 ? C.leafAlt : C.leaf} flatShading roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function Windmill({ onPointerDown }: { onPointerDown: () => void }) {
  const blades = useRef<THREE.Group>(null);
  useFrame((_, d) => {
    if (blades.current) blades.current.rotation.z += d * 0.9;
  });
  return (
    <group position={[2.05, 1.1, -0.4]} onPointerDown={onPointerDown}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.42, 1.1, 8]} />
        <meshStandardMaterial color={C.stone} flatShading roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.28, 0]} castShadow>
        <coneGeometry args={[0.42, 0.5, 8]} />
        <meshStandardMaterial color="#c05c4a" flatShading />
      </mesh>
      <group ref={blades} position={[0, 1.15, 0.36]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]} position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.08, 0.9, 0.03]} />
            <meshStandardMaterial color={C.wood} flatShading />
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#5e4b3f" flatShading />
        </mesh>
      </group>
    </group>
  );
}

function Lighthouse({ onPointerDown }: { onPointerDown: () => void }) {
  const beam = useRef<THREE.Group>(null);
  useFrame((_, d) => {
    if (beam.current) beam.current.rotation.y += d * 0.5;
  });
  return (
    <group position={[-2.2, 1.1, 1.1]} onPointerDown={onPointerDown}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.36, 1.4, 8]} />
        <meshStandardMaterial color={C.stone} flatShading />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.235, 0.26, 0.3, 8]} />
        <meshStandardMaterial color="#c05c4a" flatShading />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.28, 8]} />
        <meshStandardMaterial color="#fff0b8" emissive="#ffcf6b" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0, 1.72, 0]} castShadow>
        <coneGeometry args={[0.28, 0.3, 8]} />
        <meshStandardMaterial color="#3f4b5b" flatShading />
      </mesh>
      <pointLight position={[0, 1.5, 0]} color="#ffd98a" intensity={4} distance={4} />
      <group ref={beam} position={[0, 1.5, 0]}>
        <mesh position={[0, 0, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.3, 2.2, 12, 1, true]} />
          <meshBasicMaterial color="#ffe6a8" transparent opacity={0.14} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

function Campfire({ boost, onPointerDown }: { boost: number; onPointerDown: () => void }) {
  const light = useRef<THREE.PointLight>(null);
  const flame = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const f = 1 + Math.sin(t * 9) * 0.18 + Math.sin(t * 13.3) * 0.1;
    if (light.current) light.current.intensity = (2.2 + boost * 1.6) * f;
    if (flame.current) flame.current.scale.setScalar((0.9 + boost * 0.18) * f);
  });
  return (
    <group position={[0.15, 1.1, 1.55]} onPointerDown={onPointerDown}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.26, 0.04, Math.sin(a) * 0.26]} castShadow>
            <dodecahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial color="#6f6a63" flatShading />
          </mesh>
        );
      })}
      <mesh ref={flame} position={[0, 0.18, 0]}>
        <coneGeometry args={[0.13, 0.36, 6]} />
        <meshBasicMaterial color={C.ember} />
      </mesh>
      <pointLight ref={light} position={[0, 0.3, 0]} color="#ff8b3d" distance={3.4} />
      <Sparkles count={18} scale={[0.5, 1.2, 0.5]} position={[0, 0.6, 0]} size={3} speed={0.6} color="#ffb26b" />
      {/* tent */}
      <mesh position={[-0.75, 0.22, -0.15]} rotation={[0, 0.6, 0]} castShadow>
        <coneGeometry args={[0.4, 0.55, 4]} />
        <meshStandardMaterial color="#d9695a" flatShading />
      </mesh>
    </group>
  );
}

function Waterfall() {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const m = ref.current.material as THREE.MeshStandardMaterial;
      m.opacity = 0.6 + Math.sin(clock.elapsedTime * 3) * 0.06;
    }
  });
  return (
    <group position={[1.35, 0, 2.15]}>
      <mesh position={[0, 1.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 8]} />
        <meshStandardMaterial color={C.water} transparent opacity={0.85} />
      </mesh>
      <mesh ref={ref} position={[0.05, -0.3, 0.25]} rotation={[0.22, 0, 0.05]}>
        <planeGeometry args={[0.5, 2.9]} />
        <meshStandardMaterial ref={mat} color={C.water} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <Sparkles count={30} scale={[0.7, 2.6, 0.7]} position={[0.05, -0.4, 0.25]} size={2.5} speed={1.4} color="#cff6ff" />
    </group>
  );
}

function AnchorStone({ onPointerDown }: { onPointerDown: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.4;
      ref.current.position.y = -5.05 + Math.sin(clock.elapsedTime) * 0.08;
    }
  });
  return (
    <group onPointerDown={onPointerDown}>
      <mesh ref={ref} position={[0, -5.05, 0]}>
        <octahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial
          color={C.crystal}
          emissive={C.crystal}
          emissiveIntensity={1.3}
          flatShading
          transparent
          opacity={0.9}
        />
      </mesh>
      <pointLight position={[0, -5.05, 0]} color={C.crystal} intensity={3} distance={3.5} />
    </group>
  );
}

function Rocks() {
  const items = useMemo(() => {
    const r = rng(99);
    return Array.from({ length: 9 }, (_, i) => ({
      p: [(r() - 0.5) * 11, -1 + (r() - 0.5) * 4, (r() - 0.5) * 11] as [number, number, number],
      s: 0.2 + r() * 0.45,
      seed: i,
    }));
  }, []);
  return (
    <>
      {items.map((it, i) => (
        <Float key={i} speed={1 + (i % 3) * 0.3} rotationIntensity={0.6} floatIntensity={1.2}>
          <mesh position={it.p} scale={it.s}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={C.rockDark} flatShading roughness={1} />
          </mesh>
          <mesh position={[it.p[0], it.p[1] + it.s * 0.75, it.p[2]]} scale={[it.s * 0.9, it.s * 0.3, it.s * 0.9]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={C.grassDark} flatShading />
          </mesh>
        </Float>
      ))}
    </>
  );
}

function CameraRig({ target }: { target: [number, number, number] }) {
  const dest = useRef(new THREE.Vector3(...target));
  dest.current.set(target[0], target[1], target[2]);
  useFrame(({ camera, controls }) => {
    const c = controls as unknown as { target: THREE.Vector3; update: () => void } | null;
    if (!c || !c.target) return;
    const prev = c.target.clone();
    if (prev.distanceTo(dest.current) < 0.01) return;
    c.target.lerp(dest.current, 0.045);
    camera.position.add(c.target.clone().sub(prev));
    c.update();
  });
  return null;
}

/* --------------------------------- hotspots -------------------------------- */

function Marker({
  spot,
  active,
  onSelect,
}: {
  spot: Hotspot;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const ring = useRef<THREE.Mesh>(null);
  const dot = useRef<THREE.Mesh>(null);
  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime;
    if (ring.current) {
      ring.current.lookAt(camera.position);
      const s = 1 + ((t * 0.6) % 1) * 0.9;
      ring.current.scale.setScalar(s);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - ((t * 0.6) % 1));
    }
    if (dot.current) dot.current.scale.setScalar(hovered || active ? 1.4 : 1 + Math.sin(t * 2) * 0.08);
  });

  return (
    <group position={spot.position}>
      <mesh ref={ring} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.17, 0.22, 26]} />
        <meshBasicMaterial color="#ffe6a8" transparent depthWrite={false} />
      </mesh>
      <mesh
        ref={dot}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect(spot.id);
        }}
      >
        <sphereGeometry args={[0.14, 14, 14]} />
        <meshStandardMaterial color="#fff3cf" emissive="#ffcf6b" emissiveIntensity={hovered || active ? 3 : 1.4} />
      </mesh>
      {(hovered || active) && (
        <Html center distanceFactor={9} position={[0, 0.34, 0]} zIndexRange={[20, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-full border border-border/60 bg-card/90 px-3 py-1 text-[11px] font-medium tracking-wide text-card-foreground shadow-lg backdrop-blur">
            {spot.title}
          </div>
        </Html>
      )}
    </group>
  );
}

/* ---------------------------------- world ---------------------------------- */

function World({
  selected,
  onSelect,
  fireBoost,
  onFire,
}: {
  selected: string | null;
  onSelect: (id: string | null) => void;
  fireBoost: number;
  onFire: () => void;
}) {
  const drift = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (drift.current) {
      drift.current.position.y = Math.sin(clock.elapsedTime * 0.4) * 0.12;
      drift.current.rotation.z = Math.sin(clock.elapsedTime * 0.25) * 0.012;
    }
  });

  const trees = useMemo(() => {
    const r = rng(3);
    const list: { p: [number, number, number]; s: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.4;
      const rad = 1.5 + r() * 0.7;
      list.push({ p: [Math.cos(a) * rad, 1.08, Math.sin(a) * rad - 0.6], s: 0.75 + r() * 0.45 });
    }
    return list;
  }, []);

  /** solid things walkers must not clip through */
  const obstacles = useMemo<Obstacle[]>(
    () => [
      ...trees.map((t) => ({ x: t.p[0], z: t.p[2], r: 0.26 * t.s + 0.1 })),
      { x: 2.05, z: -0.4, r: 0.42 }, // windmill
      { x: -2.2, z: 1.1, r: 0.38 }, // lighthouse
      { x: 0.15, z: 1.55, r: 0.32 }, // campfire
      { x: -0.6, z: 1.4, r: 0.32 }, // tent
      { x: 1.35, z: 2.15, r: 0.34 }, // waterfall pool
    ],
    [trees]
  );


  const [apple, setApple] = useState<{ to: THREE.Vector3; id: number; eaten: boolean; landed: boolean } | null>(
    null
  );

  const dropApple = (world: THREE.Vector3) => {
    const local = drift.current ? drift.current.worldToLocal(world.clone()) : world.clone();
    const d = Math.hypot(local.x, local.z);
    if (d > 2.7) return;
    local.y = 1.14;
    setApple({ to: local, id: Date.now(), eaten: false, landed: false });
  };

  return (
    <group ref={drift}>
      <IslandBody />
      <Path />
      {/* invisible feeding plane on the grass */}
      <mesh
        position={[0, 1.13, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={(e) => {
          e.stopPropagation();
          dropApple(e.point);
        }}
      >
        <circleGeometry args={[2.8, 32]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {trees.map((t, i) => (
        <Tree key={i} position={t.p} scale={t.s} seed={i + 1} />
      ))}
      <Islander
        path={[
          [-1.5, 1.14, 1.65],
          [0.7, 1.16, 2.0],
          [1.7, 1.14, 0.85],
          [0.95, 1.14, -0.35],
          [-0.7, 1.14, 0.35],
        ]}
        cheer={fireBoost}
        obstacles={obstacles}
      />
      <Fox
        home={[-1.2, 1.14, 0.9]}
        target={apple && apple.landed && !apple.eaten ? apple.to : null}
        onEat={() => setApple((a) => (a ? { ...a, eaten: true } : a))}
        obstacles={obstacles}
      />
      {apple && !apple.eaten && (
        <Apple
          key={apple.id}
          from={new THREE.Vector3(apple.to.x, apple.to.y + 3.2, apple.to.z)}
          to={apple.to}
          eaten={apple.eaten}
          onLand={() => setApple((a) => (a && a.id === apple.id ? { ...a, landed: true } : a))}
        />
      )}

      <Windmill onPointerDown={() => onSelect("windmill")} />
      <Lighthouse onPointerDown={() => onSelect("lighthouse")} />
      <Campfire
        boost={fireBoost}
        onPointerDown={() => {
          onFire();
          onSelect("camp");
        }}
      />
      <Waterfall />
      <AnchorStone onPointerDown={() => onSelect("core")} />
      {HOTSPOTS.map((s) => (
        <Marker key={s.id} spot={s} active={selected === s.id} onSelect={onSelect} />
      ))}
      <Sparkles count={60} scale={[9, 6, 9]} position={[0, 1, 0]} size={2} speed={0.3} color="#ffe6a8" />
    </group>
  );
}

/* ----------------------------------- UI ------------------------------------ */

function Panel({ spot, onClose }: { spot: Hotspot | null; onClose: () => void }) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-4 transition-all duration-500 sm:right-6 sm:left-auto sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 sm:p-0 ${
        spot ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      {spot && (
        <article className="pointer-events-auto relative w-full max-w-[16rem] rounded-xl border border-border/60 bg-card/85 p-3.5 pr-9 shadow-xl backdrop-blur-xl">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-primary">{spot.kicker}</p>
          <h2 className="mt-0.5 font-display text-base leading-tight text-card-foreground">{spot.title}</h2>
          <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{spot.body}</p>
        </article>
      )}
    </div>
  );
}


const ISLES = [
  { id: "home", label: "Home Isle", target: [0, 0.5, 0] as [number, number, number] },
  {
    id: "lake",
    label: "Still Mere",
    target: [LAKE_ORIGIN[0], LAKE_ORIGIN[1] + 1, LAKE_ORIGIN[2]] as [number, number, number],
  },
  {
    id: "forest",
    label: "Pinewatch",
    target: [FOREST_ORIGIN[0], FOREST_ORIGIN[1] + 1, FOREST_ORIGIN[2]] as [number, number, number],
  },
];

export default function IslandScene() {
  const [selected, setSelected] = useState<string | null>(null);
  const [fireBoost, setFireBoost] = useState(0);
  const [isle, setIsle] = useState(0);
  const spot =
    [...HOTSPOTS, ...LAKE_HOTSPOTS, ...FOREST_HOTSPOTS].find((h) => h.id === selected) ?? null;


  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[var(--sky)]">
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-5 sm:p-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">A floating diorama</p>
          <h1 className="font-display text-3xl leading-tight text-foreground sm:text-5xl">Aetheris</h1>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            One small island, unmoored. Drag to orbit, scroll to lean in, tap the glowing points.
          </p>
        </header>
        <footer className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <span>{HOTSPOTS.length + LAKE_HOTSPOTS.length + FOREST_HOTSPOTS.length} points of interest</span>
        </footer>
      </div>

      <AmbientMusic />


      <div className="pointer-events-auto absolute left-1/2 top-4 z-20 flex -translate-x-1/2 gap-1 rounded-full border border-border/60 bg-card/80 p-1 shadow-lg backdrop-blur">
        {ISLES.map((i, idx) => (
          <button
            key={i.id}
            onClick={() => setIsle(idx)}
            className={`rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors ${
              isle === idx
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {i.label}
          </button>
        ))}
      </div>

      <Panel spot={spot} onClose={() => setSelected(null)} />


      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [8, 4.5, 8], fov: 40 }}
        onPointerMissed={() => setSelected(null)}
      >
        <color attach="background" args={["#f3d9c0"]} />
        <fog attach="fog" args={["#f3d9c0", 30, 80]} />
        <hemisphereLight args={["#ffe9c9", "#4a6b5a", 1.1]} />
        <directionalLight
          position={[6, 9, 4]}
          intensity={2.1}
          color="#fff0d4"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <Suspense fallback={null}>
          <World
            selected={selected}
            onSelect={setSelected}
            fireBoost={fireBoost}
            onFire={() => setFireBoost((b) => Math.min(b + 0.35, 2))}
          />
          <group position={LAKE_ORIGIN}>
            <LakeIsland onSelect={setSelected} />
            {LAKE_HOTSPOTS.filter((s) => s.id === "lake").map((s) => (
              <Marker key={s.id} spot={s} active={selected === s.id} onSelect={setSelected} />
            ))}
          </group>
          <group position={FOREST_ORIGIN}>
            <ForestIsland onSelect={setSelected} />
            {FOREST_HOTSPOTS.filter((s) => s.id === "pinewatch").map((s) => (
              <Marker key={s.id} spot={s} active={selected === s.id} onSelect={setSelected} />
            ))}
          </group>
          <Rocks />
          <BirdFlock count={6} radius={4.2} height={4.4} />

          <Stars radius={40} depth={20} count={800} factor={2} fade speed={0.4} />
          <Environment preset="sunset" />
        </Suspense>
        <CameraRig target={ISLES[isle]!.target} />
        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={6}
          maxDistance={22}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 1.9}
          enableDamping
          dampingFactor={0.06}
          autoRotate
          autoRotateSpeed={0.35}
          target={[0, 0.5, 0]}
        />
      </Canvas>
    </div>
  );
}
