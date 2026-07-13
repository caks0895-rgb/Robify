import { NextRequest, NextResponse } from "next/server";

// Simple in-memory IP cache to prevent spamming
const ipCache = new Map<string, number[]>();

export async function POST(req: NextRequest) {
  try {
    const { image, style, accessory, customColor, isPremium } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    // --- RATE LIMIT CHECK (3x per day per IP / Cookie) ---
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

    // Only apply rate limits if the user is not a verified premium member
    if (!isPremium) {
      if (timestamps.length >= 3 || (ip !== "unknown" && ipTimestamps.length >= 3)) {
        return NextResponse.json(
          { error: "Daily limit reached! You can generate a maximum of 3 images per day to prevent spam. Switch to Base Network and upgrade to Premium for Unlimited generation!" },
          { status: 429 }
        );
      }
    }

    const bankrApiKey = process.env.BANKR_API_KEY;

    // Clean up base64 string and extract MIME type
    let base64Data = image;
    let mimeType = "image/jpeg";
    const mimeMatch = image.match(/^data:([^;]+);base64,/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }
    if (image.includes("base64,")) {
      base64Data = image.split("base64,")[1];
    }

    console.log(`Analyzing image and generating descriptive prompt via Bankr for style: ${style}, accessory: ${accessory}, customColor: ${customColor}`);

    let hoodPrompt = "";
    if (accessory === "custom") {
      const sanitizedColor = (customColor || "golden").replace(/[^a-zA-Z0-9\s#-]/g, "");
      hoodPrompt = `The absolute most important requirement: The main subject MUST be wearing a custom-colored, cozy ${sanitizedColor} hoodie with the hood pulled up snugly over their head. The hood must cover their hair/head but frame their face perfectly, keeping their face, exact expression, and features fully recognizable and faithful to the uploaded photo.`;
    } else {
      hoodPrompt = `The absolute most important requirement: The main subject MUST be wearing an iconic bright stabilo green (neon lime green, Hex #00C805) hoodie with the hood pulled up snugly over their head. There MUST be a small, distinctive black and white feather (Robinhood style) sticking out from the side of the hood. The hood must cover their hair/head but frame their face perfectly, keeping their face, exact expression, and features fully recognizable and faithful to the uploaded photo.`;
    }

    const instructionsText = `You are an expert prompt engineer for Imagen. Analyze the entire uploaded photo with maximum precision, scanning the subject's face, posture, clothing style, original pose, expression, and the background details.
          
    Write a highly detailed, professional, single-paragraph image generation prompt that recreates the exact subject, composition, posture, background, and facial features of this photo in the style: "${style}".
    
    ${hoodPrompt}
    
    Style guidelines:
    - If style is "normal": The output should be a highly realistic, photorealistic, professional studio portrait, with clean studio lighting, realistic skin textures, 8k resolution, cinematic atmosphere.
    - If style is "meme": It must be styled exactly as a polished retro webcomic digital illustration with clean, detailed hand-drawn ink outlines, rich dimensional and volumetric shading, subtle gradients, and atmospheric depth. The scene must be a rich wide-angle situational composition (such as playing cards, trading on laptops, debating, celebrating, or panicking around a table/room) featuring the described main character as the central figure interacting with multiple similar cartoon characters. Use deep cinematic ambient lighting with dark purple, gold, and dark blue tones. Do not use plain flat backdrops, white sticker outlines, or wobbly MS Paint lines; keep it detailed and focused on the situational environment.
    - If style is "cartoon": It must be styled exactly as a classic retro 1960s pop-art comic book illustration. Use heavy, bold black ink outlines, high-contrast flat primary colors, retro screen-tones, a distinctive halftone dot pattern (ben-day dots), and a highly energetic, vintage comic panel aesthetic. The character must look like an iconic comic book print with a hand-drawn retro feel.
    - If style is "pixel": It must be a genuine, stunning retro 8-bit or 16-bit video game character sprite avatar. Use crisp grid-aligned visible pixels, a limited nostalgic arcade color palette, hard pixelated edges, clean black outline framing, and classic retro RPG dialogue box portrait geometry. Do not include smooth gradients; use authentic retro pixelated dithering.
    
    CRITICAL CONSTRAINT: Since the requested style is "${style}", you MUST NOT use words like "photo", "photograph", "realistic", "photorealistic", "real life", "camera", "lens", or "shot" if the style is "meme", "cartoon", or "pixel". Focus entirely on drawing, illustration, vectors, pixels, halftone dots, or ink styles as described above.

    Output ONLY the final descriptive prompt paragraph. Do not include any prefix, introduction, or conversational filler. Keep it to one concise paragraph of 70-100 words.`;

    let generatedPrompt = "";
    let promptSuccess = false;

    // Primary: Bankr LLM Gateway
    if (bankrApiKey) {
      try {
        console.log("Analyzing image and generating descriptive prompt using Bankr LLM Gateway...");
        const bankrResponse = await fetch("https://llm.bankr.bot/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": bankrApiKey,
          },
          body: JSON.stringify({
            model: "gemini-3.1-flash-lite",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: instructionsText
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${mimeType};base64,${base64Data}`
                    }
                  }
                ]
              }
            ]
          })
        });

        if (bankrResponse.ok) {
          const bankrData = await bankrResponse.json();
          const content = bankrData.choices?.[0]?.message?.content;
          if (content) {
            generatedPrompt = content.trim();
            promptSuccess = true;
            console.log("Successfully generated descriptive prompt using Bankr LLM Gateway!");
          }
        } else {
          const errMsg = await bankrResponse.text();
          console.warn(`Bankr LLM Gateway returned status ${bankrResponse.status}: ${errMsg}`);
        }
      } catch (bankrErr: any) {
        console.error("Bankr LLM Gateway did not complete prompt generation:", bankrErr);
      }
    }

    if (!promptSuccess || !generatedPrompt) {
      if (accessory === "custom") {
        const sanitizedColor = (customColor || "golden").replace(/[^a-zA-Z0-9\s#-]/g, "");
        generatedPrompt = `A detailed professional portrait of a person in "${style}" style, wearing a custom-colored, cozy ${sanitizedColor} hoodie with the hood pulled up snugly over their head, highly detailed face, perfectly matching the composition.`;
      } else {
        generatedPrompt = `A detailed professional portrait of a person in "${style}" style, wearing an iconic bright stabilo green (neon lime green, Hex #00C805) hoodie with the hood pulled up snugly, and a small black and white feather sticking out from the side of the hood, highly detailed face, perfectly matching the composition.`;
      }
      promptSuccess = true;
    }

    // Define robust style prefix and suffix to prevent image generator from ignoring the selected style
    let stylePrefix = "";
    let styleSuffix = "";
    if (style === "pixel") {
      stylePrefix = "A genuine, stunning retro 16-bit pixel art style video game sprite avatar, of a ";
      styleSuffix = ". This MUST be in authentic retro 16-bit pixel art style with visible grid-aligned square pixels, hard pixelated edges, clean black outline framing, a limited nostalgic arcade color palette, and no smooth gradients.";
    } else if (style === "cartoon") {
      stylePrefix = "A classic retro 1960s pop-art comic book illustration, of a ";
      styleSuffix = ". This MUST be in classic retro 1960s pop-art comic book illustration style with heavy bold black ink outlines, high-contrast flat primary colors, retro screen-tones, and a distinctive halftone ben-day dot pattern.";
    } else if (style === "meme") {
      stylePrefix = "A polished retro webcomic digital illustration with clean detailed hand-drawn ink outlines, of a ";
      styleSuffix = ". This MUST be in a rich wide-angle situational retro webcomic digital illustration style with clean hand-drawn ink outlines, volumetric shading, rich dimensional detail, and deep atmospheric color depth.";
    } else {
      stylePrefix = "A highly realistic, photorealistic, professional 8k studio portrait, of a ";
      styleSuffix = ". This MUST be in highly realistic photorealistic style, featuring clean studio lighting, realistic skin textures, 8k resolution, and cinematic atmosphere.";
    }

    // Clean up any photo-related keywords the LLM might have written if the style is a graphic art style
    if (style !== "normal") {
      generatedPrompt = generatedPrompt
        .replace(/\b(photorealism|photorealistic|photograph|photography|photo|real-life|realistic portrait|hyperrealistic|realistic skin|studio lighting)\b/gi, "")
        .replace(/\b(camera|lens|shot with|8k resolution|cinematic atmosphere)\b/gi, "");
    }

    // Reinforce key characteristics to ensure the image generators (Pollinations & Bankr) do not miss them
    if (accessory !== "custom") {
      generatedPrompt = `${stylePrefix}subject wearing an iconic, vibrant bright stabilo green (neon lime green, Hex #00C805) hoodie with the hood pulled up snugly over their head, and a prominent black-and-white feather sticking out of the side of the green hood. ${generatedPrompt}. The hoodie MUST be bright stabilo green (#00C805) and have a clear black and white feather sticking out from the side of the hood${styleSuffix}`;
    } else {
      const sanitizedColor = (customColor || "golden").replace(/[^a-zA-Z0-9\s#-]/g, "");
      generatedPrompt = `${stylePrefix}subject wearing a custom-colored, cozy ${sanitizedColor} hoodie with the hood pulled up snugly over their head. ${generatedPrompt}. The hoodie MUST be colored ${sanitizedColor}${styleSuffix}`;
    }

    console.log("Generated Imagen Prompt (with reinforcement):", generatedPrompt);

    // Step 2: Generate the image.
    let finalBase64 = "";
    let drawSuccess = false;

    console.log("Attempting image drawing...");

    // Generator 1 (FREE): Pollinations AI (Completely free, fast, unlimited, requires no API key)
    try {
      console.log("Attempting Pollinations AI image generation (FREE)...");
      const pollResponse = await fetch(
        `https://image.pollinations.ai/prompt/${encodeURIComponent(generatedPrompt)}?width=1024&height=1024&nologo=true&private=true&enhance=false`,
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
        console.log("Successfully drew image with Pollinations AI (FREE)!");
      } else {
        console.error(`Pollinations AI returned bad status: ${pollResponse.status}`);
      }
    } catch (pollErr: any) {
      console.error("Pollinations generator failed:", pollErr);
    }

    // Generator 2 (BANKR): Try Bankr LLM Gateway (gpt-image-2)
    if (!drawSuccess && bankrApiKey) {
      try {
        console.log("Attempting Bankr LLM Gateway image generation (gpt-image-2)...");
        const bankrImageResponse = await fetch("https://llm.bankr.bot/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": bankrApiKey,
          },
          body: JSON.stringify({
            model: "gpt-image-2",
            prompt: generatedPrompt,
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
            console.log("Successfully drew image with Bankr LLM Gateway (gpt-image-2)!");
          }
        } else {
          const errMsg = await bankrImageResponse.text();
          console.warn(`Bankr Image Gateway did not return success (${bankrImageResponse.status}): ${errMsg}`);
        }
      } catch (bankrImgErr: any) {
        console.error("Bankr image generation failed:", bankrImgErr);
      }
    }

    // Record successful generation in IP cache and cookie
    if (ip !== "unknown") {
      ipTimestamps.push(now);
      ipCache.set(ip, ipTimestamps);
    }
    timestamps.push(now);

    if (!drawSuccess) {
      console.warn("All image generation models failed. Using original photo fallback...");
      const res = NextResponse.json({
        success: true,
        prompt: generatedPrompt,
        image: image, // Fallback to original uploaded base64 image
        fallbackUsed: true,
        message: "The AI image generator server is currently busy or offline. We have gracefully loaded your original portrait with the high-fidelity green hood overlay instead!"
      });
      res.cookies.set(cookieName, JSON.stringify(timestamps), {
        maxAge: 24 * 60 * 60,
        path: "/",
        sameSite: "strict",
      });
      return res;
    }

    const res = NextResponse.json({
      success: true,
      prompt: generatedPrompt,
      image: finalBase64,
    });
    res.cookies.set(cookieName, JSON.stringify(timestamps), {
      maxAge: 24 * 60 * 60,
      path: "/",
      sameSite: "strict",
    });
    return res;

  } catch (error: any) {
    console.error("Error in POST /api/reimagine:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during re-imagination." },
      { status: 500 }
    );
  }
}
