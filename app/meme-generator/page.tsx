"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  RotateCcw, 
  Download, 
  Twitter, 
  ChevronRight, 
  Info, 
  HelpCircle, 
  AlertTriangle, 
  Check, 
  Wallet, 
  Coins, 
  Sliders, 
  MessageSquare,
  Type
} from "lucide-react";

interface MemeGenerationResult {
  success: boolean;
  engineeredPrompt?: string;
  image?: string;
}

const MEME_PRESETS = [
  {
    emoji: "🪑",
    title: "Escobar Waiting",
    prompt: "A hilarious parody of the Pablo Escobar waiting meme: our green-hoodie chibi cartoon mascot sitting alone on a wooden swing in an empty yard, looking depressed, staring blankly with giant wide funny eyes, waiting for the green candle.",
  },
  {
    emoji: "🔥",
    title: "This Is Fine",
    prompt: "A hilarious parody of the 'This Is Fine' meme: our green-hoodie chibi mascot sitting calmly at a wooden table sipping coffee, smiling with a goofy blank expression while the room behind him is engulfed in chaotic bright red flames.",
  },
  {
    emoji: "👀",
    title: "Distracted Boy",
    prompt: "A parody of the distracted boyfriend meme: a blue-skin cartoon creature walking with his companion, but turning back with a funny hyper-exaggerated expression to stare longingly at our green-hoodie chibi mascot walking past.",
  },
  {
    emoji: "👉",
    title: "Spiderman Point",
    prompt: "A parody of the Spiderman pointing meme: two identical green-hoodie chibi mascots standing in an industrial room pointing directly at each other with extremely shocked, goofy, and exaggerated facial expressions.",
  },
  {
    emoji: "🙅‍♂️",
    title: "Hotline Bling",
    prompt: "Split panel parody of Drake Hotline Bling meme: top panel has a blue character looking away in complete disgust; bottom panel has our green-hoodie chibi creature smiling warmly with a giant grin pointing with absolute approval.",
  },
  {
    emoji: "📈",
    title: "Expert Trader",
    prompt: "A smug green-hoodie chibi mascot drawing a massive vertical green line directly on his laptop screen with a green crayon while all charts in the background are crashing down in red.",
  }
];

const LAB_PRESETS = [
  {
    emoji: "📉",
    title: "Portfolio Dip",
    description: "Deep Red Portfolio",
    expression: "Crying hysterically with tears streaming down, eyes wide in panic",
    activity: "Staring at a long red candle chart plummeting straight down",
    atmosphere: "Extremely panicked, highly stressed, hopeless, and resigning to fate",
    background: "In a chaotic messy home office with cracked dusty computer monitors"
  },
  {
    emoji: "🧘",
    title: "HODL Waiter",
    description: "Waiting for Bull Run",
    expression: "Forced hollow smile, tired weary eyes but trying to be brave",
    activity: "Sitting cross-legged, meditating completely frozen with spiderwebs growing on head",
    atmosphere: "Extremely patient but suffering in silence, peaceful on the outside but crying inside",
    background: "A barren gersang desert landscape under dark gray overcast clouds"
  },
  {
    emoji: "🤑",
    title: "Meme Coin FOMO",
    description: "Shitcoin FOMO Mania",
    expression: "Eyes bulging with excitement and glowing green dollar ($) symbols",
    activity: "Panic-typing on a smartphone with both thumbs so fast it's smoking",
    atmosphere: "Super hyper, greedy, obsessed with getting rich overnight",
    background: "Deep cosmic outer space with shiny crypto coins floating everywhere"
  },
  {
    emoji: "🤦",
    title: "Panic Sell Regret",
    description: "Sold at the Bottom",
    expression: "Slapping own forehead hard, shocked expression with mouth wide open",
    activity: "Looking at a notification showing successful sell order at the absolute bottom price",
    atmosphere: "Filled with regret, feeling foolish, stunned and sad looking at the chart",
    background: "A massive green candle immediately shooting up vertically right after selling"
  },
  {
    emoji: "😴",
    title: "Zombie Dev",
    description: "Sleep Deprived Developer",
    expression: "Dull tired eyes with extremely thick dark circles, pale exhausted face",
    activity: "Holding a jumbo coffee mug and half-consciously typing code on a laptop",
    atmosphere: "Endlessly exhausted, groggy, struggling to deploy the dApp before sunrise",
    background: "A pitch-black bedroom where the only light comes from a screen full of red error text"
  },
  {
    emoji: "👑",
    title: "Giga Chad Trader",
    description: "Zen Relaxed Trader",
    expression: "Smiling broadly with absolute confidence, sharp chiseled masculine jawline",
    activity: "Laying back on a lounge chair sipping fresh coconut juice straight from the fruit",
    atmosphere: "Completely relaxed, calm, unbothered by daily market price fluctuations",
    background: "A gorgeous tropical beach with waving palm trees and a golden sunset"
  }
];

export default function MemeGeneratorPage() {
  // --- GENERAL STATES ---
  const [inputMode, setInputMode] = useState<"free-text" | "structured-lab">("structured-lab");
  const [memePrompt, setMemePrompt] = useState("");
  const [memeExpression, setMemeExpression] = useState("crying hysterically with tears streaming down, eyes wide in panic");
  const [memeActivity, setMemeActivity] = useState("staring at a long red candle chart plummeting straight down");
  const [memeAtmosphere, setMemeAtmosphere] = useState("extremely panicked, highly stressed, hopeless, and resigning to fate");
  const [memeBackground, setMemeBackground] = useState("in a chaotic messy home office with cracked dusty computer monitors");

  const [formulaType, setFormulaType] = useState<"green-hoodie" | "blue-hoodie" | "custom-hoodie">("green-hoodie");
  const [customSubject, setCustomSubject] = useState("A cute cartoon kitten");
  const [customColor, setCustomColor] = useState("bright green");
  const [customBgColor, setCustomBgColor] = useState("dark navy blue");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Generated result states
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [engineeredPrompt, setEngineeredPrompt] = useState<string | null>(null);

  // Meme Overlay states
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [textStyle, setTextStyle] = useState<"classic" | "modern" | "clean">("classic");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [textSize, setTextSize] = useState(85);

  // --- REFS ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const memeImageRef = useRef<HTMLImageElement | null>(null);

  // --- RATE LIMIT STATE ---
  const [remainingGenerations, setRemainingGenerations] = useState<number>(3);

  const getRemainingGenerationsCount = (): number => {
    if (typeof window === "undefined") return 3;
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const stored = localStorage.getItem("robify_generations_limit");
    const manualPaid = parseInt(localStorage.getItem("robify_manual_paid_count") || "0");
    if (!stored) return 3 + manualPaid;
    try {
      const timestamps: number[] = JSON.parse(stored);
      const recent = timestamps.filter((t: number) => t > oneDayAgo);
      return Math.max(0, 3 + manualPaid - recent.length);
    } catch (e) {
      return 3 + manualPaid;
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
    const manualPaid = parseInt(localStorage.getItem("robify_manual_paid_count") || "0");
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
    setRemainingGenerations(Math.max(0, 3 + manualPaid - recent.length));
  };

  // --- WALLET & BASE PAYMENTS ---
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [selectedPaymentNetwork, setSelectedPaymentNetwork] = useState<"base" | "robinhood">("base");

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const checkConnection = async () => {
        try {
          const { BrowserProvider, formatEther } = await import("ethers");
          const provider = new BrowserProvider((window as any).ethereum);
          const accounts = await provider.send("eth_accounts", []);
          if (accounts.length > 0) {
            const address = accounts[0];
            setWalletAddress(address);
            const network = await provider.getNetwork();
            setChainId(network.chainId.toString());
            const balanceObj = await provider.getBalance(address);
            const formattedBalance = parseFloat(formatEther(balanceObj)).toFixed(4);
            setWalletBalance(`${formattedBalance} ETH`);
          }
        } catch (e) {
          console.warn("Auto connection check failed:", e);
        }
      };
      checkConnection();

      // Listen to changes
      const handleAccountsChanged = async (accounts: any[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          try {
            const { BrowserProvider, formatEther } = await import("ethers");
            const provider = new BrowserProvider((window as any).ethereum);
            const balanceObj = await provider.getBalance(accounts[0]);
            const formattedBalance = parseFloat(formatEther(balanceObj)).toFixed(4);
            setWalletBalance(`${formattedBalance} ETH`);
          } catch (err) {
            console.warn("Error updating balance on account change:", err);
          }
        } else {
          setWalletAddress(null);
          setWalletBalance(null);
        }
      };

      const handleChainChanged = (hexChainId: any) => {
        // Robust decimal/hex chain ID parsing
        const parsedId = typeof hexChainId === "string" 
          ? (hexChainId.startsWith("0x") ? parseInt(hexChainId, 16).toString() : hexChainId)
          : String(hexChainId);
        setChainId(parsedId);
      };

      (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
      (window as any).ethereum.on("chainChanged", handleChainChanged);

      return () => {
        (window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged);
        (window as any).ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window === "undefined") return;
    if (!(window as any).ethereum) {
      setErrorMessage("Web3 wallet not detected! If you are on a mobile device, please open this website inside your wallet app's built-in browser (e.g. MetaMask, Trust Wallet, Coinbase Wallet).");
      return;
    }
    setIsConnecting(true);
    setErrorMessage(null);
    try {
      const { BrowserProvider, formatEther } = await import("ethers");
      const provider = new BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];
      setWalletAddress(address);

      const network = await provider.getNetwork();
      setChainId(network.chainId.toString());

      const balanceObj = await provider.getBalance(address);
      const formattedBalance = parseFloat(formatEther(balanceObj)).toFixed(4);
      setWalletBalance(`${formattedBalance} ETH`);

      setSuccessMessage(`Connected to wallet: ${address.slice(0, 6)}...${address.slice(-4)}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to connect wallet.");
    } finally {
      setIsConnecting(false);
    }
  };

  const switchChainToBase = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x2105" }], // 8453 (Base Mainnet) in hex
      });
    } catch (switchError: any) {
      const isUnrecognized = 
        switchError.code === 4902 || 
        switchError.code === -32603 ||
        (switchError.message && switchError.message.toLowerCase().includes("unrecognized")) ||
        (switchError.message && switchError.message.toLowerCase().includes("add"));
      
      if (isUnrecognized) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x2105",
                chainName: "Base Mainnet",
                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://mainnet.base.org"],
                blockExplorerUrls: ["https://basescan.org"],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add Base network:", addError);
        }
      } else {
        console.error("Failed to switch network:", switchError);
      }
    }
  };

  const switchChainToRobinhood = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1237" }], // 4663 in hex
      });
    } catch (switchError: any) {
      const isUnrecognized = 
        switchError.code === 4902 || 
        switchError.code === -32603 ||
        (switchError.message && switchError.message.toLowerCase().includes("unrecognized")) ||
        (switchError.message && switchError.message.toLowerCase().includes("add"));
      
      if (isUnrecognized) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x1237",
                chainName: "Robinhood Chain",
                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
                blockExplorerUrls: ["https://robinhoodchain.blockscout.com"],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add Robinhood Chain network:", addError);
        }
      } else {
        console.error("Failed to switch network:", switchError);
      }
    }
  };

  const paySingleGeneration = async () => {
    const isBase = selectedPaymentNetwork === "base";
    const requiredChainId = isBase ? "8453" : "4663";
    const networkName = isBase ? "Base Mainnet" : "Robinhood Chain";

    if (!walletAddress) {
      setErrorMessage("Please connect your wallet first!");
      return;
    }

    if (chainId !== requiredChainId) {
      setErrorMessage(`Please switch to ${networkName} first.`);
      if (isBase) {
        await switchChainToBase();
      } else {
        await switchChainToRobinhood();
      }
      return;
    }

    setIsPaying(true);
    setErrorMessage(null);
    try {
      const { BrowserProvider, parseEther } = await import("ethers");
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const destinationAddress = "0xfe19ce226e0d1e9da7a76422c5b82811fc7a19e8";
      const paymentAmount = "0.000033"; // $0.1 equivalent

      setSuccessMessage(`✍️ Waiting for wallet approval on ${networkName}...`);

      const tx = await signer.sendTransaction({
        to: destinationAddress,
        value: parseEther(paymentAmount),
      });

      setSuccessMessage(`🚀 Tx submitted: ${tx.hash.slice(0, 8)}... Confirming on ${networkName}...`);
      const receipt = await tx.wait(1);

      if (receipt && receipt.status === 1) {
        const currentPaid = parseInt(localStorage.getItem("robify_manual_paid_count") || "0");
        const nextPaid = currentPaid + 1;
        localStorage.setItem("robify_manual_paid_count", String(nextPaid));
        setRemainingGenerations(getRemainingGenerationsCount());
        
        setSuccessMessage(`🎉 Payment successful on ${networkName}! Initiating meme generation...`);
        setIsPaymentModalOpen(false);

        setTimeout(() => {
          generateMeme();
        }, 600);
      } else {
        setErrorMessage("Transaction was reverted.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to complete transaction.");
    } finally {
      setIsPaying(false);
    }
  };

  const handleSurpriseMe = async () => {
    setIsSuggesting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/meme-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) {
        throw new Error("Failed to fetch meme suggestion.");
      }
      const data = await res.json();
      if (data.success && data.suggestion) {
        setMemePrompt(data.suggestion);
        setSuccessMessage("💡 Inspired! A fresh meme idea has been placed in your workspace.");
      } else {
        throw new Error("No suggestion returned from the server.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to generate surprise idea.");
    } finally {
      setIsSuggesting(false);
    }
  };

  // --- CORE GENERATION ACTION ---
  const generateMeme = async () => {
    const isLab = inputMode === "structured-lab";
    if (isLab) {
      if (!memeExpression.trim() && !memeActivity.trim() && !memeAtmosphere.trim() && !memeBackground.trim()) {
        setErrorMessage("Meme Lab elements are empty! Please fill out at least one element box.");
        return;
      }
    } else {
      if (!memePrompt.trim()) {
        setErrorMessage("Meme idea is empty! Please write a description of your meme idea first.");
        return;
      }
    }

    const currentRemaining = getRemainingGenerationsCount();
    if (currentRemaining <= 0) {
      setIsPaymentModalOpen(true);
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGenerating(true);
    setGeneratedImage(null);
    setEngineeredPrompt(null);

    try {
      const res = await fetch("/api/meme-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: isLab ? "" : memePrompt,
          expression: isLab ? memeExpression : "",
          activity: isLab ? memeActivity : "",
          atmosphere: isLab ? memeAtmosphere : "",
          background: isLab ? memeBackground : "",
          formulaType,
          customSubject,
          customColor,
          customBgColor,
          isPremium: false
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Meme generation failed.");
      }

      const data: MemeGenerationResult = await res.json();
      if (data.success && data.image) {
        setGeneratedImage(data.image);
        setEngineeredPrompt(data.engineeredPrompt || null);
        recordGenerationLocal();
        setSuccessMessage("✨ Meme successfully woven! Customize text overlays below.");
      } else {
        throw new Error("Failed to retrieve image from generator.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderMemeText = useCallback((
    ctx: CanvasRenderingContext2D, 
    text: string, 
    y: number, 
    isTop: boolean
  ) => {
    ctx.save();
    const cleanText = text.toUpperCase();

    if (textStyle === "classic") {
      // Classic IMPACT Meme Font
      ctx.font = `${textSize}px Impact, Arial Black, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = Math.max(6, textSize / 7);
      ctx.textAlign = "center";
      ctx.lineJoin = "miter";
      ctx.miterLimit = 2;

      // Wrap text
      const words = cleanText.split(" ");
      let line = "";
      const lines = [];
      const maxWidth = 900;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          lines.push(line.trim());
          line = words[n] + " ";
        } else {
          line = testLine;
        }
      }
      lines.push(line.trim());

      const lineHeight = textSize * 1.1;
      let startY = y;
      if (!isTop) {
        startY = y - (lines.length - 1) * lineHeight;
      }

      lines.forEach((l, idx) => {
        const currentY = startY + idx * lineHeight;
        ctx.strokeText(l, 512, currentY);
        ctx.fillText(l, 512, currentY);
      });

    } else if (textStyle === "modern") {
      // Modern Twitter-style captioned banner
      ctx.font = `bold ${textSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";

      // White box wrap
      const words = cleanText.split(" ");
      let line = "";
      const lines = [];
      const maxWidth = 900;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          lines.push(line.trim());
          line = words[n] + " ";
        } else {
          line = testLine;
        }
      }
      lines.push(line.trim());

      const lineHeight = textSize * 1.25;
      const boxHeight = lines.length * lineHeight + 40;
      const boxY = isTop ? 0 : 1024 - boxHeight;

      // Draw white banner
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, boxY, 1024, boxHeight);

      // Render text
      ctx.fillStyle = "#000000";
      lines.forEach((l, idx) => {
        const currentY = boxY + (textSize * 0.9) + idx * lineHeight;
        ctx.fillText(l, 512, currentY);
      });

    } else {
      // Clean elegant caption text
      ctx.font = `bold ${textSize}px monospace`;
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      
      // Shadow backer
      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;

      const words = cleanText.split(" ");
      let line = "";
      const lines = [];
      const maxWidth = 900;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        if (ctx.measureText(testLine).width > maxWidth && n > 0) {
          lines.push(line.trim());
          line = words[n] + " ";
        } else {
          line = testLine;
        }
      }
      lines.push(line.trim());

      const lineHeight = textSize * 1.25;
      let startY = y;
      if (!isTop) {
        startY = y - (lines.length - 1) * lineHeight;
      }

      lines.forEach((l, idx) => {
        const currentY = startY + idx * lineHeight;
        ctx.fillText(l, 512, currentY);
      });
    }

    ctx.restore();
  }, [textStyle, textSize, textColor]);

  // --- LIVE RENDERING OF OVERLAYS ---
  useEffect(() => {
    if (!generatedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = 1024;
      canvas.height = 1024;

      // Draw original generated image
      ctx.drawImage(img, 0, 0, 1024, 1024);

      // Top text rendering (rendered crisp on top of the image)
      if (topText.trim()) {
        renderMemeText(ctx, topText, 100, true);
      }

      // Bottom text rendering (rendered crisp on top of the image)
      if (bottomText.trim()) {
        renderMemeText(ctx, bottomText, 924, false);
      }
    };
    img.src = generatedImage;
  }, [generatedImage, topText, bottomText, renderMemeText]);

  const downloadMeme = () => {
    if (!generatedImage || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = 1024;
      canvas.height = 1024;
      ctx.clearRect(0, 0, 1024, 1024);
      
      // Draw image
      ctx.drawImage(img, 0, 0, 1024, 1024);

      // Draw top text overlay
      if (topText.trim()) {
        renderMemeText(ctx, topText, 100, true);
      }
      
      // Draw bottom text overlay
      if (bottomText.trim()) {
        renderMemeText(ctx, bottomText, 924, false);
      }

      try {
        const link = document.createElement("a");
        link.download = `robify-meme-${Date.now()}.jpg`;
        link.href = canvas.toDataURL("image/jpeg", 0.95);
        link.click();
      } catch (err) {
        console.error("toDataURL failed, downloading original base64 directly:", err);
        const link = document.createElement("a");
        link.download = `robify-meme-${Date.now()}.jpg`;
        link.href = generatedImage;
        link.click();
      }
    };
    img.src = generatedImage;
  };

  const shareMemeOnX = () => {
    const text = `Just engineered a viral meme using the $ROBIFY Meme Generator! Let's build something epic on the Robinhood & Base Chain! 🟢🚀 @bankrbot`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, "_blank");
    setSuccessMessage("✨ Redirecting to X! Make sure to attach your downloaded custom meme to the post window!");
  };

  return (
    <main className="min-h-screen bg-[#040405] text-zinc-100 font-sans selection:bg-[#10B981] selection:text-black flex flex-col items-center justify-between p-4 md:p-6 relative overflow-x-hidden">
      
      {/* IMMERSIVE BACKDROP */}
      <div className="absolute inset-x-0 top-0 h-[640px] pointer-events-none z-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-repeat opacity-[0.42]"
          style={{ backgroundImage: `url('/images/sheep_background.jpg')`, backgroundSize: '240px' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#040405]" />
      </div>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[300px] bg-gradient-to-b from-[#10B981]/15 via-[#10B981]/5 to-transparent blur-3xl pointer-events-none z-0" />

      {/* --- CONTENT CONTAINER --- */}
      <div className="w-full max-w-7xl flex flex-col gap-5 flex-grow relative z-10">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col sm:flex-row justify-between items-center bg-zinc-950/65 border border-zinc-800/80 rounded-3xl p-5 sm:px-6 sm:py-5 gap-4 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3.5 group cursor-pointer">
            <div className="w-11 h-11 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-[0_4px_20px_rgba(16,185,129,0.15)] text-[#10B981] overflow-hidden relative group-hover:border-[#10B981]/40 transition-all">
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
                ROBI<span className="text-[#E2B53E]">FY</span>
                <span className="text-[10px] px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md font-mono uppercase tracking-wider font-extrabold">Meme Lab</span>
              </h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold group-hover:text-zinc-400 transition-colors font-display">
                Prompt to Meme Generator • Back to Home
              </p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-3 justify-center">
            {walletAddress ? (
              <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-1.5 pl-3">
                <span className="text-[10px] font-mono font-extrabold text-zinc-300">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
                {chainId === "8453" ? (
                  <span className="text-[9px] bg-[#E2B53E]/10 text-[#E2B53E] font-mono px-2 py-1 rounded-md font-bold uppercase">
                    Base
                  </span>
                ) : (
                  <button onClick={switchChainToBase} className="text-[9px] bg-amber-500/15 text-amber-400 px-2 py-1 rounded-md font-bold uppercase">
                    Switch Net
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="text-[10px] bg-zinc-900 hover:bg-zinc-800 text-white font-bold px-4 py-2.5 rounded-2xl border border-zinc-800 flex items-center gap-2 transition-all uppercase tracking-wider cursor-pointer font-display"
              >
                <Wallet className="w-3.5 h-3.5 text-[#E2B53E]" />
                Connect Wallet
              </button>
            )}

            <Link
              href="/studio"
              className="text-[10px] bg-[#E2B53E]/10 hover:bg-[#E2B53E]/20 text-[#E2B53E] font-bold px-4 py-2.5 rounded-2xl border border-[#E2B53E]/20 flex items-center gap-1.5 transition-all uppercase tracking-wider cursor-pointer font-display"
            >
              <span>Studio Desk 🟡</span>
            </Link>

            <Link
              href="/gallery"
              className="text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold px-4 py-2.5 rounded-2xl border border-zinc-800 flex items-center gap-1.5 transition-all uppercase tracking-wider cursor-pointer"
            >
              Gallery
            </Link>
          </div>
        </header>

        {/* MEME LAB PLAYGROUND GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-grow">
          
          {/* LEFT SIDE: CONTROLS & DESCRIPTIONS (col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            
            {/* STEP 1: FORMULA SELECTION */}
            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-[32px] p-6 flex flex-col gap-5 backdrop-blur-md">
              <div>
                <span className="text-[10px] bg-[#E2B53E]/10 text-[#E2B53E] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider font-display">
                  System Formula 🧪
                </span>
                <h3 className="text-base font-black tracking-tight text-white mt-3 uppercase font-display">
                  1. Choose Meme System Formula
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  The system formula controls the basic aesthetic rules and visual style the AI uses to draw your meme template.
                </p>
              </div>

              {/* Formula options */}
              <div className="flex flex-col gap-2.5">
                {[
                  {
                    id: "green-hoodie",
                    title: "Green Hoodie",
                    desc: "Draws character wearing the iconic bright green hoodie (#00C805) with loose drawstrings on a dark navy blue background.",
                    icon: "🟢"
                  },
                  {
                    id: "blue-hoodie",
                    title: "Blue Imagen (No Hoodie)",
                    desc: "Draws a cool, vibrant blue-skinned cartoon mascot in a glowing, futuristic digital command center with rich blue tech details.",
                    icon: "🔵"
                  },
                  {
                    id: "custom-hoodie",
                    title: "Truly Custom Style",
                    desc: "Completely define your own custom character subject, outfit, color accents, and scene background without any forced hoodies.",
                    icon: "✨"
                  }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormulaType(f.id as any)}
                    className={`p-3.5 rounded-2xl border text-left flex gap-3.5 transition-all cursor-pointer font-display ${
                      formulaType === f.id
                        ? "border-[#E2B53E] bg-[#E2B53E]/5 text-white"
                        : "border-zinc-800/50 hover:border-zinc-800 bg-zinc-900/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span className="text-2xl mt-0.5 shrink-0">{f.icon}</span>
                    <div className="flex-grow">
                      <span className="text-xs font-bold block">{f.title}</span>
                      <span className="text-[10px] text-zinc-500 block mt-1 leading-normal">{f.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom inputs if "custom-hoodie" selected */}
              <AnimatePresence>
                {formulaType === "custom-hoodie" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden flex flex-col gap-3 pt-1"
                  >
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                        Custom Subject & Outfit (e.g. cat in business suit, robot, alien)
                      </label>
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        className="w-full text-xs font-medium bg-zinc-900/50 border border-zinc-800 focus:border-[#10B981]/50 rounded-xl px-3.5 py-2.5 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#10B981]/20"
                        placeholder="e.g. A grumpy bulldog in a sleek business suit"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                          Color Theme & Accents
                        </label>
                        <input
                          type="text"
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                          className="w-full text-xs font-medium bg-zinc-900/50 border border-zinc-800 focus:border-[#10B981]/50 rounded-xl px-3.5 py-2.5 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#10B981]/20"
                          placeholder="e.g. glowing gold, synthwave pink"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                          Background & Lighting
                        </label>
                        <input
                          type="text"
                          value={customBgColor}
                          onChange={(e) => setCustomBgColor(e.target.value)}
                          className="w-full text-xs font-medium bg-zinc-900/50 border border-zinc-800 focus:border-[#10B981]/50 rounded-xl px-3.5 py-2.5 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#10B981]/20"
                          placeholder="e.g. cozy library with warm lighting"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* STEP 2: PROMPT IDE MEME */}
            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-[32px] p-6 flex flex-col gap-5 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black tracking-tight text-white uppercase flex items-center gap-2">
                    2. Define Your Meme Idea 🧪
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Choose between the Element Combinator (recommended) or write custom text freely below.
                  </p>
                  
                  {/* MULTI-LANGUAGE TIP NOTE */}
                  <div className="mt-3.5 bg-[#E2B53E]/10 border border-[#E2B53E]/20 rounded-2xl px-4 py-3 text-[11px] text-[#E2B53E] leading-relaxed flex items-start gap-2.5">
                    <span className="text-base shrink-0 select-none">💡</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold uppercase tracking-wider text-[10px]">Multi-Language Support Active</span>
                      <span>
                        You can write your inputs in <strong>any language</strong> (Indonesian, English, Spanish, etc.)! The AI Meme Lab will automatically translate, structure, and optimize it into a perfect English prompt for rendering.
                      </span>
                    </div>
                  </div>
                </div>
                {inputMode === "free-text" && (
                  <button
                    type="button"
                    onClick={handleSurpriseMe}
                    disabled={isSuggesting}
                    className={`shrink-0 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
                      isSuggesting
                        ? "bg-zinc-900/40 border-zinc-800 text-zinc-500 animate-pulse cursor-not-allowed"
                        : "bg-[#10B981]/10 hover:bg-[#10B981]/20 border-[#10B981]/30 text-[#10B981] hover:scale-[1.02]"
                    }`}
                  >
                    {isSuggesting ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border border-zinc-700 border-t-[#10B981] animate-spin" />
                        Suggesting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        Surprise Me
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* INPUT MODE SELECTION */}
              <div className="grid grid-cols-2 bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800/80 gap-1">
                <button
                  type="button"
                  onClick={() => setInputMode("structured-lab")}
                  className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    inputMode === "structured-lab"
                      ? "bg-[#E2B53E] text-black font-extrabold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  🧪 Element Combinator
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("free-text")}
                  className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    inputMode === "free-text"
                      ? "bg-[#E2B53E] text-black font-extrabold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  📝 Custom Free Text
                </button>
              </div>

              {/* DYNAMIC FORM VIEWS */}
              {inputMode === "structured-lab" ? (
                <div className="flex flex-col gap-5">
                  {/* Lab Presets Quick Select */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">
                      🧪 Quick Vibe Select (Lab Presets):
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {LAB_PRESETS.map((preset, idx) => {
                        const isSelected = 
                          memeExpression === preset.expression &&
                          memeActivity === preset.activity &&
                          memeAtmosphere === preset.atmosphere &&
                          memeBackground === preset.background;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setMemeExpression(preset.expression);
                              setMemeActivity(preset.activity);
                              setMemeAtmosphere(preset.atmosphere);
                              setMemeBackground(preset.background);
                              setSuccessMessage(`💡 Loaded vibe: "${preset.title}" - ${preset.description}`);
                            }}
                            className={`group flex flex-col items-start gap-1 p-2.5 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                              isSelected
                                ? "bg-[#E2B53E]/15 border-[#E2B53E] text-white shadow-[0_4px_12px_rgba(226,181,62,0.08)]"
                                : "bg-zinc-900/40 border-zinc-900/60 hover:border-zinc-800 hover:bg-zinc-900/80 text-zinc-300"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 w-full">
                              <span className="text-sm shrink-0 group-hover:scale-110 transition-transform">{preset.emoji}</span>
                              <span className="text-[10px] font-black tracking-tight uppercase leading-none truncate w-full group-hover:text-[#E2B53E] transition-colors font-display">
                                {preset.title}
                              </span>
                            </div>
                            <span className="text-[9px] text-zinc-500 leading-normal line-clamp-1 mt-1 font-mono">
                              {preset.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest px-1">
                        🤪 Character Expression
                      </label>
                      <input
                        type="text"
                        value={memeExpression}
                        onChange={(e) => setMemeExpression(e.target.value)}
                        className="w-full text-xs font-medium bg-zinc-900 border border-zinc-800/80 focus:border-[#E2B53E]/50 rounded-xl px-3.5 py-3 text-zinc-100 focus:outline-none transition-all placeholder-zinc-700"
                        placeholder="e.g. menangis histeris / crying hysterically"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest px-1">
                        🏃‍♂️ Activity & Object
                      </label>
                      <input
                        type="text"
                        value={memeActivity}
                        onChange={(e) => setMemeActivity(e.target.value)}
                        className="w-full text-xs font-medium bg-zinc-900 border border-zinc-800/80 focus:border-[#E2B53E]/50 rounded-xl px-3.5 py-3 text-zinc-100 focus:outline-none transition-all placeholder-zinc-700"
                        placeholder="e.g. menatap grafik lilin candle merah / staring at a red crypto chart"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest px-1">
                        ✨ Atmosphere & Mood
                      </label>
                      <input
                        type="text"
                        value={memeAtmosphere}
                        onChange={(e) => setMemeAtmosphere(e.target.value)}
                        className="w-full text-xs font-medium bg-zinc-900 border border-zinc-800/80 focus:border-[#E2B53E]/50 rounded-xl px-3.5 py-3 text-zinc-100 focus:outline-none transition-all placeholder-zinc-700"
                        placeholder="e.g. panik tingkat dewa / extremely panicked and stressed"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest px-1">
                        🖼️ Background Setting
                      </label>
                      <input
                        type="text"
                        value={memeBackground}
                        onChange={(e) => setMemeBackground(e.target.value)}
                        className="w-full text-xs font-medium bg-zinc-900 border border-zinc-800/80 focus:border-[#E2B53E]/50 rounded-xl px-3.5 py-3 text-zinc-100 focus:outline-none transition-all placeholder-zinc-700"
                        placeholder="e.g. di dalam ruang kerja yang kacau / in a messy office room"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* Meme Preset Blueprints (Idea #4) */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">
                      Or load a popular situational template:
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {MEME_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setMemePrompt(preset.prompt);
                            setSuccessMessage(`💡 Loaded situation preset: "${preset.title}"`);
                          }}
                          className={`group flex flex-col items-start gap-1 p-2.5 rounded-xl border text-left transition-all duration-350 cursor-pointer ${
                            memePrompt === preset.prompt
                              ? "bg-[#E2B53E]/15 border-[#E2B53E] text-white shadow-[0_4px_12px_rgba(226,181,62,0.08)]"
                              : "bg-zinc-900/40 border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/80 text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="text-sm shrink-0 group-hover:scale-110 transition-transform">{preset.emoji}</span>
                            <span className="text-[10px] font-black tracking-tight uppercase leading-none truncate w-full group-hover:text-[#E2B53E] transition-colors font-display">
                              {preset.title}
                            </span>
                          </div>
                          <span className="text-[9px] text-zinc-500 leading-normal line-clamp-1 mt-1 font-mono">
                            {preset.prompt}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <textarea
                      value={memePrompt}
                      onChange={(e) => setMemePrompt(e.target.value)}
                      placeholder="e.g. A developer celebrating because his code compiled on the first try but then realizing he deleted the database..."
                      rows={3}
                      className="w-full text-sm bg-zinc-900 border border-zinc-800 focus:border-[#E2B53E]/50 rounded-2xl px-4 py-3 text-white placeholder-zinc-700 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* BOTTOM CONTROL ROW WITH REMAINING LIMIT */}
              <div className="flex items-center justify-between text-xs text-zinc-500 px-1 mt-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#E2B53E]" />
                  <span>Optimized by Bankr AI Meme Lab</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#E2B53E]/10 px-2 py-0.5 rounded text-[10px] text-[#E2B53E] font-mono font-bold">
                    Daily Limit: {remainingGenerations}/3
                  </span>
                </div>
              </div>

              <button
                onClick={generateMeme}
                disabled={
                  isGenerating || 
                  (inputMode === "free-text" 
                    ? !memePrompt.trim() 
                    : (!memeExpression.trim() && !memeActivity.trim() && !memeAtmosphere.trim() && !memeBackground.trim()))
                }
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 font-display ${
                  isGenerating 
                    ? "bg-[#E2B53E]/20 text-[#E2B53E] border border-[#E2B53E]/20 animate-pulse cursor-not-allowed"
                    : (inputMode === "free-text" ? !memePrompt.trim() : (!memeExpression.trim() && !memeActivity.trim() && !memeAtmosphere.trim() && !memeBackground.trim()))
                    ? "bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-[#E2B53E] text-black hover:scale-[1.01] shadow-[0_4px_25px_rgba(226,181,62,0.2)] hover:bg-amber-400 cursor-pointer"
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-zinc-800 border-t-[#10B981] animate-spin" />
                    Generating Meme Image...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Weave & Generate Meme Image ✨
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT SIDE: PREVIEW & OVERLAYS ENGINE (col-span-7) */}
          <div className="lg:col-span-7 min-h-[440px] bg-zinc-950/40 border border-zinc-800/80 rounded-[32px] p-5 md:p-6 backdrop-blur-md flex flex-col justify-between group">
            
            {/* SCREEN HEADER */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60 mb-4">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                Meme Canvas Workspace
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Formula Sandbox</span>
              </div>
            </div>

            {/* INTERACTIVE WORKSPACE */}
            <div className="flex-grow flex flex-col items-center justify-center p-2">
              <AnimatePresence mode="wait">
                {!generatedImage && !isGenerating && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center p-8 max-w-sm flex flex-col items-center gap-4"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Meme Not Yet Generated</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Write your meme idea in the left column, then click <strong>Weave & Generate</strong> to see the system formula in action here!
                    </p>
                  </motion.div>
                )}

                {isGenerating && (
                  <motion.div
                    key="generating-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center p-8 max-w-sm flex flex-col items-center gap-4"
                  >
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
                      <div className="absolute inset-0 rounded-full border-2 border-t-[#10B981] animate-spin" />
                    </div>
                    <h3 className="text-xs font-bold text-[#10B981] uppercase tracking-widest animate-pulse">
                      Submitting Formula to Server...
                    </h3>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      Bankr LLM is optimizing your idea into an ideal prompt description, followed by visual rendering...
                    </p>
                  </motion.div>
                )}

                {generatedImage && !isGenerating && (
                  <motion.div
                    key="preview-workspace"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full flex flex-col items-center gap-5"
                  >
                    {/* MEME COMPOSITION CANVAS & LIVE PREVIEW */}
                    <div className="relative w-full max-w-[420px] aspect-square rounded-[24px] overflow-hidden bg-zinc-950 border border-zinc-800/80 shadow-2xl flex items-center justify-center" id="meme-canvas-wrapper">
                      {/* Live canvas hidden - used for compiler exports */}
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Fallback image component for simple visual rendering */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        ref={memeImageRef}
                        src={generatedImage}
                        alt="Engineered Meme"
                        className="w-full h-full object-contain pointer-events-none select-none"
                      />

                      {/* LIVE TEXT HTML OVERLAYS */}
                      {topText.trim() && (
                        <div className={`absolute top-0 left-0 right-0 p-3 text-center pointer-events-none ${
                          textStyle === "modern" ? "bg-white text-black" : ""
                        }`}>
                          <h4 
                            style={{ 
                              color: textStyle === "modern" ? "#000000" : textColor,
                              fontSize: `${textSize / 2.5}px`
                            }}
                            className={`font-extrabold uppercase leading-none break-words ${
                              textStyle === "classic" 
                                ? "font-sans [text-shadow:_-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000,2px_2px_0_#000]" 
                                : textStyle === "modern"
                                ? "font-sans"
                                : "font-mono tracking-tight [text-shadow:0_2px_10px_rgba(0,0,0,0.85)]"
                            }`}
                          >
                            {topText}
                          </h4>
                        </div>
                      )}

                      {bottomText.trim() && (
                        <div className={`absolute bottom-0 left-0 right-0 p-3 text-center pointer-events-none ${
                          textStyle === "modern" ? "bg-white text-black" : ""
                        }`}>
                          <h4 
                            style={{ 
                              color: textStyle === "modern" ? "#000000" : textColor,
                              fontSize: `${textSize / 2.5}px`
                            }}
                            className={`font-extrabold uppercase leading-none break-words ${
                              textStyle === "classic" 
                                ? "font-sans [text-shadow:_-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000,-2px_2px_0_#000,2px_2px_0_#000]" 
                                : textStyle === "modern"
                                ? "font-sans"
                                : "font-mono tracking-tight [text-shadow:0_2px_10px_rgba(0,0,0,0.85)]"
                            }`}
                          >
                            {bottomText}
                          </h4>
                        </div>
                      )}
                    </div>

                    {/* ENGINEERED PROMPT VIEW FOR THE USER */}
                    {engineeredPrompt && (
                      <div className="w-full max-w-[420px] bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-4 text-[11px] leading-relaxed">
                        <div className="flex items-center gap-1.5 text-zinc-500 font-bold mb-1.5 uppercase font-mono tracking-wider">
                          <Sliders className="w-3 h-3 text-[#10B981]" />
                          <span>Engineered Prompt Formula:</span>
                        </div>
                        <p className="text-zinc-400 font-mono italic select-all cursor-copy">
                          &quot;{engineeredPrompt}&quot;
                        </p>
                      </div>
                    )}

                    {/* STEP 3: TEXT OVERLAYS AND STYLE */}
                    <div className="w-full max-w-[420px] space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          3. Add Overlays & Text Style
                        </span>
                        
                        {/* Text style chooser */}
                        <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                          {[
                            { id: "classic", label: "Classic" },
                            { id: "modern", label: "Modern" },
                            { id: "clean", label: "Clean" }
                          ].map((ts) => (
                            <button
                              key={ts.id}
                              type="button"
                              onClick={() => {
                                setTextStyle(ts.id as any);
                                if (ts.id === "classic") setTextSize(85);
                                else if (ts.id === "modern") setTextSize(65);
                                else if (ts.id === "clean") setTextSize(55);
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                textStyle === ts.id
                                  ? "bg-[#10B981] text-black"
                                  : "text-zinc-500 hover:text-zinc-300"
                              }`}
                            >
                              {ts.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Advanced Overlay styling options (Idea #2) */}
                      <div className="bg-zinc-900/45 border border-zinc-800/80 rounded-2xl p-4 space-y-3.5 shadow-inner">
                        {/* Font size slider */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">Font Size</span>
                            <span className="text-[9px] font-mono text-zinc-500 font-bold">{textSize}px</span>
                          </div>
                          <input
                            type="range"
                            min="30"
                            max="120"
                            value={textSize}
                            onChange={(e) => setTextSize(parseInt(e.target.value))}
                            className="flex-grow accent-[#10B981] h-1 bg-zinc-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Color swatches */}
                        {textStyle !== "modern" && (
                          <div className="flex items-center justify-between gap-4 border-t border-zinc-800/40 pt-3">
                            <span className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">Text Color</span>
                            <div className="flex flex-wrap gap-1.5 justify-end">
                              {[
                                { name: "White", code: "#FFFFFF" },
                                { name: "Emerald", code: "#00C805" },
                                { name: "Gold", code: "#FBBF24" },
                                { name: "Crimson", code: "#EF4444" },
                                { name: "Blue", code: "#3B82F6" },
                                { name: "Orange", code: "#F97316" }
                              ].map((col) => (
                                <button
                                  key={col.code}
                                  type="button"
                                  onClick={() => setTextColor(col.code)}
                                  style={{ backgroundColor: col.code }}
                                  className={`w-5 h-5 rounded-full transition-all cursor-pointer border ${
                                    textColor === col.code
                                      ? "ring-2 ring-[#10B981] scale-110 border-black"
                                      : "border-zinc-700 hover:scale-105"
                                  }`}
                                  title={col.name}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider pl-1">Top Text</label>
                          <input
                            type="text"
                            value={topText}
                            onChange={(e) => setTopText(e.target.value)}
                            placeholder="e.g. WHEN MY CODE WORKS"
                            className="text-xs bg-zinc-900 border border-zinc-800 focus:border-[#10B981]/50 rounded-xl px-3 py-2 text-white focus:outline-none placeholder-zinc-700 font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider pl-1">Bottom Text</label>
                          <input
                            type="text"
                            value={bottomText}
                            onChange={(e) => setBottomText(e.target.value)}
                            placeholder="e.g. FIRST COMPILATION"
                            className="text-xs bg-zinc-900 border border-zinc-800 focus:border-[#10B981]/50 rounded-xl px-3 py-2 text-white focus:outline-none placeholder-zinc-700 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* DOWNLOAD & SHARE BUTTONS */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full max-w-[420px]">
                      <button
                        onClick={downloadMeme}
                        className="flex-1 bg-[#10B981] hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-widest py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_15px_rgba(16,185,129,0.15)]"
                      >
                        <Download className="w-4 h-4" />
                        Download Meme 💾
                      </button>

                      <button
                        onClick={shareMemeOnX}
                        className="flex-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Twitter className="w-4 h-4 shrink-0 fill-current" />
                        Share to X
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* --- NOTIFICATIONS BANNER --- */}
      {errorMessage && (
        <div className="w-full max-w-7xl mt-4 px-1">
          <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 text-xs leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="whitespace-pre-line text-left">
              <span className="font-bold">Notice:</span> {errorMessage}
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="w-full max-w-7xl mt-4 px-1">
          <div className="bg-[#E2B53E]/10 text-[#E2B53E] border border-[#E2B53E]/20 rounded-2xl p-4 flex items-start gap-3 text-xs leading-relaxed">
            <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#E2B53E]" />
            <div className="whitespace-pre-line text-left">
              <span className="font-bold">Perfect:</span> {successMessage}
            </div>
          </div>
        </div>
      )}

      {/* --- PAYMENT MODAL --- */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-800/80 rounded-[28px] overflow-hidden p-6 md:p-8 shadow-[0_0_50px_rgba(226,181,62,0.15)] flex flex-col gap-6"
            >
              <div className="flex flex-col gap-2 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-2 border border-amber-500/20">
                  <Coins className="w-5 h-5 animate-bounce text-amber-500" />
                </div>
                <h3 className="text-lg font-black font-display tracking-tight text-white uppercase">
                  Daily Limit Reached
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  The free daily limit (3 creations) has been reached. Continue generating by making a micro-payment of <strong>$0.1 (0.000033 ETH)</strong> on your choice of network.
                </p>
              </div>

              {/* Network Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">
                  Pilih Jaringan Pembayaran / Choose Network
                </span>
                <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentNetwork("base")}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedPaymentNetwork === "base"
                        ? "bg-[#E2B53E] text-black shadow-sm font-black"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span>🔵 Base</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentNetwork("robinhood")}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedPaymentNetwork === "robinhood"
                        ? "bg-[#E2B53E] text-black shadow-sm font-black"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span>🟢 Robinhood</span>
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800/60 p-4 rounded-2xl flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">Target Wallet:</span>
                  <span className="text-[#E2B53E] font-bold">0xfe19ce2...19e8</span>
                </div>
                <div className="text-[10px] text-zinc-500 bg-black/40 p-2.5 rounded-xl border border-zinc-900 font-mono break-all select-all text-center">
                  0xfe19ce226e0d1e9da7a76422c5b82811fc7a19e8
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {!walletAddress ? (
                  <button
                    onClick={connectWallet}
                    className="w-full bg-[#E2B53E] hover:bg-[#E2B53E]/90 text-black font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer font-display"
                  >
                    <Wallet className="w-4 h-4 shrink-0" />
                    Connect Wallet to Pay
                  </button>
                ) : chainId !== (selectedPaymentNetwork === "base" ? "8453" : "4663") ? (
                  <button
                    onClick={selectedPaymentNetwork === "base" ? switchChainToBase : switchChainToRobinhood}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer font-display"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                    Switch Network to {selectedPaymentNetwork === "base" ? "Base" : "Robinhood"}
                  </button>
                ) : (
                  <button
                    onClick={paySingleGeneration}
                    disabled={isPaying}
                    className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 font-display"
                  >
                    <Coins className="w-4 h-4 shrink-0" />
                    {isPaying ? "Verifying Transaction..." : `Pay $0.1 (0.000033 ETH) on ${selectedPaymentNetwork === "base" ? "Base" : "Robinhood"}`}
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-1 border-t border-zinc-800/40">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-full bg-transparent hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl py-2.5 transition-all"
                >
                  Cancel & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="w-full max-w-7xl px-4 py-8 mt-12 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
        <p className="text-[10px] text-zinc-300 font-mono font-medium text-center sm:text-left">
          &copy; 2026 ROBIFY Lab. Made with care for the Web3 community. Powered by bankr.
        </p>
        <div className="flex items-center gap-4 text-[10px] text-[#E2B53E] font-bold uppercase tracking-widest font-display">
          <span>COZY MEMES • GOLDEN LAUNCHERS</span>
        </div>
      </footer>

    </main>
  );
}
