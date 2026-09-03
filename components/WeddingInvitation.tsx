"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const EVENT_DATE = new Date("2026-10-15T11:00:00+07:00").getTime();
const MUSIC_SRC = "/audio/vay-cuoi.mp3";
const SAVED_SIGNATURES_KEY = "wedding-saved-signatures";
const STORY_SLIDES = [
  "photo-1519741497674-611481863552",
  "photo-1519225421980-715cb0215aed",
  "photo-1511285560929-80b456fea0bc",
  "photo-1520854221256-17451cc331bf",
  "photo-1460364157752-9267c1b7a7c8",
];
const FALLING_HEARTS = Array.from({ length: 16 }, (_, index) => ({
  id: index,
  left: `${(index * 23 + 5) % 97}%`,
  delay: `${(index * 1.17) % 9}s`,
  duration: `${10 + (index % 5)}s`,
  size: `${0.72 + (index % 4) * 0.12}`,
  opacity: `${0.34 + (index % 5) * 0.11}`,
}));

function StoryVisual({ background, label }: { background: string; label: string }) {
  return (
    <div className="story-visual" aria-label={label}>
      <img
        className="story-photo-background"
        src={`https://images.unsplash.com/${background}?auto=format&fit=crop&w=1000&q=85`}
        alt={label}
      />
      <div className="story-slides">
        {STORY_SLIDES.map((id, index) => (
          <img
            className={`story-slide story-slide-${index + 1}`}
            key={id}
            src={`https://images.unsplash.com/${id}?auto=format&fit=crop&w=700&q=85`}
            alt={`Khoảnh khắc cưới ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export default function WeddingInvitation() {
  const [opened, setOpened] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [quotePosition, setQuotePosition] = useState({ x: 0, y: 0 });
  const [music, setMusic] = useState(true);
  const [musicError, setMusicError] = useState(false);
  const [attendance, setAttendance] = useState("yes");
  const [sent, setSent] = useState(false);
  const [rsvpError, setRsvpError] = useState("");
  const [wishes, setWishes] = useState<Array<{
    id: string | number;
    name: string;
    message: string;
    attendance: string;
  }>>([]);
  const [signaturePosition, setSignaturePosition] = useState({ x: 210, y: 180 });
  const [signatureScale, setSignatureScale] = useState(1);
  const [signatureData, setSignatureData] = useState("");
  const [signed, setSigned] = useState(false);
  const [savedSignatures, setSavedSignatures] = useState<Array<{
    id: number;
    data: string;
    x: number;
    y: number;
    scale: number;
  }>>([]);
  const [showCoupleReveal, setShowCoupleReveal] = useState(false);
  const [showGiftReveal, setShowGiftReveal] = useState(false);
  const [savedSignaturesLoaded, setSavedSignaturesLoaded] = useState(false);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const signaturePadRef = useRef<HTMLCanvasElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const draggingSavedSignatureRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const isDrawingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setQuotePosition({
        x: Math.round((Math.random() - 0.5) * 120),
        y: Math.round((Math.random() - 0.5) * 70),
      });
    }, 3600);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/signatures")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load signatures");
        const result = await response.json();
        if (result.configured) {
          setSavedSignatures(result.signatures);
          return;
        }
        const saved = window.localStorage.getItem(SAVED_SIGNATURES_KEY);
        if (saved) setSavedSignatures(JSON.parse(saved));
      })
      .catch(() => {
        const saved = window.localStorage.getItem(SAVED_SIGNATURES_KEY);
        if (saved) setSavedSignatures(JSON.parse(saved));
      })
      .finally(() => setSavedSignaturesLoaded(true));
  }, []);

  useEffect(() => {
    if (!savedSignaturesLoaded) return;
    window.localStorage.setItem(
      SAVED_SIGNATURES_KEY,
      JSON.stringify(savedSignatures)
    );
  }, [savedSignatures, savedSignaturesLoaded]);

  useEffect(() => {
    fetch("/api/rsvp")
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
        if (result?.wishes) setWishes(result.wishes);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.4;
    if (music) {
      audio.play().catch(() => setMusicError(true));
    } else {
      audio.pause();
    }
  }, [music, opened]);

  useEffect(() => {
    const revealItems = document.querySelectorAll("[data-reveal]");
    if (!revealItems.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -30px 0px" }
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [opened, showCoupleReveal, showGiftReveal]);

  const countdown = useMemo(() => {
    const distance = Math.max(EVENT_DATE - now, 0);
    return {
      days: Math.floor(distance / 86400000),
      hours: Math.floor((distance / 3600000) % 24),
      minutes: Math.floor((distance / 60000) % 60),
      seconds: Math.floor((distance / 1000) % 60),
    };
  }, [now]);

  const submitRsvp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRsvpError("");
    const formData = new FormData(event.currentTarget);
    const submitted = Object.fromEntries(formData.entries());
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitted),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setRsvpError(result?.error ?? "Không thể gửi xác nhận lúc này.");
        return;
      }

      setWishes((previous) => [
        ...previous,
        {
          id: Date.now(),
          name: String(submitted.name),
          message: String(submitted.message || ""),
          attendance: String(submitted.attendance),
        },
      ]);
      setSent(true);
    } catch {
      setRsvpError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    }
  };

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = signaturePadRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handleDrawStart = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = signaturePadRef.current;
    const point = getCanvasPoint(event);
    const context = canvas?.getContext("2d");
    if (!canvas || !point || !context) return;

    isDrawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const handleDrawMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = signaturePadRef.current;
    const point = getCanvasPoint(event);
    const context = canvas?.getContext("2d");
    if (!canvas || !point || !context) return;

    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const finishDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = signaturePadRef.current;
    if (canvas) setSignatureData(canvas.toDataURL("image/png"));
  };

  const clearSignature = () => {
    const canvas = signaturePadRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData("");
    setSigned(false);
    setSignatureScale(1);
    setSignaturePosition({ x: 12, y: 12 });
  };

  const saveSignature = async () => {
    if (!signatureData) return;
    const signature = {
      data: signatureData,
      x: signaturePosition.x,
      y: signaturePosition.y,
      scale: signatureScale,
    };
    try {
      const response = await fetch("/api/signatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signature),
      });
      if (!response.ok) throw new Error("Unable to save signature");
      const result = await response.json();
      setSavedSignatures((previous) => [...previous, result.signature]);
    } catch {
      setSavedSignatures((previous) => [...previous, { id: Date.now(), ...signature }]);
    }
    clearSignature();
    const offset = ((savedSignatures.length + 1) % 5) * 24;
    setSignaturePosition({ x: 12 + offset, y: 12 + offset });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const board = boardRef.current;
    const signature = event.target as HTMLImageElement;
    if (!board || !signature) return;

    const signatureRect = signature.getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - signatureRect.left,
      y: event.clientY - signatureRect.top,
    };

    isDraggingRef.current = true;
    draggingSavedSignatureRef.current = signature.dataset.signatureId
      ? Number(signature.dataset.signatureId)
      : null;
    board.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !boardRef.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const savedSignature = savedSignatures.find(
      (signature) => signature.id === draggingSavedSignatureRef.current
    );
    const activeScale = savedSignature?.scale ?? signatureScale;
    const stickerWidth = 180 * activeScale;
    const stickerHeight = 70 * activeScale;
    const maxX = boardRect.width - stickerWidth - 12;
    const maxY = boardRect.height - stickerHeight - 12;

    const nextX = clamp(
      event.clientX - boardRect.left - dragOffsetRef.current.x,
      12,
      Math.max(12, maxX)
    );
    const nextY = clamp(
      event.clientY - boardRect.top - dragOffsetRef.current.y,
      12,
      Math.max(12, maxY)
    );

    if (savedSignature) {
      setSavedSignatures((previous) =>
        previous.map((signature) =>
          signature.id === savedSignature.id
            ? { ...signature, x: nextX, y: nextY }
            : signature
        )
      );
    } else {
      setSignaturePosition({ x: nextX, y: nextY });
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    draggingSavedSignatureRef.current = null;
    boardRef.current?.releasePointerCapture(event.pointerId);
  };

  return (
    <main>
      <div className="heart-rain" aria-hidden="true">
        {FALLING_HEARTS.map((heart) => (
          <span
            className="falling-heart"
            key={heart.id}
            style={
              {
                left: heart.left,
                animationDelay: heart.delay,
                animationDuration: heart.duration,
                fontSize: `${heart.size}rem`,
                "--heart-opacity": heart.opacity,
              } as React.CSSProperties
            }
          >
            <span className="heart-half heart-half-blue">T</span>
            <span className="heart-half heart-half-pink">T</span>
          </span>
        ))}
      </div>
      <audio ref={audioRef} src={MUSIC_SRC} loop preload="auto" />
      {!opened && (
        <section className="cover">
          <div className="cover-overlay" />
          <div className="cover-content reveal fade-up" data-reveal>
            <p className="eyebrow">THE WEDDING OF</p>
            <h1> Hữu Tài <span>&</span> Hà Thủy</h1>
            <p className="cover-date">15 · 10 · 2026</p>
            <button
              className="primary-button"
              onClick={() => {
                const audio = audioRef.current;
                if (audio) {
                  audio.volume = 0.4;
                  audio.currentTime = 0;
                  audio.play()
                    .then(() => setMusic(true))
                    .catch(() => setMusicError(true));
                }
                setOpened(true);
              }}
            >
              MỞ THIỆP
            </button>
            <p className="hint">Một lời mời nhỏ, một ngày thật đặc biệt.</p>
          </div>
        </section>
      )}

      {opened && (
        <>
          <nav className="nav">
            <a href="#home">T&T</a>
            <div>
              <a href="#story">Our Story</a>
              <a href="#event">The Wedding</a>
              <a href="#gallery">Gallery</a>
              <a href="#rsvp">Yêu Thương</a>
            </div>
          </nav>

          <button
            className="music-icon"
            aria-label={music ? "Tắt nhạc" : "Bật nhạc"}
            title={music ? "Tắt nhạc" : "Bật nhạc"}
            onClick={() => {
              setMusicError(false);
              setMusic((prev) => !prev);
            }}
          >
            {music ? "♫" : "♩"}
          </button>

          <section id="home" className="hero">
            <div className="hero-image" />
            <div className="hero-content reveal fade-up" data-reveal>
              <p className="eyebrow">WE ARE GETTING MARRIED</p>
              <h1> Hữu Tài <span>&</span> Hà Thủy</h1>
              <p>15.10.2026 · Thanh Hóa</p>
            </div>
            <div className="scroll">Kéo xuống↓</div>
          </section>

          <section id="story" className="section story reveal" data-reveal>
            <p className="eyebrow">OUR STORY</p>
            <h2>Một câu chuyện bắt đầu từ một cuộc gặp gỡ.</h2>
            <p className="lead">
              Có những cuộc gặp gỡ tưởng như tình cờ, nhưng lại trở thành điều
              đẹp nhất trong cuộc đời. Chúng mình rất vui khi được chia sẻ
              khoảnh khắc đặc biệt này cùng những người thân yêu.
            </p>

            {!showCoupleReveal ? (
              <button
                className="secondary-button reveal-button"
                onClick={() => setShowCoupleReveal(true)}
              >
                XEM ẢNH CÔ DÂU CHÚ RỂ
              </button>
            ) : (
              <div className="story-grid reveal fade-up" data-reveal>
                <article className="story-entry story-entry-left">
                  <StoryVisual
                    background="photo-1519741497674-611481863552"
                    label="Cô dâu và chú rể"
                  />
                  <div className="story-note">
                    <span>15 / 10 / 2026</span>
                    <h3>And so the adventure begins...</h3>
                    <p>Cảm ơn vì đã trở thành một phần trong hành trình của chúng mình.</p>
                  </div>
                </article>
                <article className="story-entry story-entry-right">
                  <div className="story-note">
                    <span>THE FIRST CHAPTER</span>
                    <h3>From this moment, together.</h3>
                    <p>Những khoảnh khắc giản dị đã viết nên câu chuyện riêng của hai chúng mình.</p>
                  </div>
                  <StoryVisual
                    background="photo-1511285560929-80b456fea0bc"
                    label="Khoảnh khắc đầu tiên của đôi uyên ương"
                  />
                </article>
                <article className="story-entry story-entry-center">
                  <div className="story-note">
                    <span>OUR PROMISE</span>
                    <p>Mỗi ngày bên nhau là một trang mới.</p>
                  </div>
                  <StoryVisual
                    background="photo-1520854221256-17451cc331bf"
                    label="Khoảnh khắc hạnh phúc của cô dâu chú rể"
                  />
                  <div className="story-note">
                    <span>FOREVER STARTS HERE</span>
                    <p>Và hôm nay, chúng mình muốn viết tiếp cùng những người thương yêu.</p>
                  </div>
                </article>
              </div>
            )}
          </section>

          <section id="event" className="section event-section reveal" data-reveal>
            <p className="eyebrow">SAVE THE DATE</p>
            <h2 className="event-title" aria-label="THE WEDDING">
              {"THE WEDDING".split("").map((character, index) => (
                <span key={`${character}-${index}`}>
                  {character === " " ? "\u00a0" : character}
                </span>
              ))}
            </h2>
            <div className="countdown">
              {[
                ["days", countdown.days],
                ["hours", countdown.hours],
                ["minutes", countdown.minutes],
                ["seconds", countdown.seconds],
              ].map(([label, value]) => (
                <div className="count-item reveal fade-up" data-reveal key={label}>
                  <strong>{pad(Number(value))}</strong>
                  <span>{String(label).toUpperCase()}</span>
                </div>
              ))}
            </div>

            <div className="event-grid reveal fade-up" data-reveal>
              <div className="event-groom">
                <span className="event-icon">♡</span>
                <h3>Lễ Thành Hôn tại Nhà Trai</h3>
                <p>11:00 · Thứ Năm</p>
                <p>15 tháng 10, 2026</p>
                <iframe
                  className="ceremony-map"
                  title="Bản đồ nhà trai"
                  src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d933.0468070926343!2d105.4565710965466!3d19.97122584026793!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2s!4v1788414900773!5m2!1sen!2s"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="event-bride">
                <span className="event-icon">⌖</span>
                <h3>Lễ Thành Hôn tại Nhà Gái</h3>
                <p>06:30 · Thứ Năm</p>
                <p>15 tháng 10, 2026</p>
                <iframe
                  className="ceremony-map"
                  title="Bản đồ nhà gái"
                  src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d658.8001155960343!2d104.86627166744569!3d20.20024267734962!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2s!4v1788414966559!5m2!1sen!2s"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </section>

          <section className="section timeline-section reveal" data-reveal>
            <p className="eyebrow">THE DAY</p>
            <h2>Wedding Timeline</h2>
            <div className="timeline-grid">
              {[
                {
                  label: "Nhà trai",
                  theme: "groom",
                  icon: "♢",
                  items: [
                    ["14/10 · 11:00", "Mời khách dùng tiệc", "Gia đình nhà trai đón tiếp người thân, bạn bè và mời khách dùng tiệc thân mật"],
                    ["14/10 · 20:00", "Ca múa hát giao lưu", "Cùng gia đình, người thân và bạn bè vui chơi, ca múa hát trong buổi tối"],
                    ["15/10 · 08:05", "Đón dâu về nhà trai", "Đoàn nhà trai đón cô dâu và cùng gia đình di chuyển về nhà trai"],
                    ["15/10 · 11:00", "Lễ thành hôn", "Gia đình hai bên thực hiện nghi lễ, ra mắt và chúc phúc cho đôi trẻ"],
                    ["15/10 · 12:30", "Tiệc mừng", "Đón khách, dùng tiệc và chung vui cùng gia đình, người thân, bạn bè đến hết buổi"],
                  ],
                },
                {
                  label: "Nhà gái",
                  theme: "bride",
                  icon: "♡",
                  items: [
                    ["14/10 · 11:00", "Mời khách dùng tiệc", "Gia đình nhà gái đón tiếp người thân, bạn bè và mời khách dùng tiệc thân mật"],
                    ["14/10 · 20:00", "Ca múa hát giao lưu", "Cùng gia đình, người thân và bạn bè vui chơi, ca múa hát trong buổi tối"],
                    ["15/10 · 06:30", "Chuẩn bị lễ cưới", "Gia đình chuẩn bị lễ vật, không gian và cô dâu cho ngày vui"],
                    ["15/10 · 07:30", "Lễ vu quy", "Gia đình làm lễ, dặn dò và trao gửi cô dâu về nhà chồng"],
                    ["15/10 · 08:05", "Cô dâu về nhà trai", "Tiễn cô dâu cùng đoàn đưa dâu, bắt đầu hành trình về nhà trai"],
                  ],
                },
              ].map(({ label, theme, icon, items }) => (
                <div className={`timeline-column timeline-${theme} reveal fade-up`} data-reveal key={label}>
                  <div className="timeline-heading">
                    <span className="timeline-icon" aria-hidden="true">{icon}</span>
                    <p className="timeline-label">{label}</p>
                  </div>
                  <div className="timeline">
                    {items.map(([time, title, desc]) => (
                      <div className="timeline-item" key={`${label}-${time}`}>
                        <time>{time}</time>
                        <div>
                          <h3>{title}</h3>
                          <p>{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="gallery" className="section gallery-section reveal" data-reveal>
            <p className="eyebrow">OUR MEMORIES</p>
            <h2>Moments</h2>
            <div className="gallery">
              {[
                "photo-1511285560929-80b456fea0bc",
                "photo-1529634806980-85c3dd6d34ac",
                "photo-1523438885200-e635ba2c371e",
                "photo-1519225421980-715cb0215aed",
                "photo-1517841905240-472988babdf9",
                "photo-1522673607200-164d1b6ce486",
                "photo-1469371670807-013ccf25f16a",
                "photo-1507504031003-b417219a0fde",
                "photo-1504150558240-0b4fd8946624",
                "photo-1544078751-58fee2d8a03b",
                "photo-1520854221256-17451cc331bf",
                "photo-1487412720507-e7ab37603c6f",
              ].map((id, index) => (
                <img
                  key={id}
                  className={`gallery-${index + 1} reveal fade-up`}
                  data-reveal
                  src={`https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`}
                  alt={`Wedding moment ${index + 1}`}
                />
              ))}
            </div>
          </section>

          <section className="section blessing-section reveal" data-reveal>
            <p className="eyebrow">CONGRATULATIONS</p>
            <h2>Give us a heart</h2>

            <div className="signature-editor reveal fade-up" data-reveal>
              <div className="signature-controls">
                <div>
                  <p className="signature-instruction">Vẽ chữ ký của bạn vào ô bên dưới</p>
                  <canvas
                    ref={signaturePadRef}
                    className="signature-pad"
                    width={700}
                    height={180}
                    onPointerDown={handleDrawStart}
                    onPointerMove={handleDrawMove}
                    onPointerUp={finishDrawing}
                    onPointerLeave={finishDrawing}
                    aria-label="Ô vẽ chữ ký"
                  />
                  <div className="signature-actions">
                    <button className="secondary-button" type="button" onClick={clearSignature}>
                      XÓA CHỮ KÝ
                    </button>
                    <button
                      className="primary-button"
                      type="button"
                      disabled={!signatureData}
                      onClick={() => setSigned(true)}
                    >
                      HIỆN CHỮ KÝ
                    </button>
                    <button
                      className="signature-position-button"
                      type="button"
                      disabled={!signed || !signatureData}
                      onClick={saveSignature}
                      aria-label="Lưu vị trí chữ ký"
                      title="Lưu vị trí chữ ký"
                    >
                      ♡
                    </button>
                  </div>
                  <label className="signature-size">
                    <span>KÍCH THƯỚC CHỮ KÝ</span>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={signatureScale}
                      onChange={(event) => setSignatureScale(Number(event.target.value))}
                    />
                    <strong>{Math.round(signatureScale * 100)}%</strong>
                  </label>
                  {savedSignatures.length > 0 && (
                    <p className="saved-signature-count">
                      Đã lưu {savedSignatures.length} chữ ký trên ảnh
                    </p>
                  )}
                </div>
              </div>

              <div
                className="signature-canvas"
                ref={boardRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                <div className="floral-border signature-floral-border" aria-hidden="true">
                  <span className="floral-flower floral-flower-top">✿</span>
                  <span className="floral-flower floral-flower-bottom">✿</span>
                  <i className="floral-leaf floral-leaf-one" />
                  <i className="floral-leaf floral-leaf-two" />
                  <i className="floral-leaf floral-leaf-three" />
                  <i className="floral-leaf floral-leaf-four" />
                </div>
                <div className="heart-portrait">
                  <img
                    src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=90"
                    alt="Cô dâu chú rể trong khung trái tim"
                  />
                </div>
                {savedSignatures.map((signature) => (
                  <img
                    className="signature-sticker saved-signature"
                    key={signature.id}
                    src={signature.data}
                    alt="Chữ ký đã lưu"
                    data-signature-id={signature.id}
                    style={{
                      left: `${signature.x}px`,
                      top: `${signature.y}px`,
                      transform: `scale(${signature.scale})`,
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                  />
                ))}
                {signed && signatureData && (
                  <img
                    className="signature-sticker"
                    src={signatureData}
                    alt="Chữ ký đã vẽ"
                    style={{
                      left: `${signaturePosition.x}px`,
                      top: `${signaturePosition.y}px`,
                      transform: `scale(${signatureScale})`,
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                  />
                )}
              </div>
              <p className="signature-drag-note">Kéo chữ ký trên ảnh để đặt vào vị trí bạn muốn.</p>
            </div>

            <div className="blessing-grid">
              {[
                {
                  role: "Lời cảm ơn từ chú rể",
                  theme: "groom",
                  image: "photo-1519741497674-611481863552",
                  text: "Hữu Tài xin gửi lời cảm ơn chân thành đến gia đình, người thân và bạn bè đã luôn yêu thương, tin tưởng và đồng hành cùng chúng mình trong những chặng đường vừa qua. Sự hiện diện, sẻ chia và những lời chúc tốt đẹp của mọi người là món quà vô cùng ý nghĩa, giúp ngày vui của chúng mình trở nên trọn vẹn hơn.",
                  signature: "Thương mến, Hữu Tài",
                },
                {
                  role: "Lời cảm ơn từ cô dâu",
                  theme: "bride",
                  image: "photo-1520854221256-17451cc331bf",
                  text: "Hà Thủy biết ơn gia đình, người thân và bạn bè đã dành cho chúng mình thật nhiều tình cảm trong ngày đặc biệt này. Cảm ơn mọi người đã luôn ở bên, lắng nghe, động viên và gửi những lời chúc ấm áp. Tình yêu thương ấy sẽ luôn là kỷ niệm đẹp mà chúng mình trân trọng trên hành trình phía trước.",
                  signature: "Thương mến, Hà Thủy",
                },
              ].map(({ role, theme, image, text, signature }) => (
                <div className={`blessing-card blessing-${theme} reveal fade-up`} data-reveal key={role}>
                  <div className="floral-border" aria-hidden="true">
                    <span className="floral-flower floral-flower-top">✿</span>
                    <span className="floral-flower floral-flower-bottom">✿</span>
                    <i className="floral-leaf floral-leaf-one" />
                    <i className="floral-leaf floral-leaf-two" />
                    <i className="floral-leaf floral-leaf-three" />
                    <i className="floral-leaf floral-leaf-four" />
                  </div>
                  <div className="blessing-heading">
                    <div className="blessing-avatar">
                      <img
                        src={`https://images.unsplash.com/${image}?auto=format&fit=crop&w=240&q=85`}
                        alt={theme === "groom" ? "Chú rể Hữu Tài" : "Cô dâu Hà Thủy"}
                      />
                    </div>
                    <p className="blessing-role">{role}</p>
                  </div>
                  <p className="blessing-text">{text}</p>
                  <div className="blessing-signature">{signature}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="section gift-section reveal" data-reveal>
            <p className="eyebrow">WEDDING GIFT</p>
            <h2>Gửi một chút yêu thương tới vợ chồng mình nhé!</h2>

            {!showGiftReveal ? (
              <button
                className="secondary-button reveal-button"
                onClick={() => setShowGiftReveal(true)}
              >
                GIVE A GIFT
              </button>
            ) : (
              <div className="gift-grid reveal fade-up" data-reveal>
                {[
                  {
                    name: "Chú rể",
                    person: "Hữu Tài",
                    bank: "Vietcombank",
                    account: "1234567890",
                    holder: "NGUYỄN HỮU TÀI",
                    qr: "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=VCB%201234567890%20NGUYEN%20HUU%20TAI",
                  },
                  {
                    name: "Cô dâu",
                    person: "Hà Thủy",
                    bank: "Techcombank",
                    account: "0987654321",
                    holder: "HÀ THỊ THỦY",
                    qr: "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=TCB%200987654321%20TRAN%20THI%20HA%20THUY",
                  },
                ].map(({ name, person, bank, account, holder, qr }) => (
                  <div className="gift-card" key={name}>
                    <div className="gift-card-top">
                      <div>
                        <p className="gift-role">{name}</p>
                        <h3>{person}</h3>
                      </div>
                      <img className="qr-code" src={qr} alt={`${person} QR code`} />
                    </div>
                    <div className="bank-info">
                      <div className="bank-row">
                        <span>Ngân hàng</span>
                        <strong>{bank}</strong>
                      </div>
                      <div className="bank-row">
                        <span>Số tài khoản</span>
                        <strong>{account}</strong>
                      </div>
                      <div className="bank-row">
                        <span>Chủ tài khoản</span>
                        <strong>{holder}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="quote-section reveal" data-reveal>
            <div
              className="quote-content"
              style={{
                transform: `translate(calc(-50% + ${quotePosition.x}px), calc(-50% + ${quotePosition.y}px))`,
              }}
            >
              <span>“</span>
              <p>Two souls, one heart, one beautiful journey.</p>
              <small>— Hữu Tài & Hà Thủy —</small>
            </div>
          </section>

          <section id="rsvp" className="section rsvp-section reveal" data-reveal>
            <p className="eyebrow">Yêu Thương</p>
            <h2>Chung vui cùng chúng mình nhé?</h2>
            {sent ? (
              <div className="success">
                <div>♡</div>
                <h3>Cảm ơn bạn!</h3>
                <p>Lời xác nhận của bạn đã được ghi nhận.</p>
                <button
                  type="button"
                  onClick={() => {
                    setRsvpError("");
                    setSent(false);
                  }}
                  className="secondary-button"
                >
                  GỬI LẠI
                </button>
              </div>
            ) : (
              <form onSubmit={submitRsvp} className="rsvp-form reveal fade-up" data-reveal>
                <label>
                  Tên của bạn
                  <input required name="name" placeholder="Nguyễn Văn A" />
                </label>
                <label>
                  Bạn có tham dự không?
                  <select name="attendance" value={attendance} onChange={(e) => setAttendance(e.target.value)}>
                    <option value="yes">Có, mình sẽ tham dự ♡</option>
                    <option value="no">Rất tiếc, mình không thể tham dự</option>
                  </select>
                </label>
                <label>
                  Số người tham dự
                  <input required name="guests" min="1" max="20" type="number" defaultValue="1" />
                </label>
                <label>
                  Lời nhắn
                  <textarea name="message" rows={4} placeholder="Gửi lời chúc đến cô dâu chú rể..." />
                </label>
                {rsvpError && <p className="rsvp-error">{rsvpError}</p>}
                <button className="primary-button" type="submit">XÁC NHẬN</button>
              </form>
            )}
            {wishes.length > 0 && (
              <div className="wish-wall">
                <p className="wish-wall-title">LỜI CHÚC TỪ BẠN BÈ</p>
                <div className="wish-list">
                  {wishes.map((wish, index) => (
                    <article className={`wish-card wish-color-${(index * 5 + 2) % 8}`} key={wish.id}>
                      <span>“</span>
                      <p>{wish.message || "Hẹn gặp hai bạn trong ngày đặc biệt!"}</p>
                      <strong>{wish.name}</strong>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>

          <footer>
            <p className="eyebrow">WITH LOVE</p>
            <h2>Hữu Tài & Hà Thủy</h2>
            <p>15 · 10 · 2026</p>
            {musicError && <p className="music-error"></p>}
          </footer>
        </>
      )}
    </main>
  );
}