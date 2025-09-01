
import { GoogleGenAI, Type } from "@google/genai";
import { StructuredTajweedFeedback } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getTafsir = async (query: string): Promise<string> => {
  try {
    const prompt = `You are an expert scholar of Quran and Hadith, acting as an intelligent study companion. Your tone should be respectful, educational, and clear.
      Provide a detailed, contextual explanation for the following query: "${query}".
      Your explanation should:
      1.  Synthesize information from a range of classical and contemporary Tafsir and Hadith commentaries.
      2.  Explain any complex theological or linguistic concepts in an accessible way.
      3.  If applicable, present different scholarly viewpoints with their evidentiary basis to show the richness of Islamic scholarship.
      4.  Provide a linguistic analysis of key Arabic terms.
      5.  Conclude with a "Further Study" section suggesting 2-3 related Quranic verses or Hadiths that shed more light on the topic.
      
      Format your response using Markdown for readability (e.g., headings, bold text, bullet points).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error fetching Tafsir from Gemini:", error);
    return "There was an error processing your request. Please check the console for more details.";
  }
};

const tajweedFeedbackSchema = {
  type: Type.OBJECT,
  properties: {
    encouragement: {
      type: Type.STRING,
      description: "A positive and encouraging opening sentence for the student.",
    },
    feedbackItems: {
      type: Type.ARRAY,
      description: "A list of specific feedback points on the recitation.",
      items: {
        type: Type.OBJECT,
        properties: {
          wordIndex: {
            type: Type.INTEGER,
            description: "The 0-based index of the word in the verse that contains the error. For example, in 'Al-hamdu lillahi', 'Al-hamdu' is index 0.",
          },
          letter: {
            type: Type.STRING,
            description: "The specific Arabic letter in the word that needs correction.",
          },
          makhrajKey: {
            type: Type.STRING,
            description: "The general articulation point. Must be one of: 'THROAT', 'TONGUE', 'LIPS', 'NASAL'.",
            enum: ['THROAT', 'TONGUE', 'LIPS', 'NASAL'],
          },
          feedback: {
            type: Type.STRING,
            description: "A short, clear explanation of the specific Tajweed error and how to correct it.",
          },
        },
        required: ["wordIndex", "letter", "makhrajKey", "feedback"],
      },
    },
    conclusion: {
      type: Type.STRING,
      description: "A motivating closing remark for the student.",
    },
  },
  required: ["encouragement", "feedbackItems", "conclusion"],
};


export const getTajweedFeedback = async (
  originalVerse: string,
  userRecitation: string
): Promise<StructuredTajweedFeedback> => {
  try {
    const prompt = `You are an expert Tajweed teacher with a gentle and encouraging tone. A student is practicing the recitation of a Quranic verse.
      
      Original Verse (Correct):
      "${originalVerse}"
      
      Student's Recitation (Phonetic Transcription):
      "${userRecitation}"
      
      Your Task:
      Analyze the student's transcribed recitation against the original Arabic verse and provide specific, actionable feedback on potential Tajweed mistakes. Identify errors in articulation points (makharij), elongation (mudood), and nasalization (ghunna).
      
      Return your analysis in a structured JSON format. For each mistake, identify the word (by its index), the specific letter, its general articulation area (makhrajKey), and a concise feedback message.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: tajweedFeedbackSchema,
      },
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error fetching Tajweed feedback from Gemini:", error);
    throw new Error("There was an error analyzing the recitation. The AI may not have been able to provide structured feedback for this recitation.");
  }
};