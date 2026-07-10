"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  Download, 
  Twitter, 
  RotateCcw, 
  Sparkles, 
  Check, 
  AlertTriangle, 
  Image as ImageIcon,
  ChevronRight,
  Info,
  VenetianMask,
  Shirt
} from "lucide-react";

// --- DATA TYPES ---
interface GenerationResult {
  success: boolean;
  image?: string;
  prompt?: string;
  fallbackUsed?: boolean;
  message?: string;
}

export default function Page() {
  // --- GENERAL STATES ---
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // --- AI RE-IMAGINATION STATES ---
  const [originalUploadedSrc, setOriginalUploadedSrc] = useState<string | null>(null);
  const [artStyle, setArtStyle] = useState<"normal" | "meme" | "cartoon" | "pixel">("normal");
  const [isReimagining, setIsReimagining] = useState(false);
  const [reimagineProgress, setReimagineProgress] = useState<string | null>(null);
  const [watermarkEnabled, setWatermarkEnabled] = useState<boolean>(true);

  // --- DAILY RATE LIMIT STATES & HELPER ---
  const [remainingGenerations, setRemainingGenerations] = useState<number>(3);

  const getRemainingGenerationsCount = (): number => {
    if (typeof window === "undefined") return 3;
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const stored = localStorage.getItem("robify_generations_limit");
    if (!stored) return 3;
    try {
      const timestamps: number[] = JSON.parse(stored);
      const recent = timestamps.filter((t: number) => t > oneDayAgo);
      return Math.max(0, 3 - recent.length);
    } catch (e) {
      return 3;
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemainingGenerations(getRemainingGenerationsCount());
  }, []);

  const recordGenerationLocal = () => {
    if (typeof window === "undefined") return;
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const stored = localStorage.getItem("robify_generations_limit");
    let timestamps: number[] = [];
    if (stored) {
      try {
        timestamps = JSON.parse(stored);
      } catch (e) {
        timestamps = [];
      }
    }
    const recent = timestamps.filter((t: number) => t > oneDayAgo);
    recent.push(now);
    localStorage.setItem("robify_generations_limit", JSON.stringify(recent));
    setRemainingGenerations(Math.max(0, 3 - recent.length));
  };

  // --- SHARING STATE ---
  const [shareText, setShareText] = useState<string>(
    "Just got my cozy green hood avatar on @robify! Custom-crafting my new PFP style with @bankrbot 🟢 #ROBIFY #bankr"
  );
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [coinNameInput, setCoinNameInput] = useState("");

  // --- REFS ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  
  // High-fidelity image state for drawing to the canvas
  const [canvasImage, setCanvasImage] = useState<HTMLImageElement | null>(null);

  // --- DRAG AND DROP HANDLERS ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // --- FILE PROCESSOR ---
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload a valid JPEG or PNG image.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsProcessing(true);
    setOriginalUploadedSrc(null); // Reset reimagined status for fresh photo uploads

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImageSrc(base64);
      setOriginalUploadedSrc(base64);
      
      // Load the image to determine natural dimensions
      const img = new window.Image();
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setCanvasImage(img);
        setIsProcessing(false);
        setSuccessMessage("Photo loaded beautifully! Select your favorite style and let's craft your custom avatar.");
      };
      img.src = base64;
    };

    reader.readAsDataURL(file);
  };

  // --- AI RE-IMAGINATION MOTOR ---
  const reimagineWithAI = async () => {
    const sourceImage = originalUploadedSrc || imageSrc;
    if (!sourceImage) {
      setErrorMessage("Please upload a photo first to weave your green hood portrait.");
      return;
    }

    // Double check client-side rate limit
    const currentRemaining = getRemainingGenerationsCount();
    if (currentRemaining <= 0) {
      setErrorMessage("Daily limit reached! You have reached the maximum of 3 generations for today. Please try again tomorrow.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsReimagining(true);
    setReimagineProgress("Welcoming your portrait to the digital studio...");

    try {
      // Step-by-step progress simulation for a warm, human experience
      const p1 = setTimeout(() => {
        setReimagineProgress("Gently crafting your unique green-hood style design...");
      }, 1500);

      const p2 = setTimeout(() => {
        setReimagineProgress("Painting your custom emerald-hood portrait...");
      }, 3500);

      const res = await fetch("/api/reimagine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: sourceImage,
          style: artStyle,
          accessory: "cowl", // Defaults to the iconic cowl hood
        }),
      });

      clearTimeout(p1);
      clearTimeout(p2);

      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 429) {
          // Sync client-side limit immediately to 0
          if (typeof window !== "undefined") {
            const now = Date.now();
            localStorage.setItem("robify_generations_limit", JSON.stringify([now, now, now]));
            setRemainingGenerations(0);
          }
        }
        throw new Error(errData.error || "Generation endpoint failed.");
      }

      const data: GenerationResult = await res.json();
      if (data.image) {
        setImageSrc(data.image);
        
        // Record successful generation
        recordGenerationLocal();
        
        const img = new window.Image();
        img.onload = () => {
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
          setCanvasImage(img);
        };
        img.src = data.image;

        if (data.fallbackUsed) {
          setErrorMessage(data.message || "AI generation servers are busy. We displayed your portrait with our emerald mask overlay!");
        } else {
          setSuccessMessage(`Success! We have beautifully woven a cozy green hood onto your photo in "${artStyle}" style.`);
        }
      } else {
        throw new Error("No image data returned from Imagen 3.");
      }
    } catch (err: any) {
      console.error("Reimagine error:", err);
      setErrorMessage(`AI Generation failed: ${err.message || err}. Please try again.`);
    } finally {
      setIsReimagining(false);
      setReimagineProgress(null);
    }
  };

  const resetToOriginal = () => {
    if (originalUploadedSrc) {
      const src = originalUploadedSrc;
      setImageSrc(src);
      setSuccessMessage("Restored your original uploaded photo.");
      
      const img = new window.Image();
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setCanvasImage(img);
      };
      img.src = src;
    }
  };

  // --- REACTIVE CANVAS DRAWING (IMAGE + WATERMARK) ---
  useEffect(() => {
    if (!imageSrc || !canvasImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use internal dimensions matching the original image to maintain maximum quality
    canvas.width = imageDimensions?.width || canvasImage.naturalWidth || 1024;
    canvas.height = imageDimensions?.height || canvasImage.naturalHeight || 1024;

    // 1. Draw Photo (Original or Re-imagined AI Portrait)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvasImage, 0, 0, canvas.width, canvas.height);

    // 2. Draw $HOODIT COIN Watermark if enabled
    if (watermarkEnabled) {
      const padding = Math.max(12, canvas.width * 0.03);
      const fontHeight = Math.max(14, canvas.width * 0.035);
      
      ctx.save();
      
      // Watermark Container Pill
      ctx.fillStyle = "rgba(9, 9, 11, 0.88)";
      ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
      ctx.lineWidth = Math.max(1.5, canvas.width * 0.003);
      
      const pillText = "$ROBIFY COIN";
      ctx.font = `bold ${fontHeight}px monospace`;
      const textWidth = ctx.measureText(pillText).width;
      
      const pillWidth = textWidth + fontHeight * 1.5;
      const pillHeight = fontHeight * 1.8;
      
      const pillX = canvas.width - pillWidth - padding;
      const pillY = canvas.height - pillHeight - padding;
      const radius = pillHeight / 2;
      
      // Draw round pill
      ctx.beginPath();
      ctx.moveTo(pillX + radius, pillY);
      ctx.lineTo(pillX + pillWidth - radius, pillY);
      ctx.quadraticCurveTo(pillX + pillWidth, pillY, pillX + pillWidth, pillY + radius);
      ctx.lineTo(pillX + pillWidth, pillY + pillHeight - radius);
      ctx.quadraticCurveTo(pillX + pillWidth, pillY + pillHeight, pillX + pillWidth - radius, pillY + pillHeight);
      ctx.lineTo(pillX + radius, pillY + pillHeight);
      ctx.quadraticCurveTo(pillX, pillY + pillHeight, pillX, pillY + pillHeight - radius);
      ctx.lineTo(pillX, pillY + radius);
      ctx.quadraticCurveTo(pillX, pillY, pillX + radius, pillY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Draw Dot Indicator
      const dotRadius = fontHeight * 0.25;
      const dotX = pillX + radius * 0.75;
      const dotY = pillY + pillHeight / 2;
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#10B981";
      ctx.fill();
      
      // Draw Text
      ctx.fillStyle = "#FFFFFF";
      ctx.textBaseline = "middle";
      ctx.fillText(pillText, dotX + dotRadius * 2, dotY);
      
      ctx.restore();
    }

  }, [imageSrc, canvasImage, watermarkEnabled, isProcessing, imageDimensions]);

  // --- COMPILATION & EXPORT ACTION ---
  const downloadPFP = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `robify-portrait-${Date.now()}.jpg`;
    link.href = canvasRef.current.toDataURL("image/jpeg", 0.95);
    link.click();
  };

  const copyCanvasToClipboard = async (): Promise<boolean> => {
    if (!canvasRef.current) return false;
    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvasRef.current?.toBlob((b) => resolve(b), "image/png");
      });
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);
        return true;
      }
    } catch (err) {
      console.warn("Failed to copy image to clipboard automatically:", err);
    }
    return false;
  };

  const shareOnX = async () => {
    let finalShareText = shareText;
    if (!finalShareText.toLowerCase().includes("@robify")) {
      finalShareText = finalShareText.trim() + " @robify";
    }
    const copied = await copyCanvasToClipboard();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(finalShareText)}`;
    window.open(twitterUrl, "_blank");
    if (copied) {
      setSuccessMessage("✨ Redirecting to X! The generated image has been copied to your clipboard. Simply press Ctrl+V (or Command+V) in the Twitter post window to attach it!");
    } else {
      setSuccessMessage("✨ Redirecting to X! Make sure to download and attach your generated green hood portrait to show off your avatar!");
    }
  };

  const launchOnBankr = () => {
    setIsLaunchModalOpen(true);
  };

  const handleConfirmLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coinNameInput.trim()) return;

    // Auto format coin symbol: remove spaces/special characters, convert to uppercase
    const cleanedCoin = coinNameInput.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    
    // Construct the compelling promotional text:
    const compiledText = `Just generated my custom green hood avatar at @robify! @bankrbot launch $${cleanedCoin} on robinhood 🟢🚀`;
    
    const copied = await copyCanvasToClipboard();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(compiledText)}`;
    window.open(twitterUrl, "_blank");
    
    setShareText(compiledText);
    setIsLaunchModalOpen(false);
    setCoinNameInput("");
    if (copied) {
      setSuccessMessage(`🚀 Launch initiated! $${cleanedCoin} token is deploying to the Robinhood Chain. We copied the generated image to your clipboard—press Ctrl+V (or Command+V) in the Twitter tab to attach it!`);
    } else {
      setSuccessMessage(`🚀 Launch initiated! $${cleanedCoin} token is deploying to the Robinhood Chain. Check your X tab to post, and make sure to attach your downloaded portrait!`);
    }
  };

  const handleCancelLaunch = () => {
    setIsLaunchModalOpen(false);
    setCoinNameInput("");
  };

  const triggerFileReset = () => {
    setImageSrc(null);
    setOriginalUploadedSrc(null);
    setImageDimensions(null);
    setCanvasImage(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <main className="min-h-screen bg-[#040405] text-zinc-100 font-sans selection:bg-[#10B981] selection:text-black flex flex-col items-center justify-between p-4 md:p-6 relative overflow-x-hidden">
      
      {/* IMMERSIVE COZY GREEN HOOD SHEEP BACKGROUND (Vibrant pattern at top, fading to solid black/dark at bottom) */}
      <div className="absolute inset-x-0 top-0 h-[720px] pointer-events-none z-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-repeat opacity-[0.52]"
          style={{ backgroundImage: `url('/images/sheep_background.jpg')`, backgroundSize: '240px' }}
        />
        {/* Smooth fade-out to main background color #040405 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#040405]" />
      </div>

      {/* GENTLE GLOWING AMBIENT GRADIENT */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[350px] bg-gradient-to-b from-[#10B981]/20 via-[#10B981]/5 to-transparent blur-3xl pointer-events-none z-0" />

      {/* AMBIENT GRADIENT OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#040405]/25 to-[#040405]/75 pointer-events-none z-0" />

      {/* --- CONTAINER WRAPPER --- */}
      <div className="w-full max-w-7xl flex flex-col gap-5 flex-grow relative z-10">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col sm:flex-row justify-between items-center bg-zinc-950/65 border border-zinc-800/80 rounded-3xl p-5 sm:px-6 sm:py-5 gap-4 backdrop-blur-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-[0_4px_20px_rgba(16,185,129,0.15)] text-[#10B981] overflow-hidden relative">
              <Image 
                src="/images/hoodit_logo.jpg" 
                alt="ROBIFY Logo" 
                width={44} 
                height={44} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black font-display tracking-tight text-white flex items-center gap-1.5">
                ROBI<span className="text-[#10B981]">FY</span>
              </h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                Cozy Green Hood Avatars • ROBIFY Studio
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 justify-center">
            <span className="text-[10px] bg-[#10B981]/10 text-[#10B981] font-mono px-4 py-2 rounded-2xl border border-[#10B981]/20 flex items-center gap-1.5 font-bold uppercase tracking-wider">
               <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-ping" />
              ROBIFY Official
            </span>
          </div>
        </header>

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-grow">
          
          {/* LEFT COLUMN: CANVAS AND DROPAREA (col-span-7) */}
          <div className="lg:col-span-7 min-h-[440px] lg:min-h-[580px] bg-zinc-950/50 border border-zinc-800/80 rounded-[32px] relative overflow-hidden flex flex-col items-center justify-center p-4 md:p-6 group transition-all duration-300 hover:border-[#10B981]/50 backdrop-blur-md">
            
            {/* Header tags indicating active state */}
            <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-none">
              <span className="bg-zinc-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-[10px] border border-zinc-800 uppercase tracking-wider font-bold text-zinc-400">
                {imageSrc ? (originalUploadedSrc === imageSrc ? "Original Photo" : "ROBIFY Portrait") : "Studio Desk"}
              </span>
              
              {isReimagining && (
                <span className="bg-[#10B981]/20 text-[#10B981] px-3.5 py-1.5 rounded-xl text-[10px] border border-[#10B981]/30 uppercase tracking-wider font-bold animate-pulse flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-ping" />
                  Weaving Hood...
                </span>
              )}
            </div>

            {/* INTERACTIVE COMPONENT SWITCH */}
            <AnimatePresence mode="wait">
              {/* State A: EMPTY STATE / DRAG-DROP AREA */}
              {!imageSrc && !isProcessing && (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center text-center p-8 cursor-pointer relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[#10B981]/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 group-hover:border-[#10B981]/50 flex items-center justify-center text-zinc-400 group-hover:text-[#10B981] mb-6 transition-all duration-300 group-hover:scale-105 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
                    <Upload className="w-6 h-6 stroke-[1.8]" />
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
                    Get your green hood on! 🟢
                  </h3>
                  
                  <p className="text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
                    Drop your selfie here! No need to shower or dress up—we will digitally slap a legendary green hood on your head so you can rule the Robinhood Chain. 😎🟢
                  </p>

                  <div className="inline-flex items-center gap-1.5 text-xs text-black font-extrabold bg-[#10B981] px-5.5 py-3 rounded-xl hover:bg-emerald-400 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.2)]">
                    CHOOSE A PHOTO
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </div>

                  <input
                     type="file"
                     ref={fileInputRef}
                     onChange={handleFileSelect}
                     accept="image/*"
                     className="hidden"
                  />
                </motion.div>
              )}

              {/* State B: PROCESSING ANIMATION */}
              {isProcessing && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full flex flex-col items-center justify-center text-center p-8"
                >
                  <div className="relative w-14 h-14 mb-6">
                    <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-[#10B981] animate-spin" />
                  </div>
                  
                  <h3 className="text-base font-bold text-white mb-1">
                    Welcoming photo...
                  </h3>
                  
                  <p className="text-xs text-zinc-500 max-w-xs leading-relaxed animate-pulse">
                    Preparing high-fidelity canvas and scaling details for a perfect finish...
                  </p>
                </motion.div>
              )}

              {/* State C: INTERACTIVE CANVAS CONTAINER */}
              {imageSrc && !isProcessing && (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full flex flex-col items-center justify-center p-2"
                >
                  {/* CANVAS WRAPPER */}
                  <div className="relative w-full max-w-[420px] aspect-square rounded-[24px] overflow-hidden bg-zinc-950 border border-zinc-800/80 shadow-2xl flex items-center justify-center group/canvas" id="canvas-card">
                    {/* Native crisp image render for guaranteed browser compatibility */}
                    <img 
                      src={imageSrc} 
                      alt="ROBIFY Portrait" 
                      className="w-full h-full object-contain select-none pointer-events-none" 
                    />

                    {/* Live HTML overlay of the watermark for ultra-crisp display */}
                    {watermarkEnabled && (
                      <div className="absolute bottom-4 right-4 bg-zinc-950/90 border border-[#10B981]/30 backdrop-blur-md rounded-full py-1.5 px-3.5 flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                        <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                        <span className="text-[10px] font-mono font-bold text-white tracking-wider">$ROBIFY COIN</span>
                      </div>
                    )}

                    <canvas
                      ref={canvasRef}
                      className="hidden"
                      id="hood-generator-canvas"
                    />
                  </div>

                  {/* RESET CONTROL PILL */}
                  <div className="mt-4 flex flex-wrap items-center justify-between w-full max-w-[420px] px-1 gap-2">
                    <button
                      onClick={triggerFileReset}
                      className="text-xs font-bold tracking-tight text-zinc-400 hover:text-white flex items-center gap-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 px-4 py-2 rounded-xl transition-all cursor-pointer"
                      id="btn-change-photo"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#10B981]" />
                      Choose another photo
                    </button>
                    
                    {imageDimensions && (
                      <span className="text-[10px] font-mono text-zinc-500">
                        {imageDimensions.width} × {imageDimensions.height} px
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Subtle card corners decoration */}
            <div className="absolute inset-0 pointer-events-none border-[12px] border-transparent group-hover:border-zinc-800/10 transition-all rounded-[32px]" />
          </div>

          {/* RIGHT COLUMN: AI GENERATOR DASHBOARD (col-span-5) */}
          <div className="lg:col-span-5 bg-zinc-950/65 border border-zinc-800/80 rounded-[32px] p-6 md:p-7 flex flex-col justify-between relative overflow-hidden backdrop-blur-md" id="ai-reimagine-bento-card">
            {/* Ambient pulsing accent light if generating */}
            {isReimagining && (
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#10B981]/5 rounded-full blur-3xl animate-pulse pointer-events-none" />
            )}
            
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-bold text-[#10B981] uppercase tracking-widest block mb-1">
                  1. Choose Art Style
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Choose your aesthetic motif. Our designer-tuned generator will naturally weave a custom emerald green cowl hood that perfectly matches your portrait.
                </p>
              </div>

              {/* Grid of Styles */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {[
                  { id: "normal", label: "Studio Portrait", desc: "Realistic photo", icon: "📸" },
                  { id: "meme", label: "Meme Style", desc: "Pepe & reaction comic", icon: "😂" },
                  { id: "cartoon", label: "Cartoon 2D", desc: "Pop-art print", icon: "🎨" },
                  { id: "pixel", label: "Retro Pixel", desc: "8-Bit Avatar", icon: "👾" },
                ].map((style) => (
                  <button
                    key={style.id}
                    disabled={isReimagining}
                    onClick={() => setArtStyle(style.id as any)}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2.5 transition-all text-center group cursor-pointer ${
                      artStyle === style.id
                        ? "border-[#10B981] bg-[#10B981]/5 text-white"
                        : "border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/30 text-zinc-400 hover:text-white"
                    } ${isReimagining ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                      {style.icon}
                    </span>
                    <div>
                      <span className="text-xs font-bold block">{style.label}</span>
                      <span className="text-[9px] text-zinc-500 font-medium block leading-none mt-1.5">{style.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Watermark toggle */}
              <div className="pt-4 flex items-center justify-between border-t border-zinc-800/40">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="text-xs text-zinc-400">Apply $ROBIFY Badge</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={watermarkEnabled} 
                    onChange={(e) => setWatermarkEnabled(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#10B981] peer-checked:after:bg-zinc-950 peer-checked:after:border-zinc-950"></div>
                </label>
              </div>
            </div>

            {/* Progress Log or Generation Button */}
            <div className="mt-8 pt-4 border-t border-zinc-800/40 flex flex-col gap-4">
              <div className="flex items-center justify-between w-full">
                {isReimagining ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-zinc-800 border-t-[#10B981] animate-spin shrink-0" />
                    <span className="text-xs text-[#10B981] font-medium animate-pulse">
                      {reimagineProgress || "Processing deep generation..."}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 text-xs text-zinc-500">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#10B981]" />
                      <span>
                        {imageSrc && originalUploadedSrc !== imageSrc 
                          ? "Your cozy green hood avatar is ready!" 
                          : "Ready to weave your cozy green hood avatar."}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg px-2.5 py-1 text-[11px] font-mono font-bold text-[#10B981]">
                      Limit: {remainingGenerations}/3 today
                    </div>
                  </div>
                )}
              </div>
 
              <div className="flex gap-2.5">
                {imageSrc && originalUploadedSrc !== imageSrc && (
                  <button
                    onClick={resetToOriginal}
                    disabled={isReimagining}
                    className="px-4 py-3.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-2xl font-bold text-xs uppercase transition-all cursor-pointer"
                  >
                    Reset
                  </button>
                )}
                
                <button
                  disabled={!imageSrc || isReimagining || (remainingGenerations <= 0 && originalUploadedSrc === imageSrc)}
                  onClick={reimagineWithAI}
                  className={`flex-grow px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 ${
                    !imageSrc
                      ? "bg-zinc-950 border border-zinc-850 text-zinc-650 cursor-not-allowed"
                      : isReimagining
                      ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 cursor-not-allowed animate-pulse"
                      : remainingGenerations <= 0 && originalUploadedSrc === imageSrc
                      ? "bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed"
                      : "bg-[#10B981] text-black hover:scale-[1.01] shadow-[0_4px_25px_rgba(16,185,129,0.25)] cursor-pointer hover:bg-emerald-400"
                  }`}
                  id="btn-trigger-reimagine"
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  {isReimagining 
                    ? "Weaving Hood..." 
                    : remainingGenerations <= 0 && originalUploadedSrc === imageSrc 
                    ? "Daily Limit Reached 🚫" 
                    : "Weave My Green Hood ✨"}
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM BENTO ACTION BAR (col-span-12) */}
          <div className="lg:col-span-12 flex flex-col md:flex-row gap-4 mt-1" id="actions-bento-bar">
            
            {/* DOWNLOAD TRIGGER */}
            <button
              disabled={!imageSrc}
              onClick={downloadPFP}
              className={`flex-1 py-4.5 px-6 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-3 transition-all ${
                imageSrc
                  ? "bg-[#10B981] text-black hover:scale-[1.01] shadow-[0_4px_30px_rgba(16,185,129,0.25)] cursor-pointer hover:bg-emerald-400"
                  : "bg-zinc-900/50 text-zinc-550 border border-zinc-850 cursor-not-allowed"
              }`}
              id="btn-download-pfp"
            >
              <Download className="w-5 h-5 stroke-[2.5]" />
              DOWNLOAD PORTRAIT
            </button>

            {/* TWITTER SHARE HUB */}
            <div className={`flex-[1.5] flex flex-col gap-2.5 ${!imageSrc ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="flex-grow">
                <input
                  type="text"
                  value={shareText}
                  onChange={(e) => setShareText(e.target.value)}
                  placeholder="Custom share text..."
                  className="w-full text-xs bg-zinc-900/50 border border-zinc-800 focus:border-[#10B981]/40 rounded-2xl px-4 py-3 text-zinc-200 placeholder-zinc-600 focus:outline-none"
                  id="share-text-input"
                />
                <p className="text-[10px] text-zinc-500 mt-1.5 px-1 leading-normal">
                  💡 <strong>Tip:</strong> Sharing or launching will copy your generated avatar to the clipboard. Simply press <strong>Ctrl+V</strong> (or <strong>Cmd+V</strong>) in the X (Twitter) compose window to attach the image instantly!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  disabled={!imageSrc}
                  onClick={shareOnX}
                  className={`flex-1 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 font-bold text-xs uppercase tracking-wider rounded-2xl px-5 py-3.5 flex items-center justify-center gap-2 transition-all ${
                    imageSrc ? "cursor-pointer" : "cursor-not-allowed"
                  }`}
                  id="btn-share-x"
                >
                  <Twitter className="w-3.5 h-3.5 fill-current text-white shrink-0" />
                  <span>Share</span>
                </button>

                <button
                  disabled={!imageSrc}
                  onClick={launchOnBankr}
                  className={`flex-[1.2] bg-gradient-to-r from-emerald-400 to-teal-500 text-black font-black text-xs uppercase tracking-widest rounded-2xl px-5 py-3.5 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] ${
                    imageSrc ? "cursor-pointer hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]" : "cursor-not-allowed"
                  }`}
                  id="btn-launch-bankr"
                >
                  <span>Launch on Bankr 🚀</span>
                </button>
              </div>
            </div>

            {/* STUDIO STATUS INDICATOR */}
            <div className="bg-zinc-950/65 border border-zinc-800/80 backdrop-blur-md rounded-2xl px-5 py-3 flex items-center justify-between min-w-[200px] gap-4" id="api-status-card">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Studio status</span>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-300 font-medium">
                  {isReimagining ? "Weaving" : "Warm & Active"}
                </span>
                <div className={`w-2.5 h-2.5 rounded-full bg-[#10B981] ${isReimagining ? "animate-ping" : "animate-pulse"}`} />
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* --- NOTIFICATIONS BANNER PANEL --- */}
      {errorMessage && (
        <div className="w-full max-w-7xl mt-4 px-1" id="notification-error-box">
          <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 text-xs leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <span className="font-bold">Notice:</span> {errorMessage}
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="w-full max-w-7xl mt-4 px-1" id="notification-success-box">
          <div className="bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded-2xl p-4 flex items-start gap-3 text-xs leading-relaxed">
            <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#10B981]" />
            <div>
              <span className="font-bold">Perfect:</span> {successMessage}
            </div>
          </div>
        </div>
      )}

      {/* --- FOOTER INFO --- */}
      <footer className="w-full max-w-7xl px-4 py-8 mt-12 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
        <p className="text-[10px] text-zinc-300 font-mono font-medium text-center sm:text-left">
          &copy; 2026 ROBIFY Community. Made with care for $ROBIFY holders. Powered by bankr.
        </p>
        <div className="flex items-center gap-4 text-[10px] text-[#10B981] font-bold uppercase tracking-widest">
          <span>Keep it cozy. Keep it green.</span>
        </div>
      </footer>

      {/* --- COIN NAME PROMPT MODAL --- */}
      <AnimatePresence>
        {isLaunchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelLaunch}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-800/80 rounded-[28px] overflow-hidden p-6 md:p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col gap-6"
            >
              <div className="flex flex-col gap-2 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] mb-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <h3 className="text-lg font-black font-display tracking-tight text-white uppercase">
                  Launch Your Coin
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Enter your coin symbol to deploy on Robinhood Chain via bankr.bot.
                </p>
              </div>

              <form onSubmit={handleConfirmLaunch} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                    Token Symbol / Name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. MYCOIN"
                    value={coinNameInput}
                    onChange={(e) => setCoinNameInput(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())}
                    className="w-full text-sm font-mono bg-zinc-900 border border-zinc-800 focus:border-[#10B981]/50 rounded-xl px-4 py-3 text-white placeholder-zinc-700 text-center uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-[#10B981]/30 transition-all"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelLaunch}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl py-3 border border-zinc-800/80 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[1.3] bg-gradient-to-r from-emerald-400 to-teal-500 text-black font-black text-xs uppercase tracking-widest rounded-xl py-3 transition-all hover:scale-[1.01] shadow-[0_0_20px_rgba(16,185,129,0.15)] flex items-center justify-center gap-1.5"
                  >
                    <span>Launch Coin 🚀</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
