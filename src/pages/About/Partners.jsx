import { Link } from 'react-router-dom'

const partners = [
  {
    name: "Intellektual mulk agentligi",
    desc: "Intellektual mulkni huquqiy himoyalash bo'yicha davlat tashkiloti.",
    logo: "",
    tag: "Davlat tashkiloti",
    color: "#7C3AED",
  },
  {
    name: "Oliy ta'lim vazirligi",
    desc: "Ilmiy va ta'lim muassasalari bilan hamkorlik.",
    logo: "",
    tag: "Ta'lim",
    color: "#6366F1",
  },
  {
    name: "Raqamli texnologiyalar markazi",
    desc: "Platformaning texnik infratuzilmasini rivojlantirish.",
    logo: "",
    tag: "Texnologiya",
    color: "#8B5CF6",
  },
  {
    name: "Xalqaro ekspertlar guruhi",
    desc: "Xalqaro standartlar va konsultatsiyalar.",
    logo: "",
    tag: "Xalqaro",
    color: "#4F46E5",
  },
];

const stats = [
  { value: "4+",   label: "Asosiy hamkorlar" },
  { value: "12+",  label: "Loyihalar" },
  { value: "3",    label: "Xalqaro shartnoma" },
  { value: "100%", label: "Shaffoflik" },
];

const Partners = () => {
  return (
    <section style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        @media (max-width: 1024px) {
          .p-hero   { flex-direction: column !important; align-items: flex-start !important; }
          .p-stats  { width: 100% !important; }
          .p-grid   { grid-template-columns: repeat(2, 1fr) !important; }
          .p-banner { padding: 56px 40px !important; }
          .p-join   { flex-direction: column !important; align-items: flex-start !important; gap: 24px !important; }
        }
        @media (max-width: 640px) {
          .p-grid       { grid-template-columns: 1fr !important; }
          .p-stats      { flex-wrap: wrap !important; }
          .p-stat       { flex: 1 1 45% !important; border-right: none !important; border-bottom: 1px solid rgba(167,139,250,.15) !important; }
          .p-banner     { padding: 44px 28px !important; border-radius: 24px !important; }
          .p-banner-title { font-size: 1.5rem !important; }
          .p-hero-h1    { font-size: 2.2rem !important; }
          .p-join       { padding: 28px 24px !important; }
          .p-wrap       { padding: 0 20px !important; }
        }

        .p-card {
          transition: transform .32s cubic-bezier(.22,.68,0,1.2),
                      box-shadow .32s ease, border-color .32s ease;
        }
        .p-card:hover { transform: translateY(-10px); }
        .p-card:hover .p-card-inner-glow { opacity: 1 !important; }
        .p-card:hover .p-logo-slot {
          border-style: solid !important;
          border-color: rgba(124,58,237,.3) !important;
        }

        .p-join-btn {
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .p-join-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 48px rgba(124,58,237,.45) !important;
        }

        @keyframes floatUp {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-14px); }
        }
        .p-blob-a { animation: floatUp 8s ease-in-out infinite; }
        .p-blob-b { animation: floatUp 11s ease-in-out infinite reverse; }
      `}</style>

      <div style={S.bgGrad} />
      <div style={S.bgGrid} />
      <div className="p-blob-a" style={{ ...S.blob, top: -60, right: -100, width: 500, height: 500, background: "radial-gradient(circle, rgba(167,139,250,.2) 0%, transparent 68%)" }} />
      <div className="p-blob-b" style={{ ...S.blob, bottom: 0, left: -120, width: 440, height: 440, background: "radial-gradient(circle, rgba(99,102,241,.15) 0%, transparent 68%)" }} />
      <div style={{ ...S.blob, top: "45%", left: "50%", width: 600, height: 300, background: "radial-gradient(ellipse, rgba(196,181,253,.08) 0%, transparent 70%)" }} />

      <div style={S.wrap} className="p-wrap">

        {/* HERO */}
        <div style={S.hero} className="p-hero">
          <div style={S.heroLeft}>
            <div style={S.eyebrow}>
              <span style={S.dot} />
              Hamkorlik
            </div>
            <h1 style={S.h1} className="p-hero-h1">
              Bizning{" "}
              <span style={S.h1Grad}>hamkorlarimiz</span>
            </h1>
            <p style={S.heroDesc}>
              UzIntellekt platformasi davlat tashkilotlari, ilmiy muassasalar
              va xalqaro ekspertlar bilan hamkorlikda faoliyat yuritadi —
              intellektual mulkni ishonchli va shaffof boshqarish uchun.
            </p>
          </div>

          <div style={S.statPanel} className="p-stats">
            {stats.map((s, i) => (
              <div
                key={i}
                style={{
                  ...S.stat,
                  borderRight: i < stats.length - 1 ? "1px solid rgba(167,139,250,.15)" : "none",
                }}
                className="p-stat"
              >
                <span style={S.statVal}>{s.value}</span>
                <span style={S.statLbl}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={S.rule} />

        <div style={S.sectionRow}>
          <span style={S.sectionNum}>01</span>
          <span style={S.sectionLbl}>Asosiy hamkorlar</span>
        </div>

        {/* GRID */}
        <div style={S.grid} className="p-grid">
          {partners.map((item, idx) => (
            <div key={idx} style={S.card} className="p-card">
              <div
                style={{ ...S.innerGlow, background: `radial-gradient(ellipse at 30% 20%, ${item.color}18, transparent 65%)` }}
                className="p-card-inner-glow"
              />
              <div style={{ ...S.cardBar, background: `linear-gradient(90deg, ${item.color}, ${item.color}55, transparent)` }} />
              <span style={{ ...S.tag, color: item.color, background: `${item.color}12`, borderColor: `${item.color}28` }}>
                {item.tag}
              </span>
              <div style={S.logoSlot} className="p-logo-slot">
                <img src={item.logo} alt={item.name} style={S.logoImg} />
              </div>
              <h3 style={S.cardTitle}>{item.name}</h3>
              <p style={S.cardDesc}>{item.desc}</p>
              <div style={S.cardFooter}>
                <span style={{ ...S.footerLink, color: item.color }}>Batafsil</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...S.rule, margin: "72px 0 64px" }} />

        {/* BANNER */}
        <div style={S.banner} className="p-banner">
          <div style={S.bannerGrid} />
          <div style={{ ...S.ring, width: 260, height: 260, bottom: -70, right: -70, borderColor: "rgba(255,255,255,.1)" }} />
          <div style={{ ...S.ring, width: 380, height: 380, bottom: -120, right: -120, borderColor: "rgba(255,255,255,.055)" }} />
          <div style={{ ...S.ring, width: 180, height: 180, top: -50, left: -50, borderColor: "rgba(255,255,255,.07)" }} />
          <div style={S.bannerBody}>
            <p style={S.bannerEye}>Hamkorlik tamoyillari</p>
            <h3 style={S.bannerTitle} className="p-banner-title">
              Ishonchli hamkorlik —<br />barqaror rivojlanish asosi
            </h3>
            <p style={S.bannerText}>
              UzIntellekt hamkorlikni ochiqlik, shaffoflik va huquqiy
              ishonchlilik tamoyillari asosida rivojlantiradi. Har bir
              hamkorlik kelishuvi xalqaro standartlarga to'liq mos keladi.
            </p>
            <div style={S.pillRow}>
              {["Ochiqlik", "Shaffoflik", "Ishonchlilik", "Xalqaro standart"].map((p, i) => (
                <span key={i} style={S.pill}>{p}</span>
              ))}
            </div>
          </div>
        </div>

        {/* JOIN */}
        <div style={S.joinRow} className="p-join">
          <div>
            <h4 style={S.joinTitle}>Hamkor bo'lishni xohlaysizmi?</h4>
            <p style={S.joinDesc}>
              Biz bilan bog'laning — hamkorlik shartlarini birgalikda muhokama qilamiz.
            </p>
          </div>
          {/* ← href o'rniga Link — page reload bo'lmaydi */}
          <Link to="/contact" style={S.joinBtn} className="p-join-btn">
            Bog'lanish
          </Link>
        </div>

      </div>
    </section>
  );
};

/* STYLES */
const S = {
  page: {
    position: "relative",
    background: "linear-gradient(150deg, #FAF8FF 0%, #F3F0FF 40%, #EEF2FF 80%, #FAF8FF 100%)",
    paddingTop: "112px",
    paddingBottom: "140px",
    overflow: "hidden",
    fontFamily: "'DM Sans', sans-serif",
  },
  bgGrad: {
    position: "absolute", inset: 0, pointerEvents: "none",
    background: "radial-gradient(circle at 20% 20%, rgba(167,139,250,.09) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(99,102,241,.08) 0%, transparent 50%)",
  },
  bgGrid: {
    position: "absolute", inset: 0, pointerEvents: "none",
    backgroundImage: "linear-gradient(rgba(109,40,217,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(109,40,217,.035) 1px, transparent 1px)",
    backgroundSize: "64px 64px",
  },
  blob: { position: "absolute", borderRadius: "50%", pointerEvents: "none" },
  wrap: { position: "relative", maxWidth: "1200px", margin: "0 auto", padding: "0 32px", zIndex: 1 },
  hero: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "48px", marginBottom: "60px" },
  heroLeft: { maxWidth: "560px", display: "flex", flexDirection: "column", gap: "22px" },
  eyebrow: {
    display: "inline-flex", alignItems: "center", gap: "8px",
    fontSize: "11px", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase",
    color: "#7C3AED", background: "rgba(124,58,237,.07)", border: "1px solid rgba(124,58,237,.18)",
    padding: "6px 16px", borderRadius: "100px", width: "fit-content",
  },
  dot: { width: "6px", height: "6px", background: "#7C3AED", borderRadius: "50%", boxShadow: "0 0 8px rgba(124,58,237,.7)", display: "inline-block" },
  h1: {
    fontSize: "clamp(2.2rem, 4.5vw, 3.8rem)", fontWeight: "800", color: "#1E1B4B",
    letterSpacing: "-0.04em", lineHeight: 1.08, margin: 0, fontFamily: "'Sora', sans-serif",
  },
  h1Grad: {
    background: "linear-gradient(110deg, #7C3AED 0%, #6366F1 55%, #A78BFA 100%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
  },
  heroDesc: { fontSize: "16px", color: "#4B5563", lineHeight: 1.8, margin: 0 },
  statPanel: {
    display: "flex", background: "#FFFFFF",
    border: "1px solid rgba(167,139,250,.2)", borderRadius: "24px",
    boxShadow: "0 8px 40px rgba(109,40,217,.08)", overflow: "hidden", flexShrink: 0,
  },
  stat: { display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", padding: "28px 30px" },
  statVal: { fontSize: "26px", fontWeight: "800", color: "#5B21B6", fontFamily: "'Sora', sans-serif", letterSpacing: "-0.03em", lineHeight: 1 },
  statLbl: { fontSize: "11px", color: "#9CA3AF", fontWeight: "500", letterSpacing: "0.04em", whiteSpace: "nowrap", textAlign: "center" },
  rule: { height: "1px", background: "linear-gradient(90deg, transparent, rgba(124,58,237,.18), transparent)", margin: "0 0 48px" },
  sectionRow: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "36px" },
  sectionNum: { fontSize: "12px", fontWeight: "800", color: "#C4B5FD", letterSpacing: "0.1em" },
  sectionLbl: { fontSize: "13px", fontWeight: "600", color: "#6D28D9", letterSpacing: "0.06em", textTransform: "uppercase" },
  grid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" },
  card: {
    position: "relative", background: "#FFFFFF",
    border: "1px solid rgba(167,139,250,.16)", borderRadius: "28px",
    padding: "32px 28px 28px", overflow: "hidden", display: "flex", flexDirection: "column",
    boxShadow: "0 4px 24px rgba(109,40,217,.06)",
  },
  innerGlow: {
    position: "absolute", inset: 0, opacity: 0, pointerEvents: "none",
    transition: "opacity .35s ease", borderRadius: "inherit",
  },
  cardBar: { position: "absolute", top: 0, left: "28px", right: "28px", height: "2.5px", borderRadius: "0 0 6px 6px" },
  tag: {
    display: "inline-block", fontSize: "10px", fontWeight: "700",
    letterSpacing: "0.14em", textTransform: "uppercase",
    border: "1px solid", padding: "4px 12px", borderRadius: "100px",
    marginBottom: "20px", width: "fit-content",
  },
  logoSlot: {
    width: "100%", height: "72px", borderRadius: "14px",
    background: "rgba(167,139,250,.05)", border: "1.5px dashed rgba(167,139,250,.28)",
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden", marginBottom: "22px",
    transition: "border-color .25s ease, background .25s ease",
  },
  logoImg: { maxWidth: "130px", maxHeight: "44px", objectFit: "contain" },
  cardTitle: {
    fontSize: "15px", fontWeight: "700", color: "#1E1B4B", marginBottom: "10px",
    lineHeight: 1.35, fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em",
  },
  cardDesc: { fontSize: "13.5px", color: "#6B7280", lineHeight: 1.75, flex: 1, marginBottom: "20px" },
  cardFooter: { borderTop: "1px solid rgba(167,139,250,.1)", paddingTop: "14px", marginTop: "auto" },
  footerLink: { fontSize: "13px", fontWeight: "700", letterSpacing: "0.01em" },
  banner: {
    position: "relative",
    background: "linear-gradient(135deg, #5B21B6 0%, #4338CA 50%, #6D28D9 100%)",
    borderRadius: "32px", padding: "72px 80px",
    boxShadow: "0 32px 80px rgba(91,33,182,.28), 0 4px 16px rgba(91,33,182,.18)",
    overflow: "hidden", textAlign: "center", marginBottom: "32px",
  },
  bannerGrid: {
    position: "absolute", inset: 0, pointerEvents: "none",
    backgroundImage: "linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)",
    backgroundSize: "36px 36px",
  },
  ring: { position: "absolute", borderRadius: "50%", border: "1px solid", pointerEvents: "none" },
  bannerBody: { position: "relative", zIndex: 1 },
  bannerEye: { fontSize: "11px", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", marginBottom: "18px" },
  bannerTitle: {
    fontSize: "clamp(1.5rem, 3vw, 2.4rem)", fontWeight: "800", color: "#FFFFFF",
    letterSpacing: "-0.035em", lineHeight: 1.2, marginBottom: "18px", fontFamily: "'Sora', sans-serif",
  },
  bannerText: { fontSize: "15.5px", color: "rgba(255,255,255,.75)", lineHeight: 1.8, maxWidth: "540px", margin: "0 auto 32px" },
  pillRow: { display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" },
  pill: {
    fontSize: "12px", fontWeight: "600", color: "rgba(255,255,255,.88)",
    background: "rgba(255,255,255,.11)", border: "1px solid rgba(255,255,255,.2)",
    padding: "7px 18px", borderRadius: "100px", letterSpacing: "0.04em",
  },
  joinRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: "32px",
    background: "#FFFFFF", border: "1px solid rgba(167,139,250,.18)", borderRadius: "24px",
    padding: "36px 48px", boxShadow: "0 4px 24px rgba(109,40,217,.07)",
  },
  joinTitle: { fontSize: "18px", fontWeight: "700", color: "#1E1B4B", margin: "0 0 8px", fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" },
  joinDesc: { fontSize: "14px", color: "#6B7280", margin: 0, lineHeight: 1.6 },
  joinBtn: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "14px 36px", flexShrink: 0,
    background: "linear-gradient(135deg, #7C3AED, #6366F1)",
    color: "#FFFFFF", borderRadius: "14px", fontWeight: "700",
    fontSize: "15px", textDecoration: "none",
    boxShadow: "0 8px 28px rgba(124,58,237,.32)", letterSpacing: "-0.01em",
  },
};

export default Partners;
