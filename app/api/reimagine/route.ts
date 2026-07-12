import { NextRequest, NextResponse } from "next/server";

// Simple in-memory IP cache to prevent spamming
const ipCache = new Map<string, number[]>();

export async function POST(req: NextRequest) {
  try {
    const { image, style, accessory, isPremium } = await req.json();

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

    console.log(`Analyzing image and generating descriptive prompt via Bankr for style: ${style}, accessory: ${accessory}`);

    const instructionsText = `You are an expert prompt engineer for Imagen. Analyze this uploaded photo and describe the main subject (e.g., facial features, hair, gender, expression, ethnicity, accessories like glasses).
          
    Then, write a highly detailed, professional, single-paragraph image generation prompt that will recreate this exact subject in the following style: "${style}".
    
    The most important requirement: The subject MUST be wearing an iconic medieval Robinhood-style ${accessory === "hat" ? "pointed archer hat with a tiny red feather" : "cozy cowl hood"} that is bright emerald green (solid #00FF00 hue). The hood/hat must cover their head/hair perfectly but leave their face completely visible and recognizable.
    
    Style guidelines:
    - If style is "normal": The output should be a highly realistic, photorealistic, professional studio portrait, with clean studio lighting, realistic skin textures, 8k resolution, cinematic atmosphere.
    - If style is "meme": It must be styled exactly as a polished retro webcomic digital illustration with clean, detailed hand-drawn ink outlines, rich dimensional and volumetric shading, subtle gradients, and atmospheric depth. The scene must be a rich wide-angle situational composition (such as playing cards, trading on laptops, debating, celebrating, or panicking around a table/room) featuring the described main character as the central figure interacting with multiple similar cartoon characters. Use deep cinematic ambient lighting with dark purple, gold, and dark blue tones. Do not use plain flat backdrops, white sticker outlines, or wobbly MS Paint lines; keep it detailed and focused on the situational environment.
    - If style is "cartoon": It must be styled exactly as a classic retro 1960s pop-art comic book illustration. Use heavy, bold black ink outlines, high-contrast flat primary colors, retro screen-tones, a distinctive halftone dot pattern (ben-day dots), and a highly energetic, vintage comic panel aesthetic. The character must look like an iconic comic book print with a hand-drawn retro feel.
    - If style is "pixel": It must be a genuine, stunning retro 8-bit or 16-bit video game character sprite avatar. Use crisp grid-aligned visible pixels, a limited nostalgic arcade color palette, hard pixelated edges, clean black outline framing, and classic retro RPG dialogue box portrait geometry. Do not include smooth gradients; use authentic retro pixelated dithering.
    
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
      generatedPrompt = `A detailed professional photo portrait of a person in "${style}" style, wearing an iconic bright emerald green Robinhood cowl hood covering their head, realistic lighting, highly detailed face.`;
      promptSuccess = true;
    }

    console.log("Generated Imagen Prompt:", generatedPrompt);

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
