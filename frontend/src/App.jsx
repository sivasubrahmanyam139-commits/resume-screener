import { useState, useEffect, useRef, useCallback } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --bg: #060910; --surface: #0c1018; --card: #101520;
    --border: rgba(99,179,237,0.12); --accent: #63b3ed;
    --accent2: #f6ad55; --accent3: #68d391; --purple: #a78bfa;
    --text: #e2e8f0; --muted: #4a5568; --glow: 0 0 40px rgba(99,179,237,0.15);
  }
  html { scroll-behavior: smooth; }
  body { background: var(--bg); color: var(--text); font-family: 'Syne', sans-serif; min-height: 100vh; overflow-x: hidden; cursor: none; }

  .cursor-dot {
    position: fixed; width: 8px; height: 8px; background: var(--accent);
    border-radius: 50%; pointer-events: none; z-index: 9999;
    left: 0; top: 0;
    transform: translate(-50%,-50%);
    opacity: 0;
    transition: width 0.15s, height 0.15s, background 0.15s, opacity 0.3s;
    box-shadow: 0 0 10px var(--accent), 0 0 20px var(--accent);
  }
  .cursor-dot.clicking { width: 14px; height: 14px; background: var(--accent2); box-shadow: 0 0 14px var(--accent2); }

  .spotlight { position: fixed; inset: 0; pointer-events: none; z-index: 1; }
  .grid-bg {
    position: fixed; inset: 0;
    background-image: linear-gradient(rgba(99,179,237,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.025) 1px, transparent 1px);
    background-size: 60px 60px; pointer-events: none; z-index: 0;
  }
  .particle-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 2; }
  .orb { position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0; }
  .orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(99,179,237,0.1) 0%, transparent 70%); top: -150px; right: -150px; animation: orbDrift 12s ease-in-out infinite; }
  .orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%); bottom: 0; left: -150px; animation: orbDrift 10s ease-in-out infinite reverse; }
  @keyframes orbDrift { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(30px,-20px) scale(1.05); } 66% { transform: translate(-20px,30px) scale(0.97); } }

  .container { position: relative; z-index: 10; width: 100%; max-width: 960px; margin: 0 auto; padding: 70px 5vw 100px; box-sizing: border-box; }

  @media (max-width: 1200px) { .container { max-width: 100%; padding: 60px 4vw 80px; } }
  @media (max-width: 768px)  { .container { padding: 48px 5vw 60px; } }
  @media (max-width: 480px)  { .container { padding: 32px 4vw 48px; } }

  .header { text-align: center; margin-bottom: 64px; animation: fadeInDown 0.9s cubic-bezier(0.16,1,0.3,1) both; }
  .badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(99,179,237,0.08); border: 1px solid rgba(99,179,237,0.25);
    color: var(--accent); font-family: 'Space Mono', monospace; font-size: 0.68rem;
    letter-spacing: 0.2em; padding: 7px 18px; border-radius: 100px; margin-bottom: 24px;
    animation: pulseBadge 3s ease-in-out infinite;
  }
  .badge-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 6px var(--accent); animation: blinkDot 1.5s ease-in-out infinite; }
  @keyframes pulseBadge { 0%,100% { box-shadow: none; } 50% { box-shadow: 0 0 20px rgba(99,179,237,0.15); } }
  @keyframes blinkDot { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }
  .title { font-size: clamp(3rem, 7vw, 5rem); font-weight: 800; line-height: 1.05; letter-spacing: -0.03em; margin-bottom: 20px; }
  .title-plain { color: var(--text); }
  .title-grad { background: linear-gradient(135deg, var(--accent) 0%, var(--purple) 60%, #f472b6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .subtitle { color: var(--muted); font-size: clamp(0.9rem, 2vw, 1.05rem); max-width: 560px; margin: 0 auto; line-height: 1.7; }

  .tilt-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 22px; padding: clamp(20px, 4vw, 38px);
    margin-bottom: 20px; position: relative; overflow: hidden; transform-style: preserve-3d;
    will-change: transform; transition: box-shadow 0.3s ease;
    animation: fadeInUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s both;
  }
  .tilt-card::before {
    content: ''; position: absolute; inset: 0; border-radius: 22px;
    background: radial-gradient(600px circle at var(--mx,50%) var(--my,50%), rgba(99,179,237,0.06), transparent 40%);
    pointer-events: none; opacity: 0; transition: opacity 0.3s;
  }
  .tilt-card:hover::before { opacity: 1; }
  .card-shine { position: absolute; inset: 0; border-radius: 22px; background: radial-gradient(300px circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.04), transparent 60%); pointer-events: none; }

  .section-label { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); }
  .label-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; box-shadow: 0 0 8px currentColor; animation: blinkDot 2s ease-in-out infinite; }

  .upload-zone {
    border: 1.5px dashed rgba(99,179,237,0.2); border-radius: 14px; padding: 30px;
    text-align: center; cursor: none; position: relative;
    transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); background: rgba(99,179,237,0.02); overflow: hidden;
  }
  .upload-zone:hover { border-color: rgba(99,179,237,0.6); background: rgba(99,179,237,0.05); transform: translateY(-3px) scale(1.005); box-shadow: 0 10px 30px rgba(99,179,237,0.1); }
  .upload-zone.has-file { border-color: rgba(104,211,145,0.5); background: rgba(104,211,145,0.04); }
  .upload-zone input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: none; width: 100%; height: 100%; }
  .upload-icon { font-size: 2.2rem; display: block; margin-bottom: 10px; transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1); }
  .upload-zone:hover .upload-icon { transform: translateY(-6px) scale(1.15) rotate(-5deg); }
  .upload-text { font-size: 0.88rem; color: var(--muted); font-family: 'Space Mono', monospace; }
  .file-confirmed { display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--accent3); font-size: 0.85rem; font-family: 'Space Mono', monospace; font-weight: 700; animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1); }
  @keyframes popIn { from { transform: scale(0.6) rotate(-5deg); opacity: 0; } to { transform: scale(1) rotate(0); opacity: 1; } }

  .divider { height: 1px; background: linear-gradient(90deg, transparent, var(--border), transparent); margin: 30px 0; }

  .btn {
    width: 100%; padding: 20px; border: none; border-radius: 14px;
    font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 800; letter-spacing: 0.04em;
    cursor: none; position: relative; overflow: hidden;
    transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%); color: white;
    box-shadow: 0 4px 24px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .btn:hover:not(:disabled) { transform: translateY(-3px) scale(1.01); box-shadow: 0 12px 40px rgba(99,102,241,0.55); }
  .btn:active:not(:disabled) { transform: scale(0.98); }
  .btn:disabled { background: linear-gradient(135deg, #1a2035, #2d3748); box-shadow: none; opacity: 0.7; }
  .btn-shimmer { position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent); animation: shimmer 2.5s infinite; }
  @keyframes shimmer { to { left: 100%; } }
  .loading-track { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: rgba(0,0,0,0.3); border-radius: 0 0 14px 14px; overflow: hidden; }
  .loading-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--purple), var(--accent2)); background-size: 200%; animation: loadSlide 1.5s ease-in-out infinite, gradShift 2s linear infinite; }
  @keyframes loadSlide { 0% { width: 0%; margin-left: 0; } 50% { width: 70%; margin-left: 15%; } 100% { width: 0%; margin-left: 100%; } }
  @keyframes gradShift { to { background-position: 200%; } }

  .error-box { background: rgba(252,129,129,0.08); border: 1px solid rgba(252,129,129,0.3); color: #fc8181; padding: 12px 18px; border-radius: 10px; font-size: 0.83rem; margin-bottom: 18px; font-family: 'Space Mono', monospace; animation: shake 0.4s ease; }
  @keyframes shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }

  .results-wrap { animation: fadeInUp 0.5s ease both; }
  .results-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .results-title { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.02em; }
  .results-meta { font-family: 'Space Mono', monospace; font-size: 0.72rem; color: var(--muted); background: var(--card); border: 1px solid var(--border); padding: 5px 14px; border-radius: 100px; }

  .result-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 18px;
    padding: clamp(16px, 3vw, 26px) clamp(16px, 3vw, 26px) clamp(16px, 3vw, 26px) clamp(20px, 3.5vw, 30px);
    margin-bottom: 14px; position: relative; overflow: hidden;
    transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
    transform-style: preserve-3d; will-change: transform;
  }
  .result-card::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(400px circle at var(--mx,50%) var(--my,50%), rgba(99,179,237,0.05), transparent 50%);
    opacity: 0; transition: opacity 0.3s; pointer-events: none;
  }
  .result-card:hover::before { opacity: 1; }
  .rank-bar { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 18px 0 0 18px; transition: width 0.3s ease; }
  .result-card:hover .rank-bar { width: 6px; }
  .result-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .result-name { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 0.95rem; }
  .score-badge { font-family: 'Space Mono', monospace; font-size: 0.82rem; font-weight: 700; padding: 5px 14px; border-radius: 100px; transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
  .result-card:hover .score-badge { transform: scale(1.08); }
  .score-track { height: 3px; background: rgba(255,255,255,0.05); border-radius: 100px; margin: 8px 0 14px; overflow: hidden; }
  .score-fill { height: 100%; border-radius: 100px; transition: width 1.4s cubic-bezier(0.34,1.56,0.64,1); }
  .result-reason { color: var(--muted); font-size: 0.875rem; line-height: 1.65; }

  .reaction-toast {
    position: fixed; bottom: 40px; right: 40px;
    background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
    padding: 14px 22px; font-size: 0.88rem; font-family: 'Space Mono', monospace;
    z-index: 1000; display: flex; align-items: center; gap: 10px;
    box-shadow: var(--glow); pointer-events: none;
    animation: toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
  }
  .reaction-toast.hide { animation: toastOut 0.3s ease forwards; }
  @keyframes toastIn { from { transform: translateY(20px) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
  @keyframes toastOut { to { transform: translateY(10px) scale(0.95); opacity: 0; } }

  .ripple { position: fixed; border-radius: 50%; border: 1.5px solid rgba(99,179,237,0.4); pointer-events: none; z-index: 5; animation: rippleOut 0.6s ease forwards; transform: translate(-50%,-50%); }
  @keyframes rippleOut { from { width: 0; height: 0; opacity: 1; } to { width: 80px; height: 80px; opacity: 0; } }

  @keyframes fadeInDown { from { opacity: 0; transform: translateY(-24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
`;

const RANKS = [
  { color: "#f6ad55", bg: "rgba(246,173,85,0.12)",   emoji: "🥇" },
  { color: "#a0aec0", bg: "rgba(160,174,192,0.12)",  emoji: "🥈" },
  { color: "#ed8936", bg: "rgba(237,137,54,0.12)",   emoji: "🥉" },
  { color: "#63b3ed", bg: "rgba(99,179,237,0.1)",    emoji: "🎯" },
  { color: "#68d391", bg: "rgba(104,211,145,0.1)",   emoji: "📋" },
];

const TOASTS = {
  upload_jd:     { msg: "📄 JD locked in!",       color: "#63b3ed" },
  upload_resume: { msg: "👥 Resumes loaded!",      color: "#f6ad55" },
  analyzing:     { msg: "🧠 AI is thinking...",    color: "#a78bfa" },
  done:          { msg: "✅ Ranking complete!",     color: "#68d391" },
  hover_result:  { msg: "👀 Inspecting candidate", color: "#63b3ed" },
  error:         { msg: "⚠ Something went wrong", color: "#fc8181" },
};

function ScoreBar({ score, color, go }) {
  const [w, setW] = useState(0);
  useEffect(() => { if (go) setTimeout(() => setW(score), 120); }, [go, score]);
  return (
    <div className="score-track">
      <div className="score-fill" style={{ width: `${w}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
    </div>
  );
}

// ✅ Fix: ResultCard as its own component so useRef is called at top level, not inside map()
function ResultCard({ r, i, goAnim, showToast }) {
  const cardRef = useRef(null);
  const lastHoverToast = useRef(0);
  const cfg = RANKS[i] || RANKS[4];

  const handleMouseMove = (e) => {
    const el = cardRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    el.style.transform = `translateX(8px) rotateY(${dx * 4}deg) rotateX(${-dy * 3}deg) scale(1.005)`;
    el.style.boxShadow = `${-dx * 8}px ${-dy * 8}px 30px rgba(99,179,237,0.1)`;
    el.style.setProperty("--mx", ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + "%");
    el.style.setProperty("--my", ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + "%");
    const now = Date.now();
    if (now - lastHoverToast.current > 3000) { showToast("hover_result"); lastHoverToast.current = now; }
  };

  const handleMouseLeave = () => {
    const el = cardRef.current; if (!el) return;
    el.style.transform = "";
    el.style.boxShadow = "";
  };

  return (
    <div
      ref={cardRef}
      className="result-card"
      style={{ animation: `fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s both` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="rank-bar" style={{ background: `linear-gradient(180deg,${cfg.color},${cfg.color}88)` }} />
      <div className="result-top">
        <div className="result-name">
          <span style={{ fontSize: "1.2rem" }}>{cfg.emoji}</span>
          {r.name.replace(".pdf", "")}
        </div>
        <div className="score-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44` }}>
          {r.score}/100
        </div>
      </div>
      <ScoreBar score={r.score} color={cfg.color} go={goAnim} />
      <div className="result-reason">{r.reason}</div>
    </div>
  );
}

export default function App() {
  const [jd, setJd]           = useState(null);
  const [resumes, setResumes] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [goAnim, setGoAnim]   = useState(false);
  const [toast, setToast]     = useState(null);
  const [toastHide, setToastHide] = useState(false);

  const cursorDot  = useRef(null);
  const spotRef    = useRef(null);
  const canvasRef  = useRef(null);
  const mousePos   = useRef(null);
  const particles  = useRef([]);
  const rafRef     = useRef(null);
  const toastTimer = useRef(null);
  const uploadCardRef = useRef(null);

  const showToast = useCallback((key) => {
    const t = TOASTS[key]; if (!t) return;
    clearTimeout(toastTimer.current);
    setToastHide(false); setToast(t);
    toastTimer.current = setTimeout(() => {
      setToastHide(true);
      setTimeout(() => setToast(null), 300);
    }, 2200);
  }, []);

  // ✅ Cursor + particles + spotlight — uses RAF for smooth ring lerp, no CSS transition lag
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e) => {
      const firstMove = mousePos.current === null;
      mousePos.current = { x: e.clientX, y: e.clientY };

      if (firstMove && cursorDot.current) {
        cursorDot.current.style.opacity = "1";
      }

      // Dot follows instantly
      if (cursorDot.current) {
        cursorDot.current.style.left = e.clientX + "px";
        cursorDot.current.style.top  = e.clientY + "px";
      }

      // Spotlight
      if (spotRef.current) {
        spotRef.current.style.background = `radial-gradient(400px circle at ${e.clientX}px ${e.clientY}px, rgba(99,179,237,0.06) 0%, transparent 70%)`;
      }

      // Particles
      if (Math.random() > 0.5) {
        particles.current.push({
          x: e.clientX, y: e.clientY,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5 - 0.5,
          life: 1,
          size: Math.random() * 2.5 + 0.5,
          color: Math.random() > 0.5 ? "#63b3ed" : "#a78bfa",
        });
        if (particles.current.length > 80) particles.current.shift();
      }

      // CSS var for card glow
      document.querySelectorAll(".tilt-card").forEach(card => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
      });
    };

    const onDown = (e) => {
      cursorDot.current?.classList.add("clicking");
      const el = document.createElement("div");
      el.className = "ripple";
      el.style.left = e.clientX + "px";
      el.style.top  = e.clientY + "px";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 600);
    };
    const onUp = () => {
      cursorDot.current?.classList.remove("clicking");
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    // ✅ RAF loop — particles only
    const loop = () => {

      // Draw particles
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter(p => p.life > 0);
      particles.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.035;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleUploadTilt = (e) => {
    const card = uploadCardRef.current; if (!card) return;
    const r = card.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    card.style.transform = `rotateY(${dx * 5}deg) rotateX(${-dy * 4}deg)`;
    card.style.boxShadow = `${-dx * 10}px ${-dy * 10}px 40px rgba(99,179,237,0.12)`;
  };
  const handleUploadTiltLeave = () => {
    const card = uploadCardRef.current; if (!card) return;
    card.style.transform = "";
    card.style.boxShadow = "";
  };

  const handleSubmit = async () => {
    if (!jd || resumes.length === 0) { setError("Upload a Job Description and at least one resume."); showToast("error"); return; }
    setError(""); setLoading(true); setResults([]); setGoAnim(false); showToast("analyzing");
    const fd = new FormData();
    fd.append("jd", jd);
    resumes.forEach(r => fd.append("resumes", r));
    try {
      const res = await fetch("http://localhost:5000/screen", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) { setResults(data.results); setTimeout(() => setGoAnim(true), 100); showToast("done"); }
      else { setError(data.error); showToast("error"); }
    } catch { setError("Backend not running. Start the server first."); showToast("error"); }
    setLoading(false);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="grid-bg" />
      <div className="orb orb-1" /><div className="orb orb-2" />
      <canvas ref={canvasRef} className="particle-canvas" />
      <div ref={spotRef} className="spotlight" />
      <div ref={cursorDot} className="cursor-dot" />

      {toast && (
        <div className={`reaction-toast ${toastHide ? "hide" : ""}`} style={{ borderColor: toast.color + "44", color: toast.color }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: toast.color, boxShadow: `0 0 8px ${toast.color}`, display: "inline-block" }} />
          {toast.msg}
        </div>
      )}

      <div className="container">
        <div className="header">
          <div className="badge"><span className="badge-dot" />⚡ AI-POWERED · INSTANT RANKING</div>
          <h1 className="title">
            <div className="title-plain">Resume</div>
            <div className="title-grad">Screener AI</div>
          </h1>
          <p className="subtitle">Drop a JD and resumes. AI ranks the best candidates in seconds — no bias, no fatigue.</p>
        </div>

        <div ref={uploadCardRef} className="tilt-card" onMouseMove={handleUploadTilt} onMouseLeave={handleUploadTiltLeave}>
          <div className="card-shine" />
          <div className="section-label"><span className="label-dot" />Job Description</div>
          <div className={`upload-zone ${jd ? "has-file" : ""}`}>
            <input type="file" accept=".pdf" onChange={e => { setJd(e.target.files[0]); showToast("upload_jd"); }} />
            {jd
              ? <div className="file-confirmed">✅ {jd.name}</div>
              : <><span className="upload-icon">📄</span><div className="upload-text">Click to upload JD · PDF only</div></>
            }
          </div>
          <div className="divider" />
          <div className="section-label" style={{ color: "var(--accent2)" }}>
            <span className="label-dot" style={{ color: "var(--accent2)" }} />Resumes
          </div>
          <div className={`upload-zone ${resumes.length > 0 ? "has-file" : ""}`}>
            <input type="file" accept=".pdf" multiple onChange={e => { setResumes(Array.from(e.target.files)); showToast("upload_resume"); }} />
            {resumes.length > 0
              ? <div className="file-confirmed">✅ {resumes.length} resume{resumes.length > 1 ? "s" : ""} ready</div>
              : <><span className="upload-icon">👥</span><div className="upload-text">Click to upload · Multiple PDFs</div></>
            }
          </div>
          <div className="divider" />
          {error && <div className="error-box">⚠ {error}</div>}
          <button className="btn" onClick={handleSubmit} disabled={loading}>
            {!loading && <div className="btn-shimmer" />}
            {loading
              ? <><div className="loading-track"><div className="loading-fill" /></div>⏳ Analyzing with AI...</>
              : "🚀 Screen Resumes"
            }
          </button>
        </div>

        {results.length > 0 && (
          <div className="results-wrap">
            <div className="results-header">
              <div className="results-title">Ranked Candidates</div>
              <div className="results-meta">{results.length} analyzed</div>
            </div>
            {/* ✅ Each card is its own component — useRef is valid here */}
            {results.map((r, i) => (
              <ResultCard key={i} r={r} i={i} goAnim={goAnim} showToast={showToast} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
