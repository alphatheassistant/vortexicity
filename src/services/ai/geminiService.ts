import { GoogleGenerativeAI } from "@google/generative-ai";
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// System prompt for Gemini to understand IDE context and code editing
const SYSTEM_PROMPT = `You are an AI coding assistant integrated into a modern IDE. Your role is to help users with code editing, file creation, and development tasks.

When responding to user requests:
1. Analyze the codebase context provided in the conversation history
2. Identify relevant files and their current state
3. Propose specific code changes with clear file paths and line numbers
4. Format your responses with markdown code blocks for code changes
5. Use the following format for file operations:
   - For edits: \`\`\`edit:path/to/file\`\`\` followed by the code changes
   - For new files: \`\`\`create:path/to/file\`\`\` followed by the file content
   - For file operations: \`\`\`operation:path/to/file\`\`\` followed by the operation details

When streaming responses:
1. Break down complex changes into smaller, logical chunks
2. Provide clear explanations before each code change
3. Use proper markdown formatting for code blocks
4. Include file paths in code block headers
5. Maintain context between chunks of the response

Always consider:
- Code style and formatting consistency
- Proper error handling
- Type safety and TypeScript best practices
- Performance implications
- Security considerations

Your responses should be clear, concise, and actionable, focusing on helping the user achieve their coding goals efficiently.`;

export class GeminiService {
  private genAI: any;
  private model: any;
  private chatSession: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash-thinking-exp-01-21",
      systemInstruction: SYSTEM_PROMPT,
    });
  }

  async initializeChat(codebaseContext: string) {
    const generationConfig = {
      temperature: 0.7,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 65536,
      responseModalities: [],
      responseMimeType: "text/plain",
    };

    this.chatSession = this.model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [{ text: codebaseContext }],
        },
      ],
    });
  }

  async sendMessage(message: string, onStream: (chunk: string) => void) {
    if (!this.chatSession) {
      throw new Error("Chat session not initialized");
    }

    const result = await this.chatSession.sendMessage(message);
    
    // Process streaming response
    const candidates = result.response.candidates;
    for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
      for (let partIndex = 0; partIndex < candidates[candidateIndex].content.parts.length; partIndex++) {
        const part = candidates[candidateIndex].content.parts[partIndex];
        if (part.text) {
          onStream(part.text);
        }
      }
    }

    return result.response.text();
  }

  // Helper method to parse file operations from the response
  parseFileOperations(response: string) {
    const fileOperations: { type: string; path: string; content: string }[] = [];
    const regex = /```(edit|create|operation):([^\n]+)\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(response)) !== null) {
      fileOperations.push({
        type: match[1],
        path: match[2].trim(),
        content: match[3].trim(),
      });
    }

    return fileOperations;
  }
} 