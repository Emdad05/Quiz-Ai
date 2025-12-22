
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

// --- Configuration & API Logic ---

/**
 * Validates an API key. 
 * Note: Guidelines state the API key must be exclusively from process.env.API_KEY.
 * This implementation uses the environment key directly.
 */
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    // Initialization must use named parameter
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Minimal request to check validity using a lightweight model
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
 * Generates a quiz from provided content using Google Gemini.
 */
export const generateQuizFromContent = async (config: QuizConfig): Promise<GeneratedQuizData> => {
  // Use the API key exclusively from process.env.API_KEY as per hard requirement in guidelines.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("Configuration Error: API_KEY environment variable is missing.");
  }

  // Initialization must use named parameter
  const ai = new GoogleGenAI({ apiKey });
  
  // Base properties for Question
  const baseQuestionProps: any = {
    id: { type: Type.INTEGER },
    questionText: { type: Type.STRING },
    explanation: { type: Type.STRING, description: "Detailed explanation. Key phrases in markdown bold (**)." }
  };
  
  const requiredFields = ["id", "questionText", "explanation"];

  // Dynamic Schema Construction based on Quiz Type
  baseQuestionProps.options = { 
    type: Type.ARRAY, 
    items: { type: Type.STRING },
    description: config.quizType === QuizType.TRUE_FALSE ? "Must be ['True', 'False']" : "Must contain exactly 4 options."
  };
  baseQuestionProps.correctOptionIndex = { type: Type.INTEGER, description: "Index of the correct option" };
  requiredFields.push("options", "correctOptionIndex");

  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A short, engaging title." },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: baseQuestionProps,
          required: requiredFields
        }
      }
    },
    required: ["title", "questions"]
  };

  const difficultyPrompt = {
    'Easy': "Focus on direct recall and basic facts. Simple language.",
    'Medium': "Focus on conceptual understanding and application.",
    'Hard': "Focus on analysis, reasoning, and scenarios."
  };

  let typeSpecificInstruction = "";
  if (config.quizType === QuizType.TRUE_FALSE) {
      typeSpecificInstruction = "Generate True/False questions only. Options must be ['True', 'False'].";
  } else {
      typeSpecificInstruction = "Generate Multiple Choice questions with exactly 4 options and one correct answer.";
  }

  let titleInstruction = "Generate a relevant title.";
  if (config.topic && config.topic.trim() !== "") {
    titleInstruction = `Use title: "${config.topic}".`;
  }

  const systemInstruction = `You are an expert educational content creator. 
  Analyze the provided content (text, images, or documents). 
  ${titleInstruction}
  Generate ${config.questionCount} questions.
  Type: ${config.quizType}. ${typeSpecificInstruction}
  Difficulty: ${config.difficulty}. ${difficultyPrompt[config.difficulty]}
  
  Rules:
  1. Base questions strictly on provided content.
  2. Explanation should be educational with **bold** key phrases.
  3. Return raw JSON strictly following the schema.`;

  const parts: any[] = [];
  
  if (config.content) {
    parts.push({ text: config.content });
  }

  config.fileUploads.forEach(file => {
    const cleanBase64 = file.data.split(',')[1] || file.data;
    parts.push({
      inlineData: {
        data: cleanBase64,
        mimeType: file.mimeType 
      }
    });
  });

  try {
      // Use gemini-3-pro-preview for complex reasoning tasks like quiz generation as per guidelines.
      const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: { parts: parts },
          config: {
              systemInstruction: systemInstruction,
              responseMimeType: "application/json",
              responseSchema: schema,
              temperature: 0.3
          }
      });

      // Extract text directly from response.text property (not a method) as per guidelines.
      const text = response.text;
      if (!text) throw new Error("Empty response from AI");

      const data = parseJSON(text);
      return data as GeneratedQuizData;

  } catch (error: any) {
      console.error("Quiz Generation Failed:", error);
      throw new Error(error.message || "Failed to generate quiz. Please check your connection and try again.");
  }
};
