import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import ad1 from "../assets/ad_billboard.jpg";
import ad2 from "../assets/ad_billboard_two.jpg";
import ad3 from "../assets/ad_billboard_three.jpg";

export default function AdBoard() {
  const ads = useMemo(
    () => [
      { img: ad1, title: "ACME Tools",      sub: "Premium gear for kitchen & backyard." },
      { img: ad2, title: "Coffee Roasters", sub: "Small-batch beans. Big aroma." },
      { img: ad3, title: "Green Market",    sub: "Local produce. Fresh every day." },
    ],
    []
  );

  const [idx, setIdx]   = useState(0);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ads.length), 7000);
    return () => clearInterval(t);
  }, [ads.length]);

  const boardStyle = { ["--adbx-bg"]: `url(${ads[idx].img})` };

  const modal = open
    ? createPortal(
        <div className="adbx-modal" onClick={() => setOpen(false)} role="dialog" aria-modal="true">
          <div className="adbx-sheet" onClick={e => e.stopPropagation()}>
            <button className="adbx-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            <div className="adbx-sheet-body">
              <h1>Here could be your advertising</h1>
              <p>This is a placeholder. Provide a banner, a short pitch and a link — we’ll wire it up.</p>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div
        className={`adbx-board${hover ? " is-hover" : ""}`}
        style={boardStyle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => setOpen(true)}
        aria-label="Open promo"
      >
        <div className="adbx-stack" aria-hidden>
          {ads.map((a, i) => (
            <img
              key={i}
              src={a.img}
              alt=""
              className={`adbx-frame ${i === idx ? "is-active" : ""}`}
              draggable="false"
            />
          ))}
        </div>

        <div className="adbx-badge">Advertising</div>

        <div className="adbx-hover">
          <div className="adbx-hover-inner">
            <span className="adbx-title">{ads[idx].title}</span>
            <span className="adbx-sub">{ads[idx].sub}</span>
          </div>
        </div>
      </div>

      {modal}
    </>
  );
}
