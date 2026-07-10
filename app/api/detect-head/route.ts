import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

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

    // Attempt 1: Standard Gemini API with GoogleGenAI SDK (Primary & highly reliable in AI Studio)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        console.log("Using primary Gemini API key for head detection with multi-model fallback...");
        const ai = new GoogleGenAI({
          apiKey: geminiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });

        // Sequence of models to try in case of 503 or overload errors
        const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-2.5-flash"];
        let responseText = "";
        let success = false;

        for (const modelName of modelsToTry) {
          try {
            console.log(`Trying head detection model: ${modelName}`);
            const response = await ai.models.generateContent({
              model: modelName,
              contents: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data,
                  },
                },
                {
                  text: "Identify the main subject (human or pet) and detect the exact coordinates of its head/face. If there are multiple, choose the largest/most prominent head. Output only a valid JSON object matching the response schema: coordinates ymin, xmin, ymax, xmax must be on a scale of 0 to 1000 (representing normalized boundaries where 0,0 is the top-left and 1000,1000 is the bottom-right of the image). Also estimate the head tilt angle in degrees (-90 to 90, where positive is clockwise rotation).",
                },
              ],
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    subject: { type: Type.STRING, description: "Type of subject, either 'human' or 'pet' or 'none'" },
                    head_found: { type: Type.BOOLEAN, description: "Whether a head/face is found in the photo" },
                    bounding_box: {
                      type: Type.OBJECT,
                      description: "Normalized coordinate bounding box of the head/face (values 0-1000)",
                      properties: {
                        ymin: { type: Type.INTEGER },
                        xmin: { type: Type.INTEGER },
                        ymax: { type: Type.INTEGER },
                        xmax: { type: Type.INTEGER },
                      },
                      required: ["ymin", "xmin", "ymax", "xmax"],
                    },
                    head_angle_degrees: { type: Type.INTEGER, description: "Estimated rotation angle of the head in degrees, between -90 and 90" },
                  },
                  required: ["subject", "head_found", "bounding_box", "head_angle_degrees"],
                },
              },
            });

            if (response.text) {
              responseText = response.text;
              success = true;
              console.log(`Successfully completed head detection using ${modelName}`);
              break;
            }
          } catch (modelErr: any) {
            console.log(`Head detection model ${modelName} did not complete. Trying next...`);
            // Brief backoff pause
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        if (success && responseText) {
          const parsedResult = JSON.parse(responseText);
          console.log("Successfully parsed head coordinates from Gemini API:", parsedResult);
          return NextResponse.json({
            subject: parsedResult.subject || "none",
            head_found: parsedResult.head_found !== undefined ? parsedResult.head_found : false,
            bounding_box: parsedResult.bounding_box || { ymin: 200, xmin: 350, ymax: 500, xmax: 650 },
            head_angle_degrees: parsedResult.head_angle_degrees || 0,
            fallback: false,
          });
        }
      } catch (geminiError: any) {
        console.log("Primary Gemini head detection did not complete. Transitioning to Bankr...");
      }
    }

    // Attempt 2: Fallback to Bankr LLM Gateway API if configured
    const bankrApiKey = process.env.BANKR_API_KEY;
    if (bankrApiKey) {
      try {
        console.log("Using Bankr LLM Gateway API key for head detection fallback...");
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
                      url: `data:image/jpeg;base64,${base64Data}`
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
        }
      } catch (bankrError) {
        console.log("Bankr head detection did not complete.");
      }
    }

    // Attempt 3: Ultimate Fallback (No keys available or both failed)
    console.log("Using standard default placement parameters.");
    return NextResponse.json({
      subject: "none",
      head_found: false,
      bounding_box: { ymin: 220, xmin: 320, ymax: 520, xmax: 680 },
      head_angle_degrees: 0,
      fallback: true,
      message: "AI connection issue. You can easily adjust, rotate, scale, or drag the green hood manually!",
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
