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

    const suggestSystemInstructions = `You are a legendary, hilarious internet meme creator and viral marketing expert.
Your job is to generate a random, extremely funny, highly engaging, and relatable meme idea.
It can be about crypto trading, blockchain, tech developer struggles, AI hypes, or hilarious everyday life situations.
Focus on highly situational, dramatic, or ironic situations (e.g., "A trader celebrating a 5% gain on an altcoin while his main portfolio is down 90%", "A programmer spending 6 hours to automate a task that takes 10 seconds to do manually").
Keep the output extremely short (under 25 words), punchy, and direct.
Do NOT include any quotation marks, introductory text, introductory phrases (like "Here is a meme:"), or formatting. Just output the raw, hilarious descriptive idea directly.`;

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
