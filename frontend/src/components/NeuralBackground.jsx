import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';

const Stars = (props) => {
  const ref = useRef();
  const { mouse } = useThree();
  
  // Generate more particles with cyan and violet colors
  const sphere = useMemo(() => random.inSphere(new Float32Array(6000), { radius: 1.5 }), []);

  useFrame((state, delta) => {
    // Continuous subtle rotation
    ref.current.rotation.x -= delta / 20;
    ref.current.rotation.y -= delta / 25;
    
    // Mouse parallax effect
    ref.current.position.x = (mouse.x * 0.1);
    ref.current.position.y = (mouse.y * 0.1);
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial 
          transparent 
          color="#00F5FF" 
          size={0.0025} 
          sizeAttenuation={true} 
          depthWrite={false} 
          opacity={0.6}
        />
      </Points>
    </group>
  );
};

const SecondaryStars = (props) => {
  const ref = useRef();
  const { mouse } = useThree();
  const sphere = useMemo(() => random.inSphere(new Float32Array(2000), { radius: 1.2 }), []);

  useFrame((state, delta) => {
    ref.current.rotation.x += delta / 15;
    ref.current.rotation.z += delta / 30;
    
    // Inverse mouse parallax for depth
    ref.current.position.x = -(mouse.x * 0.05);
    ref.current.position.y = -(mouse.y * 0.05);
  });

  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial 
          transparent 
          color="#7C3AED" 
          size={0.0035} 
          sizeAttenuation={true} 
          depthWrite={false} 
          opacity={0.4}
        />
      </Points>
    </group>
  );
};

const NeuralBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#020817] pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020817]/50 to-[#020817] z-0" />
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Stars />
        <SecondaryStars />
      </Canvas>
    </div>
  );
};

export default NeuralBackground;