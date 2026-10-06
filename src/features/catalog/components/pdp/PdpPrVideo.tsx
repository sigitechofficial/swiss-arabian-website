"use client";

import { useEffect, useState } from "react";
import { videoClose, videoEl, videoExpand, videoExpanded, videoFrame } from "@/styles/pdpChrome";

type PdpPrVideoProps = {
  video: { url: string; name: string | null };
  poster?: string;
  title: string;
  resetKey: string;
  onError: (url: string) => void;
};

export function PdpPrVideo({ video, poster, title, resetKey, onError }: PdpPrVideoProps) {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setOpen(true);
    setExpanded(false);
  }, [resetKey]);

  if (!open) return null;

  return (
    <div className={`${videoFrame}${expanded ? ` ${videoExpanded}` : ""}`}>
      <video
        className={videoEl}
        src={video.url}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        aria-label={video.name ?? `${title} video`}
        onError={() => onError(video.url)}
      />
      <button type="button" className={videoClose} aria-label="Close video" onClick={() => setOpen(false)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>
      <button
        type="button"
        className={videoExpand}
        aria-label={expanded ? "Shrink video" : "Expand video"}
        onClick={() => setExpanded((current) => !current)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M8 4H4v4M16 4h4v4M4 16v4h4M20 16v4h-4"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
