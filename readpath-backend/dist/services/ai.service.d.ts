interface StudentContext {
    firstName: string;
    grade: string;
    readinessScore?: number;
    strengths?: string[];
    weaknesses?: string[];
    priorities?: string[];
    currentLesson?: string;
}
interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}
export declare const getTutorResponse: (messages: ChatMessage[], context: StudentContext) => Promise<{
    text: string;
    provider: "gemini" | "openai" | "offline";
}>;
export {};
//# sourceMappingURL=ai.service.d.ts.map