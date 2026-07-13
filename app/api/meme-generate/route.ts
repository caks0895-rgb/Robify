import { NextRequest, NextResponse } from "next/server";

// Simple in-memory IP cache to prevent spamming
const ipCache = new Map<string, number[]>();

export async function POST(req: NextRequest) {
  try {
    const { 
      prompt, 
      formulaType, 
      customSubject, 
      customColor, 
      customBgColor, 
      isPremium,
      expression,
      activity,
      atmosphere,
      background 
    } = await req.json();

    const isStructured = !!(expression || activity || atmosphere || background);
    const resolvedPrompt = isStructured 
      ? `Expression: ${expression || "blank, minimalist NPC face"}. Activity: ${activity || "standing still"}. Atmosphere: ${atmosphere || "calm"}. Background: ${background || "simple flat color bg"}.`
      : prompt;

    if (!resolvedPrompt) {
      return NextResponse.json(
        { error: "Meme prompt or structured elements are required" },
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
    const STYLE_BLOCK = "Style: Low-fidelity MS Paint digital drawing, bold jagged shaky hand-drawn black outlines, flat solid colors, no gradients, no shading.";

    let subjectBlock = "";
    let backgroundBlock = "";
    let characterDesc = "";

    if (formulaType === "green-hoodie") {
      characterDesc = "a simple basic Wojak cartoon mascot with warm brown skin/fur wearing a simple bright green hoodie (#00C805)";
      subjectBlock = "Subject: A simple Wojak cartoon mascot wearing a bright green hoodie (#00C805), drawn with bold black outlines.";
      backgroundBlock = "Background: Simple minimal landscape with flat solid colors.";
    } else if (formulaType === "blue-hoodie") {
      characterDesc = "a simple basic Wojak cartoon mascot with vibrant blue skin and deep-blue accents";
      subjectBlock = "Subject: A simple Wojak cartoon mascot with vibrant blue skin, drawn with bold black outlines.";
      backgroundBlock = "Background: Simple minimal landscape with flat solid colors.";
    } else if (formulaType === "custom-hoodie") {
      const sanitizedSubject = (customSubject || "A cartoon creature").replace(/[^a-zA-Z0-9\s-]/g, "");
      const sanitizedColor = (customColor || "vibrant").replace(/[^a-zA-Z0-9\s#-]/g, "");
      const sanitizedBg = (customBgColor || "dark navy blue").replace(/[^a-zA-Z0-9\s#-]/g, "");
      
      characterDesc = `a simple basic Wojak ${sanitizedSubject} with ${sanitizedColor} color accents`;
      subjectBlock = `Subject: A simple Wojak ${sanitizedSubject} with ${sanitizedColor} color accents, drawn with bold black outlines.`;
      backgroundBlock = `Background: Simple minimal landscape with flat solid ${sanitizedBg} colors.`;
    } else {
      characterDesc = "a simple basic Wojak cartoon mascot with warm brown skin/fur wearing a simple bright green hoodie (#00C805)";
      subjectBlock = "Subject: A simple Wojak cartoon mascot wearing a bright green hoodie (#00C805), drawn with bold black outlines.";
      backgroundBlock = "Background: Simple minimal landscape with flat solid colors.";
    }

    // Call text LLM to interpret free-form action/pose/expression
    let interpretedFragment = resolvedPrompt;
    let interpretationSuccess = false;

    if (bankrApiKey) {
      try {
        const interpretationSystemInstructions = `[ROLE]
You are an expert prompt optimizer for an MS Paint-style meme image generator. Your task is to translate and optimize the user's input (Indonesian or other languages) into a single, highly concise English paragraph.

[CHARACTER PROFILE]
Main Character: ${characterDesc}

[INSTRUCTIONS]
1. Translate any Indonesian inputs to clean English.
2. Formulate a short, precise English sentence for each of the 4 inputs:
   - Expression: describe the facial expression clearly.
   - Activity: describe what the character is doing or holding.
   - Atmosphere: describe the overall mood/atmosphere.
   - Background: describe the scene/background elements.
3. Combine these 4 points into a single cohesive paragraph. Do NOT use brackets or labels like "[Style]" or "[Character]".
4. Keep the entire output under 50 words total. Be extremely direct and clear.
5. SANGAT PENTING: Hanya keluarkan prompt bahasa Inggris final tersebut. Jangan ada penjelasan, percakapan, atau teks pendukung lainnya.

Inputs to combine:
${isStructured ? `- Expression: ${expression || "blank minimalist NPC face"}
- Activity: ${activity || "standing still"}
- Atmosphere: ${atmosphere || "neutral"}
- Background: ${background || "plain minimal landscape"}` : `- Main Meme Idea: ${prompt}`}`;

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
    let finalPrompt = "";
    if (interpretationSuccess) {
      finalPrompt = `${STYLE_BLOCK} ${interpretedFragment}`;
    } else {
      finalPrompt = `${subjectBlock} ${backgroundBlock} ${STYLE_BLOCK} ${interpretedFragment}`;
    }
    const NEGATIVE_CONSTRAINTS = "Avoid: 3D render, smooth gradients, shading, cinematic lighting, photorealism, professional art, clean vector, text, watermark.";
    finalPrompt = `${finalPrompt} ${NEGATIVE_CONSTRAINTS}`;
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
