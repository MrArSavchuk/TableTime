import { useEffect, useMemo, useState } from "react";

import ad1 from "../assets/ad_billboard.jpg";
import ad2 from "../assets/ad_billboard_two.jpg";
import ad3 from "../assets/ad_billboard_three.jpg";

/**
 * Sidebar vertical billboard with rotation and hover overlay.
 * Inline styles ensure badge & hover text are always on top,
 * even if some external CSS accidentally overrides z-index/opacity.
 */
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
  const [canHover, setCanHover] = useState(true);

  // auto-rotate
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % ads.length), 7000);
    return () => clearInterval(t);
  }, [ads.length]);

  // detect hover capability to always show text on touch devices
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover)");
    const upd = () => setCanHover(!!mq.matches);
    try { mq.addEventListener("change", upd); } catch { /* safari */ mq.addListener(upd); }
    upd();
    return () => {
      try { mq.removeEventListener("change", upd); } catch { mq.removeListener(upd); }
    };
  }, []);

  const showOverlay = hover || !canHover;

  // Inline styles to force stacking above ::after vignette and any CSS overrides
  const boardStyle = {
    // дублируем фон напрямую, помимо CSS var — на случай, если var где-то переопределили
    backgroundImage: `url(${ads[idx].img})`,
    // и одновременно прокидываем CSS-переменную (если твой CSS использует var(--ad-bg))
    "--ad-bg": `url(${ads[idx].img})`,
  };

  const hoverStyle = {
    position: "absolute",
    inset: 0,
    zIndex: 20,
    display: "grid",
    placeItems: "end start",
    padding: 14,
    background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,.45) 100%)",
    color: "#fff",
    opacity: showOverlay ? 1 : 0,
    transform: showOverlay ? "translateY(0)" : "translateY(6px)",
    transition: "opacity .25s ease, transform .25s ease",
    pointerEvents: "none",
  };

  const tagStyle = {
    position: "absolute",
    left: 12,
    top: 12,
    zIndex: 30,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".08em",
    color: "#fff",
    background: "rgba(0,0,0,.28)",
    border: "1px solid rgba(255,255,255,.35)",
    borderRadius: 999,
    WebkitBackdropFilter: "blur(2px)",
    backdropFilter: "blur(2px)",
    userSelect: "none",
  };

  return (
    <>
      <div
        className="ad-board"
        style={boardStyle}
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
        {/* stack of images (keeps your existing CSS animations) */}
        <div className="ad-stack" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
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

        {/* badge */}
        <div className="ad-tag" style={tagStyle}>Advertising</div>

        {/* hover overlay (title + sub) */}
        <div className="ad-hover" style={hoverStyle} aria-hidden={!showOverlay}>
          <div className="ad-hover-inner" style={{ maxWidth: "85%" }}>
            <span className="ad-title" style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.15, margin: 0 }}>
              {ads[idx].title}
            </span>
            <span className="ad-sub" style={{ fontSize: 12, opacity: .95, margin: 0 }}>
              {ads[idx].sub}
            </span>
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
