import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-styleswap-bg font-sans selection:bg-styleswap-accent selection:text-black">
      {/* Navigation */}
      <nav className="border-b-4 border-black bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-neo-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-styleswap-accent border-4 border-black rounded-neo flex items-center justify-center shadow-neo-sm">
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="text-black font-black text-2xl uppercase tracking-tighter">StyleSwap</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-black font-black uppercase tracking-wider text-sm hover:underline decoration-4 underline-offset-4 hidden sm:block">
            Login
          </Link>
          <Link href="/signup" className="bg-styleswap-accent border-4 border-black text-black px-6 py-2 rounded-neo font-black uppercase tracking-widest text-sm shadow-neo-sm hover:-translate-y-1 hover:shadow-neo active:translate-y-1 active:shadow-none transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 md:py-32 max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-8 relative z-10">
          <div className="inline-block bg-[#ffde59] border-4 border-black px-4 py-2 shadow-neo-sm transform -rotate-2">
            <p className="text-black font-black uppercase tracking-widest text-sm">Empower your showroom</p>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-black uppercase tracking-tighter leading-[0.9] drop-shadow-[4px_4px_0px_#fff]">
            The Future of <br className="hidden md:block" /> Virtual Try-On
          </h1>
          <p className="text-xl md:text-2xl font-bold text-black max-w-xl border-l-8 border-styleswap-accent pl-6 py-2 bg-white/50">
            Let your customers try on clothes instantly using AI. Zero fitting rooms. Zero hassle. Manage your inventory efficiently.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4 relative z-20">
            <Link href="/signup" className="block w-full sm:w-auto bg-[#00cc00] border-4 border-black text-black px-8 py-5 rounded-neo font-black uppercase tracking-widest text-lg shadow-neo-lg hover:-translate-y-1 hover:shadow-[10px_10px_0_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all text-center">
              Signup Now
            </Link>
            <Link href="/login" className="block w-full sm:w-auto bg-[#ffde59] border-4 border-black text-black px-8 py-5 rounded-neo font-black uppercase tracking-widest text-lg shadow-neo-lg hover:-translate-y-1 hover:shadow-[10px_10px_0_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all text-center">
              Owner Login
            </Link>
            <Link href="/shop/styleswap-demo" className="flex w-full sm:w-auto items-center justify-center gap-3 bg-white border-4 border-black text-black px-8 py-5 rounded-neo font-black uppercase tracking-widest text-lg shadow-neo-lg hover:-translate-y-1 hover:shadow-[10px_10px_0_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all text-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Explore
            </Link>
          </div>
        </div>
        
        <div className="flex-1 relative w-full aspect-square max-w-md">
          {/* Decorative Elements */}
          <div className="absolute inset-0 bg-[#ff00ff] border-4 border-black rounded-neo shadow-neo translate-x-4 translate-y-4"></div>
          <div className="absolute inset-0 bg-[#00ffff] border-4 border-black rounded-neo shadow-neo translate-x-2 translate-y-2"></div>
          <div className="absolute inset-0 bg-white border-4 border-black rounded-neo shadow-neo flex flex-col items-center justify-center p-8 text-center space-y-6">
            <svg className="w-32 h-32 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-black text-2xl uppercase tracking-wider">AI Try-On <br/> Coming to life</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t-4 border-black bg-white">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <h2 className="text-4xl md:text-6xl font-black text-black uppercase tracking-tighter mb-16 text-center">
            Built for <span className="text-styleswap-accent bg-black px-4 py-1 inline-block transform -rotate-1">Impact</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#ffde59] border-4 border-black p-8 rounded-neo shadow-neo-lg hover:-translate-y-2 transition-transform">
              <div className="w-16 h-16 bg-white border-4 border-black rounded-neo flex items-center justify-center shadow-neo-sm mb-6">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-2xl font-black uppercase mb-4">Instant Generation</h3>
              <p className="text-black font-bold text-lg">Upload a selfie, pick an outfit, and see results instantly. Our AI models handle the heavy lifting perfectly.</p>
            </div>
            
            <div className="bg-[#00ffff] border-4 border-black p-8 rounded-neo shadow-neo-lg hover:-translate-y-2 transition-transform">
              <div className="w-16 h-16 bg-white border-4 border-black rounded-neo flex items-center justify-center shadow-neo-sm mb-6">
                <span className="text-3xl">📱</span>
              </div>
              <h3 className="text-2xl font-black uppercase mb-4">Scan & Shop</h3>
              <p className="text-black font-bold text-lg">Customers simply scan a QR code at your physical store to enter the virtual changing room on their own device.</p>
            </div>
            
            <div className="bg-[#ff00ff] border-4 border-black p-8 rounded-neo shadow-neo-lg hover:-translate-y-2 transition-transform">
              <div className="w-16 h-16 bg-white border-4 border-black rounded-neo flex items-center justify-center shadow-neo-sm mb-6">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-2xl font-black uppercase mb-4 text-white drop-shadow-[2px_2px_0px_#000]">Easy Inventory</h3>
              <p className="text-white font-bold text-lg drop-shadow-[1px_1px_0px_#000]">Manage all your products, variations, and active try-on sessions from a centralized dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-black text-white px-6 py-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-styleswap-accent rounded-neo flex items-center justify-center">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="font-black text-xl uppercase tracking-tighter">StyleSwap</span>
          </div>
          <p className="font-bold text-sm text-gray-400">© 2026 StyleSwap Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
