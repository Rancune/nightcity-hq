'use client';
import { Canvas } from '@react-three/fiber';
import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import ContractBoardScene from './contract-board/ContractBoardScene';

export default function PersistentCanvas() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();

  // Affiche le Canvas seulement si connecté, sur la bonne route, et Clerk est chargé
  if (pathname !== '/contract-board' || !isLoaded || !isSignedIn) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '120px', // ajuste selon la hauteur de ton header
        left: '50%',
        transform: 'translateX(-50%)',
        width: '900px',
        height: '600px',
        zIndex: 0,
        pointerEvents: 'none',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: '0 0 40px #00fff7',
      }}
    >
      <Canvas camera={{ position: [0, 7, 0], fov: 40, near: 0.1, far: 100, up: [0, 0, -1] }}>
        <ContractBoardScene />
      </Canvas>
    </div>
  );
} 