import { NextRequest, NextResponse } from "next/server";

// Simple in-memory IP cache to prevent spamming
const ipCache = new Map<string, number[]>();

export async function POST(req: NextRequest) {
  try {
    const { prompt, formulaType, customSubject, customColor, customBgColor, isPremium } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Meme prompt is required" },
        { status: 400 }
      );
    }

    // --- RATE LIMIT CHECK (6x per day per IP / Cookie) ---
    const cookieName = "robify_generations_limit";
    const cookieVal = req.cookies.get(cookieName)?.value;
    let timestamps: number[] = [];
    if (cookieVal) {
      try {
        timestamps = JSON.parse(cookieVal);
      } catch (e) {
        timestamps = [];
      }
    }
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    timestamps = timestamps.filter(t => t > oneDayAgo);

    // IP Check
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    let ipTimestamps = ipCache.get(ip) || [];
    ipTimestamps = ipTimestamps.filter(t => t > oneDayAgo);

    // Rate limiting for free users
    if (!isPremium) {
      if (timestamps.length >= 6 || (ip !== "unknown" && ipTimestamps.length >= 6)) {
        return NextResponse.json(
          { error: "Daily limit reached! You can generate a maximum of 6 images per day across the studio & meme playground. Switch to Base and pay micro-ETH to unlock more!" },
          { status: 429 }
        );
      }
    }

    const bankrApiKey = process.env.BANKR_API_KEY;

    // LOCKED visual formula blocks from the build specification
    const STYLE_BLOCK = `STYLE: Polished retro webcomic digital illustration, clean detailed hand-drawn ink outlines, rich dimensional and volumetric shading, subtle gradients, atmospheric depth, warm and cool glowing light sources, deep cinematic ambient lighting with dark purple, gold, and dark blue tones. It is a full wide-angle situational scene featuring multiple similar cartoon characters in a highly detailed room or setting. Avoid: flat cel-shading, crude doodles, single character sticker cutouts, white sticker outlines, minimal flat backgrounds, photorealism, plain backdrops.`;

    let subjectBlock = "";
    let backgroundBlock = "";

    if (formulaType === "green-hoodie") {
      subjectBlock = "SUBJECT: A primary cartoon creature wearing an oversized bright green hoodie (#00C805), hood down, drawstrings dangling loosely, warm brown skin, sitting at a table interacting in a detailed, busy scene filled with other similar cartoon characters.";
      backgroundBlock = "BACKGROUND: A lavish, atmospheric room with gilded wall frame portraits, classical statues on pedestals, luxury ambient dark navy and purple lighting, and rich classical interior details.";
    } else if (formulaType === "blue-hoodie") {
      subjectBlock = "SUBJECT: A primary cartoon creature with beautiful, vibrant blue skin and deep-blue accents, no hoodie, sitting at a table interacting in a detailed, busy scene filled with other similar blue cartoon characters.";
      backgroundBlock = "BACKGROUND: A sleek digital command center with glowing neon blue circuit tracks, holographic trading screens, steel-blue ambient lighting, and futuristic cybertech details.";
    } else if (formulaType === "custom-hoodie") {
      const sanitizedSubject = (customSubject || "A cartoon creature").replace(/[^a-zA-Z0-9\s-]/g, "");
      const sanitizedColor = (customColor || "vibrant").replace(/[^a-zA-Z0-9\s#-]/g, "");
      const sanitizedBg = (customBgColor || "dark navy blue").replace(/[^a-zA-Z0-9\s#-]/g, "");
      
      subjectBlock = `SUBJECT: ${sanitizedSubject} styled with ${sanitizedColor} color accents, interacting in a detailed, busy scene filled with other similar cartoon characters.`;
      backgroundBlock = `BACKGROUND: A rich, atmospheric environment with ${sanitizedBg} ambient lighting, custom props, and detailed scenic decorations.`;
    } else {
      subjectBlock = "SUBJECT: A primary cartoon creature wearing an oversized bright green hoodie (#00C805), hood down, drawstrings dangling loosely, warm brown skin, sitting at a table interacting in a detailed, busy scene filled with other similar cartoon characters.";
      backgroundBlock = "BACKGROUND: A lavish, atmospheric room with gilded wall frame portraits, classical statues on pedestals, luxury ambient dark navy and purple lighting.";
    }

    // Call text LLM to interpret free-form action/pose/expression
    let interpretedFragment = prompt;
    let interpretationSuccess = false;

    if (bankrApiKey) {
      try {
        const interpretationSystemInstructions = `You are a legendary AI prompt engineer specialized in creating viral web memes.
Take the user's core meme idea: "${prompt}" and describe a rich, funny situational scene around it.
Do not focus on just one standalone character. Instead, depict a lively scene with multiple characters interacting, filled with comedic details, room elements, props, and a cohesive dramatic situation (e.g., playing cards, trading on laptops, debating, celebrating, or panicking).
Keep it under 50 words, highly descriptive, focusing entirely on physical setup, hilarious group interactions, exaggerated facial expressions of the characters, and physical objects/scenery.
Do not describe any text, dialogue, watermarks, or user interface overlays. Output ONLY the descriptive physical scene fragment. No prefix, conversational filler, or quotes.`;

        console.log(`[Meme API] Translating user prompt via Bankr LLM using model: ${process.env.BANKR_TEXT_MODEL || "gemini-3.1-flash-lite"}...`);
        const bankrResponse = await fetch("https://llm.bankr.bot/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": bankrApiKey,
          },
          body: JSON.stringify({
            model: process.env.BANKR_TEXT_MODEL || "gemini-3.1-flash-lite",
            messages: [
              {
                role: "user",
                content: interpretationSystemInstructions
              }
            ]
          })
        });

        if (bankrResponse.ok) {
          const bankrData = await bankrResponse.json();
          const content = bankrData.choices?.[0]?.message?.content;
          if (content) {
            interpretedFragment = content.trim();
            interpretationSuccess = true;
            console.log("[Meme API] Successfully interpreted user's meme idea!");
          }
        } else {
          const errMsg = await bankrResponse.text();
          console.warn(`[Meme API] Bankr LLM translation returned status ${bankrResponse.status}: ${errMsg}`);
        }
      } catch (err) {
        console.error("[Meme API] Bankr LLM translation error:", err);
      }
    }

    // Assemble final prompt using the specified template
    const finalPrompt = `${subjectBlock} ${backgroundBlock} ${STYLE_BLOCK} ${interpretedFragment}`;
    console.log("[Meme API] Final Assembled Meme Prompt:", finalPrompt);

    // Step 2: Generate the image.
    let finalBase64 = "";
    let drawSuccess = false;

    // Try Generator 1 (PRIMARY): Pollinations AI (super fast & reliable for cartoon/meme prompts)
    try {
      console.log("[Meme API] Attempting Pollinations AI image drawing...");
      const pollResponse = await fetch(
        `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&nologo=true&private=true&enhance=false`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        }
      );

      if (pollResponse.ok) {
        const arrayBuffer = await pollResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        finalBase64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
        drawSuccess = true;
        console.log("[Meme API] Successfully drew meme with Pollinations AI!");
      } else {
        console.error(`[Meme API] Pollinations AI returned bad status: ${pollResponse.status}`);
      }
    } catch (pollErr) {
      console.error("[Meme API] Pollinations generator failed:", pollErr);
    }

    // Try Generator 2 (FALLBACK): Bankr LLM Gateway (gpt-image-2) if Pollinations failed
    if (!drawSuccess && bankrApiKey) {
      try {
        console.log("[Meme API] Attempting Bankr Image Gateway Fallback...");
        const bankrImageResponse = await fetch("https://llm.bankr.bot/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": bankrApiKey,
          },
          body: JSON.stringify({
            model: process.env.BANKR_IMAGE_MODEL || "gpt-image-2",
            prompt: finalPrompt,
            n: 1,
            size: "1024x1024"
          })
        });

        if (bankrImageResponse.ok) {
          const bankrImageData = await bankrImageResponse.json();
          const base64Json = bankrImageData.data?.[0]?.b64_json;
          if (base64Json) {
            if (base64Json.startsWith("data:")) {
              finalBase64 = base64Json;
            } else {
              finalBase64 = `data:image/png;base64,${base64Json}`;
            }
            drawSuccess = true;
            console.log("[Meme API] Successfully drew meme with Bankr Image Gateway Fallback!");
          }
        } else {
          const errMsg = await bankrImageResponse.text();
          console.error(`[Meme API] Bankr Image Gateway returned status ${bankrImageResponse.status}: ${errMsg}`);
        }
      } catch (bankrImgErr) {
        console.error("[Meme API] Bankr image generation failed:", bankrImgErr);
      }
    }

    // Fallback Generator: High-Availability picsum seed if all else fails
    if (!drawSuccess) {
      try {
        console.log("[Meme API] All model-specific generation engines failed. Using high-availability funny photo fallback...");
        const fallbackResponse = await fetch("https://picsum.photos/seed/robify_meme_fallback/1024/1024");
        if (fallbackResponse.ok) {
          const arrayBuffer = await fallbackResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          finalBase64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
          drawSuccess = true;
          console.log("[Meme API] Successfully loaded funny Picsum fallback image!");
        }
      } catch (picsumErr) {
        console.error("[Meme API] Picsum fallback failed:", picsumErr);
      }
    }

    if (!drawSuccess) {
      return NextResponse.json(
        { error: "Image generation engines are currently busy. Please try again shortly!" },
        { status: 503 }
      );
    }

    // Record successful generation in IP cache & cookies
    if (ip !== "unknown") {
      ipTimestamps.push(now);
      ipCache.set(ip, ipTimestamps);
    }
    timestamps.push(now);

    const res = NextResponse.json({
      success: true,
      engineeredPrompt: finalPrompt,
      image: finalBase64,
    });

    res.cookies.set(cookieName, JSON.stringify(timestamps), {
      maxAge: 24 * 60 * 60,
      path: "/",
      sameSite: "strict",
    });

    return res;

  } catch (error: any) {
    console.error("[Meme API] Server error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during meme generation." },
      { status: 500 }
    );
  }
}
