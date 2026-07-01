"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";

const MarioGame = dynamic(() => import("../components/MarioGame"), { ssr: false });

// ── LOGO URLS (real SVGs from devicon / simpleicons CDN) ──────
const LOGOS: Record<string, string> = {
  "Figma":       "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg",
  "Adobe XD":    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/xd/xd-plain.svg",
  "Photoshop":   "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/photoshop/photoshop-plain.svg",
  "Illustrator": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/illustrator/illustrator-plain.svg",
  "After Effects":"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/aftereffects/aftereffects-original.svg",
  "Premiere Pro":"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/premierepro/premierepro-original.svg",
  "Blender":     "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/blender/blender-original.svg",
  "HTML5":       "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
  "CSS3":        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
  "JavaScript":  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
  "React":       "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
  "Next.js":     "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
  "Node.js":     "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
  "Python":      "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
  "C++":         "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",
  "Git":         "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg",
  "VS Code":     "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg",
  "Tailwind":    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg",
  "TypeScript":  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
};

// ── RESUME DATA ───────────────────────────────────────────────
const R = {
  name: "ADARSH SINGH GAUR",
  sub: "Lead UI/UX Designer  •  Creative Technologist",
  tagline: "I craft pixel-perfect, intuitive user experiences and possess the engineering chops to bring them to life.",
  phone: "+91 6263 777 945",
  email: "adarshsinghgaur.99@gmail.com",
  location: "Sector 1, Bhilai, Chhattisgarh",
  profile:
    "Highly creative UI/UX Designer & Frontend Developer with 5+ years of experience transforming complex ideas into intuitive, beautiful digital products. Expert in the full Adobe Creative Suite, Figma, and Blender for design & 3D, paired with solid HTML/CSS, JavaScript & React skills for implementation. I don't just design — I build.",

  xp: [
    {
      role: "Lead UI/UX Designer", company: "Globussoft, Bhilai",
      period: "2025 – Present", icon: "✨",
      tags: ["Figma", "Design Systems", "Prototyping", "User Research", "Leadership"],
      desc: "Spearheading all UI/UX initiatives. Crafting scalable design systems, conducting generative user research, and building high-fidelity Figma prototypes to guide cross-functional teams in shipping premium digital products.",
    },
    {
      role: "Senior Visual Designer", company: "Utkarsh Promotional Industry, Bhilai",
      period: "2023 – 2025", icon: "🎨",
      tags: ["Photoshop", "Illustrator", "Brand Identity", "Print Media"],
      desc: "Directed visual design streams including branding, marketing collateral, and corporate identity. Managed the intersection of digital design and physical manufacturing workflows.",
    },
    {
      role: "Motion & Graphics Designer", company: "BlueD Studios, Bhilai",
      period: "2023", icon: "🎬",
      tags: ["After Effects", "Premiere Pro", "Motion Graphics", "Social Media"],
      desc: "Produced high-impact motion graphics and visual campaigns for prominent brands (TechB, Ultracare TMT) and large-scale events, significantly boosting digital engagement.",
    },
    {
      role: "3D & Architectural Viz Artist", company: "Mahobiya Builders, Bhilai",
      period: "2021 – 2022", icon: "🏗️",
      tags: ["Blender", "Lumion", "AutoCAD", "3D Rendering"],
      desc: "Created photorealistic 3D architectural visualizations and immersive environments for premium real estate projects, elevating client presentations.",
    },
  ],

  projects: [
    {
      title: "Fintech Dashboard Redesign", type: "UI/UX Case Study", icon: "📊",
      tags: ["Figma", "UX Research", "Data Visualization", "Wireframing"],
      desc: "Complete overhaul of a legacy financial dashboard. Conducted user interviews, mapped complex user journeys, and delivered a sleek, accessible Figma prototype that increased task completion rate by 40%."
    },
    {
      title: "Design System \"Aura\"", type: "Design Engineering", icon: "🧩",
      tags: ["Figma", "React", "Storybook", "Design Tokens"],
      desc: "Architected a comprehensive design system bridging Figma and React. Established typography scales, color tokens, and a library of 40+ responsive components."
    },
    {
      title: "Interactive Web Portfolio", type: "Creative Development", icon: "🎮",
      tags: ["Next.js", "Canvas API", "UI Design", "TypeScript"],
      desc: "Designed and engineered an immersive portfolio experience featuring a custom-built, fully playable retro platformer integrated within a modern, glassmorphic UI layout."
    },
    {
      title: "Brand Evolution: TechB", type: "Brand Identity", icon: "✨",
      tags: ["Illustrator", "Typography", "Logo Design", "Guidelines"],
      desc: "Developed a modern, cohesive brand identity for a tech startup including logo redesign, typographic hierarchy, custom iconography, and comprehensive brand guidelines."
    },
    {
      title: "E-Commerce Mobile App", type: "Mobile UI Design", icon: "📱",
      tags: ["Figma", "Prototyping", "iOS Guidelines", "Micro-interactions"],
      desc: "Designed a premium mobile shopping experience for a luxury apparel brand. Focused on fluid navigation, immersive product displays, and a seamless checkout flow."
    },
    {
      title: "3D Product Configurator", type: "3D & WebGL", icon: "🧊",
      tags: ["Blender", "Three.js", "UI Design", "Rendering"],
      desc: "Created a web-based 3D product configurator. Modelled and textured assets in Blender, then designed an intuitive UI overlay for users to customize materials in real-time."
    }
  ],

  skills: {
    design: ["Figma", "Adobe XD", "Photoshop", "Illustrator", "After Effects", "Premiere Pro", "Blender", "Design Systems", "Prototyping", "User Research"],
    dev: ["HTML5", "CSS3", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS", "Node.js", "Git", "VS Code"]
  }
};

// ── COMPONENTS ────────────────────────────────────────────────

function StatNumber({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)', marginBottom: '8px' }} className="text-accent">
        {value}
      </div>
      <div style={{ fontSize: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}

function SkillBadge({ name, logo }: { name: string; logo?: string }) {
  return (
    <div className="tech-badge">
      {logo && LOGOS[logo] ? <img src={LOGOS[logo]} alt={name} width={16} height={16} style={{ borderRadius: 2 }} /> : null}
      {name}
    </div>
  );
}

const PORTFOLIO_GALLERY = [
  { id: 1, title: "Fintech Dashboard", type: "UI/UX Design", icon: "📊", color: "#1a0533", tags: ["Figma", "UI Design", "Prototype"], desc: "Dark mode financial dashboard with complex data visualization.", device: "laptop" },
  { id: 2, title: "E-Commerce App", type: "Mobile UI Design", icon: "📱", color: "#001a08", tags: ["Figma", "iOS", "E-Commerce"], desc: "Premium mobile shopping experience for luxury apparel.", device: "mobile" },
  { id: 3, title: "Analytics Portal", type: "Web App Design", icon: "🖥️", color: "#331a00", tags: ["React", "Dashboard", "UX"], desc: "Real-time analytics portal with customizable drag-and-drop widgets.", device: "laptop" },
  { id: 4, title: "Smart Home Hub", type: "IoT Interface", icon: "🏠", color: "#002b33", tags: ["Figma", "Smart Home", "UI"], desc: "Centralized smart home control center for tablet devices.", device: "mobile" },
  { id: 5, title: "Fitness Tracker", type: "Wearable UI", icon: "⌚", color: "#330000", tags: ["WatchOS", "Health", "UI Design"], desc: "Minimalist fitness tracking interface for smartwatches.", device: "mobile" },
  { id: 6, title: "Crypto Wallet", type: "DeFi App", icon: "🪙", color: "#1f1f00", tags: ["Web3", "Mobile UI", "Crypto"], desc: "Secure and intuitive cryptocurrency wallet interface.", device: "mobile" }
];

function ThreeDGallery({ items, onSelectMockup }: { items: typeof PORTFOLIO_GALLERY, onSelectMockup: (item: typeof PORTFOLIO_GALLERY[0] | null) => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const nextItem = () => setActiveIndex((prev) => (prev + 1) % items.length);
  const prevItem = () => setActiveIndex((prev) => (prev - 1 + items.length) % items.length);

  return (
    <div style={{ position: 'relative', width: '100%', height: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: '1200px', overflowX: 'hidden' }}>
      {items.map((item, index) => {
        let diff = index - activeIndex;
        if (diff > Math.floor(items.length / 2)) diff -= items.length;
        if (diff < -Math.floor(items.length / 2)) diff += items.length;

        const isActive = diff === 0;
        const absDiff = Math.abs(diff);

        const translateX = diff * 220; 
        const translateZ = isActive ? 0 : -absDiff * 180; 
        const rotateY = diff === 0 ? 0 : diff > 0 ? -30 : 30; 
        const opacity = isActive ? 1 : Math.max(0, 1 - absDiff * 0.4);
        const zIndex = 100 - absDiff;

        return (
          <div 
            key={item.id}
            onClick={() => {
              if (isActive) onSelectMockup(item);
              else setActiveIndex(index);
            }}
            style={{
              position: 'absolute',
              width: '320px',
              height: '420px',
              transition: 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)',
              transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg)`,
              opacity,
              zIndex,
              cursor: isActive ? 'default' : 'pointer',
              userSelect: 'none',
              pointerEvents: opacity > 0.1 ? 'auto' : 'none'
            }}
          >
            <div className="glass-card" style={{ width: '100%', height: '100%', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                height: '180px', 
                background: item.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderBottom: '1px solid var(--border-color)',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 8, color: 'var(--text-secondary)' }}>
                    Image Placeholder
                  </div>
                </div>
              </div>
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 8, color: 'var(--yellow)', textTransform: 'uppercase', marginBottom: 8 }}>
                  {item.type}
                </div>
                <h3 style={{ fontSize: '12px', marginBottom: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>{item.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 8, lineHeight: 1.8, marginBottom: 16, flex: 1 }}>
                  {item.desc}
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {item.tags.map(t => (
                    <span key={t} style={{ fontSize: 8, padding: '4px 8px', background: '#222', border: '2px solid #fff', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '20px', zIndex: 200 }}>
        <button onClick={prevItem} style={{ background: 'var(--red)', border: '4px solid #fff', color: '#fff', width: '48px', height: '48px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', boxShadow: '4px 4px 0 #8b0000', fontFamily: "'Press Start 2P', monospace" }}>&lt;</button>
        <button onClick={nextItem} style={{ background: 'var(--blue)', border: '4px solid #fff', color: '#fff', width: '48px', height: '48px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', boxShadow: '4px 4px 0 #025070', fontFamily: "'Press Start 2P', monospace" }}>&gt;</button>
      </div>
      
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function Page() {
  const [revealedSkills, setRevealedSkills] = useState<string[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedMockup, setSelectedMockup] = useState<typeof PORTFOLIO_GALLERY[0] | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      
      {/* Navbar Removed as requested */}

      {/* ══════════════════════════════════════════════════
          CINEMATIC GAME HERO SECTION
      ══════════════════════════════════════════════════ */}
      <section style={{ 
        width: '100%', height: '100vh', 
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', background: '#000'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <MarioGame onSkillReveal={(sk) => setRevealedSkills(sk)} />
        </div>
        
        {/* Subtle scroll prompt & skills overlay */}
        <div style={{ 
          background: '#050505', borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '16px 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          zIndex: 10
        }}>
          {revealedSkills.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
                Skills Explored:
              </span>
              {revealedSkills.map(s => (
                <span key={s} style={{ 
                  padding: '6px 12px', fontSize: 8,
                  background: 'var(--dark)', color: 'var(--yellow)', textTransform: 'uppercase',
                  border: '2px solid #fff', boxShadow: '2px 2px 0 #000'
                }}>{s}</span>
              ))}
            </div>
          )}
        </div>


      </section>

      {/* ══════════════════════════════════════════════════
          WORK / EXPERIENCE
      ══════════════════════════════════════════════════ */}
      <section id="work" style={{ padding: '6rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
        <h2 className="retro-title">EXPERIENCE</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {R.xp.map((job, i) => (
            <div key={i} className="glass-card" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ 
                width: 56, height: 56, background: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0,
                border: '4px solid #fff', boxShadow: '4px 4px 0 #000'
              }}>
                {job.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                  <h3 style={{ fontSize: '14px', color: 'var(--yellow)', textShadow: '2px 2px 0 #8b0000', lineHeight: 1.4 }}>{job.role}</h3>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{job.period}</span>
                </div>
                <div style={{ color: 'var(--blue)', fontSize: '10px', marginBottom: 16 }}>{job.company}</div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 20, fontSize: 10 }}>{job.desc}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {job.tags.map(t => (
                    <span key={t} style={{ 
                      fontSize: 8, padding: '6px 12px', background: '#222', border: '2px solid #fff',
                      color: 'var(--text-secondary)', textTransform: 'uppercase', boxShadow: '2px 2px 0 #000'
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          DESIGN IDEOLOGY (THE "OG" FORMAT)
      ══════════════════════════════════════════════════ */}
      <section id="ideology" style={{ padding: '8rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '6rem', maxWidth: 800, margin: '0 auto 6rem' }}>
            <h2 className="retro-title" style={{ fontSize: 'clamp(1.2rem, 4vw, 2rem)', marginBottom: '2rem' }}>
              DESIGN FIRST.<br/><br/>CODE SECOND.
            </h2>
            <p style={{ fontSize: 'clamp(10px, 2vw, 14px)', color: 'var(--text-secondary)', lineHeight: 2 }}>
              I am a <strong style={{color: '#fff'}}>UI/UX Designer</strong> obsessed with human-centric interfaces, meticulous aesthetic precision, and digital psychology. Beyond the canvas, I possess the engineering fluency to <strong style={{color: 'var(--blue)'}}>bring these highly-detailed experiences to life</strong> with uncompromised fidelity.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '6rem' }}>
            <StatNumber value="5+" label="Years UX Experience" />
            <StatNumber value="60+" label="Interfaces Designed" />
            <StatNumber value="100%" label="Pixel Perfect Execution" />
            <StatNumber value="∞" label="Attention to Detail" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '2rem' }}>
            {/* Design Skills (Primary) */}
            <div className="glass-card" style={{ background: '#1a0533' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--yellow)', textShadow: '2px 2px 0 #8b0000', lineHeight: 1.4 }}>
                <span style={{ color: 'var(--yellow)', fontSize: '24px' }}>✦</span> PRODUCT DESIGN
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.8, fontSize: 10 }}>
                My core discipline. I craft intuitive, scalable, and visually stunning digital products. From deep user research and wireframing, to high-fidelity prototyping and establishing comprehensive design systems in Figma.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {R.skills.design.map(s => <SkillBadge key={s} name={s} logo={s} />)}
              </div>
            </div>

            {/* Dev Skills (Secondary Superpower) */}
            <div className="glass-card" style={{ background: '#021a24' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--blue)', textShadow: '2px 2px 0 #025070', lineHeight: 1.4 }}>
                <span style={{ color: 'var(--blue)', fontSize: '24px' }}>⚡</span> FRONTEND ENG
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.8, fontSize: 10 }}>
                My secondary weapon. No more compromising design for development constraints. I possess the technical fluency to translate complex UI/UX architectures into robust, buttery-smooth React applications.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {R.skills.dev.map(s => <SkillBadge key={s} name={s} logo={s} />)}
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          UI DESIGN SHOWCASE
      ══════════════════════════════════════════════════ */}
      <section id="designs" style={{ 
        padding: '6rem 0', 
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ 
              fontSize: 8, color: 'var(--yellow)', textTransform: 'uppercase', 
              marginBottom: 12, display: 'block' 
            }}>PORTFOLIO GALLERY</span>
            <h2 className="retro-title" style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)', marginBottom: '1rem' }}>
              INTERACTIVE 3D UI SHOWCASE
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(8px, 2vw, 10px)', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
              A curated collection of user interface designs. Flip through the gallery to explore high-fidelity concepts and prototypes.
            </p>
          </div>
        </div>

        {/* 3D GALLERY COMPONENT */}
        <ThreeDGallery items={PORTFOLIO_GALLERY} onSelectMockup={setSelectedMockup} />
        
      </section>

      {/* ══════════════════════════════════════════════════
          PROJECTS
      ══════════════════════════════════════════════════ */}
      <section id="projects" style={{ padding: '6rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
        <h2 className="retro-title">FEATURED WORK</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '2rem' }}>
          {R.projects.map((p, i) => (
            <div key={i} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ 
                  fontSize: 8, color: 'var(--yellow)', textTransform: 'uppercase' 
                }}>{p.type}</div>
                <div style={{ fontSize: 24 }}>{p.icon}</div>
              </div>
              <h3 style={{ fontSize: '14px', marginBottom: 16, color: 'var(--blue)', textShadow: '2px 2px 0 #025070', lineHeight: 1.4 }}>{p.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 24, flex: 1, fontSize: 10 }}>{p.desc}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {p.tags.map(t => (
                  <span key={t} style={{ 
                    fontSize: 8, padding: '6px 10px', background: '#222',
                    border: '2px solid #fff', color: 'var(--text-secondary)', textTransform: 'uppercase', boxShadow: '2px 2px 0 #000'
                  }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CONTACT
      ══════════════════════════════════════════════════ */}
      <section id="contact" style={{ 
        padding: '8rem 2rem', position: 'relative', overflow: 'hidden'
      }}>
        <div className="glass-card" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', padding: '4rem 2rem' }}>
          <h2 className="retro-title" style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)' }}>LET'S CREATE SOMETHING EXTRAORDINARY.</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(8px, 2vw, 10px)', lineHeight: 2, maxWidth: 500, margin: '0 auto 3rem' }}>
            Looking for a designer who understands the deepest technical constraints of engineering, or a developer obsessed with pixel-perfect design? I bridge that gap perfectly. Let's start a conversation.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', marginBottom: '3rem' }}>
            <a href={`mailto:${R.email}`} style={{ color: '#fff', textDecoration: 'none', fontSize: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>✉️</span> {R.email}
            </a>
            <a href={`tel:${R.phone.replace(/\s/g,'')}`} style={{ color: '#fff', textDecoration: 'none', fontSize: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>📞</span> {R.phone}
            </a>
            <div style={{ color: 'var(--text-secondary)', fontSize: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>📍</span> {R.location}
            </div>
          </div>
          
          <a href={`mailto:${R.email}`} className="btn-primary" style={{ padding: '16px 32px', fontSize: 10 }}>GET IN TOUCH</a>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer style={{ 
        padding: '3rem 2rem', textAlign: 'center', 
        color: 'var(--text-secondary)', fontSize: 8,
        flexWrap: 'wrap'
      }}>  <div style={{ marginBottom: 16, color: '#fff', textTransform: 'uppercase' }}>© 2025 ADARSH SINGH GAUR</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 8, color: 'var(--text-secondary)', flexWrap: 'wrap', lineHeight: 2 }}>
          Crafted with extreme attention to detail, 🪙 coins, and <span style={{ color: '#e52521', fontSize: 10 }}>♥</span> by Adarsh
        </div>
      </footer>

      {/* 8-bit Mockup Modal (Moved to Root) */}
      {selectedMockup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Press Start 2P', monospace",
          padding: '20px'
        }} onClick={() => setSelectedMockup(null)}>
          
          <button onClick={() => setSelectedMockup(null)} style={{
            position: 'absolute', top: 20, right: 20,
            background: 'transparent', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer', zIndex: 10
          }}>×</button>

          {/* 8-BIT MACBOOK FRAME */}
          {selectedMockup.device === 'laptop' && (
            <div style={{
              width: '100%', maxWidth: '900px',
              background: '#c0c0c0',
              border: '8px solid #000',
              boxShadow: 'inset 4px 4px 0px #fff, inset -4px -4px 0px #808080, 12px 12px 0px rgba(0,0,0,0.8)',
              padding: '16px', display: 'flex', flexDirection: 'column', position: 'relative'
            }} onClick={e => e.stopPropagation()}>
              <div style={{
                background: '#000', padding: '24px 24px 40px 24px', display: 'flex', flexDirection: 'column', position: 'relative'
              }}>
                <div style={{ background: '#222', flex: 1, aspectRatio: '16/10', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: selectedMockup.color, opacity: 0.3 }} />
                  <div style={{ fontSize: 80, marginBottom: 24, zIndex: 2 }}>{selectedMockup.icon}</div>
                  <div style={{ color: '#fff', textAlign: 'center', zIndex: 2, lineHeight: 1.6 }}>
                    <div style={{ color: '#049cd8', fontSize: 20, marginBottom: 12 }}>{selectedMockup.title}</div>
                    <div style={{ fontSize: 10, color: '#aaa', maxWidth: 400, margin: '0 auto' }}>{selectedMockup.desc}</div>
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 12 }}>
                  🍎
                </div>
              </div>
              <div style={{
                height: '32px', background: '#c0c0c0', borderTop: '4px solid #808080',
                position: 'absolute', bottom: '-40px', left: '-8px', right: '-8px',
                border: '8px solid #000', boxShadow: '12px 12px 0px rgba(0,0,0,0.8)',
                display: 'flex', justifyContent: 'center'
              }}>
                <div style={{ width: '120px', height: '8px', background: '#808080', marginTop: '6px' }} />
              </div>
            </div>
          )}

          {/* 8-BIT IPHONE FRAME */}
          {selectedMockup.device === 'mobile' && (
            <div style={{
              width: '100%', maxWidth: '380px', height: '80vh',
              background: '#000',
              border: '8px solid #444',
              boxShadow: 'inset 4px 4px 0px #666, inset -4px -4px 0px #222, 12px 12px 0px rgba(0,0,0,0.8)',
              padding: '16px', display: 'flex', flexDirection: 'column', position: 'relative'
            }} onClick={e => e.stopPropagation()}>
              {/* Retro Notch */}
              <div style={{
                position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)',
                width: '140px', height: '24px', background: '#000', zIndex: 10,
                borderBottom: '4px solid #222', borderLeft: '4px solid #222', borderRight: '4px solid #222'
              }} />
              
              <div style={{
                background: '#222', flex: 1, overflow: 'hidden', position: 'relative',
                border: '4px solid #111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: selectedMockup.color, opacity: 0.3 }} />
                <div style={{ fontSize: 64, marginBottom: 24, zIndex: 2 }}>{selectedMockup.icon}</div>
                <div style={{ color: '#fff', textAlign: 'center', zIndex: 2, lineHeight: 1.6 }}>
                  <div style={{ color: '#049cd8', fontSize: 16, marginBottom: 12 }}>{selectedMockup.title}</div>
                  <div style={{ fontSize: 10, color: '#aaa', maxWidth: 200, margin: '0 auto' }}>{selectedMockup.desc}</div>
                </div>
              </div>
              
              {/* Home Indicator */}
              <div style={{
                position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                width: '100px', height: '6px', background: '#333'
              }} />
            </div>
          )}

        </div>
      )}
    </div>
  );
}
