"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { 
  Sparkles, 
  Image as ImageIcon, 
  MessageSquare, 
  ChevronRight, 
  Shield, 
  Zap, 
  Layers,
  ArrowUpRight
} from "lucide-react";

export default function LandingPage() {
  // Stagger animation helpers
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  } as any;

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  } as any;

  return (
    <main className="min-h-screen bg-[#040405] text-zinc-100 font-sans selection:bg-[#E2B53E] selection:text-black flex flex-col items-center justify-between p-4 md:p-6 relative overflow-x-hidden">
      
      {/* IMMERSIVE COZY SHEEP BACKGROUND (Elegant repeating top, fading to deep solid dark) */}
      <div className="absolute inset-x-0 top-0 h-[720px] pointer-events-none z-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-repeat opacity-[0.22] grayscale contrast-125"
          style={{ backgroundImage: `url('/images/sheep_background.jpg')`, backgroundSize: '240px' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#040405]" />
      </div>

      {/* GENTLE GLOWING AMBIENT GRADIENTS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[380px] bg-gradient-to-b from-[#E2B53E]/15 via-[#E2B53E]/5 to-transparent blur-3xl pointer-events-none z-0" />
      <div className="absolute top-[400px] left-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* --- WRAPPER --- */}
      <div className="w-full max-w-6xl flex flex-col gap-12 flex-grow relative z-10 pt-6 md:pt-12">
        
        {/* LOGO / BRANDING HEADER */}
        <header className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center shadow-[0_4px_20px_rgba(226,181,62,0.15)] text-[#E2B53E] overflow-hidden">
              <Image 
                src="/images/hoodit_logo.jpg" 
                alt="ROBIFY Logo" 
                width={40} 
                height={40} 
                className="w-full h-full object-cover grayscale opacity-90"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-lg font-black font-display tracking-tight text-white uppercase">
                ROBI<span className="text-[#E2B53E]">FY</span>
              </h1>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold font-display">
                Cinematic Gold Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[9px] bg-[#E2B53E]/10 text-[#E2B53E] font-mono px-3 py-1.5 rounded-xl border border-[#E2B53E]/20 flex items-center gap-1.5 font-bold uppercase tracking-wider">
               <span className="w-1.5 h-1.5 bg-[#E2B53E] rounded-full animate-ping" />
              Mainnet Active
            </span>
          </div>
        </header>

        {/* HERO HEADER */}
        <section className="text-center flex flex-col items-center gap-6 max-w-3xl mx-auto pt-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900/80 border border-zinc-800 rounded-full text-[10px] uppercase font-bold tracking-widest text-[#E2B53E]"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Welcome to the Golden Frontier</span>
          </motion.div>

          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-black font-display tracking-tight text-white leading-[1.05]"
          >
            CRAFT YOUR COZY <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
              GOLDEN AVATAR
            </span>
          </motion.h2>

          <motion.p 
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm md:text-base text-zinc-400 max-w-xl leading-relaxed"
          >
            Enter the most advanced Web3 art ecosystem on Robinhood & Base Chain. Create iconic golden or custom-hooded profile pictures, browse the community gallery, or generate viral memes using custom system prompt formulas.
          </motion.p>
        </section>

        {/* MAIN NAVIGATION BENTO CARDS */}
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* CARD 1: ROBIFY STUDIO */}
          <motion.div 
            variants={itemVariants}
            className="group relative bg-zinc-950/60 hover:bg-zinc-950/90 border border-zinc-800/80 hover:border-[#E2B53E]/50 rounded-[32px] overflow-hidden p-6 md:p-8 flex flex-col justify-between min-h-[380px] transition-all duration-300 backdrop-blur-xl shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#E2B53E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 group-hover:border-[#E2B53E]/40 flex items-center justify-center text-zinc-400 group-hover:text-[#E2B53E] transition-all duration-300 shadow-md">
                <Layers className="w-6 h-6" />
              </div>
              
              <div>
                <span className="text-[10px] font-extrabold text-[#E2B53E] uppercase tracking-widest font-mono">
                  01. AVATAR STUDIO
                </span>
                <h3 className="text-xl font-black font-display text-white mt-2 tracking-tight group-hover:text-[#E2B53E] transition-colors">
                  ROBIFY STUDIO DESK
                </h3>
                <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                  Upload your selfie or portrait photo, and watch our artificial intelligence weave a legendary golden or custom cowl hood with high precision in various artistic styles.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <Link 
                href="/studio"
                className="inline-flex items-center gap-2 bg-[#E2B53E] hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl transition-all shadow-md group-hover:shadow-[0_4px_20px_rgba(226,181,62,0.25)]"
              >
                <span>Open Studio Desk</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>
          </motion.div>

          {/* CARD 2: PROMPT TO MEME LAB (The highlight user-request) */}
          <motion.div 
            variants={itemVariants}
            className="group relative bg-zinc-950/60 hover:bg-zinc-950/90 border border-zinc-800/80 hover:border-amber-500/50 rounded-[32px] overflow-hidden p-6 md:p-8 flex flex-col justify-between min-h-[380px] transition-all duration-300 backdrop-blur-xl shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 group-hover:border-amber-500/40 flex items-center justify-center text-zinc-400 group-hover:text-amber-500 transition-all duration-300 shadow-md relative">
                <MessageSquare className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                </span>
              </div>
              
              <div>
                <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest font-mono">
                  02. EXPERIMENTAL LAB
                </span>
                <h3 className="text-xl font-black font-display text-white mt-2 tracking-tight group-hover:text-amber-500 transition-colors">
                  PROMPT TO MEME LAB
                </h3>
                <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                  Experiment with creating viral jokes! Test our system prompt formulas (Hoodie Meme, Base Chain, Classic Meme) or formulate your own custom system prompt recipes to discover the craziest meme templates.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <Link 
                href="/meme-generator"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl transition-all shadow-md"
              >
                <span>Start Weaving Memes</span>
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>
          </motion.div>

          {/* CARD 3: MASTERPIECE GALLERY */}
          <motion.div 
            variants={itemVariants}
            className="group relative bg-zinc-950/60 hover:bg-zinc-950/90 border border-zinc-800/80 hover:border-[#E2B53E]/50 rounded-[32px] overflow-hidden p-6 md:p-8 flex flex-col justify-between min-h-[380px] transition-all duration-300 backdrop-blur-xl shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#E2B53E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 group-hover:border-[#E2B53E]/40 flex items-center justify-center text-zinc-400 group-hover:text-[#E2B53E] transition-all duration-300 shadow-md">
                <ImageIcon className="w-6 h-6" />
              </div>
              
              <div>
                <span className="text-[10px] font-extrabold text-[#E2B53E] uppercase tracking-widest font-mono">
                  03. PUBLIC EXHIBIT
                </span>
                <h3 className="text-xl font-black font-display text-white mt-2 tracking-tight group-hover:text-[#E2B53E] transition-colors">
                  COZY HOOD GALLERY
                </h3>
                <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                  Browse the golden-hooded masterpieces crafted by the community. Download your favorite artworks, share them directly on X, or reload your old works back into the studio editor.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <Link 
                href="/gallery"
                className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 group-hover:border-[#E2B53E]/30 font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl transition-all shadow-md"
              >
                <span>Open Masterpiece Gallery</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>
          </motion.div>
        </motion.section>

        {/* STATS / FEATURES FOOTNOTE SECTION */}
        <section className="bg-zinc-950/40 border border-zinc-900/80 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-3.5 p-2">
            <div className="p-2.5 bg-[#E2B53E]/10 rounded-xl text-[#E2B53E]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-white tracking-wider font-display">Base & Robinhood Chain</h4>
              <p className="text-[10.5px] text-zinc-500 leading-relaxed mt-1">Micro-payments instantly verified on your choice of Base Mainnet or Robinhood Chain.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-3.5 p-2 border-y md:border-y-0 md:border-x border-zinc-900/80">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-white tracking-wider font-display">Prompt Optimizer</h4>
              <p className="text-[10.5px] text-zinc-500 leading-relaxed mt-1">Utilizes Bankr LLM to compile the best visual meme parameters.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-3.5 p-2">
            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-white tracking-wider font-display">Local Persistence</h4>
              <p className="text-[10.5px] text-zinc-500 leading-relaxed mt-1">All woven masterpieces are automatically saved in your browser sandbox.</p>
            </div>
          </div>
        </section>

      </div>

      {/* --- FOOTER --- */}
      <footer className="w-full max-w-6xl px-4 py-8 mt-12 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
        <p className="text-[10px] text-zinc-400 font-mono font-medium text-center sm:text-left">
          &copy; 2026 ROBIFY Ecosystem. Made with care for the Web3 community. Powered by bankr.bot.
        </p>
        <div className="flex items-center gap-4 text-[10px] text-[#E2B53E] font-bold uppercase tracking-widest font-display">
          <span>COZY COWL • GOLDEN MEME LAB</span>
        </div>
      </footer>

    </main>
  );
}
