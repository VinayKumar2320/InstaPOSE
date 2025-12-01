import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, PoseFeedback, Gender, PoseStyle, PoseLandmarks } from "../types";

// FIXED: use the correct environment variable that Vite exposes
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Create Google GenAI client
const ai = new GoogleGenAI({ apiKey });

/* ------------------------ SCHEMAS ------------------------ */

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    environment: { type: Type.STRING },
    lighting: {
      type: Type.OBJECT,
      properties: {
        quality: { type: Type.STRING, enum: ["Excellent", "Good", "Fair", "Poor"] },
        direction: { type: Type.STRING },
        suggestion: { type: Type.STRING }
      },
      required: ["quality", "direction", "suggestion"]
    },
    background: {
      type: Type.OBJECT,
      properties: {
        clutterLevel: { type: Type.STRING, enum: ["Clean", "Moderate", "Cluttered"] },
        suggestion: { type: Type.STRING }
      },
      required: ["clutterLevel", "suggestion"]
    },
    suggestedPose: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
        steps: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["title", "description", "difficulty", "steps"]
    }
  },
  required: ["environment", "lighting", "background", "suggestedPose"]
};

const feedbackSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER },
    matchStatus: { type: Type.STRING, enum: ["Perfect", "Good", "Needs Improvement"] },
    adjustments: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["score", "matchStatus", "adjustments"]
};

const landmarksSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    nose: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
    leftShoulder: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
    rightShoulder: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
    leftElbow: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
    rightElbow: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
    leftWrist: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
    rightWrist: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
    leftHip: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
    rightHip: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } }
  }
};

/* ------------------------ FUNCTIONS ------------------------ */

export const analyzeSceneAndSuggest = async (
  base64Image: string,
  gender: Gender,
  style: PoseStyle
): Promise<AnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        {
          text: `
            Act as a world-class photographer.
            Analyze the scene and recommend a perfect Instagram-style pose.
            Gender: ${gender}
            Style: ${style}
            Return only JSON.
          `
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema
      }
    });

    return JSON.parse(await response.text());
  } catch (err) {
    console.error("Analysis failed:", err);
    throw err;
  }
};

export const generatePoseReference = async (
  poseDescription: string,
  gender: Gender,
  style: PoseStyle
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          text: `
            Generate a photorealistic black-background pose reference.
            Pose: ${poseDescription}
            Gender: ${gender}
            Style: ${style}
            No text, no watermark.
          `
        }
      ]
    });

    const image = response.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData
    );

    return image?.inlineData?.data ?? "";
  } catch (err) {
    console.error("Reference image failed:", err);
    throw err;
  }
};

export const evaluatePoseMatch = async (
  base64Image: string,
  targetPoseDescription: string
): Promise<PoseFeedback> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        {
          text: `
            Evaluate the user's pose accuracy.
            Target: "${targetPoseDescription}"
            Return JSON only.
          `
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: feedbackSchema
      }
    });

    return JSON.parse(await response.text());
  } catch (err) {
    console.error("Evaluation failed:", err);
    throw err;
  }
};

export const extractPoseLandmarks = async (
  base64Image: string
): Promise<PoseLandmarks | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        { text: "Extract normalized 2D body pose landmarks as JSON only." }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: landmarksSchema
      }
    });

    return JSON.parse(await response.text());
  } catch (err) {
    console.error("Landmark extraction failed:", err);
    return null;
  }
};
