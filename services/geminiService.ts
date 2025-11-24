import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ExtractedData } from '../types';

const MODEL_NAME = 'gemini-2.5-flash';

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    reference: { type: SchemaType.STRING, description: "The product reference code or ID found on the label." },
    length: { type: SchemaType.STRING, description: "The length dimension found on the label (e.g., 6000mm, 6m)." },
    quantity: { type: SchemaType.STRING, description: "The quantity or count found on the label." },
    boundingBox: {
      type: SchemaType.OBJECT,
      description: "The bounding box of the technical drawing/profile sketch (usually black lines on white background). Returns values normalized 0-1000.",
      properties: {
        ymin: { type: SchemaType.NUMBER },
        xmin: { type: SchemaType.NUMBER },
        ymax: { type: SchemaType.NUMBER },
        xmax: { type: SchemaType.NUMBER },
      },
      required: ["ymin", "xmin", "ymax", "xmax"]
    }
  },
  required: ["reference", "length", "quantity", "boundingBox"]
} as any;

export const analyzeImage = async (base64Image: string): Promise<ExtractedData> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key is missing");

    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1,
      }
    });

    const prompt = `
      Analyze this industrial label. 
      Extract the Reference Number, Length, and Quantity.
      Also, identify the technical drawing or profile cross-section (usually a black line drawing). 
      Return the bounding box for this drawing.
      If a field is not found, return empty string.
    `;

    const result = await model.generateContent([
      { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
      prompt
    ]);

    const response = result.response;
    const text = response.text();

    return JSON.parse(text) as ExtractedData;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};