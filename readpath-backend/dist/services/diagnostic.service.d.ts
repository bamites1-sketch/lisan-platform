type Grade = string;
interface SkillScores {
    PHONEMIC_AWARENESS: number;
    PHONICS_DECODING: number;
    FLUENCY: number;
    VOCABULARY: number;
    COMPREHENSION: number;
}
interface AssessmentResponse {
    question: {
        skillArea: string;
    };
    isCorrect: boolean;
}
interface Diagnostics {
    strengths: Array<{
        skill: string;
        score: number;
        message: string;
    }>;
    weaknesses: Array<{
        skill: string;
        score: number;
        message: string;
    }>;
    priorities: string[];
    recommendations: Array<{
        skill: string;
        activities: string[];
        message: string;
    }>;
}
export declare const calculateReadinessScore: (responses: AssessmentResponse[]) => Promise<SkillScores>;
export declare const generateDiagnostics: (scores: SkillScores, grade: Grade) => Diagnostics;
export declare const generateLearningPlan: (diagnostics: Diagnostics, grade: Grade) => Array<{
    weekNumber: number;
    title: string;
    goals: string[];
    activities: Array<{
        skillArea: string;
        title: string;
        description: string;
    }>;
}>;
export {};
//# sourceMappingURL=diagnostic.service.d.ts.map