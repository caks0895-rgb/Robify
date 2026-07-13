"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
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
  Trash2,
  Wallet,
  Coins
} from "lucide-react";

// --- DATA TYPES ---
interface GenerationResult {
  success: boolean;
  image?: string;
  prompt?: string;
  fallbackUsed?: boolean;
  message?: string;
}

export default function StudioPage() {
  // --- GENERAL STATES ---
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [canvasImage, setCanvasImage] = useState<HTMLImageElement | null>(null);
  
  // --- AI RE-IMAGINATION STATES ---
  const [originalUploadedSrc, setOriginalUploadedSrc] = useState<string | null>(null);
  const [artStyle, setArtStyle] = useState<"normal" | "meme" | "cartoon" | "pixel">("normal");
  const [accessory, setAccessory] = useState<"cowl" | "custom">("cowl");
  const [customColor, setCustomColor] = useState<string>("golden");
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
    // eslint-disable-next-line react-hooks/purity
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

  // --- GALLERY CREATIONS STATE ---
  const [creations, setCreations] = useState<{ id: string; image: string; style: string; timestamp: number }[]>([]);

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

      // Check if we came from the Gallery page requesting to edit/load a previous creation
      const tempLoad = localStorage.getItem("robify_load_temp");
      if (tempLoad) {
        try {
          const creation = JSON.parse(tempLoad);
          if (creation && creation.image) {
            setImageSrc(creation.image);
            setOriginalUploadedSrc(creation.image);
            setArtStyle(creation.style);
            
            const img = new window.Image();
            img.onload = () => {
              setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
              setCanvasImage(img);
            };
            img.src = creation.image;
            
            setSuccessMessage(`Loaded your previous "${creation.style}" creation from the Gallery into the editor!`);
          }
          localStorage.removeItem("robify_load_temp");
        } catch (e) {
          console.error("Failed to load temporary creation from gallery", e);
        }
      }
    }
  }, []);

  // --- WEB3 WALLET & BASE PAYMENT STATES ---
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [selectedPaymentNetwork, setSelectedPaymentNetwork] = useState<"base" | "robinhood">("base");

  // Auto-connect and check subscription state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ((window as any).ethereum) {
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
            console.warn("Auto reconnection check failed:", e);
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
          const parsedId = parseInt(hexChainId, 16).toString();
          setChainId(parsedId);
        };

        (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
        (window as any).ethereum.on("chainChanged", handleChainChanged);

        return () => {
          (window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged);
          (window as any).ethereum.removeListener("chainChanged", handleChainChanged);
        };
      }
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
      console.error("Wallet connection failed:", err);
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
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x2105",
                chainName: "Base Mainnet",
                nativeCurrency: {
                  name: "Ether",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://mainnet.base.org"],
                blockExplorerUrls: ["https://basescan.org"],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add Base network:", addError);
        }
      }
      console.error("Failed to switch network:", switchError);
    }
  };

  const switchChainToRobinhood = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1237" }], // 4663 (Robinhood Chain) in hex
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x1237",
                chainName: "Robinhood Chain",
                nativeCurrency: {
                  name: "Ether",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
                blockExplorerUrls: ["https://robinhoodchain.blockscout.com"],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add Robinhood Chain network:", addError);
        }
      }
      console.error("Failed to switch network:", switchError);
    }
  };

  const paySingleGeneration = async () => {
    const isBase = selectedPaymentNetwork === "base";
    const requiredChainId = isBase ? "8453" : "4663";
    const networkName = isBase ? "Base Mainnet" : "Robinhood Chain";

    if (typeof window === "undefined" || !(window as any).ethereum || !walletAddress) {
      setErrorMessage("Please connect your Web3 wallet first!");
      return;
    }

    if (chainId !== requiredChainId) {
      setErrorMessage(`Please switch your wallet network to ${networkName} to proceed with the transaction.`);
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
      const paymentAmount = "0.000033"; // $0.1 USD equivalent in ETH

      setSuccessMessage(`✍️ Please approve the $0.1 (0.000033 ETH) transaction in your wallet on ${networkName}...`);

      const tx = await signer.sendTransaction({
        to: destinationAddress,
        value: parseEther(paymentAmount),
      });

      setTxHash(tx.hash);
      setSuccessMessage(`🚀 Transaction submitted! Waiting for confirmation on ${networkName}... Tx: ${tx.hash.slice(0, 8)}...`);

      const receipt = await tx.wait(1);

      if (receipt && receipt.status === 1) {
        const currentPaid = parseInt(localStorage.getItem("robify_manual_paid_count") || "0");
        const nextPaid = currentPaid + 1;
        localStorage.setItem("robify_manual_paid_count", String(nextPaid));
        
        setRemainingGenerations(getRemainingGenerationsCount());
        
        setSuccessMessage(`🎉 Sukses! Pembayaran $0.1 berhasil diverifikasi di ${networkName}. Memulai pembuatan avatar Anda...`);
        setIsPaymentModalOpen(false);

        setTimeout(() => {
          reimagineWithAI();
        }, 600);
      } else {
        setErrorMessage("Transaction was reverted on-chain. Please verify and try again.");
      }
    } catch (err: any) {
      console.error("Payment failed:", err);
      setErrorMessage(err.message || `Failed to complete the ${networkName} payment transaction.`);
    } finally {
      setIsPaying(false);
    }
  };

  // --- SHARING STATE ---
  const [shareText, setShareText] = useState<string>(
    "Just got my cozy green hood avatar on https://robify.vercel.app/ ! Custom-crafting my new PFP style with @bankrbot 🟢 #ROBIFY #bankr"
  );
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [coinNameInput, setCoinNameInput] = useState("");

  // --- REFS ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    setOriginalUploadedSrc(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImageSrc(base64);
      setOriginalUploadedSrc(base64);
      
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

    const currentRemaining = getRemainingGenerationsCount();
    
    if (currentRemaining <= 0) {
      setIsPaymentModalOpen(true);
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsReimagining(true);
    setReimagineProgress("Welcoming your portrait to the digital studio...");
    const paidThisTurn = false;

    try {
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
          accessory,
          customColor,
          isPremium: paidThisTurn,
        }),
      });

      clearTimeout(p1);
      clearTimeout(p2);

      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 429 && !paidThisTurn) {
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
        
        if (!paidThisTurn) {
          recordGenerationLocal();
        }
        
        if (typeof window !== "undefined") {
          const nowVal = Date.now();
          const randVal = Math.random().toString(36).substring(2, 11);
          const newCreation = {
            id: `creation-${nowVal}-${randVal}`,
            image: data.image,
            style: artStyle,
            timestamp: nowVal
          };
          const stored = localStorage.getItem("robify_creations");
          let updated = [newCreation];
          if (stored) {
            try {
              updated = [newCreation, ...JSON.parse(stored)];
            } catch (e) {
              updated = [newCreation];
            }
          }
          localStorage.setItem("robify_creations", JSON.stringify(updated));
        }
        
        const img = new window.Image();
        img.onload = () => {
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
          setCanvasImage(img);
        };
        img.src = data.image;

        if (data.fallbackUsed) {
          setErrorMessage(data.message || "AI generation servers are busy. We displayed your portrait with our emerald mask overlay!");
        } else {
          setSuccessMessage(paidThisTurn 
            ? "Sukses! Pembayaran terverifikasi dan AI Avatar Anda berhasil dibuat!"
            : `Success! We have beautifully woven a cozy ${accessory === "custom" ? customColor : "green"} $Hoodie onto your photo in "${artStyle}" style.`
          );
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

    canvas.width = imageDimensions?.width || canvasImage.naturalWidth || 1024;
    canvas.height = imageDimensions?.height || canvasImage.naturalHeight || 1024;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvasImage, 0, 0, canvas.width, canvas.height);

    if (watermarkEnabled) {
      const padding = Math.max(12, canvas.width * 0.03);
      const fontHeight = Math.max(14, canvas.width * 0.035);
      
      ctx.save();
      
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
      
      const dotRadius = fontHeight * 0.25;
      const dotX = pillX + radius * 0.75;
      const dotY = pillY + pillHeight / 2;
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#10B981";
      ctx.fill();
      
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
    if (!finalShareText.toLowerCase().includes("robify.vercel.app")) {
      finalShareText = finalShareText.trim() + " https://robify.vercel.app/";
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

    const cleanedCoin = coinNameInput.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const compiledText = `Just generated my custom green hood avatar at https://robify.vercel.app/ ! @bankrbot launch $${cleanedCoin} on robinhood 🟢🚀`;
    
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
      
      {/* IMMERSIVE COZY GREEN HOOD SHEEP BACKGROUND */}
      <div className="absolute inset-x-0 top-0 h-[720px] pointer-events-none z-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-repeat opacity-[0.52]"
          style={{ backgroundImage: `url('/images/sheep_background.jpg')`, backgroundSize: '240px' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#040405]" />
      </div>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[350px] bg-gradient-to-b from-[#10B981]/20 via-[#10B981]/5 to-transparent blur-3xl pointer-events-none z-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#040405]/25 to-[#040405]/75 pointer-events-none z-0" />

      {/* --- CONTAINER WRAPPER --- */}
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
                ROBI<span className="text-[#10B981]">FY</span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-mono uppercase tracking-wider font-extrabold">Studio</span>
              </h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold group-hover:text-zinc-400 transition-colors font-display">
                Stabilo Green $Hoodie Avatars • Back to Home
              </p>
            </div>
          </Link>
          
          <div className="flex flex-wrap items-center gap-3 justify-center">
            {walletAddress ? (
              <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-1.5 pl-3">
                <div className="flex flex-col items-start pr-2">
                  <span className="text-[10px] font-mono font-extrabold text-zinc-300">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                  <span className="text-[8px] font-mono text-zinc-500 font-bold">
                    {walletBalance || "0.0000 ETH"}
                  </span>
                </div>
                
                {chainId === "8453" ? (
                  <span className="text-[9px] bg-[#E2B53E]/10 text-[#E2B53E] font-mono px-3 py-1.5 rounded-xl border border-[#E2B53E]/20 flex items-center gap-1 font-bold uppercase tracking-wider">
                    <span className="w-1 h-1 bg-[#E2B53E] rounded-full" />
                    Base
                  </span>
                ) : (
                  <button
                    onClick={switchChainToBase}
                    className="text-[9px] bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 font-mono px-3 py-1.5 rounded-xl border border-amber-500/20 flex items-center gap-1 font-bold uppercase tracking-wider transition-all cursor-pointer"
                    title="Click to Switch to Base Mainnet"
                  >
                    <span className="w-1 h-1 bg-amber-500 rounded-full animate-ping" />
                    Wrong Net
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="text-[10px] bg-zinc-900 hover:bg-zinc-800 text-white font-bold px-4 py-2.5 rounded-2xl border border-zinc-800 hover:border-zinc-700 flex items-center gap-2 transition-all uppercase tracking-wider cursor-pointer shadow-md font-display"
              >
                <Wallet className="w-3.5 h-3.5 text-[#E2B53E]" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}

            <Link
              href="/gallery"
              className="text-[10px] bg-zinc-900 hover:bg-zinc-800 text-[#E2B53E] hover:text-amber-400 font-bold px-4 py-2.5 rounded-2xl border border-zinc-800 hover:border-[#E2B53E]/30 flex items-center gap-1.5 transition-all uppercase tracking-wider cursor-pointer shadow-md font-display"
            >
              <ImageIcon className="w-3.5 h-3.5 shrink-0 text-[#E2B53E]" />
              Gallery
            </Link>

            <span className="text-[10px] bg-[#E2B53E]/10 text-[#E2B53E] font-mono px-4 py-2.5 rounded-2xl border border-[#E2B53E]/20 flex items-center gap-1.5 font-bold uppercase tracking-wider">
               <span className="w-1.5 h-1.5 bg-[#E2B53E] rounded-full animate-ping" />
              ROBIFY Official
            </span>
          </div>
        </header>

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-grow">
          
          {/* LEFT COLUMN: CANVAS AND DROPAREA */}
          <div className="lg:col-span-7 min-h-[440px] lg:min-h-[580px] bg-zinc-950/50 border border-zinc-800/80 rounded-[32px] relative overflow-hidden flex flex-col items-center justify-center p-4 md:p-6 group transition-all duration-300 hover:border-[#E2B53E]/50 backdrop-blur-md">
            
            <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-none">
              <span className="bg-zinc-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-[10px] border border-zinc-800 uppercase tracking-wider font-bold text-zinc-400 font-display">
                {imageSrc ? (originalUploadedSrc === imageSrc ? "Original Photo" : "ROBIFY Portrait") : "Studio Desk"}
              </span>
              
              {isReimagining && (
                <span className="bg-[#E2B53E]/20 text-[#E2B53E] px-3.5 py-1.5 rounded-xl text-[10px] border border-[#E2B53E]/30 uppercase tracking-wider font-bold animate-pulse flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#E2B53E] rounded-full animate-ping" />
                  Weaving Hood...
                </span>
              )}
            </div>

            <AnimatePresence mode="wait">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-[#E2B53E]/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 group-hover:border-[#E2B53E]/50 flex items-center justify-center text-zinc-400 group-hover:text-[#E2B53E] mb-6 transition-all duration-300 group-hover:scale-105 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
                    <Upload className="w-6 h-6 stroke-[1.8]" />
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 tracking-tight font-display">
                    Get your stabilo green $Hoodie on! 🟢
                  </h3>
                  
                  <p className="text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
                    Drop your selfie or any image here! Our advanced AI scans the entire picture to perfectly overlay an iconic bright stabilo green $Hoodie with a signature black and white feather! 🟢🪶
                  </p>

                  <div className="inline-flex items-center gap-1.5 text-xs text-black font-extrabold bg-[#E2B53E] px-5.5 py-3 rounded-xl hover:bg-amber-400 transition-all shadow-[0_4px_20px_rgba(226,181,62,0.2)] font-display">
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
                    <div className="absolute inset-0 rounded-full border-2 border-t-[#E2B53E] animate-spin" />
                  </div>
                  
                  <h3 className="text-base font-bold text-white mb-1">
                    Welcoming photo...
                  </h3>
                  
                  <p className="text-xs text-zinc-500 max-w-xs leading-relaxed animate-pulse">
                    Preparing high-fidelity canvas and scaling details for a perfect finish...
                  </p>
                </motion.div>
              )}

              {imageSrc && !isProcessing && (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full flex flex-col items-center justify-center p-2"
                >
                  <div className="relative w-full max-w-[420px] aspect-square rounded-[24px] overflow-hidden bg-zinc-950 border border-zinc-800/80 shadow-2xl flex items-center justify-center group/canvas" id="canvas-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={imageSrc} 
                      alt="ROBIFY Portrait" 
                      className="w-full h-full object-contain select-none pointer-events-none" 
                    />

                    {watermarkEnabled && (
                      <div className="absolute bottom-4 right-4 bg-zinc-950/90 border border-[#E2B53E]/30 backdrop-blur-md rounded-full py-1.5 px-3.5 flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                        <div className="w-2 h-2 rounded-full bg-[#E2B53E] animate-pulse" />
                        <span className="text-[10px] font-mono font-bold text-white tracking-wider">$ROBIFY COIN</span>
                      </div>
                    )}

                    <canvas
                      ref={canvasRef}
                      className="hidden"
                      id="hood-generator-canvas"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between w-full max-w-[420px] px-1 gap-2">
                    <button
                      onClick={triggerFileReset}
                      className="text-xs font-bold tracking-tight text-zinc-400 hover:text-white flex items-center gap-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 px-4 py-2 rounded-xl transition-all cursor-pointer font-display"
                      id="btn-change-photo"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#E2B53E]" />
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

            <div className="absolute inset-0 pointer-events-none border-[12px] border-transparent group-hover:border-zinc-800/10 transition-all rounded-[32px]" />
          </div>

          {/* RIGHT COLUMN: AI GENERATOR DASHBOARD */}
          <div className="lg:col-span-5 bg-zinc-950/65 border border-zinc-800/80 rounded-[32px] p-6 md:p-7 flex flex-col justify-between relative overflow-hidden backdrop-blur-md" id="ai-reimagine-bento-card">
            {isReimagining && (
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#E2B53E]/5 rounded-full blur-3xl animate-pulse pointer-events-none" />
            )}
            
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-bold text-[#10B981] uppercase tracking-widest block mb-1 font-display">
                  1. Choose Art Style
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Choose your aesthetic motif. Our advanced AI scans the entire composition and precisely overlays our signature stabilo green $Hoodie with the classic Robinhood black and white feather!
                </p>
              </div>

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
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2.5 transition-all text-center group cursor-pointer font-display ${
                      artStyle === style.id
                        ? "border-[#E2B53E] bg-[#E2B53E]/5 text-white"
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

              <div className="pt-4 border-t border-zinc-800/40 space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-[#10B981] uppercase tracking-widest block mb-1 font-display">
                    2. Choose Hoodie Design
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    Select between our signature Robinhood-themed Green Hoodie with Feather, or design your own customized hoodie style!
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    disabled={isReimagining}
                    onClick={() => setAccessory("cowl")}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all text-left cursor-pointer font-display ${
                      accessory === "cowl"
                        ? "border-[#10B981] bg-[#10B981]/5 text-white"
                        : "border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/30 text-zinc-400 hover:text-white"
                    } ${isReimagining ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <span className="text-xl">🟢</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold block">Classic $Hoodie</span>
                      <span className="text-[9px] text-zinc-500 font-medium block leading-none mt-1">Stabilo Green + Feather</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isReimagining}
                    onClick={() => setAccessory("custom")}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all text-left cursor-pointer font-display ${
                      accessory === "custom"
                        ? "border-[#E2B53E] bg-[#E2B53E]/5 text-white"
                        : "border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/30 text-zinc-400 hover:text-white"
                    } ${isReimagining ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <span className="text-xl">🎨</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold block">Custom Hoodie</span>
                      <span className="text-[9px] text-zinc-500 font-medium block leading-none mt-1">Choose Custom Color</span>
                    </div>
                  </button>
                </div>

                {accessory === "custom" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3.5 space-y-2.5 p-3.5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80"
                  >
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Type Custom Color or Style Description
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        disabled={isReimagining}
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        placeholder="e.g., golden, luxurious royal gold, dark crimson red..."
                        className="flex-1 bg-zinc-950/80 border border-zinc-800 focus:border-[#E2B53E] text-xs text-zinc-200 placeholder-zinc-600 px-3 py-2 rounded-xl focus:outline-none transition-all"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { name: "Golden", value: "luxury royal golden" },
                        { name: "Gold Leather", value: "golden scale leather" },
                        { name: "Neon Blue", value: "bright neon blue cyberpunk" },
                        { name: "Crimson Red", value: "dark crimson red" },
                        { name: "Holographic", value: "shimmering holographic chrome" },
                      ].map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          disabled={isReimagining}
                          onClick={() => setCustomColor(preset.value)}
                          className={`text-[9px] px-2 py-1 rounded-md border transition-all cursor-pointer font-medium ${
                            customColor === preset.value
                              ? "border-[#E2B53E] bg-[#E2B53E]/10 text-[#E2B53E]"
                              : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/20 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

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
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E2B53E] peer-checked:after:bg-zinc-950 peer-checked:after:border-zinc-950"></div>
                </label>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-800/40 flex flex-col gap-4">
              <div className="flex items-center justify-between w-full">
                {isReimagining ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-zinc-800 border-t-[#E2B53E] animate-spin shrink-0" />
                    <span className="text-xs text-[#E2B53E] font-medium animate-pulse">
                      {reimagineProgress || "Processing deep generation..."}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 text-xs text-zinc-500">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#E2B53E]" />
                      <span>
                        {imageSrc && originalUploadedSrc !== imageSrc 
                          ? `Your ${accessory === "custom" ? customColor : "stabilo green"} $Hoodie avatar is ready!` 
                          : `Ready to weave your ${accessory === "custom" ? customColor : "stabilo green"} $Hoodie avatar.`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg px-2.5 py-1 text-[11px] font-mono font-bold text-[#10B981]">
                        Limit: {remainingGenerations}/3 today
                      </div>
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
                  disabled={!imageSrc || isReimagining}
                  onClick={reimagineWithAI}
                  className={`flex-grow px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 font-display ${
                    !imageSrc
                      ? "bg-zinc-950 border border-zinc-850 text-zinc-650 cursor-not-allowed"
                      : isReimagining
                      ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 cursor-not-allowed animate-pulse"
                      : "bg-[#10B981] text-black hover:scale-[1.01] shadow-[0_4px_25px_rgba(16,185,129,0.25)] cursor-pointer hover:bg-emerald-400"
                  }`}
                  id="btn-trigger-reimagine"
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  {isReimagining 
                    ? "Weaving Hood..." 
                    : `Weave My ${accessory === "custom" ? "Custom" : "Green"} $Hoodie ✨`}
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM BENTO ACTION BAR */}
          <div className="lg:col-span-12 flex flex-col md:flex-row gap-4 mt-1" id="actions-bento-bar">
            
            <button
              disabled={!imageSrc}
              onClick={downloadPFP}
              className={`flex-1 py-4.5 px-6 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-3 transition-all font-display ${
                imageSrc
                  ? "bg-[#E2B53E] text-black hover:scale-[1.01] shadow-[0_4px_30px_rgba(226,181,62,0.25)] cursor-pointer hover:bg-amber-400"
                  : "bg-zinc-900/50 text-zinc-550 border border-zinc-850 cursor-not-allowed"
              }`}
              id="btn-download-pfp"
            >
              <Download className="w-5 h-5 stroke-[2.5]" />
              DOWNLOAD PORTRAIT
            </button>

            <div className={`flex-[1.5] flex flex-col gap-2.5 ${!imageSrc ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="flex-grow">
                <input
                  type="text"
                  value={shareText}
                  onChange={(e) => setShareText(e.target.value)}
                  placeholder="Custom share text..."
                  className="w-full text-xs bg-zinc-900/50 border border-zinc-800 focus:border-[#E2B53E]/40 rounded-2xl px-4 py-3 text-zinc-200 placeholder-zinc-600 focus:outline-none"
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
                  className={`flex-[1.2] bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs uppercase tracking-widest rounded-2xl px-5 py-3.5 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all shadow-[0_0_20px_rgba(226,181,62,0.15)] ${
                    imageSrc ? "cursor-pointer hover:shadow-[0_0_30px_rgba(226,181,62,0.3)]" : "cursor-not-allowed"
                  }`}
                  id="btn-launch-bankr"
                >
                  <span>Launch on Bankr 🚀</span>
                </button>
              </div>
            </div>

            <div className="bg-zinc-950/65 border border-zinc-800/80 backdrop-blur-md rounded-2xl px-5 py-3 flex items-center justify-between min-w-[200px] gap-4" id="api-status-card">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Studio status</span>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-300 font-medium">
                  {isReimagining ? "Weaving" : "Warm & Active"}
                </span>
                <div className={`w-2.5 h-2.5 rounded-full bg-[#E2B53E] ${isReimagining ? "animate-ping" : "animate-pulse"}`} />
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
            <div className="whitespace-pre-line text-left">
              <span className="font-bold">Notice:</span> {errorMessage}
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="w-full max-w-7xl mt-4 px-1" id="notification-success-box">
          <div className="bg-[#E2B53E]/10 text-[#E2B53E] border border-[#E2B53E]/20 rounded-2xl p-4 flex items-start gap-3 text-xs leading-relaxed">
            <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#E2B53E]" />
            <div className="whitespace-pre-line text-left">
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
        <div className="flex items-center gap-4 text-[10px] text-[#E2B53E] font-bold uppercase tracking-widest font-display">
          <span>Keep it cozy. Keep it golden.</span>
        </div>
      </footer>

      {/* --- COIN NAME PROMPT MODAL --- */}
      <AnimatePresence>
        {isLaunchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelLaunch}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-800/80 rounded-[28px] overflow-hidden p-6 md:p-8 shadow-[0_0_50px_rgba(226,181,62,0.15)] flex flex-col gap-6"
            >
              <div className="flex flex-col gap-2 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#E2B53E]/10 flex items-center justify-center text-[#E2B53E] mb-2 shadow-[0_0_20px_rgba(226,181,62,0.2)]">
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
                    className="w-full text-sm font-mono bg-zinc-900 border border-zinc-800 focus:border-[#E2B53E]/50 rounded-xl px-4 py-3 text-white placeholder-zinc-700 text-center uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-[#E2B53E]/30 transition-all"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelLaunch}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl py-3 border border-zinc-800/80 transition-all font-display"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[1.3] bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs uppercase tracking-widest rounded-xl py-3 transition-all hover:scale-[1.01] shadow-[0_0_20px_rgba(226,181,62,0.15)] flex items-center justify-center gap-1.5 font-display"
                  >
                    <span>Launch Coin 🚀</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-2 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                  <Coins className="w-5 h-5 animate-bounce text-amber-500" />
                </div>
                <h3 className="text-lg font-black font-display tracking-tight text-white uppercase">
                  Daily Limit Reached
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  The free daily limit (2 creations) has been reached. Continue generating by making a micro-payment of <strong>$0.1 (0.000033 ETH)</strong> on your choice of network.
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
                    disabled={isConnecting}
                    className="w-full bg-[#E2B53E] hover:bg-[#E2B53E]/90 text-black font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_15px_rgba(226,181,62,0.2)] font-display"
                  >
                    <Coins className="w-4 h-4 shrink-0" />
                    {isConnecting ? "Connecting wallet..." : "Connect Wallet to Pay"}
                  </button>
                ) : chainId !== (selectedPaymentNetwork === "base" ? "8453" : "4663") ? (
                  <button
                    onClick={selectedPaymentNetwork === "base" ? switchChainToBase : switchChainToRobinhood}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_15px_rgba(245,158,11,0.2)] font-display"
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

                {walletAddress && (
                  <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 px-1">
                    <span>Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                    <span>Balance: {walletBalance || "loading..."}</span>
                  </div>
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

    </main>
  );
}
