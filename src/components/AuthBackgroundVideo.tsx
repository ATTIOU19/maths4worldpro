import authBgVideo from "@/../public/videos/auth-bg.mp4.asset.json";

const AuthBackgroundVideo = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
    <video
      src={(authBgVideo as { url: string }).url}
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    />
    {/* Dark overlay + radial calm center for form readability */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(213_61%_8%/0.55)_0%,_hsl(213_61%_8%/0.75)_100%)]" />
  </div>
);

export default AuthBackgroundVideo;