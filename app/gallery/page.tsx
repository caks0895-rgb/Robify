"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Download, 
  Twitter, 
  Trash2, 
  Image as ImageIcon,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Edit
} from "lucide-react";

interface Creation {
  id: string;
  image: string;
  style: string;
  timestamp: number;
}

export default function GalleryPage() {
  const router = useRouter();
  const [creations, setCreations] = useState<Creation[]>([]);
  const [selectedCreation, setSelectedCreation] = useState<Creation | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load creations from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("robify_creations");
      if (stored) {
        try {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCreations(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse robify_creations", e);
        }
      }
    }
  }, []);

  const deleteCreation = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const filtered = creations.filter(c => c.id !== id);
    setCreations(filtered);
    if (typeof window !== "undefined") {
      localStorage.setItem("robify_creations", JSON.stringify(filtered));
    }
    if (selectedCreation?.id === id) {
      setSelectedCreation(null);
    }
    setSuccessMessage("Removed creation from your gallery.");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const loadToEditor = (creation: Creation) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("robify_load_temp", JSON.stringify(creation));
      router.push("/");
    }
  };

  const downloadImage = (creation: Creation) => {
    const link = document.createElement("a");
    link.download = `robify-creation-${creation.style}-${creation.id}.jpg`;
    link.href = creation.image;
    link.click();
  };

  const shareOnX = (creation: Creation) => {
    const text = `Just generated this cozy golden hood avatar! Create yours at https://robify.vercel.app/ 🟡 @bankrbot #ROBIFY`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, "_blank");
  };

  return (
    <main className="min-h-screen bg-[#040405] text-zinc-100 font-sans selection:bg-[#E2B53E] selection:text-black flex flex-col items-center justify-between p-4 md:p-6 relative overflow-x-hidden">
      
      {/* IMMERSIVE COZY GOLDEN HOOD SHEEP BACKGROUND */}
      <div className="absolute inset-x-0 top-0 h-[480px] pointer-events-none z-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-repeat opacity-[0.22] grayscale contrast-125"
          style={{ backgroundImage: `url('/images/sheep_background.jpg')`, backgroundSize: '240px' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#040405]" />
      </div>

      {/* GENTLE GLOWING AMBIENT GRADIENT */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[300px] bg-gradient-to-b from-[#E2B53E]/15 via-[#E2B53E]/5 to-transparent blur-3xl pointer-events-none z-0" />

      {/* CONTAINER WRAPPER */}
      <div className="w-full max-w-7xl flex flex-col gap-6 flex-grow relative z-10">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col sm:flex-row justify-between items-center bg-zinc-950/65 border border-zinc-800/80 rounded-3xl p-5 sm:px-6 sm:py-5 gap-4 backdrop-blur-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-[0_4px_20px_rgba(226,181,62,0.15)] text-[#E2B53E] overflow-hidden relative">
              <Image 
                src="/images/hoodit_logo.jpg" 
                alt="ROBIFY Logo" 
                width={44} 
                height={44} 
                className="w-full h-full object-cover grayscale opacity-90"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black font-display tracking-tight text-white flex items-center gap-1.5">
                ROBI<span className="text-[#E2B53E]">FY</span> <span className="text-xs bg-[#E2B53E]/10 text-[#E2B53E] px-2 py-0.5 rounded font-mono font-bold uppercase">Gallery</span>
              </h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-display">
                Your Personal On-Chain Masterpieces
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs bg-[#E2B53E] hover:bg-amber-400 text-black font-black px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all uppercase tracking-wider cursor-pointer shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Studio
            </Link>
          </div>
        </header>

        {/* NOTIFICATION FEEDBACK BAR */}
        {successMessage && (
          <div className="bg-amber-500/10 text-[#E2B53E] border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3 text-xs">
            <Sparkles className="w-4 h-4 text-[#E2B53E] shrink-0" />
            <div>{successMessage}</div>
          </div>
        )}

        {/* MAIN BODY: GALLERY SPLIT OR GRID */}
        <section className="bg-zinc-950/40 border border-zinc-900/60 rounded-[32px] p-6 md:p-8 backdrop-blur-md flex-grow min-h-[450px]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-lg md:text-xl font-black font-display tracking-tight text-white uppercase flex items-center gap-2">
                <span className="text-[#E2B53E]">🟡</span> THE COZY HOOD GALLERY
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                A dedicated, beautiful presentation of all your created golden or custom cowl portraits.
              </p>
            </div>
            {creations.length > 0 && (
              <span className="text-[10px] font-mono bg-[#E2B53E]/10 text-[#E2B53E] border border-[#E2B53E]/20 px-4 py-1.5 rounded-xl font-black uppercase tracking-wider">
                {creations.length} total portraits
              </span>
            )}
          </div>

          {creations.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-2xl py-24 px-4 text-center flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 mb-4 border border-zinc-800">
                <ImageIcon className="w-7 h-7" />
              </div>
              <p className="text-base font-bold text-zinc-300">No cozy creations saved yet</p>
              <p className="text-xs text-zinc-500 max-w-sm mt-2 leading-relaxed">
                Head back to the main Studio, upload a photo, weave a gorgeous hood, and build your digital lineup!
              </p>
              <Link
                href="/"
                className="mt-6 text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold px-5 py-3 rounded-xl transition-all uppercase tracking-wider font-display"
              >
                Go to Studio
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {creations.map((creation) => (
                <div
                  key={creation.id}
                  onClick={() => setSelectedCreation(creation)}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 hover:border-[#E2B53E]/60 transition-all duration-300 cursor-pointer shadow-md hover:shadow-[#E2B53E]/10 hover:-translate-y-1"
                >
                  <img
                    src={creation.image}
                    alt={`${creation.style} style`}
                    className="w-full h-full object-cover select-none"
                    referrerPolicy="no-referrer"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-3 text-center">
                    <span className="text-[10px] text-white font-extrabold uppercase tracking-wider mb-2">
                      View Details
                    </span>
                    <span className="text-[9px] text-[#E2B53E] font-mono font-bold capitalize bg-[#E2B53E]/10 px-2 py-0.5 rounded border border-[#E2B53E]/10">
                      {creation.style} Style
                    </span>
                  </div>

                  {/* Top Delete Pin */}
                  <button
                    onClick={(e) => deleteCreation(creation.id, e)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-zinc-950/90 hover:bg-red-500 text-zinc-400 hover:text-white border border-zinc-800 hover:border-red-500/20 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Bottom style Label */}
                  <div className="absolute bottom-2.5 left-2.5 bg-zinc-950/80 backdrop-blur-md px-2 py-0.5 rounded border border-zinc-800/50 text-[8px] font-mono font-extrabold text-zinc-300 uppercase tracking-wider group-hover:hidden transition-all">
                    {creation.style}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* LIGHTBOX PREVIEW MODAL */}
      {selectedCreation && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCreation(null)}
        >
          <div 
            className="bg-zinc-950 border border-zinc-800 rounded-[32px] max-w-2xl w-full p-5 md:p-6 space-y-5 shadow-[0_10px_50px_rgba(226,181,62,0.1)] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Cross Button */}
            <button
              onClick={() => setSelectedCreation(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 p-2 rounded-xl text-xs hover:bg-zinc-800 transition-all cursor-pointer font-bold"
            >
              ✕ Close
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Image side */}
              <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 relative">
                <img
                  src={selectedCreation.image}
                  alt="Selected custom hood masterpiece"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Controls & details side */}
              <div className="flex flex-col justify-between py-1">
                <div>
                  <span className="text-[9px] bg-[#E2B53E]/15 text-[#E2B53E] font-mono font-black px-2.5 py-1 rounded-lg border border-[#E2B53E]/25 uppercase tracking-wider inline-block">
                    {selectedCreation.style} Style Creation
                  </span>
                  <h3 className="text-lg font-black text-white uppercase mt-3 font-display">
                    Golden Cowl Avatar
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Created on {new Date(selectedCreation.timestamp).toLocaleDateString(undefined, { dateStyle: "long" })}
                  </p>
                  
                  <div className="mt-4 bg-zinc-900/40 border border-zinc-800/60 p-3.5 rounded-xl space-y-1.5 text-[11px] text-zinc-400 leading-normal">
                    <p>✨ <strong>Style:</strong> Weaved utilizing the premium cozy {selectedCreation.style} render engine.</p>
                    <p>💾 <strong>Storage:</strong> Safely persisted locally inside your browser&apos;s private sandbox storage.</p>
                  </div>
                </div>

                <div className="space-y-2 mt-5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => downloadImage(selectedCreation)}
                      className="bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 hover:border-zinc-700 font-extrabold text-xs uppercase tracking-wider py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#E2B53E]" />
                      Download
                    </button>

                    <button
                      onClick={() => shareOnX(selectedCreation)}
                      className="bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 hover:border-zinc-700 font-extrabold text-xs uppercase tracking-wider py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Twitter className="w-3.5 h-3.5 text-sky-400" />
                      Post to X
                    </button>
                  </div>

                  <button
                    onClick={() => loadToEditor(selectedCreation)}
                    className="w-full bg-[#E2B53E] hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <Edit className="w-4 h-4" />
                    Load Back to Studio Editor
                  </button>

                  <button
                    onClick={() => deleteCreation(selectedCreation.id)}
                    className="w-full text-red-400 hover:text-red-300 font-bold text-xs uppercase tracking-wider py-2 text-center hover:underline transition-all block cursor-pointer"
                  >
                    Remove from Gallery
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER SECTION */}
      <footer className="w-full max-w-7xl border-t border-zinc-900/60 mt-8 pt-6 pb-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-zinc-500 gap-3 relative z-10">
        <div>
          © 2026 ROBIFY. Weaving Cozy Masterpieces across the Base Chain.
        </div>
        <div className="flex gap-4 font-mono">
          <Link href="/" className="hover:text-zinc-300">STUDIO</Link>
          <span>•</span>
          <span className="text-[#E2B53E]">GALLERY</span>
        </div>
      </footer>

    </main>
  );
}
