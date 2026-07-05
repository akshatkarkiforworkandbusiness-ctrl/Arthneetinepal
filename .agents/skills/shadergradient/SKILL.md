---
name: shadergradient
description: Skill for creating customizable 3D, moving gradients for React using @shadergradient/react. Essential for high-end web design.
---

# ShaderGradient Skill

This skill provides you with the knowledge and capability to implement beautiful, customizable 3D moving gradients in React using `ruucm/shadergradient`.

## Installation

When deciding to use this skill in a React project, first ensure the dependencies are installed:
```bash
npm i @shadergradient/react @react-three/fiber three three-stdlib camera-controls
npm i -D @types/three
```

## Basic Usage

Drop `ShaderGradient` inside `ShaderGradientCanvas` and drive it with props or a query string.

```tsx
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react'

function ExampleComponent() {
  return (
    <ShaderGradientCanvas
      style={{ position: 'absolute', inset: 0 }}
      pixelDensity={1.5}
      fov={45}
    >
      <ShaderGradient cDistance={32} cPolarAngle={125} color1="#ff0000" color2="#00ff00" color3="#0000ff" />
    </ShaderGradientCanvas>
  )
}
```

Load settings from a URL string:
```tsx
<ShaderGradientCanvas>
  <ShaderGradient
    control='query'
    urlString='https://www.shadergradient.co/customize?animate=on&cDistance=3.6&cPolarAngle=90&color1=%2352ff89&color2=%23dbba95&color3=%23d0bce1&lightType=3d&shader=defaults&type=plane&uFrequency=5.5&uSpeed=0.4&uStrength=4'
  />
</ShaderGradientCanvas>
```

## Repository Context

The full source code of the `shadergradient` repository is available at `C:\Users\asus\.gemini\antigravity\scratch\shadergradient`. You can explore it if you need advanced customization, to look at examples, or to understand the internal mechanisms of the package.
