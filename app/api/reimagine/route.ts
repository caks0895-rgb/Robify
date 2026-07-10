import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Simple in-memory IP cache to prevent spamming
const ipCache = new Map<string, number[]>();

export async function POST(req: NextRequest) {
  try {
    const { image, style, accessory } = await req.json();

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

    if (timestamps.length >= 3 || (ip !== "unknown" && ipTimestamps.length >= 3)) {
      return NextResponse.json(
        { error: "Daily limit reached! You can generate a maximum of 3 images per day to prevent spam." },
        { status: 429 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

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

    console.log(`Analyzing image and generating descriptive prompt for style: ${style}, accessory: ${accessory}`);

    const instructionsText = `You are an expert prompt engineer for Imagen. Analyze this uploaded photo and describe the main subject (e.g., facial features, hair, gender, expression, ethnicity, accessories like glasses).
          
    Then, write a highly detailed, professional, single-paragraph image generation prompt that will recreate this exact subject in the following style: "${style}".
    
    The most important requirement: The subject MUST be wearing an iconic medieval Robinhood-style ${accessory === "hat" ? "pointed archer hat with a tiny red feather" : "cozy cowl hood"} that is bright emerald green (solid #00FF00 hue). The hood/hat must cover their head/hair perfectly but leave their face completely visible and recognizable.
    
    Style guidelines:
    - If style is "normal": The output should be a highly realistic, photorealistic, professional studio portrait, with clean studio lighting, realistic skin textures, 8k resolution, cinematic atmosphere.
    - If style is "meme": It must be styled exactly as a funny, expressive, viral internet meme template / MS Paint style cartoon illustration. Use flat digital cartoon colors, simple shapes, and thick, intentionally rough/wobbly black marker outlines. Emphasize a highly expressive, hilarious meme face with dramatic comic-relief eyes, funny grin, in the spirit of classic internet meme characters like Pepe, boy's club comic panels, or ms paint reaction drawings to produce a perfect viral reaction meme template.
    - If style is "cartoon": It must be styled exactly as a classic retro 1960s pop-art comic book illustration. Use heavy, bold black ink outlines, high-contrast flat primary colors, retro screen-tones, a distinctive halftone dot pattern (ben-day dots), and a highly energetic, vintage comic panel aesthetic. The character must look like an iconic comic book print with a hand-drawn retro feel.
    - If style is "pixel": It must be a genuine, stunning retro 8-bit or 16-bit video game character sprite avatar. Use crisp grid-aligned visible pixels, a limited nostalgic arcade color palette, hard pixelated edges, clean black outline framing, and classic retro RPG dialogue box portrait geometry. Do not include smooth gradients; use authentic retro pixelated dithering.
    
    Output ONLY the final descriptive prompt paragraph. Do not include any prefix, introduction, or conversational filler. Keep it to one concise paragraph of 70-100 words.`;

    let generatedPrompt = "";
    let promptSuccess = false;

    // Step 1: Use Bankr LLM Gateway first (extremely cheap & bypasses primary key 503 errors)
    const bankrApiKey = process.env.BANKR_API_KEY;
    if (bankrApiKey) {
      try {
        console.log("Attempting ultra-economical Bankr LLM Gateway prompt generation...");
        // Use gemini-3.1-flash-lite (the ultra-fast, ultra-economical $0.25/1M token model supporting image inputs)
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
            console.log("Successfully generated descriptive prompt using Bankr LLM Gateway (gemini-3.1-flash-lite)!");
          }
        } else {
          const errMsg = await bankrResponse.text();
          console.warn(`Bankr LLM Gateway returned status ${bankrResponse.status}: ${errMsg}`);
        }
      } catch (bankrErr: any) {
        console.log("Bankr LLM Gateway did not complete prompt generation. Using primary instead...");
      }
    }

    // Fallback to primary Google GenAI if Bankr was skipped or failed
    if (!promptSuccess) {
      const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-2.5-flash"];
      for (const modelName of modelsToTry) {
        try {
          console.log(`Re-imagine Prompt Step: Trying primary model ${modelName}...`);
          const promptResponse = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data,
                },
              },
              {
                text: instructionsText,
              },
            ],
          });

          if (promptResponse.text) {
            generatedPrompt = promptResponse.text.trim();
            promptSuccess = true;
            console.log(`Successfully generated descriptive prompt with primary model: ${modelName}`);
            break;
          }
        } catch (modelErr: any) {
          console.log(`Prompt generation model ${modelName} did not complete. Trying next model...`);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }

    if (!promptSuccess || !generatedPrompt) {
      throw new Error("Failed to generate descriptive prompt using any of the available models.");
    }

    console.log("Generated Imagen Prompt:", generatedPrompt);

    // Step 2: Generate the image.
    // Prioritize free models first to save user costs, then fall back to premium options if those fail or are rate-limited.
    let finalBase64 = "";
    let drawSuccess = false;

    console.log("Attempting image drawing...");

    // Model 1 (FREE): Try gemini-3.1-flash-lite-image (Completely free Google tier model)
    try {
      console.log("Attempting gemini-3.1-flash-lite-image (FREE)...");
      const drawResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [
            {
              text: generatedPrompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      });

      if (drawResponse.candidates?.[0]?.content?.parts) {
        for (const part of drawResponse.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            finalBase64 = `data:image/png;base64,${part.inlineData.data}`;
            drawSuccess = true;
            console.log("Successfully drew image with gemini-3.1-flash-lite-image (FREE)!");
            break;
          }
        }
      }
    } catch (err: any) {
      console.log("Model gemini-3.1-flash-lite-image did not return an image. Transitioning to next free fallback...");
    }

    // Model 2 (FREE & BULLETPROOF): Pollinations AI (Completely free, fast, unlimited, requires no API key)
    if (!drawSuccess) {
      try {
        console.log("Attempting Pollinations AI image generation (FREE)...");
        const pollResponse = await fetch(
          `https://image.pollinations.ai/prompt/${encodeURIComponent(generatedPrompt)}?width=1024&height=1024&nologo=true&private=true&enhance=false`
        );

        if (pollResponse.ok) {
          const arrayBuffer = await pollResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          finalBase64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
          drawSuccess = true;
          console.log("Successfully drew image with Pollinations AI (FREE) fallback!");
        } else {
          console.error(`Pollinations AI returned bad status: ${pollResponse.status}`);
        }
      } catch (pollErr: any) {
        console.log("Pollinations generator did not complete. Transitioning to paid fallbacks...");
      }
    }

    // Model 3 (PAID / BUDGET): Try Bankr LLM Gateway (gpt-image-2) - ultra-economical, uses user's Bankr credits
    if (!drawSuccess && bankrApiKey) {
      try {
        console.log("Attempting Bankr LLM Gateway image generation (gpt-image-2) [PAID fallback]...");
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
            console.log("Successfully drew image with Bankr LLM Gateway (gpt-image-2) fallback!");
          }
        } else {
          const errMsg = await bankrImageResponse.text();
          console.log(`Bankr Image Gateway did not return success (${bankrImageResponse.status}): ${errMsg}`);
        }
      } catch (bankrImgErr: any) {
        console.log("Bankr image generation did not complete. Transitioning to premium fallbacks...");
      }
    }

    // Model 4 (PAID): Try Google GenAI imagen-4.0-generate-001 (Requires paid tier / premium billing plan)
    if (!drawSuccess) {
      try {
        console.log("Attempting imagen-4.0-generate-001 [PAID fallback]...");
        const imagenResponse = await ai.models.generateImages({
          model: "imagen-4.0-generate-001",
          prompt: generatedPrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: "image/jpeg",
            aspectRatio: "1:1",
          },
        });

        const generatedImageObj = imagenResponse.generatedImages?.[0];
        const imageBytes = generatedImageObj?.image?.imageBytes || (generatedImageObj as any)?.imageBytes;
        if (imageBytes) {
          finalBase64 = `data:image/jpeg;base64,${imageBytes}`;
          drawSuccess = true;
          console.log("Successfully drew image with imagen-4.0-generate-001!");
        }
      } catch (err: any) {
        console.log("Model imagen-4.0-generate-001 did not return an image. Transitioning to final fallback...");
      }
    }

    // Model 5 (PAID): Try Google GenAI imagen-3.0-generate-002 (Requires paid tier / premium billing plan)
    if (!drawSuccess) {
      try {
        console.log("Attempting imagen-3.0-generate-002 [PAID fallback]...");
        const imagenResponse = await ai.models.generateImages({
          model: "imagen-3.0-generate-002",
          prompt: generatedPrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: "image/jpeg",
            aspectRatio: "1:1",
          },
        });

        const generatedImageObj = imagenResponse.generatedImages?.[0];
        const imageBytes = generatedImageObj?.image?.imageBytes || (generatedImageObj as any)?.imageBytes;
        if (imageBytes) {
          finalBase64 = `data:image/jpeg;base64,${imageBytes}`;
          drawSuccess = true;
          console.log("Successfully drew image with imagen-3.0-generate-002 fallback!");
        }
      } catch (err: any) {
        console.log("Model imagen-3.0-generate-002 did not return an image.");
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
