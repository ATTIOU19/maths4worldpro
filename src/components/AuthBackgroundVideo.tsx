const AuthBackgroundVideo = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
    <video
      src="/videos/auth-bg.mp4"
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      className="absolute inset-0 w-full h-full object-cover"
      style={{ filter: "hue-rotate(-10deg) saturate(1.1)" }}
    />
    {/* Tint overlay matching the homepage hero blue gradient */}
    <div className="absolute inset-0 bg-[linear-gradient(135deg,_hsl(213_61%_27%/0.75)_0%,_hsl(204_68%_47%/0.55)_50%,_hsl(213_61%_18%/0.8)_100%)] mix-blend-multiply" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(213_61%_15%/0.35)_0%,_hsl(213_61%_10%/0.65)_100%)]" />
  </div>
);

export default AuthBackgroundVideo;