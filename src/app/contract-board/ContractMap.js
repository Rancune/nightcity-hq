import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Float, useTexture } from '@react-three/drei';
import { useState, useEffect, useRef } from 'react';
import styles from './ContractBoard.module.css';

const contracts = [
  { id: 1, x: -2, y: 0.1, z: 1, title: 'Extraction', description: 'Sortir un VIP du quartier Arasaka.' },
  { id: 2, x: 1.5, y: 0.1, z: -1.5, title: 'Vol de données', description: 'Pirater un serveur Militech.' },
  { id: 3, x: 0.5, y: 0.1, z: 2, title: 'Sabotage', description: 'Saboter une installation corpo.' },
];

function CameraLookAt({ target }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(...target);
  }, [camera, target]);
  return null;
}

function MapPlane() {
  const texture = useTexture('/nightcity-generic-map.jpg');
  const textureLoaded = texture && texture.image;

  // Pour éviter la déformation, on force le mapping à cover
  if (textureLoaded) {
    texture.wrapS = texture.wrapT = 1000; // RepeatWrapping
    texture.repeat.set(1, 1);
    texture.offset.set(0, 0);
  }

  // Décale le plan vers le haut (y = 3)
  return (
    <mesh rotation={[-Math.PI / 2.2, 0, 0]} position={[0, 3, 0]} receiveShadow>
      <planeGeometry args={[9, 6]} />
      <meshStandardMaterial
        map={textureLoaded ? texture : null}
        color={textureLoaded ? "#00fff7" : "red"}
        opacity={0.7}
        transparent
        emissive="#00fff7"
        emissiveIntensity={0.2}
      />
      {!textureLoaded && (
        <Html center>
          <div style={{
            color: 'red',
            background: 'rgba(0,0,0,0.7)',
            padding: '1rem',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            textShadow: '0 0 8px #fff',
          }}>
            Erreur : la texture de la carte n'est pas chargée !
          </div>
        </Html>
      )}
    </mesh>
  );
}

function ContractMarker({ contract, onClick, hovered, setHovered }) {
  return (
    <Float floatIntensity={2} speed={2}>
      <mesh
        position={[contract.x, hovered ? contract.y + 0.25 : contract.y, contract.z]}
        onClick={() => onClick(contract)}
        onPointerOver={() => setHovered(contract.id)}
        onPointerOut={() => setHovered(null)}
        className={hovered ? styles['glow-hover'] : ''}
      >
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial color="#00fff7" emissive="#00fff7" emissiveIntensity={hovered ? 1.5 : 0.8} />
      </mesh>
      <Html center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div style={{ color: '#00fff7', textShadow: '0 0 8px #00fff7', fontWeight: 'bold', fontSize: '1rem' }}>
          📍
        </div>
      </Html>
    </Float>
  );
}

export default function ContractMap() {
  const [selected, setSelected] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const canvasRef = useRef();
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current?.children[0];
    if (!canvas) return;
    const handleContextLost = (e) => {
      e.preventDefault();
      setContextLost(true);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost, false);
    };
  }, []);

  // Caméra centrée et adaptée au plan 9x6, recentrée sur le plan décalé
  return (
    <div style={{ width: '100%', height: '600px', position: 'relative' }} ref={canvasRef}>
      {contextLost && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.9)', color: '#00fff7', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold',
          flexDirection: 'column',
        }}>
          Erreur : le contexte WebGL a été perdu.<br />
          Essayez de recharger la page ou d'utiliser une image plus légère.
        </div>
      )}
      <Canvas camera={{ position: [0, 7, 0], fov: 40, near: 0.1, far: 100, up: [0, 0, -1] }} shadows>
        <CameraLookAt target={[0, 3, 0]} />
        {/* Lumière holographique */}
        <ambientLight intensity={0.5} />
        <pointLight position={[0, 5, 5]} intensity={1.2} color="#00fff7" />
        {/* Carte */}
        <MapPlane />
        {/* Marqueurs de contrats */}
        {contracts.map(contract => (
          <ContractMarker
            key={contract.id}
            contract={contract}
            onClick={setSelected}
            hovered={hoveredId === contract.id}
            setHovered={setHoveredId}
          />
        ))}
        {/* Popup contrat */}
        {selected && (
          <Html position={[selected.x, selected.y + 0.3, selected.z]} center distanceFactor={2} zIndexRange={[10, 0]}>
            <div style={{ background: 'rgba(10,30,40,0.95)', border: '1px solid #00fff7', color: '#fff', padding: '1rem', borderRadius: 8, minWidth: 200, boxShadow: '0 0 20px #00fff7' }}>
              <h2 style={{ color: '#00fff7', marginBottom: 8 }}>{selected.title}</h2>
              <p style={{ color: '#fff', marginBottom: 8 }}>{selected.description}</p>
              <button style={{ background: 'none', border: '1px solid #00fff7', color: '#00fff7', borderRadius: 4, padding: '0.3rem 1rem', cursor: 'pointer' }} onClick={() => setSelected(null)}>Fermer</button>
            </div>
          </Html>
        )}
        {/* Contrôles (optionnel, désactivés pour carte fixe) */}
        {/* <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI/2.2} minPolarAngle={Math.PI/2.2} /> */}
      </Canvas>
    </div>
  );
} 