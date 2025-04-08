import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { GeminiConfig, FileContext, FileOperation } from '@/types/gemini';

export class GeminiService {
  private model: GenerativeModel;
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    this.config = config;
    const genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = genAI.getGenerativeModel({ model: config.model });
  }

  private parseFileOperations(content: string): FileOperation[] {
    const operations: FileOperation[] = [];
    const regex = /<file_(create|edit|delete)>\s*<path>(.*?)<\/path>\s*(?:<content>([\s\S]*?)<\/content>)?<\/file_\1>/g;
    
    let match;
    while ((match = regex.exec(content)) !== null) {
      const [_, type, path, content] = match;
      operations.push({
        type: type as 'create' | 'edit' | 'delete',
        path,
        content,
        language: path.split('.').pop()
      });
    }
    
    return operations;
  }

  async streamResponse(
    prompt: string,
    fileContext: FileContext[],
    onToken: (token: string) => void,
    onFileOperation: (operation: FileOperation) => void
  ) {
    const contextPrompt = fileContext.map(file => 
      `File: ${file.path}\nContent:\n${file.content}\n---\n`
    ).join('\n');

    const fullPrompt = `Project Context:\n${contextPrompt}\n\nUser: ${prompt}`;
    
    const result = await this.model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: this.config.temperature ?? 0.7,
        maxOutputTokens: this.config.maxTokens,
      },
    });

    let buffer = '';
    for await (const chunk of result.stream) {
      const text = chunk.text();
      buffer += text;
      onToken(text);

      // Check for complete file operations in buffer
      const operations = this.parseFileOperations(buffer);
      operations.forEach(op => {
        onFileOperation(op);
        // Remove processed operation from buffer
        buffer = buffer.replace(
          `<file_${op.type}><path>${op.path}</path>${op.content ? `<content>${op.content}</content>` : ''}</file_${op.type}>`,
          ''
        );
      });
    }
  }
} 