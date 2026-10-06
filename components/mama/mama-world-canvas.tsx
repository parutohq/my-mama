'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type WorldPlace = 'sanctuary' | 'journey' | 'care' | 'journal';
type Props = { place: WorldPlace; onSelect: (place: WorldPlace) => void; reducedMotion: boolean };

const stops: Record<WorldPlace, { camera: [number, number, number]; look: [number, number, number] }> = {
  sanctuary: { camera: [0, 6.7, 12.5], look: [0, .6, 0] },
  journey: { camera: [-4.4, 3.2, 5.7], look: [-4.1, 1.35, -1.3] },
  care: { camera: [4.5, 3.2, 5.7], look: [4.1, 1.35, -1.3] },
  journal: { camera: [0, 2.9, 5.9], look: [0, 1.25, 2.1] },
};

export function MamaWorldCanvas({ place, onSelect, reducedMotion }: Props) {
  return <Canvas camera={{ position: stops.sanctuary.camera, fov: 48, near: .1, far: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: 'low-power' }} fallback={<span aria-hidden="true" />}>
    <color attach="background" args={['#281a2b']} />
    <fog attach="fog" args={['#412b3b', 13, 32]} />
    <ambientLight intensity={1.15} color="#ffe4d0" />
    <hemisphereLight args={['#fbd5ba', '#3b2633', 2]} />
    <directionalLight position={[-5, 9, 5]} intensity={2.7} color="#ffcba3" />
    <pointLight position={[0, 4, -1]} intensity={35} distance={15} decay={2} color="#ffb78a" />
    <CameraJourney place={place} reducedMotion={reducedMotion} />
    <Sanctuary onSelect={onSelect} place={place} reducedMotion={reducedMotion} />
    <OrbitControls makeDefault enablePan={false} enableZoom={false} enableDamping dampingFactor={.08} minPolarAngle={.75} maxPolarAngle={1.5} minAzimuthAngle={-.35} maxAzimuthAngle={.35} />
  </Canvas>;
}

function CameraJourney({ place, reducedMotion }: { place: WorldPlace; reducedMotion: boolean }) {
  const { camera, controls } = useThree();
  const target = useRef(new THREE.Vector3(...stops.sanctuary.look));
  const moving = useRef(false);
  useEffect(() => { moving.current = true; }, [place]);
  useFrame((_, delta) => {
    if (!moving.current) return;
    const stop = stops[place];
    const t = reducedMotion ? 1 : 1 - Math.exp(-delta * 2.5);
    camera.position.lerp(new THREE.Vector3(...stop.camera), t);
    target.current.lerp(new THREE.Vector3(...stop.look), t);
    if (controls && 'target' in controls) {
      const orbit = controls as THREE.EventDispatcher & { target: THREE.Vector3; update: () => void };
      orbit.target.copy(target.current);
      orbit.update();
    } else camera.lookAt(target.current);
    if (camera.position.distanceTo(new THREE.Vector3(...stop.camera)) < .025 && target.current.distanceTo(new THREE.Vector3(...stop.look)) < .025) moving.current = false;
  });
  return null;
}

function Sanctuary({ place, onSelect, reducedMotion }: Props) {
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.34, 0]}><circleGeometry args={[12, 64]} /><meshStandardMaterial color="#705365" roughness={.9} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.27, 0]}><circleGeometry args={[8.2, 64]} /><meshStandardMaterial color="#d7ad98" roughness={.95} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.24, 0]}><ringGeometry args={[7.65, 7.8, 64]} /><meshStandardMaterial color="#f3d7bb" /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.22, 0]}><circleGeometry args={[2.1, 64]} /><meshStandardMaterial color="#b88079" roughness={.75} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.205, 0]}><ringGeometry args={[1.93, 2.02, 64]} /><meshStandardMaterial color="#f9d6b3" emissive="#c88165" emissiveIntensity={.28} /></mesh>
    <Pavilion position={[-4.15, 0, -1.55]} tint="#c98585" glow="#f6ad9c" onClick={() => onSelect('journey')} selected={place === 'journey'} reducedMotion={reducedMotion} />
    <Pavilion position={[4.15, 0, -1.55]} tint="#c09a79" glow="#ffca91" onClick={() => onSelect('care')} selected={place === 'care'} reducedMotion={reducedMotion} />
    <Pavilion position={[0, 0, 2.9]} tint="#ad829a" glow="#e8afcb" onClick={() => onSelect('journal')} selected={place === 'journal'} reducedMotion={reducedMotion} />
    <mesh position={[0, .08, -.5]}><cylinderGeometry args={[.18, .28, .58, 16]} /><meshStandardMaterial color="#a47972" /></mesh>
    <mesh position={[0, .55, -.5]}><sphereGeometry args={[.48, 24, 16]} /><meshStandardMaterial color="#ffe1bd" emissive="#ed9f7d" emissiveIntensity={.75} /></mesh>
    {Array.from({ length: 16 }, (_, i) => {
      const angle = i * Math.PI * 2 / 16;
      return <Plant key={i} position={[Math.cos(angle) * 7.05, 0, Math.sin(angle) * 7.05]} scale={i % 4 === 0 ? 1.35 : .9} />;
    })}
  </group>;
}

function Pavilion({ position, tint, glow, onClick, selected, reducedMotion }: { position: [number, number, number]; tint: string; glow: string; onClick: () => void; selected: boolean; reducedMotion: boolean }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame((state) => { if (light.current) light.current.intensity = selected ? 19 : reducedMotion ? 10 : 10 + Math.sin(state.clock.elapsedTime * 1.8) * 1.2; });
  return <group position={position} onClick={(event) => { event.stopPropagation(); onClick(); }} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = ''; }}>
    <mesh position={[0, -.08, 0]}><cylinderGeometry args={[1.7, 1.85, .38, 32]} /><meshStandardMaterial color="#9a6f68" roughness={.85} /></mesh>
    <mesh position={[0, .1, 0]}><cylinderGeometry args={[1.43, 1.5, .13, 32]} /><meshStandardMaterial color="#e3c2a8" roughness={.9} /></mesh>
    {[[-1.1, -.7], [1.1, -.7], [-1.1, .7], [1.1, .7]].map(([x, z], i) => <mesh key={i} position={[x, 1.22, z]}><cylinderGeometry args={[.11, .15, 2.2, 12]} /><meshStandardMaterial color="#e5c2aa" roughness={.9} /></mesh>)}
    <mesh position={[0, 2.37, 0]}><cylinderGeometry args={[1.32, 1.72, .45, 4]} /><meshStandardMaterial color={tint} roughness={.72} /></mesh>
    <mesh position={[0, 2.63, 0]}><coneGeometry args={[.7, .58, 4]} /><meshStandardMaterial color={tint} roughness={.72} /></mesh>
    <mesh position={[0, 1.1, -.75]}><boxGeometry args={[2.1, 1.78, .14]} /><meshStandardMaterial color="#694652" roughness={.8} /></mesh>
    <mesh position={[0, 1.13, -.65]}><planeGeometry args={[1.06, 1.5]} /><meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={selected ? .85 : .45} /></mesh>
    <pointLight ref={light} position={[0, 1.45, .1]} color={glow} distance={5} decay={2} />
    <mesh position={[0, .66, 1]}><sphereGeometry args={[.24, 16, 12]} /><meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.1} /></mesh>
  </group>;
}

function Plant({ position, scale }: { position: [number, number, number]; scale: number }) {
  return <group position={position} scale={scale}>
    <mesh position={[0, .13, 0]}><cylinderGeometry args={[.18, .13, .3, 10]} /><meshStandardMaterial color="#a26e66" /></mesh>
    <mesh position={[0, .54, 0]}><coneGeometry args={[.38, .85, 7]} /><meshStandardMaterial color="#526b55" roughness={1} /></mesh>
    <mesh position={[.16, .66, .03]}><coneGeometry args={[.22, .6, 6]} /><meshStandardMaterial color="#778567" roughness={1} /></mesh>
  </group>;
}
