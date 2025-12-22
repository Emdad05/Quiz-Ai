
// Use correct import as per @google/genai guidelines
import { GoogleGenAI, Type } from "@google/genai";
import { QuizConfig, GeneratedQuizData, QuizType } from "../types";

/**
 * Utility to parse JSON from AI response.
 * Handles potential markdown code block wrapping.
 */
const parseJSON = (text: string) => {
    try {
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON", e);
        throw new Error("The AI response could not be processed. Please try simplifying your content.");
    }
};

/**
 * Retrieves a list of available API keys from LocalStorage (User keys) 
 * or Environment Variables (System keys).
 */
const getAvailableKeys = (): string[] => {
  // 1. Try LocalStorage (User provided keys)
  try {
    const stored = localStorage.getItem('user_gemini_keys');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Failed to read user keys from storage");
  }

  // 2. Fallback to process.env.API_KEY (System/Vercel keys)
  const envKey = process.env.API_KEY;
  if (envKey) {
    return envKey.split(',').map(k => k.trim()).filter(k => k.length > 0);
  }

  return [];
};

/**
 * Validates an API key using the free-tier Flash model.
 */
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: 'ping',
    });
    return true;
  } catch (e) {
    console.warn("API Key Validation Failed", e);
    return false;
  }
};

/**
 * Generates a quiz from provided content using Google Gemini 3 Flash (Free Tier).
 */
export const generateQuizFromContent = async (config: QuizConfig): Promise<GeneratedQuizData> => {
  const keys = getAvailableKeys();
  
  if (keys.length === 0) {
    throw new Error("No API keys found. Please add a key in the settings or configure the system environment.");
  }

  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A short, engaging title." },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            questionText: { type: Type.STRING },
            explanation: { type: Type.STRING, description: "Detailed explanation. Key phrases in markdown bold (**)." },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: config.quizType === QuizType.TRUE_FALSE ? "Must be ['True', 'False']" : "Must contain exactly 4 options."
            },
            correctOptionIndex: { type: Type.INTEGER, description: "Index of the correct option" }
          },
          required: ["id", "questionText", "explanation", "options", "correctOptionIndex"]
        }
      }
    },
    required: ["title", "questions"]
  };

  const difficultyPrompt = {
    'Easy': "Focus on direct recall and basic facts.",
    'Medium': "Focus on conceptual understanding and application.",
    'Hard': "Focus on analysis, reasoning, and scenarios."
  };

  let typeSpecificInstruction = config.quizType === QuizType.TRUE_FALSE 
    ? "Generate True/False questions only. Options must be ['True', 'False']." 
    : "Generate Multiple Choice questions with exactly 4 options and one correct answer.";

  const systemInstruction = `You are an expert educational content creator. 
  ${config.topic ? `Use title: "${config.topic}".` : "Generate a relevant title."}
  Generate ${config.questionCount} questions.
  Type: ${config.quizType}. ${typeSpecificInstruction}
  Difficulty: ${config.difficulty}. ${difficultyPrompt[config.difficulty]}
  
  Rules:
  1. Base questions strictly on provided content.
  2. Explanation should be educational with **bold** key phrases.
  3. Return raw JSON strictly following the schema.`;

  const parts: any[] = [];
  if (config.content) parts.push({ text: config.content });
  config.fileUploads.forEach(file => {
    const cleanBase64 = file.data.split(',')[1] || file.data;
    parts.push({ inlineData: { data: cleanBase64, mimeType: file.mimeType } });
  });

  let errorLogs: string[] = [];

  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: parts },
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.3
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");

      return parseJSON(text) as GeneratedQuizData;

    } catch (error: any) {
      const errorMsg = error.message || "Unknown error";
      errorLogs.push(`Key ${i+1} Failure: ${errorMsg}`);

      if ((errorMsg.includes('429') || errorMsg.includes('quota')) && i < keys.length - 1) {
        continue;
      }
      break;
    }
  }

  const finalLog = errorLogs.join('\n');
  throw new Error(`CRITICAL_FAILURE_LOGS::${finalLog}`);
};
