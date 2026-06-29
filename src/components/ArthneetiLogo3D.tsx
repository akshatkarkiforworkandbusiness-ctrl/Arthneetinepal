import Spline from '@splinetool/react-spline';

export default function ArthneetiLogo3D({ className }: { className?: string }) {
  return (
    <div className={className} style={{ pointerEvents: 'none' }}>
      <Spline
        scene="https://prod.spline.design/5qtV4S4Gsd3GD748/scene.splinecode" 
      />
    </div>
  );
}
