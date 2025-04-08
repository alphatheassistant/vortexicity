import { GeminiConfig, FileContext, FileOperation } from '@/types/gemini';

export class GeminiService {
  private config: GeminiConfig;
  private MODEL_ID = 'gemini-2.0-flash-thinking-exp-01-21';
  private API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(config: GeminiConfig) {
    this.config = config;
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
    
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: fullPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: this.config.temperature ?? 0.7,
        maxOutputTokens: this.config.maxTokens,
        responseMimeType: "text/plain"
      }
    };

    try {
      const response = await fetch(
        `${this.API_URL}/${this.MODEL_ID}:streamGenerateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert the chunk to text
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
              const text = data.candidates[0].content.parts[0].text;
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
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error in stream response:', error);
      throw error;
    }
  }
} 
