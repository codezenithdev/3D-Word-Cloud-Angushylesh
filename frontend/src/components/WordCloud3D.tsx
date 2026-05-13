import { Suspense, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, OrbitControls, Stars, Text } from "@react-three/drei";
import type { Group } from "three";

export type WordDatum = { word: string; weight: number };

export type WordCloud3DProps = {
  words: WordDatum[];
  /** Cap for GPU-friendly scene (plan suggests ~40–60). */
  maxWords?: number;
};

function fibonacciSphere(
  count: number,
  radius: number,
): [number, number, number][] {
  if (count <= 0) return [];
  const pts: [number, number, number][] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const denom = Math.max(count - 1, 1);
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / denom) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    pts.push([
      radius * Math.cos(theta) * r,
      radius * y,
      radius * Math.sin(theta) * r,
    ]);
  }
  return pts;
}

function weightToColor(weight: number, hueOffset: number): string {
  const h = (200 + hueOffset * 18 + weight * 90) % 360;
  const s = 62 + weight * 28;
  const l = 42 + weight * 22;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function RotatingShell({ children }: { children: ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.11;
  });
  return <group ref={ref}>{children}</group>;
}

function CloudLabels({
  items,
}: {
  items: { word: string; weight: number; position: [number, number, number] }[];
}) {
  return (
    <>
      {items.map(({ word, weight, position }, i) => {
        const fontSize = 0.16 + weight * 0.42;
        const color = weightToColor(weight, i * 0.7);
        return (
          <Billboard
            key={`${word}-${i}`}
            position={position}
            follow
            lockX={false}
            lockY={false}
            lockZ={false}
          >
            <Text
              fontSize={fontSize}
              color={color}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.018}
              outlineColor="#05080c"
              maxWidth={3.2}
            >
              {word}
            </Text>
          </Billboard>
        );
      })}
    </>
  );
}

function Scene({ words }: { words: WordDatum[] }) {
  const items = useMemo(() => {
    const positions = fibonacciSphere(words.length, 5.2);
    return words.map((w, i) => ({
      ...w,
      position: positions[i] ?? [0, 0, 0],
    }));
  }, [words]);

  return (
    <>
      <color attach="background" args={["#080c12"]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[8, 10, 6]} intensity={1.05} />
      <directionalLight position={[-6, -4, -8]} intensity={0.35} />
      <Stars radius={80} depth={40} count={1200} factor={2.5} fade speed={0.4} />
      <RotatingShell>
        <Suspense fallback={null}>
          <CloudLabels items={items} />
        </Suspense>
      </RotatingShell>
      <OrbitControls
        enablePan
        enableZoom
        minDistance={6}
        maxDistance={22}
        autoRotate={false}
        makeDefault
        dampingFactor={0.08}
        enableDamping
      />
    </>
  );
}

export default function WordCloud3D({ words, maxWords = 52 }: WordCloud3DProps) {
  const trimmed = useMemo(
    () => words.slice(0, Math.min(maxWords, words.length)),
    [words, maxWords],
  );

  if (trimmed.length === 0) return null;

  return (
    <Canvas
      camera={{ position: [0, 0.4, 12.5], fov: 48, near: 0.1, far: 200 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <Scene words={trimmed} />
    </Canvas>
  );
}
