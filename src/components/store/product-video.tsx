"use client";

export function ProductVideo({ src }: { src: string }) {
  return (
    <video
      src={src}
      autoPlay
      controls
      playsInline
      className="w-full h-full object-cover"
    />
  );
}
