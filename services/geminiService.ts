import { GoogleGenAI, Type } from "@google/genai";
import { CrystalExtractionResponse, Message } from "../types";

// Initialize Gemini Client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined in the environment.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Performs a search-grounded query using Gemini 2.5 Flash
 * Now includes history and user context.
 */
export const searchAndAnalyze = async (query: string, history: Message[], userName: string) => {
  const ai = getAiClient();
  
  try {
    // Convert previous messages to Gemini Content format
    // We exclude the very last 'user' message which is the 'query' passed separately if needed,
    // but typically 'history' contains everything including the new user message, or we append it.
    // Here we assume 'history' is the PAST conversation, and 'query' is the new message.
    
    const formattedHistory = history.filter(m => !m.isThinking).map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const systemInstruction = `You are Crystallize AI, an intelligent research assistant. 
    You are talking to "${userName}". Be friendly, professional, and address them by name occasionally.
    
    Your goal is to provide comprehensive, fact-based answers using Google Search.
    Always cite your sources implicitly by using the search tool.
    
    If the user refers to previous topics, use the conversation context to answer accurately.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [...formattedHistory, { role: 'user', parts: [{ text: query }] }],
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: systemInstruction,
      },
    });

    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, groundingChunks };
  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw error;
  }
};

/**
 * Crystallizes a raw text response into structured knowledge (JSON)
 */
export const crystallizeKnowledge = async (text: string, sourceContext: string): Promise<CrystalExtractionResponse> => {
  const ai = getAiClient();

  try {
    const prompt = `
      Analyze the following text and "crystallize" it into a structured knowledge entry.
      Extract the core insight, a title, relevant keywords, and a broad category.
      
      Text to analyze:
      ${text}
      
      Context/Query:
      ${sourceContext}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A concise title for this knowledge nugget" },
            summary: { type: Type.STRING, description: "The crystallized insight (2-3 sentences)" },
            keywords: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "5-7 important keywords/tags"
            },
            category: { type: Type.STRING, description: "General domain (e.g., Technology, Health, History)" }
          },
          required: ["title", "summary", "keywords", "category"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as CrystalExtractionResponse;
    }
    throw new Error("No JSON returned from crystallization");

  } catch (error) {
    console.error("Crystallization Error:", error);
    throw error;
  }
};