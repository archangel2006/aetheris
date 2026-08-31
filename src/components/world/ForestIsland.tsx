import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

/* --------------------------------- helpers -------------------------------- */

function rand(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647), (s - 1) / 2147483646);
}

const F = {
  ground: "#4a6759",
  groundDark: "#3b5449",
  rock: "#5b6570",
  rockMoss: "#5f8a63",
  trunk: "#4a3b34",
  needle: "#2f5b52",
  needleAlt: "#3b7060",
  water: "#5f8f92",
  amber: "#ffb257",
  bear: "#5b463c",
  bearDark: "#42332c",
  deer: "#a9805c",
  deerPale: "#e6d3ba",
};

const R = 4.2; // island radius
const SAFE = R - 1.0; // deer/bear roam limit

function clampToIsle(v: THREE.Vector3) {
  const d = Math.hypot(v.x, v.z);
  if (d > SAFE) {
    v.x = (v.x / d) * SAFE;
    v.z = (v.z / d) * SAFE;
  }
  return v;
}

/* --------------------------------- terrain -------------------------------- */

function ForestTerrain() {
  const rockGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(R * 0.95, 4.2, 9, 4);
    const pos = g.attributes["position"] as THREE.BufferAttribute;
    const r = rand(131);
    for (let i = 0; i < pos.count; i++) {
      pos.setX(i, pos.getX(i) + (r() - 0.5) * 0.6);
      pos.setZ(i, pos.getZ(i) + (r() - 0.5) * 0.6);
      pos.setY(i, pos.getY(i) + (r() - 0.5) * 0.3);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const topGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(R, R * 0.93, 0.7, 10, 1);
    const pos = g.attributes["position"] as THREE.BufferAttribute;
    const r = rand(57);
    for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getY(i) + (r() - 0.5) * 0.2);
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group>
      <mesh geometry={rockGeo} position={[0, -2.0, 0]} rotation={[Math.PI, 0.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#3f4a52" flatShading roughness={1} />
      </mesh>
      <mesh geometry={topGeo} position={[0, 0.15, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={F.ground} flatShading roughness={1} />
      </mesh>
      {/* worn earth patch where the den sits */}
      <mesh position={[-1.5, 0.505, -1.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.1, 12]} />
        <meshStandardMaterial color="#4a4034" roughness={1} />
      </mesh>

      {/* mossy hummocks */}
      {([
        [1.5, -1.2, 0.9],
        [0.4, 1.9, 0.8],
        [-2.0, 0.9, 0.7],
      ] as const).map(([x, z, s], i) => (
        <mesh key={i} position={[x, 0.45, z]} scale={[s, s * 0.35, s]} castShadow receiveShadow>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={F.groundDark} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/* --------------------------------- stream --------------------------------- */

function Stream() {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.6, 0.5, 1.1),
        new THREE.Vector3(-1.1, 0.5, 0.7),
        new THREE.Vector3(0.2, 0.5, 1.1),
        new THREE.Vector3(1.3, 0.5, 0.6),
        new THREE.Vector3(2.5, 0.5, 0.9),
      ]),
    []
  );
  const pts = useMemo(() => curve.getPoints(40), [curve]);

  useFrame(({ clock }) => {
    if (mat.current) mat.current.opacity = 0.75 + Math.sin(clock.elapsedTime * 2) * 0.06;
  });

  return (
    <group>
      {pts.map((p, i) => (
        <mesh key={i} position={[p.x, 0.51, p.z]} rotation={[-Math.PI / 2, 0, i * 0.4]} receiveShadow>
          <circleGeometry args={[0.3, 6]} />
          {i === 0 ? (
            <meshStandardMaterial ref={mat} color={F.water} transparent opacity={0.8} roughness={0.15} metalness={0.3} />
          ) : (
            <meshStandardMaterial color={F.water} transparent opacity={0.8} roughness={0.15} metalness={0.3} />
          )}
        </mesh>
      ))}
      {/* wet stones along the bank */}
      {pts
        .filter((_, i) => i % 7 === 3)
        .map((p, i) => (
          <mesh key={`s${i}`} position={[p.x + (i % 2 ? 0.34 : -0.34), 0.55, p.z + 0.12]} scale={0.14} castShadow>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={F.rock} flatShading roughness={1} />
          </mesh>
        ))}
      <Sparkles count={16} scale={[4.6, 0.4, 1.2]} position={[0, 0.7, 0.9]} size={2} speed={0.5} color="#bfe6e0" />
    </group>
  );
}

/* ---------------------------------- pines ---------------------------------- */

function Pine({ position, scale = 1, seed = 1 }: { position: [number, number, number]; scale?: number; seed?: number }) {
  const ref = useRef<THREE.Group>(null);
  const tilt = useMemo(() => (rand(seed * 17 + 3)() - 0.5) * 0.14, [seed]);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = tilt + Math.sin(clock.elapsedTime * 0.8 + seed) * 0.02;
  });
  const tiers = 4 + (seed % 2);
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.11, 0.9, 6]} />
        <meshStandardMaterial color={F.trunk} flatShading roughness={1} />
      </mesh>
      {Array.from({ length: tiers }, (_, i) => (
        <mesh key={i} position={[0, 0.95 + i * 0.38, 0]} rotation={[0, i * 0.7, 0]} castShadow>
          <coneGeometry args={[0.62 - i * 0.12, 0.62, 6]} />
          <meshStandardMaterial color={i % 2 ? F.needleAlt : F.needle} flatShading roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function MossStone({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow receiveShadow>
        <dodecahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial color={F.rock} flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 0.16, 0]} scale={[0.95, 0.35, 0.95]}>
        <dodecahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color={F.rockMoss} flatShading roughness={1} />
      </mesh>
    </group>
  );
}

function FallenLog() {
  return (
    <group position={[1.55, 0.62, -1.25]} rotation={[0, -0.5, 0.06]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.19, 0.22, 2.1, 8]} />
        <meshStandardMaterial color={F.trunk} flatShading roughness={1} />
      </mesh>
      <mesh position={[1.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.19, 0.19, 0.05, 8]} />
        <meshStandardMaterial color="#6b5546" flatShading />
      </mesh>
      {/* moss along the top */}
      {[-0.6, -0.1, 0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.15, 0.02]} scale={[0.3, 0.09, 0.22]}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={F.rockMoss} flatShading />
        </mesh>
      ))}
      {/* small mushrooms */}
      {[-0.35, 0.75].map((x, i) => (
        <group key={i} position={[x, 0.18, 0.12]} scale={0.5}>
          <mesh>
            <cylinderGeometry args={[0.03, 0.04, 0.14, 5]} />
            <meshStandardMaterial color="#e8dcc4" flatShading />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <coneGeometry args={[0.1, 0.1, 6]} />
            <meshStandardMaterial color="#c56b5a" flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* --------------------------------- lantern -------------------------------- */

function Lantern({ onPointerDown }: { onPointerDown: () => void }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (light.current) light.current.intensity = 5 + Math.sin(t * 5) * 0.6 + Math.sin(t * 11.3) * 0.3;
  });
  return (
    <group position={[0.55, 0.5, 1.85]} onPointerDown={onPointerDown}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, 1.2, 6]} />
        <meshStandardMaterial color="#33403f" flatShading />
      </mesh>
      <mesh position={[0.16, 1.18, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 5]} />
        <meshStandardMaterial color="#33403f" flatShading />
      </mesh>
      <group position={[0.34, 1.0, 0]}>
        <mesh>
          <boxGeometry args={[0.18, 0.24, 0.18]} />
          <meshStandardMaterial color="#ffd9a0" emissive={F.amber} emissiveIntensity={2.4} transparent opacity={0.92} />
        </mesh>
        <mesh position={[0, 0.17, 0]}>
          <coneGeometry args={[0.15, 0.12, 4]} />
          <meshStandardMaterial color="#33403f" flatShading />
        </mesh>
        <pointLight ref={light} color="#ffb257" distance={5.5} />
      </group>
      <Sparkles count={26} scale={[2.2, 1.4, 2.2]} position={[0.2, 1.0, 0]} size={2.6} speed={0.35} color="#ffca82" />
    </group>
  );
}

function Fireflies() {
  return (
    <>
      <Sparkles count={40} scale={[5.4, 1.6, 5.4]} position={[0, 1.1, 0]} size={2.2} speed={0.28} color="#ffd48a" />
      <Sparkles count={26} scale={[5.8, 0.6, 5.8]} position={[0, 0.7, 0]} size={1.6} speed={0.18} color="#9fc9d8" />
    </>
  );
}

function LowFog() {
  const ref = useRef<THREE.Group>(null);
  const puffs = useMemo(() => {
    const r = rand(303);
    return Array.from({ length: 9 }, () => ({
      x: (r() - 0.5) * 5.6,
      z: (r() - 0.5) * 5.6,
      s: 0.8 + r() * 0.9,
      ph: r() * Math.PI * 2,
    }));
  }, []);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.02;
  });
  return (
    <group ref={ref}>
      {puffs.map((p, i) => (
        <mesh key={i} position={[p.x, 0.62 + Math.sin(p.ph) * 0.05, p.z]} rotation={[-Math.PI / 2, 0, p.ph]} renderOrder={4}>
          <circleGeometry args={[p.s, 10]} />
          <meshBasicMaterial color="#c9d6e4" transparent opacity={0.12} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------------------------- bear ---------------------------------- */

type BearState = "sleep" | "inside" | "wake" | "walk" | "drink" | "return";

const DEN_POS = new THREE.Vector3(-1.5, 0.62, -1.4);
const DEN_MOUTH = new THREE.Vector3(-1.5, 0.62, -0.75);

function Bear({
  onPointerDown,
  command,
  onInsideChange,
}: {
  onPointerDown: () => void;
  command: { type: "in" | "out"; n: number };
  onInsideChange: (inside: boolean) => void;
}) {
  const g = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const den = useMemo(() => DEN_POS.clone(), []);
  const water = useMemo(() => new THREE.Vector3(-1.05, 0.62, 0.45), []);
  const pos = useRef(DEN_MOUTH.clone());
  const yaw = useRef(0.6);
  const state = useRef<BearState>("sleep");
  const until = useRef(6);
  const breath = useRef(0);
  const lastCmd = useRef(command.n);
  const goingInside = useRef(false);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const node = g.current;
    if (!node) return;
    breath.current = Math.sin(t * 1.6) * 0.02;

    const goTo = (dst: THREE.Vector3, speed: number) => {
      const dir = dst.clone().sub(pos.current);
      dir.y = 0;
      const d = dir.length();
      if (d < 0.08) return true;
      dir.normalize();
      pos.current.addScaledVector(dir, Math.min(speed * dt, d));
      const want = Math.atan2(dir.x, dir.z);
      yaw.current += (((want - yaw.current + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 3);
      return false;
    };

    // player commands: click the bear -> back to bed, click the cave -> come out
    if (command.n !== lastCmd.current) {
      lastCmd.current = command.n;
      if (command.type === "in" && state.current !== "inside") {
        goingInside.current = true;
        state.current = "return";
      } else if (command.type === "out" && state.current === "inside") {
        pos.current.copy(den);
        onInsideChange(false);
        state.current = "wake";
        until.current = t + 1.4;
      }
    }

    switch (state.current) {
      case "inside":
        if (t > until.current) {
          pos.current.copy(den);
          onInsideChange(false);
          state.current = "wake";
          until.current = t + 2.2;
        }
        break;
      case "sleep":
        if (t > until.current) {
          state.current = "wake";
          until.current = t + 2.2;
        }
        break;
      case "wake":
        if (t > until.current) state.current = "walk";
        break;
      case "walk":
        if (goTo(water, 0.32)) {
          state.current = "drink";
          until.current = t + 6;
        }
        break;
      case "drink":
        if (t > until.current) state.current = "return";
        break;
      case "return":
        if (goTo(goingInside.current ? DEN_POS : den, 0.3)) {
          if (goingInside.current) {
            goingInside.current = false;
            state.current = "inside";
            onInsideChange(true);
            until.current = t + 26 + Math.random() * 14;
          } else {
            state.current = "inside";
            onInsideChange(true);
            until.current = t + 26 + Math.random() * 14;
          }
        }
        break;
    }

    const inside = state.current === "inside";
    node.visible = !inside;
    if (inside) return;

    const walking = state.current === "walk" || state.current === "return";
    node.position.set(pos.current.x, pos.current.y + (walking ? Math.abs(Math.sin(t * 5)) * 0.03 : breath.current), pos.current.z);
    node.rotation.y = yaw.current;
    node.rotation.z = state.current === "sleep" ? 0.35 : 0;
    node.scale.setScalar(state.current === "sleep" ? 0.92 : 1);
    if (head.current) {
      const drinkTilt = state.current === "drink" ? 0.75 : state.current === "sleep" ? 0.4 : 0.1;
      head.current.rotation.x += (drinkTilt - head.current.rotation.x) * Math.min(1, dt * 3);
    }
  });

  const leg = (x: number, z: number, i: number) => (
    <mesh key={i} position={[x, -0.19, z]} castShadow>
      <cylinderGeometry args={[0.09, 0.08, 0.28, 6]} />
      <meshStandardMaterial color={F.bearDark} flatShading roughness={1} />
    </mesh>
  );

  return (
    <group ref={g} onPointerDown={(e) => (e.stopPropagation(), onPointerDown())}>
      <group position={[0, 0.34, 0]}>
        {/* body */}
        <mesh scale={[0.42, 0.38, 0.62]} castShadow>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={F.bear} flatShading roughness={1} />
        </mesh>
        {/* shoulder hump */}
        <mesh position={[0, 0.2, 0.18]} scale={[0.3, 0.2, 0.3]} castShadow>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={F.bear} flatShading roughness={1} />
        </mesh>
        <group ref={head} position={[0, 0.16, 0.55]}>
          <mesh castShadow>
            <icosahedronGeometry args={[0.24, 1]} />
            <meshStandardMaterial color={F.bear} flatShading roughness={1} />
          </mesh>
          <mesh position={[0, -0.05, 0.2]} scale={[0.7, 0.6, 0.8]}>
            <icosahedronGeometry args={[0.15, 0]} />
            <meshStandardMaterial color="#7a6153" flatShading />
          </mesh>
          <mesh position={[0, -0.03, 0.31]}>
            <sphereGeometry args={[0.045, 6, 5]} />
            <meshStandardMaterial color="#241c17" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.15, 0.2, -0.02]} castShadow>
              <sphereGeometry args={[0.08, 6, 5]} />
              <meshStandardMaterial color={F.bearDark} flatShading />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={`e${s}`} position={[s * 0.09, 0.04, 0.19]}>
              <sphereGeometry args={[0.024, 6, 5]} />
              <meshStandardMaterial color="#1d1712" />
            </mesh>
          ))}
        </group>
        {[
          [0.2, 0.32],
          [-0.2, 0.32],
          [0.2, -0.3],
          [-0.2, -0.3],
        ].map(([x, z], i) => leg(x!, z!, i))}
        <mesh position={[0, 0.02, -0.42]}>
          <sphereGeometry args={[0.08, 6, 5]} />
          <meshStandardMaterial color={F.bearDark} flatShading />
        </mesh>
      </group>
    </group>
  );
}

function Den({ onPointerDown }: { onPointerDown: () => void }) {
  return (
    <group position={[-1.5, 0.5, -1.4]} onPointerDown={(e) => (e.stopPropagation(), onPointerDown())}>
      {/* hollow rock mound */}
      <mesh position={[0, 0.28, -0.25]} scale={[1.45, 1.15, 1.3]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={F.rock} flatShading roughness={1} />
      </mesh>
      <mesh position={[-0.5, 0.72, -0.5]} scale={[0.62, 0.5, 0.6]} rotation={[0.2, 0.6, 0.1]} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={F.rockMoss} flatShading roughness={1} />
      </mesh>
      {/* circular black entrance hole + tunnel depth */}
      <mesh position={[0, 0.34, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.5, 1.1, 16, 1, true]} />
        <meshStandardMaterial color="#0c1113" side={THREE.DoubleSide} roughness={1} />
      </mesh>
      <mesh position={[0, 0.34, -0.2]}>
        <circleGeometry args={[0.45, 16]} />
        <meshBasicMaterial color="#070b0c" />
      </mesh>
      <mesh position={[0, 0.34, 0.9]} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.45, 0.62, 16]} />
        <meshStandardMaterial color={F.rock} flatShading roughness={1} side={THREE.DoubleSide} />
      </mesh>
      {/* rim stones */}
      {[-1, 1].map((s) => (
        <mesh key={`lip${s}`} position={[s * 0.72, 0.14, 0.82]} scale={[0.24, 0.26, 0.22]} rotation={[0, 0, s * 0.3]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={F.rockMoss} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
}


/* --------------------------- sleeping "zzz" puff --------------------------- */

const ZBARS: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, 0.08, 0.17, 0],
  [0, -0.08, 0.17, 0],
  [0, 0, 0.23, 0.72],
];

function Zzz() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock, camera }) => {
    const node = g.current;
    if (!node) return;
    const t = clock.elapsedTime;
    node.children.forEach((c, i) => {
      const k = (t * 0.4 + i * 0.33) % 1;
      c.position.set(Math.sin(k * 5 + i) * 0.13 + i * 0.06, k * 0.75, 0);
      c.scale.setScalar(0.55 + k * 0.9);
      c.quaternion.copy(camera.quaternion);
      const o = Math.sin(k * Math.PI) * 0.95;
      c.traverse((m) => {
        const mat = (m as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
        if (mat && "opacity" in mat) mat.opacity = o;
      });
    });
  });

  return (
    <group ref={g} position={[-1.5, 1.45, -0.95]}>
      {[0, 1, 2].map((i) => (
        <group key={i}>
          {ZBARS.map(([x, y, w, r], j) => (
            <mesh key={j} position={[x, y, 0]} rotation={[0, 0, r]}>
              <planeGeometry args={[w, 0.04]} />
              <meshBasicMaterial color="#ffe9c2" transparent opacity={0.9} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ---------------------------------- deer ---------------------------------- */

function DeerBody({ fawn = false }: { fawn?: boolean }) {
  const s = fawn ? 0.62 : 1;
  return (
    <group scale={s}>
      <mesh position={[0, 0.44, 0]} scale={[0.19, 0.2, 0.42]} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={F.deer} flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 0.4, -0.1]} scale={[0.16, 0.13, 0.3]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={F.deerPale} flatShading />
      </mesh>
      {/* neck + head (pivots at the shoulders) */}
      <group name="deerHead" position={[0, 0.55, 0.22]}>
      <mesh position={[0, 0.07, 0.08]} rotation={[0.6, 0, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.34, 6]} />
        <meshStandardMaterial color={F.deer} flatShading roughness={1} />
      </mesh>
      <group position={[0, 0.23, 0.18]} rotation={[0.25, 0, 0]}>

        {/* skull */}
        <mesh scale={[0.11, 0.11, 0.15]} castShadow>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={F.deer} flatShading roughness={1} />
        </mesh>
        {/* muzzle, tapering forward */}
        <mesh position={[0, -0.035, 0.15]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.8]} castShadow>
          <cylinderGeometry args={[0.038, 0.075, 0.19, 6]} />
          <meshStandardMaterial color="#b98d67" flatShading roughness={1} />
        </mesh>
        {/* nose pad */}
        <mesh position={[0, -0.04, 0.245]}>
          <icosahedronGeometry args={[0.035, 0]} />
          <meshStandardMaterial color="#2a1f18" flatShading />
        </mesh>
        {/* ears — flat leaf shapes swept back */}
        {[-1, 1].map((k) => (
          <mesh
            key={k}
            position={[k * 0.1, 0.07, -0.02]}
            rotation={[-0.25, k * 0.5, k * 0.75]}
            scale={[0.55, 1, 1]}
            castShadow
          >
            <coneGeometry args={[0.055, 0.16, 5]} />
            <meshStandardMaterial color={F.deerPale} flatShading />
          </mesh>
        ))}
        {[-1, 1].map((k) => (
          <mesh key={`ey${k}`} position={[k * 0.085, 0.015, 0.055]}>
            <sphereGeometry args={[0.022, 6, 5]} />
            <meshStandardMaterial color="#1d1712" />
          </mesh>
        ))}
        {!fawn &&
          [-1, 1].map((k) => (
            <group key={`a${k}`} position={[k * 0.06, 0.09, -0.01]} rotation={[-0.45, 0, k * 0.45]}>
              {/* main beam */}
              <mesh position={[0, 0.13, 0]} rotation={[0, 0, k * 0.12]} castShadow>
                <cylinderGeometry args={[0.016, 0.026, 0.26, 5]} />
                <meshStandardMaterial color="#cbb493" flatShading roughness={1} />
              </mesh>
              {/* upper beam, swept back */}
              <mesh position={[k * 0.045, 0.29, -0.05]} rotation={[-0.5, 0, k * 0.3]} castShadow>
                <cylinderGeometry args={[0.011, 0.016, 0.2, 5]} />
                <meshStandardMaterial color="#cbb493" flatShading roughness={1} />
              </mesh>
              {/* brow tine */}
              <mesh position={[k * 0.055, 0.14, 0.06]} rotation={[0.9, 0, k * 0.7]} castShadow>
                <cylinderGeometry args={[0.009, 0.014, 0.15, 5]} />
                <meshStandardMaterial color="#cbb493" flatShading roughness={1} />
              </mesh>
              {/* fork tip */}
              <mesh position={[k * 0.1, 0.36, -0.09]} rotation={[-0.7, 0, k * 0.8]} castShadow>
                <cylinderGeometry args={[0.007, 0.011, 0.12, 5]} />
                <meshStandardMaterial color="#cbb493" flatShading roughness={1} />
              </mesh>
            </group>
          ))}
      </group>
      </group>

      {/* legs */}
      {[
        [0.1, 0.24],
        [-0.1, 0.24],
        [0.1, -0.24],
        [-0.1, -0.24],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x!, 0.19, z!]} castShadow>
          <cylinderGeometry args={[0.028, 0.024, 0.4, 5]} />
          <meshStandardMaterial color="#7b5b41" flatShading />
        </mesh>
      ))}
      <mesh position={[0, 0.5, -0.4]} scale={[0.7, 1, 0.7]}>
        <sphereGeometry args={[0.06, 6, 5]} />
        <meshStandardMaterial color={F.deerPale} flatShading />
      </mesh>
    </group>
  );
}

type DeerProps = {
  home: [number, number, number];
  fawn?: boolean;
  seed: number;
  hopSignal: number;
  hopDelay?: number;
  onClick?: () => void;
  leader?: React.RefObject<THREE.Vector3>;
  report?: React.RefObject<THREE.Vector3>;
};

function Deer({ home, fawn = false, seed, hopSignal, hopDelay = 0, onClick, leader, report }: DeerProps) {
  const g = useRef<THREE.Group>(null);
  const headNode = useRef<THREE.Object3D | null>(null);
  const pos = useRef(new THREE.Vector3(...home));
  const yaw = useRef(seed);
  const mode = useRef<"graze" | "alert" | "walk" | "hop">("graze");
  const until = useRef(2 + seed);
  const dest = useRef(new THREE.Vector3(...home));
  const hopStart = useRef(-99);
  const lastSignal = useRef(0);
  const r = useMemo(() => rand(seed * 91 + 7), [seed]);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const node = g.current;
    if (!node) return;

    if (hopSignal !== lastSignal.current) {
      lastSignal.current = hopSignal;
      mode.current = "hop";
      hopStart.current = t + hopDelay;
      until.current = t + hopDelay + 1.7;
    }

    if (mode.current === "hop") {
      if (t > until.current) {
        mode.current = "graze";
        until.current = t + 3 + r() * 4;
      }
    } else if (t > until.current) {
      if (mode.current === "graze") {
        mode.current = r() > 0.55 ? "alert" : "walk";
        until.current = t + (mode.current === "alert" ? 1.6 + r() : 2.5 + r() * 2);
        if (mode.current === "walk") {
          if (leader?.current && fawn) {
            const a = r() * Math.PI * 2;
            clampToIsle(dest.current.set(leader.current.x + Math.cos(a) * 0.5, home[1], leader.current.z + Math.sin(a) * 0.5));
          } else {
            const a = r() * Math.PI * 2;
            const rad = 0.4 + r() * 1.0;
            clampToIsle(dest.current.set(home[0] + Math.cos(a) * rad, home[1], home[2] + Math.sin(a) * rad));
          }
        }
      } else {
        mode.current = "graze";
        until.current = t + 3 + r() * 5;
      }
    }

    // fawn stays near its adult
    if (fawn && leader?.current && pos.current.distanceTo(leader.current) > 1.4 && mode.current !== "hop") {
      clampToIsle(dest.current.set(leader.current.x + 0.45, home[1], leader.current.z + 0.35));
      mode.current = "walk";
      until.current = Math.max(until.current, t + 1.5);
    }

    let bounce = 0;
    if (mode.current === "walk" || (mode.current === "hop" && t > hopStart.current)) {
      const hopping = mode.current === "hop";
      const dir = dest.current.clone().sub(pos.current);
      dir.y = 0;
      const d = dir.length();
      if (hopping) {
        const k = t - hopStart.current;
        bounce = Math.max(0, Math.sin(k * (fawn ? 9 : 7)) * (fawn ? 0.16 : 0.2));
        const fwd = new THREE.Vector3(Math.sin(yaw.current), 0, Math.cos(yaw.current));
        const next = pos.current.clone().addScaledVector(fwd, 0.9 * dt);
        if (Math.hypot(next.x, next.z) < SAFE) pos.current.copy(next);
        else {
          // turn back toward the middle of the isle instead of leaping off
          const inward = Math.atan2(-pos.current.x, -pos.current.z);
          yaw.current += (((inward - yaw.current + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 4);
        }
      } else if (d > 0.06) {
        dir.normalize();
        pos.current.addScaledVector(dir, Math.min((fawn ? 0.34 : 0.26) * dt, d));
        clampToIsle(pos.current);
        const want = Math.atan2(dir.x, dir.z);
        yaw.current += (((want - yaw.current + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 3);
        bounce = Math.abs(Math.sin(t * (fawn ? 8 : 6))) * 0.015;
      }
    }

    node.position.set(pos.current.x, pos.current.y + bounce, pos.current.z);
    node.rotation.y = yaw.current;
    node.rotation.x = 0;
    // only the head/neck moves: graze = nose to the grass, alert = head high
    const target = mode.current === "graze" ? 0.75 : mode.current === "alert" ? -0.2 : 0.05;
    if (!headNode.current) headNode.current = node.getObjectByName("deerHead") ?? null;
    const h = headNode.current;
    if (h) h.rotation.x += (target - h.rotation.x) * Math.min(1, dt * 2.5);

    if (report) report.current?.copy(pos.current);
  });

  return (
    <group ref={g} position={home} onPointerDown={(e) => (e.stopPropagation(), onClick?.())}>
      <group>
        <DeerBody fawn={fawn} />
      </group>
    </group>
  );
}

/* --------------------------------- island --------------------------------- */

export default function ForestIsland({ onSelect }: { onSelect: (id: string) => void }) {
  const [hop, setHop] = useState(0);
  const [bearCmd, setBearCmd] = useState<{ type: "in" | "out"; n: number }>({ type: "out", n: 0 });
  const [bearInside, setBearInside] = useState(false);
  const momPos = useRef(new THREE.Vector3(1.1, 0.5, 1.3));

  const pines = useMemo(() => {
    const r = rand(23);
    const list: { p: [number, number, number]; s: number }[] = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + r() * 0.35;
      const rad = 2.7 + r() * 0.9;
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad;
      // keep the stream corridor clear
      if (Math.abs(z - 0.85) < 0.6) continue;
      // keep the den + clearing open so the bear stays visible
      if (Math.hypot(x + 1.5, z + 1.4) < 1.9) continue;
      list.push({ p: [x, 0.45, z], s: 0.7 + r() * 0.75 });
    }
    return list;
  }, []);

  const stones = useMemo(() => {
    const r = rand(77);
    return Array.from({ length: 5 }, () => ({
      p: [(r() - 0.5) * 5.6, 0.55, (r() - 0.5) * 5.6] as [number, number, number],
      s: 0.5 + r() * 0.8,
    }));
  }, []);

  return (
    <group>
      <ForestTerrain />
      <Stream />
      {pines.map((p, i) => (
        <Pine key={i} position={p.p} scale={p.s} seed={i + 1} />
      ))}
      {stones.map((s, i) => (
        <MossStone key={i} position={s.p} scale={s.s} />
      ))}
      <FallenLog />
      <Den onPointerDown={() => setBearCmd((c) => ({ type: "out", n: c.n + 1 }))} />
      <Lantern onPointerDown={() => onSelect("lantern")} />
      <Fireflies />
      <LowFog />
      <Bear
        command={bearCmd}
        onInsideChange={setBearInside}
        onPointerDown={() => (setBearCmd((c) => ({ type: "in", n: c.n + 1 })), onSelect("bear"))}
      />
      {bearInside && <Zzz />}

      <Deer
        home={[1.1, 0.5, 1.3]}
        seed={2}
        hopSignal={hop}
        onClick={() => (setHop((h) => h + 1), onSelect("deer"))}
        report={momPos}
      />
      <Deer
        home={[-0.9, 0.5, 1.9]}
        seed={5}
        hopSignal={hop}
        hopDelay={0.25}
        onClick={() => (setHop((h) => h + 1), onSelect("deer"))}
      />
      <Deer
        home={[1.55, 0.5, 1.75]}
        fawn
        seed={9}
        hopSignal={hop}
        hopDelay={0.45}
        leader={momPos}
        onClick={() => (setHop((h) => h + 1), onSelect("deer"))}
      />

      {/* cool dusk fill + the one warm accent already lives in the lantern */}
      <hemisphereLight args={["#8f9fc4", "#2c3a35", 0.8]} />
      <pointLight position={[-2.4, 2.6, -2]} color="#8ea8d8" intensity={2.2} distance={9} />
    </group>
  );
}
