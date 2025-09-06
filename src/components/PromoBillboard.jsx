import { useEffect, useMemo, useState } from "react";

import ad1 from "../assets/ad_billboard.jpg";
import ad2 from "../assets/ad_billboard_two.jpg";
import ad3 from "../assets/ad_billboard_three.jpg";

export default function PromoBillboard() {
  const ads = useMemo(
    () => [
      { img: ad1, title: "ACME Tools",      sub: "Premium gear for kitchen & backyard." },
      { img: ad2, title: "Coffee Roasters", sub: "Small-batch beans. Big aroma." },
      { img: ad3, title: "Green Market",    sub: "Local produce. Fresh every day." },
    ],
    []
  );

  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % ads.length), 7000);
    return () => clearInterval(t);
  }, [ads.length]);

  const safetyZ = { zIndex: 9, position: "absolute" };

  return (
    <>
      <div
        className={`ad-board ${hover ? "is-hover" : ""}`}
        style={{ "--ad-bg": `url(${ads[idx].img})` }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        aria-label="Open promo"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); }
        }}
      >
        <div className="ad-stack">
          {ads.map((a, i) => (
            <img
              key={i}
              src={a.img}
              alt=""
              className={`ad-frame ${i === idx ? "active" : ""}`}
              draggable="false"
            />
          ))}
        </div>

        <div className="ad-tag" style={safetyZ}>Advertising</div>

        <div className="ad-hover" style={safetyZ}>
          <div className="ad-hover-inner">
            <span className="ad-title">{ads[idx].title}</span>
            <span className="ad-sub">{ads[idx].sub}</span>
          </div>
        </div>
      </div>

      {open && (
        <div className="modal" onClick={() => setOpen(false)} role="dialog" aria-modal="true">
          <div className="ad-fullscreen" onClick={(e) => e.stopPropagation()}>
            <button className="ad-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            <div className="ad-fullscreen-content">
              <h1>Here could be your advertising</h1>
              <p>This is a placeholder. Provide a banner, a short pitch and a link — we’ll wire it up.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
