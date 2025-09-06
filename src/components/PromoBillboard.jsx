import { useEffect, useRef, useState } from "react";

// ✅ импортируем картинки из src/assets
import ad1 from "../assets/ad_billboard.jpg";
import ad2 from "../assets/ad_billboard_two.jpg";
import ad3 from "../assets/ad_billboard_three.jpg";

const ADS = [ad1, ad2, ad3];

export default function PromoBillboard() {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const tRef = useRef(null);

  useEffect(() => {
    tRef.current = setInterval(() => setI((n) => (n + 1) % ADS.length), 6500);
    return () => clearInterval(tRef.current);
  }, []);

  return (
    <>
      <div className="ad-board" onClick={() => setOpen(true)}>
        <span className="ad-tag">advertising</span>

        <div className="ad-stack" aria-hidden>
          {ADS.map((src, idx) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`ad-frame ${i === idx ? "active" : ""}`}
              loading={idx === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          ))}
        </div>

        <div className="ad-hover">
          <div className="ad-hover-inner">
            <div className="ad-title">Your Brand</div>
            <div className="ad-sub">Simple tagline about a great product.</div>
          </div>
        </div>
      </div>

      {open && (
        <div className="modal" onClick={() => setOpen(false)}>
          <div className="ad-fullscreen" onClick={(e) => e.stopPropagation()}>
            <button className="ad-close" onClick={() => setOpen(false)} aria-label="Close">
              ✕
            </button>
            <div className="ad-fullscreen-content">
              <h1>This space could be your ad</h1>
              <p>Bring your message to thousands of hungry customers. Simple, clean, effective.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
