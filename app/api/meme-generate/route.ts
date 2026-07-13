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
    const STYLE_BLOCK = `STYLE: MS Paint style, low-fidelity digital drawing. Extremely bad, rough, ugly, and low quality. Very bold, jagged, shaky, hand-drawn black outlines that look like they were drawn by a young child or with a shaky computer mouse. Strictly flat, solid color blocks only. ABSOLUTELY NO gradients, NO soft blending, NO cinematic lighting, NO shadows, NO blending of colors. Limited, saturated old computer color palette. The character's face must be extremely simple, minimalist, ugly, blank, and hampa, resembling a basic Wojak or NPC meme. The output must feature jagged pixels, low resolution output, and digital artifacting.`;

    let subjectBlock = "";
    let backgroundBlock = "";
    let characterDesc = "";

    if (formulaType === "green-hoodie") {
      characterDesc = "a simple, extremely ugly MS Paint cartoon mascot (warm brown skin/fur, blank minimalist hampa NPC expression) wearing a simple bright green hoodie (#00C805) with messy shaky black outlines, hood down";
      subjectBlock = "SUBJECT: A simple, ugly hand-drawn cartoon mascot wearing a bright green hoodie (#00C805), hood down, with an extremely minimalist, blank hampa NPC expression, drawn with bold jagged shaky black outlines in bad MS Paint style.";
      backgroundBlock = "BACKGROUND: An extremely simple, ugly, low-detail landscape with flat solid colors and basic shapes.";
    } else if (formulaType === "blue-hoodie") {
      characterDesc = "a simple, extremely ugly MS Paint cartoon mascot (vibrant blue skin, deep-blue accents, blank minimalist hampa NPC expression) with no hoodie, drawn with messy shaky black outlines";
      subjectBlock = "SUBJECT: A simple, ugly hand-drawn cartoon mascot with vibrant blue skin and deep-blue accents, no hoodie, with an extremely minimalist, blank hampa NPC expression, drawn with bold jagged shaky black outlines in bad MS Paint style.";
      backgroundBlock = "BACKGROUND: An extremely simple, ugly, low-detail landscape with flat solid colors and basic shapes.";
    } else if (formulaType === "custom-hoodie") {
      const sanitizedSubject = (customSubject || "A cartoon creature").replace(/[^a-zA-Z0-9\s-]/g, "");
      const sanitizedColor = (customColor || "vibrant").replace(/[^a-zA-Z0-9\s#-]/g, "");
      const sanitizedBg = (customBgColor || "dark navy blue").replace(/[^a-zA-Z0-9\s#-]/g, "");
      
      characterDesc = `a simple, extremely ugly MS Paint ${sanitizedSubject} (blank minimalist hampa NPC expression) with ${sanitizedColor} color accents, drawn with messy shaky black outlines`;
      subjectBlock = `SUBJECT: A simple, ugly hand-drawn ${sanitizedSubject} with ${sanitizedColor} color accents, with an extremely minimalist, blank hampa NPC expression, drawn with bold jagged shaky black outlines in bad MS Paint style.`;
      backgroundBlock = `BACKGROUND: An extremely simple, ugly, low-detail landscape with flat solid ${sanitizedBg} colors and basic shapes.`;
    } else {
      characterDesc = "a simple, extremely ugly MS Paint cartoon mascot (warm brown skin/fur, blank minimalist hampa NPC expression) wearing a simple bright green hoodie (#00C805) with messy shaky black outlines, hood down";
      subjectBlock = "SUBJECT: A simple, ugly hand-drawn cartoon mascot wearing a bright green hoodie (#00C805), hood down, with an extremely minimalist, blank hampa NPC expression, drawn with bold jagged shaky black outlines in bad MS Paint style.";
      backgroundBlock = "BACKGROUND: An extremely simple, ugly, low-detail landscape with flat solid colors and basic shapes.";
    }

    // Call text LLM to interpret free-form action/pose/expression
    let interpretedFragment = resolvedPrompt;
    let interpretationSuccess = false;

    if (bankrApiKey) {
      try {
        const interpretationSystemInstructions = `[ROLE]
Anda adalah AI generator untuk gambar meme internet bergaya "MS Paint / Low-Fi Sketch". Tugas Anda adalah mengubah deskripsi pengguna menjadi gambar dengan estetika spesifik: kasar, minimalis, dan seperti buatan tangan menggunakan mouse.

[STYLE RULES - WAJIB]
1. STYLE: Hand-drawn MS Paint aesthetic.
2. LINES: Gunakan garis hitam tebal, kasar, tidak rata, dan terlihat sedikit gemetar (shaky, hand-drawn ink). Jangan buat garis vektor yang rapi.
3. COLORS: Gunakan palet warna dasar yang solid dan flat. DILARANG menggunakan gradien, shading halus, airbrush, atau pencahayaan 3D.
4. CHARACTER: Karakter harus memiliki wajah minimalis (seperti tipe Wojak/NPC) dengan ekspresi yang sangat jelas namun digambar sederhana.
5. BACKGROUND: Latar belakang harus minimalis, flat (datar), tidak mendetail, dan hanya berisi elemen yang relevan dengan suasana.

[OUTPUT FORMAT]
Setiap kali pengguna memberikan input (Ekspresi, Suasana, Kegiatan, Latar Belakang), Anda harus merangkai deskripsi tersebut menjadi prompt gambar yang konsisten dengan gaya di atas.

[NEGATIVE CONSTRAINTS]
- NO 3D rendering, NO photorealism, NO anime art, NO professional digital illustration.
- NO smooth gradients, NO soft blending, NO professional lighting.
- NO complex details. Gambar harus terlihat "low-effort" namun ekspresif.

Tugas Anda adalah merangkum input pengguna di bawah ini menjadi sebuah prompt gambar satu paragraf dalam bahasa Inggris untuk generator gambar:
Karakter Utama: ${characterDesc}
${isStructured ? `- Ekspresi: ${expression || "blank, minimalist NPC face"}
- Kegiatan: ${activity || "no activity"}
- Suasana: ${atmosphere || "neutral"}
- Latar Belakang: ${background || "plain minimal landscape"}` : `- Ide Meme Utama: ${prompt}`}

Gunakan format Template Prompt Pengguna seperti ini untuk menghasilkan prompt Anda (ganti semua kata di dalam kurung siku dengan deskripsi dalam bahasa Inggris, dan semua label kunci HARUS dalam bahasa Inggris saja):
[Style: MS Paint style, low-fidelity digital drawing, hand-drawn shaky black ink outlines, solid flat colors, old computer paint aesthetic]
[Character: A simple, ugly, basic cartoon mascot with warm brown skin/fur, wearing a simple bright green hoodie (#00C805), having a blank minimalist expression]
[Activity/Object: (Deskripsi sangat sederhana dalam bahasa Inggris tentang apa yang dilakukan/dipegang sesuai input)]
[Background: (Deskripsi sangat sederhana dalam bahasa Inggris, flat solid color landscape)]

PENTING:
- SANGAT DILARANG menggunakan kata-kata atau label kunci berbahasa Indonesia seperti '[Gaya: ...]', '[Karakter: ...]', '[Aktivitas/Objek: ...]', atau '[Latar Belakang: ...]'.
- Semua label kunci dalam kurung siku WAJIB dalam bahasa Inggris: '[Style: ...]', '[Character: ...]', '[Activity/Object: ...]', '[Background: ...]'.
- Terjemahkan seluruh input bahasa Indonesia pengguna menjadi deskripsi bahasa Inggris yang ringkas dan padat.
- Output HANYA prompt final tersebut dalam bahasa Inggris, jangan menyertakan pengantar, penjelasan, atau teks obrolan lainnya.`;

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
    const NEGATIVE_CONSTRAINTS = "Avoid: chibi, large head, stocky body, professional illustration, clean vector art, professional comics, 3D images, 3D render, Octane render, V-Ray, Unreal Engine style, modern anime, gradients, cinematic lighting, soft shadows, blending colors, high detail, anatomical precision, flat vector, clean line art, text, watermark, photorealism, stiff symmetrical poses, plain backgrounds.";
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
