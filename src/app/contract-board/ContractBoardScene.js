import { useLoader } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import { TextureLoader } from 'three';
import { useState } from 'react';

const contracts = [
  { id: 1, x: -2, y: 0.1, z: 1, title: 'Extraction', description: 'Sortir un VIP du quartier Arasaka.' },
  { id: 2, x: 1.5, y: 0.1, z: -1.5, title: 'Vol de données', description: 'Pirater un serveur Militech.' },
  { id: 3, x: 0.5, y: 0.1, z: 2, title: 'Sabotage', description: 'Saboter une installation corpo.' },
];

function ContractMarker({ contract, onClick, hovered, setHovered }) {
  return (
    <Float floatIntensity={2} speed={2}>
      <mesh
        position={[contract.x, hovered ? contract.y + 0.25 : contract.y, contract.z]}
        onClick={() => onClick(contract)}
        onPointerOver={() => setHovered(contract.id)}
        onPointerOut={() => setHovered(null)}
      >
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshBasicMaterial color="#00fff7" />
      </mesh>
      <Html center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div style={{ color: '#00fff7', textShadow: '0 0 8px #00fff7', fontWeight: 'bold', fontSize: '1rem' }}>
          📍
        </div>
      </Html>
    </Float>
  );
}

function MapPlane() {
  const texture = useLoader(TextureLoader, '/nightcity-generic-map.jpg');
  return (
    <mesh rotation={[-Math.PI / 2.2, 0, 0]} position={[0, 3, 0]}>
      <planeGeometry args={[9, 6]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

export default function ContractBoardScene() {
  const [selected, setSelected] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <>
      <MapPlane />
      {contracts.map(contract => (
        <ContractMarker
          key={contract.id}
          contract={contract}
          onClick={setSelected}
          hovered={hoveredId === contract.id}
          setHovered={setHoveredId}
        />
      ))}
      {selected && (
        <Html position={[selected.x, selected.y + 0.3, selected.z]} center distanceFactor={2} zIndexRange={[10, 0]}>
          <div style={{ background: 'rgba(10,30,40,0.95)', border: '1px solid #00fff7', color: '#fff', padding: '1rem', borderRadius: 8, minWidth: 200, boxShadow: '0 0 20px #00fff7' }}>
            <h2 style={{ color: '#00fff7', marginBottom: 8 }}>{selected.title}</h2>
            <p style={{ color: '#fff', marginBottom: 8 }}>{selected.description}</p>
            <button style={{ background: 'none', border: '1px solid #00fff7', color: '#00fff7', borderRadius: 4, padding: '0.3rem 1rem', cursor: 'pointer' }} onClick={() => setSelected(null)}>Fermer</button>
          </div>
        </Html>
      )}
    </>
  );
} 