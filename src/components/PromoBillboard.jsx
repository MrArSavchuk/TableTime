import { useEffect, useState } from "react";

// Картинки лежат в src/assets
const ADS = [
  new URL("../assets/ad_billboard.jpg", import.meta.url).href,
  new URL("../assets/ad_billboard_two.jpg", import.meta.url).href,
  new URL("../assets/ad_billboard_three.jpg", import.meta.url).href,
];

export default function PromoBillboard() {
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);

  // Автосмена
  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % ADS.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* Fallback: фоновая картинка на контейнере */}
      <div
        className="ad-board"
        onClick={() => setOpen(true)}
        style={{
          backgroundImage: `url(${ADS[idx]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Кроссфейд через img-слои */}
        <div className="ad-stack" aria-hidden="true">
          {ADS.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`ad-frame ${i === idx ? "active" : ""}`}
              loading="eager"
            />
          ))}
        </div>

        <span className="ad-tag">advertising</span>

        <div className="ad-hover">
          <div className="ad-hover-inner">
            <div className="ad-title">Your Brand Here</div>
            <div className="ad-sub">Simple tagline about a great product.</div>
          </div>
        </div>
      </div>

      {open && (
        <div className="modal" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="ad-fullscreen" onClick={(e) => e.stopPropagation()}>
            <button className="ad-close" onClick={() => setOpen(false)} aria-label="Close">
              ✕
            </button>
            <div className="ad-fullscreen-content">
              <h1>This could be your ad</h1>
              <p>Reach thousands of hungry users. Contact us to place your brand here.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
