import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Clean up base64 string if it contains data URL headers and extract MIME type
    let base64Data = image;
    let mimeType = "image/jpeg";
    const mimeMatch = image.match(/^data:([^;]+);base64,/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }
    if (image.includes("base64,")) {
      base64Data = image.split("base64,")[1];
    }

    // Primary Attempt: Bankr LLM Gateway API (Highly secure & reliable, completely server-side)
    const bankrApiKey = process.env.BANKR_API_KEY;
    if (bankrApiKey) {
      try {
        console.log("Using Bankr LLM Gateway API key for head detection...");
        const response = await fetch("https://llm.bankr.bot/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": bankrApiKey,
          },
          body: JSON.stringify({
            model: "gemini-3.1-flash-lite",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: `You are a precise computer vision API. Identify the main subject (human or pet) and detect the exact coordinates of its head. Output only a valid JSON object matching this schema:
{
  "subject": "human" | "pet" | "none",
  "head_found": boolean,
  "bounding_box": { "ymin": number, "xmin": number, "ymax": number, "xmax": number },
  "head_angle_degrees": number
}
Coordinate system: The image dimensions are normalized on a scale from 0 to 1000. (ymin, xmin) is top-left, and (ymax, xmax) is bottom-right.`
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Analyze this photo and return the head coordinates in JSON."
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

        if (response.ok) {
          const data = await response.json();
          const messageContent = data?.choices?.[0]?.message?.content;
          if (messageContent) {
            const parsedResult = JSON.parse(messageContent);
            return NextResponse.json({
              subject: parsedResult.subject || "none",
              head_found: parsedResult.head_found !== undefined ? parsedResult.head_found : false,
              bounding_box: parsedResult.bounding_box || { ymin: 200, xmin: 350, ymax: 500, xmax: 650 },
              head_angle_degrees: parsedResult.head_angle_degrees || 0,
              fallback: false,
            });
          }
        } else {
          const errText = await response.text();
          console.warn(`Bankr LLM Gateway head detection returned bad status ${response.status}: ${errText}`);
        }
      } catch (bankrError) {
        console.error("Bankr head detection did not complete:", bankrError);
      }
    } else {
      console.warn("BANKR_API_KEY environment variable is not set.");
    }

    // Fallback: Default placement parameters
    console.log("Using standard default placement parameters.");
    return NextResponse.json({
      subject: "none",
      head_found: false,
      bounding_box: { ymin: 220, xmin: 320, ymax: 520, xmax: 680 },
      head_angle_degrees: 0,
      fallback: true,
      message: "Bankr API is not configured or offline. You can easily adjust, rotate, scale, or drag the green hood manually!",
    });

  } catch (error: any) {
    console.error("Error in POST /api/detect-head:", error);
    return NextResponse.json({
      subject: "none",
      head_found: false,
      bounding_box: { ymin: 220, xmin: 320, ymax: 520, xmax: 680 },
      head_angle_degrees: 0,
      fallback: true,
      message: `An error occurred: ${error.message || error}. Manual placement is fully enabled.`,
    });
  }
}
