import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const WOOL = "#f6efe2";
const SKIN = "#e5b48a";

/* --------------------------------- sheep ---------------------------------- */

export function Sheep({
  position,
  rotation = 0,
  speed = 1,
  radius = 0.5,
}: {
  position: [number, number, number];
  rotation?: number;
  speed?: number;
  radius?: number;
}) {
  const g = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const phase = useMemo(() => Math.random() * 10, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed * 0.35 + phase;
    if (g.current) {
      g.current.position.x = position[0] + Math.cos(t) * radius;
      g.current.position.z = position[2] + Math.sin(t) * radius;
      g.current.rotation.y = -t + Math.PI / 2;
      g.current.position.y = position[1] + Math.abs(Math.sin(t * 6)) * 0.015;
    }
    if (head.current) head.current.rotation.x = 0.25 + Math.sin(t * 2.2) * 0.35;
  });
  return (
    <group ref={g} position={position} rotation={[0, rotation, 0]} scale={0.42}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <dodecahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial color={WOOL} flatShading roughness={1} />
      </mesh>
      <group ref={head} position={[0, 0.5, 0.3]}>
        <mesh position={[0, -0.1, 0.12]} castShadow>
          <boxGeometry args={[0.17, 0.2, 0.22]} />
          <meshStandardMaterial color="#4a4038" flatShading />
        </mesh>
      </group>
      {[
        [-0.14, -0.14],
        [0.14, -0.14],
        [-0.14, 0.16],
        [0.14, 0.16],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x as number, 0.12, z as number]}>
          <cylinderGeometry args={[0.035, 0.035, 0.26, 5]} />
          <meshStandardMaterial color="#4a4038" flatShading />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------------------------- deer ----------------------------------- */

export function Deer({ position }: { position: [number, number, number] }) {
  const g = useRef<THREE.Group>(null);
  const phase = useMemo(() => Math.random() * 6, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;
    if (g.current) {
      g.current.position.y = position[1] + Math.abs(Math.sin(t * 2.4)) * 0.06;
      g.current.rotation.y = Math.sin(t * 0.4) * 0.7;
    }
  });
  return (
    <group ref={g} position={position} scale={0.5}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.28, 0.3, 0.6]} />
        <meshStandardMaterial color="#c58b5c" flatShading />
      </mesh>
      <mesh position={[0, 0.85, 0.26]} castShadow>
        <boxGeometry args={[0.2, 0.24, 0.24]} />
        <meshStandardMaterial color="#d59c6c" flatShading />
      </mesh>
      {[-0.09, 0.09].map((x, i) => (
        <mesh key={i} position={[x, 1.05, 0.26]} rotation={[0.2, 0, x > 0 ? -0.4 : 0.4]}>
          <coneGeometry args={[0.03, 0.28, 4]} />
          <meshStandardMaterial color="#8a6244" flatShading />
        </mesh>
      ))}
      {[
        [-0.1, -0.2],
        [0.1, -0.2],
        [-0.1, 0.2],
        [0.1, 0.2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x as number, 0.2, z as number]}>
          <cylinderGeometry args={[0.035, 0.035, 0.42, 5]} />
          <meshStandardMaterial color="#8a6244" flatShading />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------------------- villagers -------------------------------- */

export function Villager({
  curve,
  offset = 0,
  speed = 0.06,
  shirt = "#4f7fb5",
  carry,
}: {
  curve: THREE.CatmullRomCurve3;
  offset?: number;
  speed?: number;
  shirt?: string;
  carry?: "hoe" | "basket";
}) {
  const g = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * speed + offset) % 1;
    const p = curve.getPointAt(t);
    const ahead = curve.getPointAt((t + 0.01) % 1);
    if (g.current) {
      g.current.position.copy(p);
      g.current.position.y += Math.abs(Math.sin(clock.elapsedTime * 6)) * 0.02;
      g.current.lookAt(tmp.copy(ahead).setY(p.y));
    }
    const swing = Math.sin(clock.elapsedTime * 6) * 0.5;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
  });
  return (
    <group ref={g} scale={0.34}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <capsuleGeometry args={[0.16, 0.34, 3, 8]} />
        <meshStandardMaterial color={shirt} flatShading />
      </mesh>
      <mesh position={[0, 1.16, 0]} castShadow>
        <sphereGeometry args={[0.17, 10, 10]} />
        <meshStandardMaterial color={SKIN} flatShading />
      </mesh>
      <mesh position={[0, 1.3, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.32, 0.18, 8]} />
        <meshStandardMaterial color="#e0b672" flatShading />
      </mesh>
      <mesh ref={legL} position={[-0.09, 0.42, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.46, 6]} />
        <meshStandardMaterial color="#6b5a48" flatShading />
      </mesh>
      <mesh ref={legR} position={[0.09, 0.42, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.46, 6]} />
        <meshStandardMaterial color="#6b5a48" flatShading />
      </mesh>
      {carry === "hoe" && (
        <mesh position={[0.22, 0.85, 0.05]} rotation={[0, 0, -0.3]}>
          <cylinderGeometry args={[0.025, 0.025, 0.9, 5]} />
          <meshStandardMaterial color="#a5763f" flatShading />
        </mesh>
      )}
      {carry === "basket" && (
        <mesh position={[0.26, 0.72, 0]}>
          <cylinderGeometry args={[0.16, 0.12, 0.2, 7]} />
          <meshStandardMaterial color="#c99656" flatShading />
        </mesh>
      )}
    </group>
  );
}

/* ---------------------------------- crops ---------------------------------- */

export function Farm({ position }: { position: [number, number, number] }) {
  const rows = useMemo(() => {
    const list: [number, number][] = [];
    for (let x = -2; x <= 2; x++) for (let z = -1; z <= 1; z++) list.push([x * 0.19, z * 0.24]);
    return list;
  }, []);
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.rotation.z = Math.sin(clock.elapsedTime * 2) * 0.03;
  });
  return (
    <group position={position}>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.3, 1.0]} />
        <meshStandardMaterial color="#8a6a45" roughness={1} />
      </mesh>
      <group ref={g}>
        {rows.map(([x, z], i) => (
          <mesh key={i} position={[x, 0.12, z]} castShadow>
            <coneGeometry args={[0.055, 0.24, 4]} />
            <meshStandardMaterial color={i % 3 ? "#9ac24f" : "#d8bb4a"} flatShading />
          </mesh>
        ))}
      </group>
    </group>
  );
}
