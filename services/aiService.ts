import { GoogleGenAI, Type } from "@google/genai";
import { AiAction } from '../types';

interface AiResponse {
    reply: string;
    language: 'en' | 'hi';
    action: AiAction;
}

let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (!ai) {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("Gemini API key is not available.");
            throw new Error("Gemini API key is not configured. Please contact the administrator.");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};


const responseSchema = {
    type: Type.OBJECT,
    properties: {
        reply: {
            type: Type.STRING,
            description: "A helpful, conversational, and concise reply to the user's query, written in plain text. It should match the user's language."
        },
        language: {
            type: Type.STRING,
            description: "The ISO 639-1 code for the language of the 'reply' text (e.g., 'en' for English, 'hi' for Hindi). This MUST match the language of the reply."
        },
        action: {
            type: Type.OBJECT,
            description: "An action for the application to perform, if explicitly requested. If no action is needed, this object should have null values.",
            properties: {
                command: {
                    type: Type.STRING,
                    description: "The command to execute. Valid commands: 'navigate', 'open_report_modal', 'apply_filter', 'reset_filters', 'click_mark_done', 'logout', 'toggle_maintenance'. If no action, must be null.",
                    nullable: true,
                },
                payload: {
                    type: Type.STRING,
                    description: "Argument for the command. For 'navigate': 'dashboard'|'performance'. For 'open_report_modal': 'Calls Made'|'Meeting Fixed'|'FollowUps Done'. For 'apply_filter': 'filterName:value'. For 'click_mark_done': the leadId. Null for other commands.",
                    nullable: true,
                }
            }
        }
    }
};

const getSystemInstruction = (context: object): string => {
    return `You are a helpful AI assistant integrated into a sales dashboard application called 'SC-Dashboard'.
Your goal is to assist the user by answering questions and performing actions within the app.
You MUST provide your response in the specified JSON format according to the schema.

**Your Capabilities:**
1.  **Answer Questions**: Use the provided context to answer questions about the user's data. Be concise and helpful.
2.  **Perform Actions**: If the user explicitly requests an action, populate the 'action' object in your JSON response.

**Key Rules:**
-   **Language**: You MUST respond in the same language as the user's prompt (English or Hindi).
-   **Language Field**: You MUST correctly identify the language of your reply in the 'language' field ('en' for English, 'hi' for Hindi).
-   **Reply Field**: ALWAYS provide a friendly text reply in the 'reply' field.
-   **Action Field**: ONLY populate the 'action' object if explicitly asked. For general questions, the 'action' object's properties must be 'null'.
-   **Data**: Base your answers on the context provided. Do not invent data.

**Available Actions:**
*   command: 'navigate': To switch pages.
    *   payload: 'dashboard' or 'performance'.
*   command: 'open_report_modal': To open a report.
    *   payload: 'Calls Made', 'Meeting Fixed', or 'FollowUps Done'.
*   command: 'apply_filter': To filter data.
    *   payload: A string in 'filterName:value' format. e.g., 'stepCode:Step-1a'.
*   command: 'reset_filters': To clear all filters.
    *   payload: null
*   command: 'click_mark_done': To open the submission form for a lead.
    *   payload: The leadId (e.g., 'L-12345').
*   command: 'logout': To sign the user out.
    *   payload: null
*   command: 'toggle_maintenance': (Developer only) To turn maintenance mode on or off.
    *   payload: null

**IMPORTANT**:
-   For 'click_mark_done', you need a lead ID from the user. If they don't provide one, ask for it.
-   The 'toggle_maintenance' command is restricted and will only work if the current user is a developer.

**Current Application Context:**
${JSON.stringify(context, null, 2)}
`;
};


export const getAiResponse = async (prompt: string, context: object): Promise<AiResponse> => {
    try {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                systemInstruction: getSystemInstruction(context)
            },
        });

        const jsonText = response.text.trim();
        const parsedResponse = JSON.parse(jsonText);
        
        // Ensure the response shape is correct, providing defaults if not
        return {
            reply: parsedResponse.reply || "I'm not sure how to respond to that, but I'm here to help!",
            language: parsedResponse.language === 'hi' ? 'hi' : 'en',
            action: parsedResponse.action || { command: null, payload: null }
        };

    } catch (error) {
        console.error("Error fetching from Gemini API:", error);
        throw new Error("Failed to get a response from the AI assistant.");
    }
};