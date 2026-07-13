import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const bankrApiKey = process.env.BANKR_API_KEY;

    if (!bankrApiKey) {
      return NextResponse.json(
        { error: "BANKR_API_KEY is not configured in the environment." },
        { status: 500 }
      );
    }

    const suggestSystemInstructions = `You are an unhinged, legendary crypto and internet meme creator.
Your job is to generate a random, extremely funny, chaotic, and relatable meme idea based on Web3, crypto trading, developer panic, or AI hype.
Focus on highly dramatic, ironic, or absurd situations (e.g., "A trader frantically drawing green candle lines with a green crayon directly on his laptop screen during a crash", "A developer panicking because he pushed his API key to GitHub and now robots are mining memecoins on his server", "A trader crying while holding a burning trashcan labeled 'My Portfolio' but smiling because he has 10 followers on X").
Keep the output under 25 words, extremely punchy, funny, and direct. No quotes, intro, or formatting. Just output the raw idea directly.`;

    console.log("[Meme Suggest API] Requesting random meme idea from Bankr LLM...");

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
            content: suggestSystemInstructions,
          },
        ],
        temperature: 0.9, // Higher temperature for more randomness and creativity
      }),
    });

    if (bankrResponse.ok) {
      const bankrData = await bankrResponse.json();
      const content = bankrData.choices?.[0]?.message?.content;
      if (content) {
        const suggestion = content.trim().replace(/^["']|["']$/g, ""); // Clean any leading/trailing quotes
        console.log("[Meme Suggest API] Generated idea:", suggestion);
        return NextResponse.json({ success: true, suggestion });
      }
    }

    // Fallback ideas if API fails or returns empty
    const fallbacks = [
      "A developer explaining to the CEO why a one-line bug fix took three days and deleted the staging environment.",
      "A crypto trader checking the price chart every 30 seconds hoping it will go up just because he bought $10 worth of it.",
      "An AI engineer spending the entire day arguing with an LLM about how to write a simple regex pattern.",
      "A person sleeping soundly during a massive market crash but waking up in panic because they left the stove on.",
      "A designer watching a developer build their pixel-perfect layout using only unstyled table elements.",
      "A student studying for 10 hours for an exam only to realize the test is open-book and they brought the wrong book."
    ];
    const fallbackSuggestion = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    console.warn("[Meme Suggest API] Bankr API failed or returned empty. Using fallback idea.");
    return NextResponse.json({ success: true, suggestion: fallbackSuggestion });

  } catch (err: any) {
    console.error("[Meme Suggest API] Error generating suggestion:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}
