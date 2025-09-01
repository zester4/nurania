
import { GoogleGenAI, Type } from "@google/genai";
import { StructuredTajweedFeedback, LearningPath } from "../types";

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

const learningPathSchema = {
    type: Type.OBJECT,
    properties: {
        topic: { type: Type.STRING },
        introduction: { type: Type.STRING },
        steps: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique slug-like ID for the step, e.g., 'salah-quran-baqarah-45'" },
                    type: { type: Type.STRING, enum: ['quran', 'hadith', 'tafsir', 'quiz'] },
                    title: { type: Type.STRING, description: "A short, engaging title for the learning step." },
                    content: { type: Type.STRING, description: "For Tafsir, the full explanation. For Quran/Hadith, a brief summary of what the user should focus on. For quizzes, a lead-in sentence." },
                    reference: {
                        type: Type.OBJECT,
                        properties: {
                            surah: { type: Type.INTEGER, description: "Surah number for Quran verses." },
                            ayah: { type: Type.INTEGER, description: "Ayah number for Quran verses." },
                            bookSlug: { type: Type.STRING, description: "Slug of the Hadith book (e.g., 'sahih-bukhari')." },
                            hadithKeyword: { type: Type.STRING, description: "A primary English keyword to find the relevant Hadith." }
                        }
                    },
                    quiz: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correctAnswerIndex: { type: Type.INTEGER },
                            explanation: { type: Type.STRING, description: "A brief explanation for why the correct answer is right." }
                        }
                    }
                },
                required: ["id", "type", "title", "content", "reference"]
            }
        }
    },
    required: ["topic", "introduction", "steps"]
};

export const generateLearningPath = async (topic: string): Promise<LearningPath> => {
    try {
        const prompt = `You are an expert Islamic curriculum designer. Create a structured, beginner-friendly learning path on the topic of "${topic}". The path should consist of 5-7 steps, mixing Quran verses, related Hadith, concise Tafsir (explanation), and a multiple-choice quiz question to reinforce learning.
        
        Instructions:
        1.  Start with a foundational Quran verse.
        2.  Follow up with a supporting Hadith.
        3.  Provide a concise 'tafsir' or explanation that connects the verse and Hadith.
        4.  Continue this pattern, building on the concepts.
        5.  Include one simple 'quiz' step somewhere in the middle of the path to check for understanding.
        6.  For Hadith references, provide a 'bookSlug' from this list: 'sahih-bukhari', 'sahih-muslim', 'al-tirmidhi', 'abu-dawood', 'ibn-e-majah', 'sunan-nasai', and a simple 'hadithKeyword' for searching.
        7.  Ensure all content is authentic, well-regarded, and presented in a clear, educational tone.
        8.  Return the entire learning path in the specified JSON format.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: learningPathSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error(`Error generating learning path for topic "${topic}":`, error);
        throw new Error("Could not generate a learning path at this time. The AI may be experiencing issues.");
    }
};