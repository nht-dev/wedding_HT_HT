"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

const EVENT_DATE = new Date("2026-10-15T11:00:00+07:00").getTime();
const SAVED_SIGNATURES_KEY = "wedding-saved-signatures";
const GROOM_MAP_URL = "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d933.0468070926343!2d105.4565710965466!3d19.97122584026793!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2s!4v1788414900773!5m2!1sen!2s";
const BRIDE_MAP_URL = "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d658.8001155960343!2d104.86627166744569!3d20.20024267734962!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2s!4v1788414966559!5m2!1sen!2s";
const FALLING_HEARTS = Array.from({ length: 10 }, (_, index) => ({
  id: index,
  left: `${(index * 23 + 5) % 97}%`,
  delay: `${(index * 1.17) % 9}s`,
  duration: `${10 + (index % 5)}s`,
  size: `${0.48 + (index % 4) * 0.08}`,
  opacity: `${0.34 + (index % 5) * 0.11}`,
}));

type StoryVisualProps = {
  background: string;
  label: string;
  slides: string[];
};

function StoryVisual({
  background,
  label,
  slides,
}: StoryVisualProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideTransition, setSlideTransition] = useState(0);
  const swipeStartRef = useRef<{ id: number; x: number } | null>(null);
  const currentSlide = slides[activeSlide] ?? slides[0];

  useEffect(() => {
    setActiveSlide((current) => Math.min(current, Math.max(slides.length - 1, 0)));
  }, [slides.length]);

  const changeSlide = (direction: 1 | -1) => {
    if (slides.length < 2) return;
    setSlideTransition(Math.floor(Math.random() * 4) + 1);
    setActiveSlide((current) => (current + direction + slides.length) % slides.length);
  };

  const handleSwipeStart = (event: React.PointerEvent<HTMLDivElement>) => {
    swipeStartRef.current = { id: event.pointerId, x: event.clientX };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSwipeEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const swipeStart = swipeStartRef.current;
    if (!swipeStart || swipeStart.id !== event.pointerId) return;

    swipeStartRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const distance = event.clientX - swipeStart.x;
    if (Math.abs(distance) < 40 || slides.length < 2) return;

    changeSlide(distance < 0 ? 1 : -1);
  };

  return (
    <div
      className="story-visual"
      aria-label={label}
      onPointerDown={handleSwipeStart}
      onPointerUp={handleSwipeEnd}
      onPointerCancel={() => { swipeStartRef.current = null; }}
    >
      <Image
        className="story-photo-background"
        src={background}
        alt={label}
        width={1200}
        height={1200}
        quality={45}
      />

      <div className="story-slides">
        {currentSlide && (
          <Image
            className={`story-slide story-slide-current story-slide-transition-${slideTransition}`}
            key={currentSlide}
            src={currentSlide}
            alt={`Khoảnh khắc cưới ${activeSlide + 1}`}
            width={800}
            height={800}
            quality={45}
          />
        )}
      </div>
      {slides.length > 1 && (
        <div className="story-controls">
          <button
            type="button"
            className="story-control story-control-previous"
            aria-label="Ảnh trước"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => changeSlide(-1)}
          >
            ←
          </button>
          <button
            type="button"
            className="story-control story-control-next"
            aria-label="Ảnh tiếp theo"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => changeSlide(1)}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

function GalleryCarousel({ images }: { images: string[] }) {
  const [activeImage, setActiveImage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [transition, setTransition] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const currentImage = images[activeImage] ?? images[0];

  useEffect(() => {
    setActiveImage((current) => Math.min(current, Math.max(images.length - 1, 0)));
  }, [images.length]);

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.2 }
    );
    observer.observe(gallery);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || images.length < 2) return;
    const timer = window.setInterval(() => {
      setTransition(Math.floor(Math.random() * 3) + 1);
      setActiveImage((current) => (current + 1) % images.length);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [images.length, isVisible]);

  const changeImage = (direction: 1 | -1) => {
    if (images.length < 2) return;
    setTransition(Math.floor(Math.random() * 3) + 1);
    setActiveImage((current) => (current + direction + images.length) % images.length);
  };

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowLeft") changeImage(-1);
      if (event.key === "ArrowRight") changeImage(1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, images.length]);

  if (!currentImage) return null;

  return (
    <div className="gallery" ref={galleryRef}>
      <Image
        className="gallery-blur-backdrop"
        src={currentImage}
        alt=""
        width={1200}
        height={900}
        quality={35}
        aria-hidden="true"
      />
      <Image
        className={`gallery-carousel-image gallery-transition-${transition}`}
        key={currentImage}
        src={currentImage}
        alt={`Wedding moment ${activeImage + 1}`}
        width={1200}
        height={900}
        quality={45}
        loading="lazy"
        onClick={() => setLightboxOpen(true)}
      />
      {images.length > 1 && (
        <>
          <button
            type="button"
            className="gallery-control gallery-control-previous"
            aria-label="Ảnh trước"
            onClick={() => changeImage(-1)}
          >
            ←
          </button>
          <button
            type="button"
            className="gallery-control gallery-control-next"
            aria-label="Ảnh tiếp theo"
            onClick={() => changeImage(1)}
          >
            →
          </button>
          <p className="gallery-count" aria-live="polite">
            {activeImage + 1} / {images.length}
          </p>
        </>
      )}
      {lightboxOpen && currentImage && (
        <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label="Xem ảnh kỷ niệm lớn" onClick={() => setLightboxOpen(false)}>
          <button
            type="button"
            className="gallery-lightbox-close"
            aria-label="Đóng ảnh lớn"
            onClick={() => setLightboxOpen(false)}
          >
            ×
          </button>
          <button
            type="button"
            className="gallery-lightbox-control gallery-lightbox-previous"
            aria-label="Ảnh trước"
            onClick={(event) => { event.stopPropagation(); changeImage(-1); }}
          >
            ←
          </button>
          <Image
            className="gallery-lightbox-image"
            src={currentImage}
            alt={`Wedding moment ${activeImage + 1}`}
            width={1800}
            height={1350}
            quality={75}
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            className="gallery-lightbox-control gallery-lightbox-next"
            aria-label="Ảnh tiếp theo"
            onClick={(event) => { event.stopPropagation(); changeImage(1); }}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function TimelineCard({
  item,
  theme,
  image,
  mapSrc,
  mapTitle,
}: {
  item: string[] | null;
  theme: "groom" | "bride";
  image?: string;
  mapSrc?: string;
  mapTitle?: string;
}) {
  if (!item) {
    return (
      <article className={`timeline-card timeline-card-${theme} timeline-card-empty`}>
        {mapSrc ? (
          <iframe
            className="timeline-map"
            title={mapTitle ?? "Bản đồ địa điểm tổ chức"}
            src={mapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <img
            src={image ?? "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=700&q=82"}
            alt="Khoảnh khắc chuẩn bị ngày cưới"
          />
        )}
      </article>
    );
  }

  const [time, title, description] = item;
  return (
    <article className={`timeline-card timeline-card-${theme}`}>
      <time>{time}</time>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

export default function WeddingInvitation() {
  const [opened, setOpened] = useState(false);
  const [opening, setOpening] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [music, setMusic] = useState(true);
  const [musicError, setMusicError] = useState(false);
  const [musicPlaylist, setMusicPlaylist] = useState<string[]>([]);
  const [storySlides, setStorySlides] = useState<string[][]>([[], [], []]);
  const galleries = useMemo(() => storySlides.flat(), [storySlides]);
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
  const [giftAnimating, setGiftAnimating] = useState(false);
  const [qrPreview, setQrPreview] = useState<{ src: string; person: string } | null>(null);
  const [savedSignaturesLoaded, setSavedSignaturesLoaded] = useState(false);
  const [currentTrack, setCurrentTrack] = useState("");
  const heartRainRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const signaturePadRef = useRef<HTMLCanvasElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const draggingSavedSignatureRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const isDrawingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef(currentTrack);

  useEffect(() => {
    fetch("/api/audio")
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
        const tracks = Array.isArray(result?.tracks) ? result.tracks : [];
        setMusicPlaylist(tracks);
        if (tracks[0]) {
          currentTrackRef.current = tracks[0];
          setCurrentTrack(tracks[0]);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    fetch("/api/story-slides")
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
        if (Array.isArray(result?.slides)) {
          setStorySlides(result.slides.map((slides: unknown) =>
            Array.isArray(slides) ? slides.filter((slide): slide is string => typeof slide === "string") : []
          ));
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const heartRain = heartRainRef.current;
    if (!heartRain) return;

    let previousScrollY = window.scrollY;
    let previousTime = performance.now();
    let settleTimer = 0;

    const handleScroll = () => {
      const currentTime = performance.now();
      const elapsed = Math.max(currentTime - previousTime, 16);
      const distance = Math.abs(window.scrollY - previousScrollY);

      previousScrollY = window.scrollY;
      previousTime = currentTime;
      if (distance / elapsed < 0.35) return;

      heartRain.classList.add("is-scroll-rushing");
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        heartRain.classList.remove("is-scroll-rushing");
      }, 180);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.clearTimeout(settleTimer);
    };
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

  const chooseNextTrack = (trackToAvoid = currentTrackRef.current) => {
    const availableTracks = musicPlaylist.filter((track) => track !== trackToAvoid);
    const nextTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)] ?? musicPlaylist[0] ?? "";
    currentTrackRef.current = nextTrack;
    setCurrentTrack(nextTrack);
    return nextTrack;
  };

  const startTrack = (track: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = track;
    audio.currentTime = 0;
    audio.load();
    audio.play().catch(() => setMusicError(true));
  };

  const playNextTrack = () => {
    const nextTrack = chooseNextTrack();
    startTrack(nextTrack);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.8;
    if (music) {
      audio.play().catch(() => setMusicError(true));
    } else {
      audio.pause();
    }
  }, [music, opened, currentTrack]);

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
      <div className="heart-rain" ref={heartRainRef} aria-hidden="true">
        {FALLING_HEARTS.map((heart) => (
          <span
            className="falling-heart"
            key={heart.id}
            style={
              {
                left: heart.left,
                animationDelay: heart.delay,
                "--heart-duration": heart.duration,
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
      <audio ref={audioRef} src={currentTrack || undefined} onEnded={playNextTrack} preload="auto" />
      {!opened && (
        <section className={`cover${opening ? " is-opening" : ""}`}>
          <div className="cover-overlay" />
          <div className="tri-fold-invitation" aria-hidden="true">
            <div className="fold-panel fold-panel-left">
              <span>Hữu Tài</span>
            </div>
            <div className="fold-panel fold-panel-center">
              <span></span>
            </div>
            <div className="fold-panel fold-panel-right">
              <span>Hà Thủy</span>
            </div>
          </div>
          <div className="cover-content reveal fade-up" data-reveal>
            <p className="eyebrow cover-wedding-label">THE WEDDING OF</p>
            <p className="cover-date">15 · 10 · 2026</p>
            <button
              className="primary-button cover-open-button"
              aria-label="Mở thiệp cưới T và T"
              disabled={opening}
              onClick={() => {
                if (opening) return;
                setOpening(true);
                const selectedTrack = chooseNextTrack("");
                const audio = audioRef.current;
                if (audio) {
                  audio.volume = 1;
                  audio.currentTime = 0;
                  startTrack(selectedTrack);
                  setMusic(true);
                }
                window.setTimeout(() => setOpened(true), 900);
              }}
            >
              <span>Mở</span>
              <i>❤️</i>
              <span>Thiệp</span>
            </button>
            <p className="hint cover-hint">Một lời mời nhỏ, một ngày thật đặc biệt. Hãy cùng chúng mình lưu giữ khoảnh khắc đáng nhớ.</p>
          </div>
        </section>
      )}

      {opened && (
        <>
          <nav className={`nav${navOpen ? " is-open" : ""}`}>
            <div className="couple-mark" aria-label="Hữu Tài và Hà Thủy">
              <span className="couple-mark-groom">Hữu Tài</span>
              <span className="couple-mark-join">&amp;</span>
              <span className="couple-mark-bride">Hà Thủy</span>
            </div>
            <button
              type="button"
              className="nav-toggle"
              aria-label={navOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={navOpen}
              onClick={() => setNavOpen((current) => !current)}
            >
              <span />
              <span />
              <span />
            </button>
            <div className="nav-links">
              <a href="#story" onClick={() => setNavOpen(false)}>Câu Chuyện Chúng Tôi</a>
              <a href="#event" onClick={() => setNavOpen(false)}>The Wedding</a>
              <a href="#timeline" onClick={() => setNavOpen(false)}>Timeline</a>
              <a href="#gallery" onClick={() => setNavOpen(false)}>Thư Viện</a>
              <a href="#blessing" onClick={() => setNavOpen(false)}>Kỷ Niệm</a>
              <a href="#gift" onClick={() => setNavOpen(false)}>Gift</a>
              <a href="#rsvp" onClick={() => setNavOpen(false)}>Tham dự?</a>
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
              <div className="hero-event-meta">
                <div className="hero-event-topline">
                  <span>THỨ NĂM</span>
                  <i className="hero-event-divider" aria-hidden="true" />
                  <span>15.10.2026</span>
                </div>
                <p>THANH HÓA</p>
              </div>
            </div>
            <div className="scroll">Kéo xuống↓</div>
          </section>

          <section id="story" className="section story reveal" data-reveal>
            <p className="eyebrow">Câu Chuyện Chúng Tôi</p>
            <h2>Một câu chuyện bắt đầu từ một cuộc gặp gỡ.</h2>
            <p className="lead">
              Có những cuộc gặp gỡ tưởng như tình cờ, nhưng lại trở thành điều
              đẹp nhất trong cuộc đời. Chúng mình rất vui khi được chia sẻ
              khoảnh khắc đặc biệt này cùng những người thân yêu.
            </p>

            {!showCoupleReveal ? (
              <button
                className="secondary-button reveal-button couple-reveal-button"
                onClick={() => setShowCoupleReveal(true)}
              >
                XEM ẢNH CÔ DÂU CHÚ RỂ
              </button>
            ) : (
              <div className="story-grid reveal fade-up" data-reveal>
                <article className="story-entry story-entry-left">
                  <StoryVisual
                    background="/pictures/HTH_0305.JPG"
                    label="Câu chuyện của chúng mình"
                    slides={storySlides[0]}
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
                    background="/pictures/HTH_0194.JPG"
                    label="Câu chuyện của chúng mình"
                    slides={storySlides[1]}
                  />
                </article>
                <article className="story-entry story-entry-center">
                  <div className="story-note">
                    <span className="promise-label">OUR PROMISE</span>
                    <p className="promise-text">Mỗi ngày bên nhau là một trang mới.</p>
                  </div>
                  <StoryVisual
                    background="/pictures/slide3/HTH_9996.jpg"
                    label="Câu chuyện của chúng mình"
                    slides={storySlides[2]}
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

          </section>

          <section id="timeline" className="section timeline-section reveal" data-reveal>
            <p className="eyebrow">THE DAY</p>
            <h2>Wedding Timeline</h2>
            <div className="timeline-grid">
              <div className="timeline-side-label timeline-side-label-groom">
                <span>♢</span> NHÀ TRAI
              </div>
              <div className="timeline-side-label timeline-side-label-bride">
                NHÀ GÁI <span>♡</span>
              </div>
              <div className="timeline-rail" aria-hidden="true" />
              <div className="timeline-shared-row timeline-row">
                <article className="timeline-shared-card">
                  <time>14/10 · 08:00 - 20:00</time>
                  <h3>Mời khách &amp; giao lưu văn nghệ</h3>
                  <p>Đón tiếp người thân, bạn bè, dùng tiệc và cùng nhau ca hát trong ngày hội của hai gia đình.</p>
                </article>
              </div>
              {[
                ["15/10 · 06:30", null, ["15/10 · 06:30", "Chuẩn bị lễ cưới", "Gia đình chuẩn bị lễ vật, không gian và cô dâu cho ngày vui"]],
                ["15/10 · 07:30", null, ["15/10 · 07:30", "Lễ vu quy", "Gia đình làm lễ, dặn dò và trao gửi cô dâu về nhà chồng"]],
                ["15/10 · 08:05", ["15/10 · 08:05", "Đón dâu về nhà trai", "Đoàn nhà trai đón cô dâu và cùng gia đình di chuyển về nhà trai"], ["15/10 · 08:05", "Cô dâu về nhà trai", "Tiễn cô dâu cùng đoàn đưa dâu, bắt đầu hành trình về nhà trai"]],
                ["15/10 · 11:00", ["15/10 · 11:00", "Lễ thành hôn", "Gia đình hai bên thực hiện nghi lễ, ra mắt và chúc phúc cho đôi trẻ"], null],
                ["15/10 · 12:30", ["15/10 · 12:30", "Tiệc mừng", "Đón khách, dùng tiệc và chung vui cùng gia đình, người thân, bạn bè"], null],
              ].map(([time, groomItem, brideItem], index) => (
                <div className={`timeline-row timeline-row-${index + 1}`} key={String(time)}>
                  <TimelineCard
                    item={groomItem as string[] | null}
                    theme="groom"
                    image={index === 0
                      ? "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=82"
                      : "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=700&q=82"}
                    mapSrc={index === 1 ? BRIDE_MAP_URL : undefined}
                    mapTitle="Bản đồ nhà gái"
                  />
                  <div className="timeline-arrow" aria-hidden="true">↓</div>
                  <TimelineCard
                    item={brideItem as string[] | null}
                    theme="bride"
                    mapSrc={index === 3 ? GROOM_MAP_URL : undefined}
                    mapTitle="Bản đồ nhà trai"
                  />
                </div>
              ))}
            </div>
          </section>

          <section id="gallery" className="section gallery-section reveal" data-reveal>
            <p className="eyebrow">OUR MEMORIES</p>
            <h2>Moments</h2>
            <GalleryCarousel images={galleries} />
          </section>

          <section id="blessing" className="section blessing-section reveal" data-reveal>
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
                    alt="Cô dâu chú rể trong khung trái tim"
                    src="/pictures/HTH_0305.JPG?auto=format&fit=crop&w=900&q=90"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "right center",
                    }}
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
                  image: "/pictures/alone/HTH_9861.JPG",
                  text: "Hữu Tài xin gửi lời cảm ơn chân thành đến gia đình, người thân và bạn bè đã luôn yêu thương, tin tưởng và đồng hành cùng chúng mình trong những chặng đường vừa qua. Sự hiện diện, sẻ chia và những lời chúc tốt đẹp của mọi người là món quà vô cùng ý nghĩa, giúp ngày vui của chúng mình trở nên trọn vẹn hơn.",
                  signature: "Thương mến, Hữu Tài",
                },
                {
                  role: "Lời cảm ơn từ cô dâu",
                  theme: "bride",
                  image: "/pictures/alone/HTH_9578.jpg",
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
                        src={image + `?auto=format&fit=crop&w=240&q=85`}
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

          <section id="gift" className="section gift-section reveal" data-reveal>
            <p className="eyebrow">WEDDING GIFT</p>
            <h2>Gửi một chút yêu thương tới vợ chồng mình nhé!</h2>

            {!showGiftReveal ? (
              <button
                className={`secondary-button reveal-button gift-transfer-button${giftAnimating ? " is-sending" : ""}`}
                aria-label="Mở thông tin chuyển khoản ngân hàng"
                title="Mở thông tin chuyển khoản ngân hàng"
                disabled={giftAnimating}
                onClick={() => {
                  setGiftAnimating(true);
                  window.setTimeout(() => setShowGiftReveal(true), 520);
                }}
              >
                <span className="gift-money gift-money-left" aria-hidden="true">$</span>
                <span className="gift-transfer-icon" aria-hidden="true">QR</span>
                <span className="gift-money gift-money-right" aria-hidden="true">$</span>
              </button>
            ) : (
              <div className="gift-grid reveal fade-up" data-reveal>
                {[
                  {
                    name: "Chú rể",
                    person: "Hữu Tài",
                    bank: "TP Bank",
                    account: "84688688868",
                    holder: "NGUYỄN HỮU TÀI",
                    qr: "/pictures/QR/Chong_QR.jpg?size=220x220",
                  },
                  {
                    name: "Cô dâu",
                    person: "Hà Thủy",
                    bank: "TP Bank",
                    account: "04229804401",
                    holder: "HÀ THỊ THỦY",
                    qr: "/pictures/QR/Vo_QR.jpg?size=220x220",
                  },
                ].map(({ name, person, bank, account, holder, qr }) => (
                  <div className="gift-card" key={name}>
                    <div className="gift-card-top">
                      <div>
                        <p className="gift-role">{name}</p>
                        <h3>{person}</h3>
                      </div>
                      <button
                        type="button"
                        className="qr-trigger"
                        aria-label={`Xem QR chuyển khoản của ${person}`}
                        onClick={() => setQrPreview({ src: qr, person })}
                      >
                        <img className="qr-code" src={qr} alt={`${person} QR code`} />
                      </button>
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
            {qrPreview && (
              <div
                className="qr-lightbox"
                role="dialog"
                aria-modal="true"
                aria-label={`QR chuyển khoản của ${qrPreview.person}`}
                onClick={() => setQrPreview(null)}
              >
                <div className="qr-lightbox-panel" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className="qr-lightbox-close"
                    aria-label="Đóng QR"
                    onClick={() => setQrPreview(null)}
                  >
                    ×
                  </button>
                  <p>QR chuyển khoản - {qrPreview.person}</p>
                  <img src={qrPreview.src} alt={`QR chuyển khoản của ${qrPreview.person}`} />
                  <a className="primary-button qr-download" href={qrPreview.src} download>
                    TẢI QR VỀ
                  </a>
                </div>
              </div>
            )}
          </section>

          <section className="quote-section reveal" data-reveal>
            <div className="quote-content">
              <span className="quote-mark quote-mark-open">“</span>
              <p>Two souls, one heart, one beautiful journey.</p>
              <span className="quote-mark quote-mark-close">”</span>
              <small className="quote-signature">
                — Hữu Tài <span className="quote-heart" aria-hidden="true">♥</span> Hà Thủy —
              </small>
            </div>
          </section>

          <section id="rsvp" className="section rsvp-section reveal" data-reveal>
            <p className="eyebrow">Tham dự lễ thành hôn</p>
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
            <h2 className="footer-title" aria-label="Hữu Tài và Hà Thủy">
              {"Hữu Tài & Hà Thủy".split("").map((character, index) => (
                <span key={`${character}-${index}`}>
                  {character === " " ? "\u00a0" : character}
                </span>
              ))}
            </h2>
            <p>15 · 10 · 2026</p>
            <p className="footer-credit">A little piece of love, crafted ❤️ by chú rể Hữu Tài</p>
          </footer>
        </>
      )}
    </main>
  );
}
