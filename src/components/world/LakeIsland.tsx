import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

/* --------------------------------- helpers -------------------------------- */

function rand(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647), (s - 1) / 2147483646);
}

const L = {
  grass: "#7fbfa0",
  grassDark: "#5da186",
  rock: "#6d7f7b",
  water: "#4fc3c7",
  reed: "#4f9a6a",
  lily: "#5fb87f",
  koi: "#f0714a",
};

/* --------------------------------- terrain -------------------------------- */

function LakeTerrain({ radius = 3.4 }: { radius?: number }) {
  const rockGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(radius * 0.95, 3.6, 8, 3);
    const pos = g.attributes["position"] as THREE.BufferAttribute;
    const r = rand(41);
    for (let i = 0; i < pos.count; i++) {
      pos.setX(i, pos.getX(i) + (r() - 0.5) * 0.5);
      pos.setZ(i, pos.getZ(i) + (r() - 0.5) * 0.5);
    }
    g.computeVertexNormals();
    return g;
  }, [radius]);

  return (
    <group>
      <mesh geometry={rockGeo} position={[0, -1.7, 0]} rotation={[Math.PI, 0.7, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={L.rock} flatShading roughness={1} />
      </mesh>
      {/* grassy rim (ring so the lake sits in the middle) */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 0.94, 0.5, 9]} />
        <meshStandardMaterial color={L.grass} flatShading roughness={0.95} />
      </mesh>
      {/* basin */}
      <mesh position={[0, 0.3, 0]} receiveShadow>
        <cylinderGeometry args={[radius * 0.72, radius * 0.55, 0.34, 12]} />
        <meshStandardMaterial color="#3c6f6b" flatShading roughness={1} />
      </mesh>
      {/* mossy mounds on the rim */}
      {([
        [radius * 0.82, -0.4],
        [-radius * 0.78, 0.6],
        [0.2, -radius * 0.85],
      ] as const).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.34, z]} scale={[0.7, 0.3, 0.7]} castShadow>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={L.grassDark} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------------------------- water --------------------------------- */

function Water({ radius, onDrop }: { radius: number; onDrop: (p: THREE.Vector3) => void }) {
  return (
    <mesh
      position={[0, 0.46, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={3}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
      onPointerDown={(e) => {
        e.stopPropagation();
        onDrop(e.point.clone());
      }}
    >
      <circleGeometry args={[radius, 40]} />
      <meshStandardMaterial
        color={L.water}
        transparent
        opacity={0.5}
        depthWrite={false}
        roughness={0.1}
        metalness={0.25}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}


function Ripple({ position }: { position: THREE.Vector3 }) {
  const ref = useRef<THREE.Mesh>(null);
  const t0 = useRef(0);
  useFrame(({ clock }) => {
    if (!t0.current) t0.current = clock.elapsedTime;
    const k = Math.min((clock.elapsedTime - t0.current) / 1.6, 1);
    if (ref.current) {
      ref.current.scale.setScalar(0.2 + k * 1.4);
      (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - k);
    }
  });
  return (
    <mesh ref={ref} position={[position.x, 0.455, position.z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
      <ringGeometry args={[0.22, 0.3, 24]} />
      <meshBasicMaterial color="#dffcff" transparent depthWrite={false} />
    </mesh>
  );
}

/* ----------------------------------- koi ---------------------------------- */

type Grain = { id: number; p: THREE.Vector3 };

function Koi({
  index,
  radius,
  foods,
  positions,
  onEat,
  color = "#f0714a",
}: {
  index: number;
  radius: number;
  foods: Grain[];
  positions: React.MutableRefObject<THREE.Vector3[]>;
  onEat: (id: number) => void;
  color?: string;
}) {
  const g = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const pos = useRef(
    new THREE.Vector3(Math.cos(index) * radius * 0.5, 0.4, Math.sin(index * 1.7) * radius * 0.5)
  );
  positions.current[index] = pos.current;
  const phase = index * 1.3;

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const node = g.current;
    if (!node) return;

    // claim the nearest grain this koi is closest to
    let claim: Grain | null = null;
    let claimD = Infinity;
    for (const f of foods) {
      let nearest = -1;
      let nd = Infinity;
      positions.current.forEach((p, i) => {
        if (!p) return;
        const d = p.distanceTo(f.p);
        if (d < nd) {
          nd = d;
          nearest = i;
        }
      });
      if (nearest === index && nd < claimD) {
        claimD = nd;
        claim = f;
      }
    }
    // if nothing claimed but food exists, still drift toward the closest grain
    if (!claim && foods.length) {
      let nd = Infinity;
      for (const f of foods) {
        const d = pos.current.distanceTo(f.p);
        if (d < nd) {
          nd = d;
          claim = f;
        }
      }
    }

    const orbitR = radius * (0.32 + (index % 3) * 0.16);
    const speed = 0.32 + (index % 4) * 0.05;
    const goal = claim
      ? new THREE.Vector3(claim.p.x, 0.4, claim.p.z)
      : new THREE.Vector3(Math.cos(t * speed + phase) * orbitR, 0.4, Math.sin(t * speed + phase) * orbitR);
    const dir = goal.clone().sub(pos.current);
    const d = dir.length();
    if (d > 0.02) {
      dir.normalize();
      pos.current.addScaledVector(dir, Math.min((claim ? 1.5 : 0.85) * dt, d));
      const want = Math.atan2(dir.x, dir.z);
      node.rotation.y += ((want - node.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 5);
    }
    if (claim && d < 0.11) onEat(claim.id);

    node.position.set(pos.current.x, 0.38 + Math.sin(t * 2 + phase) * 0.015, pos.current.z);
    node.rotation.z = Math.sin(t * 3 + phase) * 0.08;
    if (tail.current) tail.current.rotation.y = Math.sin(t * (claim ? 13 : 6) + phase) * 0.6;
  });

  return (
    <group ref={g} scale={1.5} renderOrder={1}>
      {/* body — laterally flattened, tapered toward the tail */}
      <mesh scale={[0.55, 0.9, 1.5]} castShadow>
        <sphereGeometry args={[0.11, 9, 7]} />
        <meshStandardMaterial color={color} flatShading roughness={0.5} />
      </mesh>
      {/* head */}
      <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]} scale={[0.55, 1, 0.9]}>
        <coneGeometry args={[0.105, 0.14, 7]} />
        <meshStandardMaterial color={color} flatShading roughness={0.5} />
      </mesh>
      {/* pale belly */}
      <mesh position={[0, -0.035, 0.01]} scale={[0.45, 0.4, 1.3]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshStandardMaterial color="#fdf3e6" flatShading />
      </mesh>
      {/* dappled patch on the back */}
      <mesh position={[0, 0.055, -0.02]} scale={[0.4, 0.3, 0.75]}>
        <sphereGeometry args={[0.09, 7, 6]} />
        <meshStandardMaterial color="#fdf3e6" flatShading />
      </mesh>
      {/* eyes */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.048, 0.018, 0.13]}>
          <sphereGeometry args={[0.019, 6, 5]} />
          <meshStandardMaterial color="#2b2118" />
        </mesh>
      ))}
      {/* dorsal fin */}
      <mesh position={[0, 0.09, -0.01]} rotation={[0.25, 0, 0]} scale={[0.25, 1, 1]}>
        <coneGeometry args={[0.07, 0.11, 4]} />
        <meshStandardMaterial color={color} flatShading side={THREE.DoubleSide} />
      </mesh>
      {/* pectoral fins */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.055, -0.01, 0.05]} rotation={[0.2, 0, s * -1.1]} scale={[1, 1, 0.25]}>
          <coneGeometry args={[0.05, 0.1, 4]} />
          <meshStandardMaterial color="#fdf3e6" flatShading side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* tail — narrow peduncle into a forked fan */}
      <group ref={tail} position={[0, 0, -0.14]}>
        <mesh scale={[0.3, 0.5, 0.6]}>
          <sphereGeometry args={[0.07, 6, 5]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
        {[0.4, -0.4].map((tilt) => (
          <mesh key={tilt} position={[0, tilt * 0.09, -0.1]} rotation={[Math.PI / 2 - tilt * 0.7, 0, 0]} scale={[0.22, 1, 1]}>
            <coneGeometry args={[0.075, 0.17, 4]} />
            <meshStandardMaterial color={color} flatShading side={THREE.DoubleSide} transparent opacity={0.95} />
          </mesh>
        ))}
      </group>
    </group>
  );
}



/* -------------------------------- dragonfly -------------------------------- */

function Dragonfly({ seed, radius }: { seed: number; radius: number }) {
  const g = useRef<THREE.Group>(null);
  const wings = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (g.current) {
      const a = t * (0.5 + (seed % 3) * 0.15) + seed;
      const r = radius * (0.4 + ((seed * 7) % 5) * 0.1);
      g.current.position.set(
        Math.cos(a) * r,
        0.85 + Math.sin(t * 2 + seed) * 0.18,
        Math.sin(a * 1.3) * r
      );
      g.current.rotation.y = -a;
    }
    if (wings.current) wings.current.rotation.x = Math.sin(t * 40 + seed) * 0.5;
  });
  return (
    <group ref={g} scale={0.4}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.03, 0.3, 2, 5]} />
        <meshStandardMaterial color="#3fb6c9" emissive="#2b8fa0" emissiveIntensity={0.5} flatShading />
      </mesh>
      <mesh position={[0, 0.01, 0.19]}>
        <sphereGeometry args={[0.055, 6, 5]} />
        <meshStandardMaterial color="#2f6f7d" flatShading />
      </mesh>
      <group ref={wings} position={[0, 0.05, 0.05]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.16, 0, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.32, 0.005, 0.1]} />
            <meshStandardMaterial color="#dff8ff" transparent opacity={0.55} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* --------------------------------- flora ---------------------------------- */

function Reeds({ radius }: { radius: number }) {
  const items = useMemo(() => {
    const r = rand(17);
    return Array.from({ length: 26 }, () => {
      const a = r() * Math.PI * 2;
      const rr = radius * (0.72 + r() * 0.2);
      return { x: Math.cos(a) * rr, z: Math.sin(a) * rr, h: 0.4 + r() * 0.5, s: r() * 10 };
    });
  }, [radius]);
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current)
      g.current.children.forEach((c, i) => {
        c.rotation.z = Math.sin(clock.elapsedTime * 1.4 + i) * 0.12;
      });
  });
  return (
    <group ref={g}>
      {items.map((it, i) => (
        <group key={i} position={[it.x, 0.34, it.z]}>
          <mesh position={[0, it.h / 2, 0]} castShadow>
            <cylinderGeometry args={[0.015, 0.025, it.h, 4]} />
            <meshStandardMaterial color={L.reed} flatShading />
          </mesh>
          <mesh position={[0, it.h + 0.05, 0]}>
            <capsuleGeometry args={[0.035, 0.1, 2, 5]} />
            <meshStandardMaterial color="#8d6a45" flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function LilyPads({ radius }: { radius: number }) {
  const pads = useMemo(() => {
    const r = rand(63);
    return Array.from({ length: 9 }, () => {
      const a = r() * Math.PI * 2;
      const rr = radius * (0.15 + r() * 0.55);
      return { x: Math.cos(a) * rr, z: Math.sin(a) * rr, s: 0.2 + r() * 0.18, f: r() > 0.6 };
    });
  }, [radius]);
  const g = useRef<THREE.Group>(null);

  return (
    <group ref={g}>
      {pads.map((p, i) => (
        <group key={i} position={[p.x, 0.52, p.z]}>
          <mesh rotation={[-Math.PI / 2, 0, i]}>
            <circleGeometry args={[p.s, 7, 0.35, Math.PI * 1.85]} />
            <meshStandardMaterial color={L.lily} flatShading side={THREE.DoubleSide} roughness={0.85} />
          </mesh>
          {p.f && (
            <mesh position={[0, 0.06, 0]}>
              <coneGeometry args={[0.07, 0.14, 5]} />
              <meshStandardMaterial color="#f7c6dd" flatShading />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/* --------------------------------- island --------------------------------- */

export default function LakeIsland({
  position = [0, 0, 0],
  onSelect,
}: {
  position?: [number, number, number];
  onSelect?: (id: string) => void;
}) {
  const radius = 3.4;
  const waterR = radius * 0.72;
  const drift = useRef<THREE.Group>(null);
  const [foods, setFoods] = useState<Grain[]>([]);
  const koiPositions = useRef<THREE.Vector3[]>([]);
  const nextId = useRef(1);

  useFrame(({ clock }) => {
    if (drift.current) {
      const t = clock.elapsedTime * 0.3 + 2;
      drift.current.position.y = position[1] + Math.sin(t) * 0.14;
      drift.current.rotation.z = Math.sin(t * 0.6) * 0.012;
    }
  });

  const removeGrain = (id: number) => setFoods((f) => f.filter((g) => g.id !== id));

  const dropFood = (p: THREE.Vector3) => {
    const local = drift.current ? drift.current.worldToLocal(p.clone()) : p;
    // scatter a few grains around the click point
    const grains: Grain[] = Array.from({ length: 3 }, (_, i) => {
      const a = Math.random() * Math.PI * 2;
      const r = i === 0 ? 0 : 0.12 + Math.random() * 0.22;
      return {
        id: nextId.current++,
        p: new THREE.Vector3(local.x + Math.cos(a) * r, 0.44, local.z + Math.sin(a) * r),
      };
    });
    setFoods((f) => [...f, ...grains].slice(-18));
    onSelect?.("lake");
    const ids = grains.map((g) => g.id);
    window.setTimeout(() => setFoods((f) => f.filter((g) => !ids.includes(g.id))), 12000);
  };

  return (
    <group ref={drift} position={position}>
      <LakeTerrain radius={radius} />
      <Water radius={waterR} onDrop={dropFood} />
      <Reeds radius={radius} />
      <LilyPads radius={waterR} />
      {Array.from({ length: 7 }, (_, i) => (
        <Koi
          key={i}
          index={i}
          radius={waterR}
          foods={foods}
          positions={koiPositions}
          onEat={removeGrain}
          color={i % 3 === 0 ? "#f5f1e8" : i % 3 === 1 ? "#f0714a" : "#e8a33d"}
        />
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <Dragonfly key={i} seed={i * 3 + 1} radius={waterR} />
      ))}
      {foods.map((g) => (
        <group key={g.id}>
          <Ripple position={g.p} />
          <mesh position={[g.p.x, 0.5, g.p.z]}>
            <dodecahedronGeometry args={[0.04, 0]} />
            <meshStandardMaterial color="#e8c37a" flatShading />
          </mesh>
        </group>
      ))}
      <Sparkles count={26} scale={[radius * 1.6, 1.4, radius * 1.6]} position={[0, 1, 0]} size={2} speed={0.4} color="#cffaff" />
      <pointLight position={[0, 1.2, 0]} color="#7fe3e8" intensity={1.6} distance={6} />
    </group>
  );

}
