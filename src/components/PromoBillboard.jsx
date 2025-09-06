import { useEffect, useState } from "react";
import ad1 from "../assets/ad_billboard.jpg";
import ad2 from "../assets/ad_billboard_two.jpg";
import ad3 from "../assets/ad_billboard_three.jpg";

export default function PromoBillboard() {
  const IMGS = [ad1, ad2, ad3];
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    IMGS.forEach((src) => {
      const i = new Image();
      i.src = src;
    });
  }, []);

  useEffect(() => {
    if (open) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % IMGS.length);
    }, 7000);
    return () => clearInterval(id);
  }, [open]);

  return (
    <>
      <div
        className="ad-board"
        role="button"
        aria-label="Open advertising"
        onClick={() => setOpen(true)}
      >
        <div className="ad-stack">
          {IMGS.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className={`ad-frame${i === idx ? " active" : ""}`}
              draggable="false"
            />
          ))}
        </div>

        <span className="ad-tag" aria-hidden="true">advertising</span>

        <div className="ad-hover" aria-hidden="true">
          <div className="ad-hover-inner">
            <div className="ad-title">Bluefin Promo Co.</div>
            <div className="ad-sub">Fresh vibes • Cozy evenings • Great taste</div>
          </div>
        </div>
      </div>

      {open && (
        <div
          className="modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="ad-fullscreen">
            <button
              className="ad-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
            <div className="ad-fullscreen-content">
              <h1>THIS COULD BE YOUR AD</h1>
              <p>Showcase your brand, promo or seasonal offer here.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
