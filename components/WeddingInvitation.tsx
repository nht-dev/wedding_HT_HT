"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const EVENT_DATE = new Date("2026-10-15T11:00:00+07:00").getTime();
const MUSIC_SRC = "/audio/vay-cuoi.mp3";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export default function WeddingInvitation() {
  const [opened, setOpened] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [music, setMusic] = useState(true);
  const [musicError, setMusicError] = useState(false);
  const [attendance, setAttendance] = useState("yes");
  const [sent, setSent] = useState(false);
  const [signaturePosition, setSignaturePosition] = useState({ x: 210, y: 180 });
  const [signatureData, setSignatureData] = useState("");
  const [signed, setSigned] = useState(false);
  const [showCoupleReveal, setShowCoupleReveal] = useState(false);
  const [showGiftReveal, setShowGiftReveal] = useState(false);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const signatureRef = useRef<HTMLImageElement | null>(null);
  const signaturePadRef = useRef<HTMLCanvasElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const isDrawingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
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

  const submitRsvp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
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
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const board = boardRef.current;
    const signature = signatureRef.current;
    if (!board || !signature) return;

    const signatureRect = signature.getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - signatureRect.left,
      y: event.clientY - signatureRect.top,
    };

    isDraggingRef.current = true;
    board.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !boardRef.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const maxX = boardRect.width - 180;
    const maxY = boardRect.height - 60;

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

    setSignaturePosition({ x: nextX, y: nextY });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    boardRef.current?.releasePointerCapture(event.pointerId);
  };

  return (
    <main>
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
              <a href="#rsvp">RSVP</a>
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
            <div className="scroll">SCROLL ↓</div>
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
                <img src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=85" alt="Couple" />
                <div className="story-note">
                  <span>15 / 10 / 2026</span>
                  <h3>And so the adventure begins...</h3>
                  <p>
                    Cảm ơn vì đã trở thành một phần trong hành trình của chúng
                    mình.
                  </p>
                </div>
              </div>
            )}
          </section>

          <section id="event" className="section event-section reveal" data-reveal>
            <p className="eyebrow">SAVE THE DATE</p>
            <h2>THE WEDDING</h2>
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
              <div>
                <span className="event-icon">♡</span>
                <h3>Wedding Ceremony</h3>
                <p>18:00 · Thứ Ba</p>
                <p>15 tháng 10, 2026</p>
              </div>
              <div>
                <span className="event-icon">⌖</span>
                <h3>ABC Wedding Center</h3>
                <p>123 Phố Hoàng Diệu</p>
                <p>Ba Đình, Hà Nội</p>
                <a
                  className="text-link"
                  href="https://www.google.com/maps/search/?api=1&query=Hanoi"
                  target="_blank"
                  rel="noreferrer"
                >
                  XEM BẢN ĐỒ →
                </a>
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
                  items: [
                    ["10:30", "Chuẩn bị", "Gia đình chuẩn bị tiệc và đón khách"],
                    ["12:00", "Đón khách", "Mời khách tới dự lễ và chụp hình"],
                    ["15:30", "Sắp xếp nghi thức", "Ổn định sân khấu, âm thanh và lễ tân"],
                  ],
                },
                {
                  label: "Nhà gái",
                  items: [
                    ["09:30", "Chuẩn bị", "Trang trí nhà cửa và làm đẹp cho cô dâu"],
                    ["11:00", "Đón khách", "Tiếp đón người thân và bạn bè"],
                    ["14:30", "Gửi xe và đồng hành", "Gia đình hỗ trợ lễ nghi và di chuyển"],
                  ],
                },
              ].map(({ label, items }) => (
                <div className="timeline-column reveal fade-up" data-reveal key={label}>
                  <p className="timeline-label">{label}</p>
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

          <section className="section location-section reveal" data-reveal>
            <p className="eyebrow">LOCATION</p>
            <h2>Nhà trai & nhà gái</h2>
            <div className="location-grid">
              {[
                {
                  label: "Nhà trai",
                  address: "123 Phố Hoàng Diệu, Ba Đình, Hà Nội",
                  map: "https://www.google.com/maps?q=123+Ph%E1%BB%91+Ho%C3%A0ng+Di%E1%BB%87u+Ba+%C4%90%C3%ACnh+H%C3%A0+N%E1%BB%99i&output=embed",
                },
                {
                  label: "Nhà gái",
                  address: "456 Đường Trần Duy Hưng, Cầu Giấy, Hà Nội",
                  map: "https://www.google.com/maps?q=456+%C4%90%C6%B0%E1%BB%9Dng+Tr%E1%BA%A7n+Duy+H%C6%B0ng+C%E1%BA%A7u+Gi%E1%BA%A5y+H%C3%A0+N%E1%BB%99i&output=embed",
                },
              ].map(({ label, address, map }) => (
                <div className="location-card reveal fade-up" data-reveal key={label}>
                  <div className="location-info">
                    <span className="event-icon">⌖</span>
                    <h3>{label}</h3>
                    <p>{address}</p>
                    <a
                      className="text-link"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      XEM BẢN ĐỒ →
                    </a>
                  </div>
                  <iframe
                    title={label}
                    src={map}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="section blessing-section reveal" data-reveal>
            <p className="eyebrow">CONGRATULATIONS</p>
            <h2>Ký tên chúc mừng</h2>

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
                      ĐẶT CHỮ KÝ VÀO ẢNH
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="signature-canvas"
                ref={boardRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                <img
                  src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=90"
                  alt="Couple frame"
                />
                {signed && signatureData && (
                  <img
                    ref={signatureRef}
                    className="signature-sticker"
                    src={signatureData}
                    alt="Chữ ký đã vẽ"
                    style={{ left: `${signaturePosition.x}px`, top: `${signaturePosition.y}px` }}
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
                  role: "Gia đình nhà trai",
                  text: "Trân trọng kính mời cùng chúc mừng hạnh phúc mới cho hai bên gia đình.",
                  signature: "Ký tên: Gia đình nhà trai",
                },
                {
                  role: "Gia đình nhà gái",
                  text: "Xin gửi lời chúc mừng nồng nhiệt và những niềm vui trọn vẹn trong ngày cưới.",
                  signature: "Ký tên: Gia đình nhà gái",
                },
              ].map(({ role, text, signature }) => (
                <div className="blessing-card reveal fade-up" data-reveal key={role}>
                  <p className="blessing-role">{role}</p>
                  <p className="blessing-text">{text}</p>
                  <div className="blessing-signature">{signature}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="section gift-section reveal" data-reveal>
            <p className="eyebrow">WEDDING GIFT</p>
            <h2>Mừng cưới chú rể và cô dâu</h2>

            {!showGiftReveal ? (
              <button
                className="secondary-button reveal-button"
                onClick={() => setShowGiftReveal(true)}
              >
                MỪNG CƯỚI
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

          <section id="gallery" className="section gallery-section reveal" data-reveal>
            <p className="eyebrow">OUR MEMORIES</p>
            <h2>Moments</h2>
            <div className="gallery">
              {[
                "photo-1511285560929-80b456fea0bc",
                "photo-1460364157752-9267c1b7a7c8",
                "photo-1523438885200-e635ba2c371e",
                "photo-1519225421980-715cb0215aed",
                "photo-1517841905240-472988babdf9",
                "photo-1513278974582-3e6b8d3b3a6a",
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

          <section className="quote-section reveal" data-reveal>
            <div>
              <span>“</span>
              <p>Two souls, one heart, one beautiful journey.</p>
              <small>— Hữu Tài & Hà Thủy —</small>
            </div>
          </section>

          <section id="rsvp" className="section rsvp-section reveal" data-reveal>
            <p className="eyebrow">RSVP</p>
            <h2>Will you join us?</h2>
            {sent ? (
              <div className="success">
                <div>♡</div>
                <h3>Cảm ơn bạn!</h3>
                <p>Lời xác nhận của bạn đã được ghi nhận.</p>
                <button onClick={() => setSent(false)} className="secondary-button">
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
                  <select value={attendance} onChange={(e) => setAttendance(e.target.value)}>
                    <option value="yes">Có, mình sẽ tham dự ♡</option>
                    <option value="no">Rất tiếc, mình không thể tham dự</option>
                  </select>
                </label>
                <label>
                  Số người tham dự
                  <input required min="1" max="20" type="number" defaultValue="1" />
                </label>
                <label>
                  Lời nhắn
                  <textarea rows={4} placeholder="Gửi lời chúc đến cô dâu chú rể..." />
                </label>
                <button className="primary-button" type="submit">XÁC NHẬN</button>
              </form>
            )}
          </section>

          <footer>
            <p className="eyebrow">WITH LOVE</p>
            <h2>Hữu Tài & Hà Thủy</h2>
            <p>15 · 10 · 2026</p>
            {musicError && <p className="music-error">Chưa tìm thấy file nhạc trong thư mục public/audio.</p>}
            <p className="footer-note">
              * Demo: RSVP hiện chỉ chạy ở phía trình duyệt. Có thể kết nối
              Supabase/Vercel Postgres sau.
            </p>
          </footer>
        </>
      )}
    </main>
  );
}