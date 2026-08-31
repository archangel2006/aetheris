import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* --------------------------------- palette -------------------------------- */

const FOX = {
  fur: "#e07a3f",
  furDark: "#c05f2c",
  cream: "#f7ead6",
  paw: "#4b3327",
};

const SKIN = "#e8b48c";

export type Obstacle = { x: number; z: number; r: number };

/** push a point out of any overlapping obstacle */
function clearOf(p: THREE.Vector3, obs: Obstacle[]) {
  for (const o of obs) {
    const dx = p.x - o.x;
    const dz = p.z - o.z;
    const d = Math.hypot(dx, dz);
    if (d < o.r && d > 0.0001) {
      p.x = o.x + (dx / d) * o.r;
      p.z = o.z + (dz / d) * o.r;
    }
  }
  return p;
}

function isFree(x: number, z: number, obs: Obstacle[], pad = 0.15) {
  return obs.every((o) => Math.hypot(x - o.x, z - o.z) > o.r + pad);
}

/**
 * Steer a normalized heading around obstacles by sliding along them
 * (tangential) instead of pushing straight back — pure repulsion deadlocks.
 */
function steerAround(dir: THREE.Vector3, x: number, z: number, obs: Obstacle[], margin = 0.22) {
  const out = dir.clone();
  for (const o of obs) {
    const ax = x - o.x;
    const az = z - o.z;
    const d = Math.hypot(ax, az);
    const range = o.r + margin;
    if (d > range || d < 0.0001) continue;
    const nx = ax / d;
    const nz = az / d;
    // only avoid obstacles we're heading into
    const facing = -(dir.x * nx + dir.z * nz);
    const push = (range - d) / range;
    if (facing > 0) {
      // tangent: perpendicular to the obstacle normal, on the side we're already leaning
      const side = dir.x * -nz + dir.z * nx >= 0 ? 1 : -1;
      out.x += -nz * side * (0.9 + facing) * 1.4;
      out.z += nx * side * (0.9 + facing) * 1.4;
    }
    // gentle outward nudge so we never sink in
    out.x += nx * push * 0.6;
    out.z += nz * push * 0.6;
  }
  out.y = 0;
  if (out.lengthSq() < 0.0001) return dir.clone();
  return out.normalize();
}


/* ---------------------------------- fox ----------------------------------- */
/** A low-poly fox that roams the island and runs to any dropped apple. */
export function Fox({
  home = [0, 1.1, 0],
  target,
  onEat,
  obstacles = [],
  bounds = 2.4,
}: {
  home?: [number, number, number];
  target: THREE.Vector3 | null;
  onEat: () => void;
  obstacles?: Obstacle[];
  bounds?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const legs = useRef<THREE.Group>(null);
  const pos = useRef(new THREE.Vector3(home[0], home[1], home[2]));
  const wander = useRef(new THREE.Vector3(home[0], home[1], home[2]));
  const nextPick = useRef(0);
  const eatUntil = useRef(0);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const g = group.current;
    if (!g) return;

    // pick a new wander point every few seconds (avoiding trees & props)
    if (t > nextPick.current) {
      nextPick.current = t + 3 + Math.random() * 3;
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 0.6 + Math.random() * 1.6;
        const x = home[0] + Math.cos(a) * r;
        const z = home[2] + Math.sin(a) * r;
        if (Math.hypot(x, z) < bounds && isFree(x, z, obstacles)) {
          wander.current.set(x, home[1], z);
          break;
        }
      }
    }

    const eating = t < eatUntil.current;
    const goal = target ? new THREE.Vector3(target.x, home[1], target.z) : wander.current;
    const flat = new THREE.Vector3(pos.current.x, home[1], pos.current.z);
    const dir = goal.clone().sub(flat);
    const dist = dir.length();
    const speed = target ? 1.9 : 0.55;

    if (!eating && dist > 0.12) {
      dir.normalize();
      const move = steerAround(dir, pos.current.x, pos.current.z, obstacles);
      const before = pos.current.clone();
      pos.current.addScaledVector(move, Math.min(speed * dt, Math.max(dist, 0.2)));
      clearOf(pos.current, obstacles);
      // stuck? pick a fresh wander point right away
      if (!target && before.distanceTo(pos.current) < speed * dt * 0.25) nextPick.current = 0;
      dir.copy(move);

      const rad = Math.hypot(pos.current.x, pos.current.z);
      if (rad > bounds) {
        pos.current.x *= bounds / rad;
        pos.current.z *= bounds / rad;
      }
      const want = Math.atan2(dir.x, dir.z);
      g.rotation.y += ((want - g.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 6);
      const gait = target ? 16 : 7;
      if (legs.current) legs.current.rotation.x = Math.sin(t * gait) * 0.55;
      g.position.y = home[1] + Math.abs(Math.sin(t * gait * 0.5)) * (target ? 0.06 : 0.02);
    } else {
      if (legs.current) legs.current.rotation.x *= 0.9;
      g.position.y = home[1] + Math.sin(t * 2) * 0.01;
      if (target && !eating) {
        eatUntil.current = t + 1.4;
        onEat();
      }
    }

    g.position.x = pos.current.x;
    g.position.z = pos.current.z;
    if (tail.current) tail.current.rotation.y = Math.sin(t * (target ? 10 : 3)) * 0.5;
    if (head.current)
      head.current.rotation.x = eating ? 0.5 + Math.sin(t * 14) * 0.18 : Math.sin(t * 1.6) * 0.08;
  });


  return (
    <group ref={group} position={home} scale={0.42}>
      {/* body */}
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.26, 0.5, 3, 6]} />
        <meshStandardMaterial color={FOX.fur} flatShading roughness={0.9} />
      </mesh>
      {/* chest fluff */}
      <mesh position={[0, 0.4, 0.3]} castShadow>
        <sphereGeometry args={[0.2, 7, 6]} />
        <meshStandardMaterial color={FOX.cream} flatShading />
      </mesh>
      {/* head */}
      <group ref={head} position={[0, 0.68, 0.42]}>
        <mesh castShadow>
          <boxGeometry args={[0.36, 0.32, 0.34]} />
          <meshStandardMaterial color={FOX.fur} flatShading />
        </mesh>
        {/* snout */}
        <mesh position={[0, -0.05, 0.24]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.13, 0.28, 4]} />
          <meshStandardMaterial color={FOX.cream} flatShading />
        </mesh>
        <mesh position={[0, -0.05, 0.4]}>
          <sphereGeometry args={[0.045, 6, 6]} />
          <meshStandardMaterial color="#2b2118" flatShading />
        </mesh>
        {/* eyes */}
        {[-0.11, 0.11].map((x) => (
          <mesh key={x} position={[x, 0.06, 0.18]}>
            <sphereGeometry args={[0.035, 6, 6]} />
            <meshStandardMaterial color="#2b2118" />
          </mesh>
        ))}
        {/* ears */}
        {[-0.13, 0.13].map((x) => (
          <mesh key={x} position={[x, 0.22, -0.02]} rotation={[0, 0, x > 0 ? -0.15 : 0.15]} castShadow>
            <coneGeometry args={[0.1, 0.24, 4]} />
            <meshStandardMaterial color={FOX.furDark} flatShading />
          </mesh>
        ))}
      </group>
      {/* legs */}
      <group ref={legs} position={[0, 0.34, 0]}>
        {([
          [-0.16, 0.24],
          [0.16, 0.24],
          [-0.16, -0.24],
          [0.16, -0.24],
        ] as const).map(([x, z], i) => (
          <mesh key={i} position={[x, -0.16, z]} castShadow>
            <boxGeometry args={[0.11, 0.34, 0.11]} />
            <meshStandardMaterial color={i < 2 ? FOX.paw : FOX.furDark} flatShading />
          </mesh>
        ))}
      </group>
      {/* tail */}
      <group ref={tail} position={[0, 0.55, -0.36]}>
        <mesh rotation={[-0.7, 0, 0]} position={[0, 0.06, -0.16]} castShadow>
          <coneGeometry args={[0.16, 0.6, 6]} />
          <meshStandardMaterial color={FOX.fur} flatShading />
        </mesh>
        <mesh position={[0, 0.28, -0.36]}>
          <sphereGeometry args={[0.11, 7, 6]} />
          <meshStandardMaterial color={FOX.cream} flatShading />
        </mesh>
      </group>
    </group>
  );
}

/* --------------------------------- human ---------------------------------- */
/** Islander who strolls between spots, pausing at each, and waves when the fox is fed. */
export function Islander({
  path,
  cheer = 0,
  obstacles = [],
}: {
  path: [number, number, number][];
  cheer?: number;
  obstacles?: Obstacle[];
}) {
  const group = useRef<THREE.Group>(null);
  const arms = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const legsRef = useRef<THREE.Group>(null);
  const stops = useMemo(() => path.map((p) => new THREE.Vector3(...p)), [path]);
  const pos = useRef(stops[0]!.clone());
  const idx = useRef(0);
  const resumeAt = useRef(2);
  const giveUpAt = useRef(0);

  const yaw = useRef(0);
  const cheerRef = useRef(0);
  cheerRef.current = cheer;

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const g = group.current;
    if (!g) return;
    const waving = t < cheerRef.current + 2.2;

    const goal = stops[idx.current]!;
    const dir = new THREE.Vector3(goal.x - pos.current.x, 0, goal.z - pos.current.z);
    const dist = dir.length();
    const resting = t < resumeAt.current;
    let walking = false;

    if (!resting) {
      if (dist < 0.12) {
        // arrived — stand still a while, then head to the next spot
        resumeAt.current = t + 2.5 + Math.random() * 5;
        idx.current = (idx.current + 1) % stops.length;
        giveUpAt.current = 0;
      } else {
        if (!giveUpAt.current) giveUpAt.current = t + 14;
        walking = true;
        dir.normalize();
        const move = steerAround(dir, pos.current.x, pos.current.z, obstacles, 0.28);
        pos.current.addScaledVector(move, Math.min(0.42 * dt, dist));
        clearOf(pos.current, obstacles);
        const want = Math.atan2(move.x, move.z);
        yaw.current += ((want - yaw.current + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 4);
        // couldn't reach it in time — move on instead of grinding against a tree
        if (t > giveUpAt.current) {
          idx.current = (idx.current + 1) % stops.length;
          giveUpAt.current = 0;
        }
      }
    }


    g.position.set(pos.current.x, goal.y + (walking ? Math.abs(Math.sin(t * 4)) * 0.015 : 0), pos.current.z);
    g.rotation.y = yaw.current;
    const swing = walking ? Math.sin(t * 4) * 0.45 : 0;
    if (legsRef.current) legsRef.current.rotation.x += (swing - legsRef.current.rotation.x) * 0.2;
    if (arms.current) arms.current.rotation.x += (-swing * 0.85 - arms.current.rotation.x) * 0.2;
    if (rightArm.current)
      rightArm.current.rotation.z = waving ? -2.2 + Math.sin(t * 12) * 0.4 : 0;
  });


  return (
    <group ref={group} scale={0.5}>
      {/* legs */}
      <group ref={legsRef} position={[0, 0.62, 0]}>
        {[-0.11, 0.11].map((x) => (
          <mesh key={x} position={[x, -0.3, 0]} castShadow>
            <boxGeometry args={[0.16, 0.62, 0.17]} />
            <meshStandardMaterial color="#43607d" flatShading />
          </mesh>
        ))}
      </group>
      {/* torso */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.4, 3, 7]} />
        <meshStandardMaterial color="#d9694f" flatShading />
      </mesh>
      {/* arms */}
      <group ref={arms} position={[0, 1.16, 0]}>
        <mesh position={[-0.3, -0.24, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.4, 3, 6]} />
          <meshStandardMaterial color="#c85c44" flatShading />
        </mesh>
        <group ref={rightArm} position={[0.3, 0, 0]}>
          <mesh position={[0, -0.24, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.4, 3, 6]} />
            <meshStandardMaterial color="#c85c44" flatShading />
          </mesh>
        </group>
      </group>
      {/* head */}
      <mesh position={[0, 1.42, 0]} castShadow>
        <sphereGeometry args={[0.22, 8, 7]} />
        <meshStandardMaterial color={SKIN} flatShading />
      </mesh>
      {[-0.08, 0.08].map((x) => (
        <mesh key={x} position={[x, 1.45, 0.2]}>
          <sphereGeometry args={[0.028, 6, 6]} />
          <meshStandardMaterial color="#2b2118" />
        </mesh>
      ))}
      {/* straw hat */}
      <mesh position={[0, 1.58, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.44, 0.05, 10]} />
        <meshStandardMaterial color="#e2c073" flatShading />
      </mesh>
      <mesh position={[0, 1.66, 0]} castShadow>
        <coneGeometry args={[0.24, 0.24, 10]} />
        <meshStandardMaterial color="#d8b264" flatShading />
      </mesh>
    </group>
  );
}

/* --------------------------------- apple ---------------------------------- */

export function Apple({
  from,
  to,
  eaten,
  onLand,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  eaten: boolean;
  onLand?: () => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const y = useRef(from.y);
  const v = useRef(0);
  const [landed, setLanded] = useState(false);

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    if (!landed) {
      v.current += 9.8 * dt;
      y.current -= v.current * dt;
      if (y.current <= to.y) {
        y.current = to.y;
        setLanded(true);
        onLand?.();
      }
      g.rotation.x += dt * 4;
    }
    g.position.set(to.x, y.current, to.z);
    if (eaten) g.scale.multiplyScalar(0.88);
  });


  return (
    <group ref={ref} position={[to.x, from.y, to.z]}>
      <mesh castShadow>
        <sphereGeometry args={[0.12, 8, 7]} />
        <meshStandardMaterial color="#d94f45" flatShading roughness={0.6} />
      </mesh>
      <mesh position={[0.02, 0.13, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.012, 0.012, 0.1, 4]} />
        <meshStandardMaterial color="#6b4a2f" />
      </mesh>
      <mesh position={[0.09, 0.15, 0]} rotation={[0, 0, -0.6]}>
        <sphereGeometry args={[0.05, 5, 4]} />
        <meshStandardMaterial color="#5aa65c" flatShading />
      </mesh>
    </group>
  );
}

/* --------------------------------- birds ---------------------------------- */
/** Flock of flapping low-poly birds circling the island. */
export function BirdFlock({
  count = 5,
  radius = 6,
  height = 3.6,
  color = "#3f4b5b",
}: {
  count?: number;
  radius?: number;
  height?: number;
  color?: string;
}) {
  const birds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        phase: (i / count) * Math.PI * 2,
        r: radius + (i % 3) * 0.7,
        h: height + Math.sin(i * 2.3) * 0.6,
        speed: 0.22 + (i % 4) * 0.02,
        scale: 0.13 + (i % 3) * 0.03,
      })),
    [count, radius, height]
  );
  return (
    <>
      {birds.map((b, i) => (
        <Bird key={i} {...b} color={color} />
      ))}
    </>
  );
}

function Bird({
  phase,
  r,
  h,
  speed,
  scale,
  color,
}: {
  phase: number;
  r: number;
  h: number;
  speed: number;
  scale: number;
  color: string;
}) {
  const g = useRef<THREE.Group>(null);
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const a = phase + t * speed;
    const g0 = g.current;
    if (!g0) return;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    g0.position.set(x, h + Math.sin(t * 0.8 + phase) * 0.3, z);
    g0.rotation.y = -a + Math.PI / 2;
    g0.rotation.z = 0.25;
    const flap = Math.sin(t * 6 + phase) * 0.7;
    if (left.current) left.current.rotation.z = 0.25 + flap;
    if (right.current) right.current.rotation.z = -0.25 - flap;
  });

  return (
    <group ref={g} scale={scale}>
      {/* body */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.055, 0.16, 2, 5]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.04, 0.14]}>
        <sphereGeometry args={[0.055, 6, 5]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh position={[0, 0.03, 0.21]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.022, 0.07, 4]} />
        <meshStandardMaterial color="#e6a44b" flatShading />
      </mesh>
      {/* tail */}
      <mesh position={[0, 0.01, -0.17]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.07, 0.14, 3]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      {/* wings — pivoted at the body so they flap properly */}
      <group ref={left} position={[-0.04, 0.03, 0]}>
        <mesh position={[-0.17, 0, 0]}>
          <boxGeometry args={[0.34, 0.014, 0.13]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
      </group>
      <group ref={right} position={[0.04, 0.03, 0]}>
        <mesh position={[0.17, 0, 0]}>
          <boxGeometry args={[0.34, 0.014, 0.13]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
      </group>
    </group>
  );
}
