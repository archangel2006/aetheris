import { useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

function chunkGeometry(seed: number, r = 1.6) {
  const g = new THREE.ConeGeometry(r, r * 1.7, 7, 3);
  const pos = g.attributes["position"] as THREE.BufferAttribute;
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647), (s - 1) / 2147483646);
  for (let i = 0; i < pos.count; i++) {
    pos.setX(i, pos.getX(i) + (rand() - 0.5) * 0.35);
    pos.setZ(i, pos.getZ(i) + (rand() - 0.5) * 0.35);
  }
  g.computeVertexNormals();
  return g;
}

export function MiniIsland({
  position,
  radius = 1.5,
  seed = 5,
  grass = "#7fc26b",
  rock = "#7d6250",
  bob = 1,
  children,
}: {
  position: [number, number, number];
  radius?: number;
  seed?: number;
  grass?: string;
  rock?: string;
  bob?: number;
  children?: ReactNode;
}) {
  const g = useRef<THREE.Group>(null);
  const geo = useMemo(() => chunkGeometry(seed, radius), [seed, radius]);
  useFrame(({ clock }) => {
    if (g.current) {
      const t = clock.elapsedTime * 0.35 * bob + seed;
      g.current.position.y = position[1] + Math.sin(t) * 0.18;
      g.current.rotation.z = Math.sin(t * 0.7) * 0.02;
    }
  });
  return (
    <group ref={g} position={position}>
      <mesh geometry={geo} position={[0, -1.2, 0]} rotation={[Math.PI, 0.4, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={rock} flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 1.02, radius, 0.36, 7]} />
        <meshStandardMaterial color={grass} flatShading roughness={0.95} />
      </mesh>
      {children}
    </group>
  );
}

/* ---------------------------- themed satellites ---------------------------- */

export function MushroomHollow() {
  const caps: [number, number, number, number, string][] = [
    [0.3, 0.24, 0.1, 1, "#e0645f"],
    [-0.6, 0.24, 0.5, 0.7, "#e3a14a"],
    [0.75, 0.24, -0.55, 0.85, "#d3568e"],
    [-0.35, 0.24, -0.6, 0.55, "#e0645f"],
  ];
  return (
    <>
      {caps.map(([x, y, z, s, c], i) => (
        <group key={i} position={[x, y, z]} scale={s}>
          <mesh position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.13, 0.45, 7]} />
            <meshStandardMaterial color="#f3ead6" flatShading />
          </mesh>
          <mesh position={[0, 0.5, 0]} castShadow>
            <sphereGeometry args={[0.32, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
        </group>
      ))}
      <Sparkles count={22} scale={[2.4, 1.4, 2.4]} position={[0, 0.9, 0]} size={2.5} speed={0.5} color="#ffc8e5" />
      <pointLight position={[0, 1, 0]} color="#ff9ecb" intensity={2} distance={4} />
    </>
  );
}

export function CrystalQuarry() {
  const shards = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return {
          p: [Math.cos(a) * (0.35 + (i % 3) * 0.28), 0.35, Math.sin(a) * (0.35 + (i % 3) * 0.28)] as [
            number,
            number,
            number,
          ],
          s: 0.4 + (i % 4) * 0.22,
          r: a,
        };
      }),
    []
  );
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current)
      g.current.children.forEach((c, i) => {
        c.scale.setScalar(shards[i]!.s * (1 + Math.sin(clock.elapsedTime * 2 + i) * 0.05));
      });
  });
  return (
    <>
      <group ref={g}>
        {shards.map((s, i) => (
          <mesh key={i} position={s.p} rotation={[0.15, s.r, 0.12]} scale={s.s} castShadow>
            <coneGeometry args={[0.22, 1.1, 5]} />
            <meshStandardMaterial
              color="#8fe4ff"
              emissive="#4fc9ef"
              emissiveIntensity={0.8}
              transparent
              opacity={0.85}
              flatShading
            />
          </mesh>
        ))}
      </group>
      <pointLight position={[0, 0.9, 0]} color="#8fe4ff" intensity={3} distance={5} />
      <Sparkles count={20} scale={[2.2, 1.6, 2.2]} position={[0, 0.9, 0]} size={3} speed={0.4} color="#bff0ff" />
    </>
  );
}

export function SunkenRuins() {
  const cols: [number, number][] = [
    [-0.6, -0.4],
    [0.5, -0.55],
    [0.65, 0.5],
    [-0.5, 0.55],
  ];
  return (
    <>
      {cols.map(([x, z], i) => (
        <group key={i} position={[x, 0.2, z]}>
          <mesh position={[0, 0.35 + (i % 2) * 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.14, 0.7 + (i % 2) * 0.4, 8]} />
            <meshStandardMaterial color="#d7cbb8" flatShading />
          </mesh>
          <mesh position={[0, 0.03, 0]} castShadow>
            <boxGeometry args={[0.34, 0.1, 0.34]} />
            <meshStandardMaterial color="#c4b8a4" flatShading />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.32, 0]} rotation={[0, 0.4, 0]} castShadow>
        <torusGeometry args={[0.34, 0.06, 6, 16]} />
        <meshStandardMaterial color="#e8d9a8" emissive="#c9a54a" emissiveIntensity={0.5} flatShading />
      </mesh>
      <Sparkles count={14} scale={[2, 1.2, 2]} position={[0, 0.8, 0]} size={2} speed={0.3} color="#ffe6a8" />
    </>
  );
}

/* ------------------------------ hot air balloon ---------------------------- */

export function Balloon({ path = 9, height = 3.4 }: { path?: number; height?: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.08;
    if (g.current) {
      g.current.position.set(Math.cos(t) * path, height + Math.sin(t * 2.4) * 0.4, Math.sin(t) * path);
      g.current.rotation.y = -t;
    }
  });
  return (
    <group ref={g} scale={0.8}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshStandardMaterial color="#e0645f" flatShading />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <coneGeometry args={[0.3, 0.4, 12]} />
        <meshStandardMaterial color="#e3a14a" flatShading />
      </mesh>
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[0.26, 0.2, 0.26]} />
        <meshStandardMaterial color="#a5763f" flatShading />
      </mesh>
    </group>
  );
}

/* --------------------------------- whale ----------------------------------- */

export function SkyWhale() {
  const g = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.05 + 2;
    if (g.current) {
      g.current.position.set(Math.cos(t) * 13, -3 + Math.sin(t * 1.6) * 1.2, Math.sin(t) * 13);
      g.current.rotation.y = -t + Math.PI / 2;
      g.current.rotation.z = Math.sin(t * 1.6) * 0.15;
    }
    if (tail.current) tail.current.rotation.y = Math.sin(clock.elapsedTime * 1.4) * 0.5;
  });
  return (
    <group ref={g}>
      <mesh castShadow>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color="#6f86b8" flatShading />
      </mesh>
      <mesh position={[0, -0.25, 0.35]} scale={[0.85, 0.5, 0.8]}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color="#a8bcd8" flatShading />
      </mesh>
      <mesh ref={tail} position={[0, 0.1, -1.2]}>
        <coneGeometry args={[0.5, 0.9, 4]} />
        <meshStandardMaterial color="#6f86b8" flatShading />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.85, -0.1, 0.1]} rotation={[0, 0, s * 0.6]}>
          <coneGeometry args={[0.22, 0.7, 4]} />
          <meshStandardMaterial color="#8ea3c9" flatShading />
        </mesh>
      ))}
      <Sparkles count={12} scale={[3, 1.5, 3]} size={2} speed={0.3} color="#cfe2ff" />
    </group>
  );
}
