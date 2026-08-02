'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="relative bg-black font-sans selection:bg-white/30 text-white">
      
      {/* Sleek Fixed Navbar */}
      <nav className="fixed top-0 w-full px-6 py-6 flex justify-between items-center z-50 mix-blend-difference text-white">
        <div className="text-xl font-serif tracking-[0.3em] uppercase font-bold">
          Tryonity<span className="opacity-50">.</span>
        </div>
        <div className="flex items-center gap-6 text-[10px] font-bold tracking-[0.2em] uppercase">
          <Link href="/login" className="hover:opacity-70 transition-opacity">Client Login</Link>
          <Link href="/signup" className="hover:opacity-70 transition-opacity">Request Access</Link>
        </div>
      </nav>

      {/* Slide 1: Hero */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-black z-0">
        <div 
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2564&auto=format&fit=crop')",
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundAttachment: 'fixed'
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="relative z-10 text-center px-4 flex flex-col items-center">
          <h1 className="font-serif text-5xl md:text-8xl tracking-widest uppercase text-white font-light drop-shadow-2xl">
            Redefine <br/><span className="italic font-serif">Reality</span>
          </h1>
          <div className="mt-16 flex flex-col items-center gap-4">
            <p className="text-[9px] md:text-xs font-mono tracking-[0.4em] uppercase text-white/80">
              Scroll to explore
            </p>
            <div className="w-[1px] h-12 bg-white/50 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Slide 2: The Tech */}
      <section className="relative min-h-screen w-full flex items-center justify-center p-6 bg-black z-10">
        <div 
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=2564&auto=format&fit=crop')",
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundAttachment: 'fixed'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        
        <div className="relative z-10 p-10 md:p-20 rounded-[2.5rem] bg-black/20 backdrop-blur-2xl border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.8)] max-w-2xl text-center">
          <h2 className="font-serif text-3xl md:text-5xl uppercase tracking-[0.2em] mb-8 drop-shadow-md">
            Neural Precision
          </h2>
          <p className="font-sans text-xs md:text-sm leading-loose tracking-[0.2em] uppercase text-white/70 max-w-md mx-auto">
            The world&apos;s most advanced digital fitting engine. By utilizing bleeding-edge vertex mapping and physical simulations, we create an exact digital reflection of haute couture. 
            <br/><br/>
            Zero estimates. Absolute perfection.
          </p>
        </div>
      </section>

      {/* Slide 3: The Atelier & CTA */}
      <section className="relative min-h-screen w-full flex items-center justify-center p-6 bg-black z-20">
        <div 
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage: "url('/luxury_kiosk.jpg')",
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundAttachment: 'fixed'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black" />
        
        <div className="relative z-10 p-12 md:p-24 rounded-[3rem] bg-black/20 backdrop-blur-md border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.9)] max-w-xl text-center w-full">
          <h2 className="font-serif text-4xl md:text-6xl uppercase tracking-[0.1em] mb-4">
            Enter
          </h2>
          <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/50 mb-16">
            The Virtual Showroom
          </p>
          
          <div className="flex flex-col gap-5 w-full">
            <Link href="/login" className="w-full py-5 bg-white/90 text-black text-[10px] font-bold tracking-[0.2em] uppercase text-center hover:bg-white transition-colors rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              Client Login
            </Link>
            <Link href="/signup" className="w-full py-5 border border-white/30 text-white text-[10px] font-bold tracking-[0.2em] uppercase text-center hover:bg-white/10 hover:border-white transition-colors rounded-full">
              Request Access
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="relative bg-black w-full py-12 text-center text-[9px] font-mono tracking-[0.4em] text-white/30 uppercase z-30">
        &copy; 2026 Tryonity Global
      </footer>
    </div>
  );
}
