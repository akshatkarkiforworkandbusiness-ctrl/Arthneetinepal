---
name: react-three-fiber
description: Skill for building 3D scenes in React using @react-three/fiber. Essential for advanced web design and 3D graphics integration.
---

# React Three Fiber Skill

This skill provides you with the knowledge and capability to implement beautiful, interactive 3D scenes in React using `pmndrs/react-three-fiber` (R3F).

## Installation

When deciding to use this skill in a React project, ensure the core dependencies are installed:
```bash
npm i @react-three/fiber three
```
Note: You may also frequently need `@react-three/drei` for helpful abstractions.

## Basic Usage

R3F allows you to render Three.js objects declaratively in React using a `<Canvas>` component.

```tsx
import { createRoot } from 'react-dom/client'
import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

function Box(props) {
  // This reference gives us direct access to the THREE.Mesh object
  const ref = useRef()
  // Hold state for hovered and clicked events
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)
  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => (ref.current.rotation.x += delta))
  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? 1.5 : 1}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => hover(true)}
      onPointerOut={(event) => hover(false)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  )
}

export default function App() {
  return (
    <Canvas>
      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      <Box position={[-1.2, 0, 0]} />
      <Box position={[1.2, 0, 0]} />
    </Canvas>
  )
}
```

## Repository Context

The full source code of the `react-three-fiber` repository is available at `C:\Users\asus\.gemini\antigravity\scratch\react-three-fiber`. Use it to understand advanced APIs, lifecycle methods, hooks (like `useFrame`, `useThree`, `useLoader`), or investigate internal mechanics.
