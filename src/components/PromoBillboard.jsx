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

  // Автопереключение
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ads.length), 7000);
    return () => clearInterval(t);
  }, [ads.length]);

  // Предзагрузка для плавности
  useEffect(() => {
    ads.forEach(({ img }) => { const i = new Image(); i.src = img; });
  }, [ads]);

  const currentImg = ads[idx].img;

  return (
    <>
      {/* Передаём текущий фон НЕ через backgroundImage,
          а через CSS-переменную (надёжно и не конфликтует
          с шортхэндом background в стилях) */}
      <div
        className="ad-board"
        onClick={() => setOpen(true)}
        aria-label="Open promo"
        style={{ "--ad-bg": `url("${currentImg}")` }}
      >
        {/* Слой img для анимации + фоллбек: если img не загрузится,
            фон из --ad-bg всё равно виден */}
        <div className="ad-stack" aria-hidden="true">
          {ads.map((a, i) => (
            <img
              key={i}
              src={a.img}
              alt=""
              aria-hidden="true"
              className={`ad-frame ${i === idx ? "active" : ""}`}
              draggable="false"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          ))}
        </div>

        <div className="ad-tag">Advertising</div>

        <div className="ad-hover">
          <div className="ad-hover-inner">
            <div className="ad-title">{ads[idx].title}</div>
            <div className="ad-sub">{ads[idx].sub}</div>
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
