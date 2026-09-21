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
  strengths: Array<{ skill: string; score: number; message: string }>;
  weaknesses: Array<{ skill: string; score: number; message: string }>;
  priorities: string[];
  recommendations: Array<{
    skill: string;
    activities: string[];
    message: string;
  }>;
}

// Calculate skill scores from responses
export const calculateReadinessScore = async (
  responses: AssessmentResponse[]
): Promise<SkillScores> => {
  const skillGroups: Record<string, { correct: number; total: number }> = {
    PHONEMIC_AWARENESS: { correct: 0, total: 0 },
    PHONICS_DECODING: { correct: 0, total: 0 },
    FLUENCY: { correct: 0, total: 0 },
    VOCABULARY: { correct: 0, total: 0 },
    COMPREHENSION: { correct: 0, total: 0 }
  };

  responses.forEach(response => {
    const area = response.question.skillArea;
    if (skillGroups[area]) {
      skillGroups[area].total++;
      if (response.isCorrect) {
        skillGroups[area].correct++;
      }
    }
  });

  // Convert to 0-100 scores
  const scores: SkillScores = {
    PHONEMIC_AWARENESS: skillGroups.PHONEMIC_AWARENESS.total > 0
      ? Math.round((skillGroups.PHONEMIC_AWARENESS.correct / skillGroups.PHONEMIC_AWARENESS.total) * 100)
      : 50,
    PHONICS_DECODING: skillGroups.PHONICS_DECODING.total > 0
      ? Math.round((skillGroups.PHONICS_DECODING.correct / skillGroups.PHONICS_DECODING.total) * 100)
      : 50,
    FLUENCY: skillGroups.FLUENCY.total > 0
      ? Math.round((skillGroups.FLUENCY.correct / skillGroups.FLUENCY.total) * 100)
      : 50,
    VOCABULARY: skillGroups.VOCABULARY.total > 0
      ? Math.round((skillGroups.VOCABULARY.correct / skillGroups.VOCABULARY.total) * 100)
      : 50,
    COMPREHENSION: skillGroups.COMPREHENSION.total > 0
      ? Math.round((skillGroups.COMPREHENSION.correct / skillGroups.COMPREHENSION.total) * 100)
      : 50,
  };

  return scores;
};

// Diagnostic engine - analyzes score combinations to identify root causes
export const generateDiagnostics = (
  scores: SkillScores,
  grade: Grade
): Diagnostics => {
  const strengths: Array<{ skill: string; score: number; message: string }> = [];
  const weaknesses: Array<{ skill: string; score: number; message: string }> = [];
  const priorities: string[] = [];
  const recommendations: Array<{ skill: string; activities: string[]; message: string }> = [];

  const STRENGTH_THRESHOLD = 75;
  const NEEDS_PRACTICE_THRESHOLD = 60;

  // Phonemic Awareness analysis
  if (scores.PHONEMIC_AWARENESS >= STRENGTH_THRESHOLD) {
    strengths.push({
      skill: 'Phonemic Awareness',
      score: scores.PHONEMIC_AWARENESS,
      message: 'You are strong at recognizing and working with sounds in words.'
    });
  } else if (scores.PHONEMIC_AWARENESS < NEEDS_PRACTICE_THRESHOLD) {
    weaknesses.push({
      skill: 'Phonemic Awareness',
      score: scores.PHONEMIC_AWARENESS,
      message: 'Working with individual sounds in words needs more practice.'
    });
    priorities.push('PHONEMIC_AWARENESS');
    recommendations.push({
      skill: 'PHONEMIC_AWARENESS',
      activities: ['sound_blending', 'rhyming', 'sound_segmenting', 'phoneme_manipulation'],
      message: 'Practicing sound blending and segmenting will help build a strong reading foundation.'
    });
  }

  // Phonics & Decoding analysis
  if (scores.PHONICS_DECODING >= STRENGTH_THRESHOLD) {
    strengths.push({
      skill: 'Phonics & Decoding',
      score: scores.PHONICS_DECODING,
      message: 'You are good at sounding out and reading unfamiliar words.'
    });
  } else if (scores.PHONICS_DECODING < NEEDS_PRACTICE_THRESHOLD) {
    weaknesses.push({
      skill: 'Phonics & Decoding',
      score: scores.PHONICS_DECODING,
      message: 'Decoding and sounding out new words is challenging for you.'
    });
    priorities.push('PHONICS_DECODING');
    recommendations.push({
      skill: 'PHONICS_DECODING',
      activities: ['letter_sounds', 'word_building', 'vowel_patterns', 'multisyllabic_words'],
      message: 'Practicing word patterns and letter sounds will improve your ability to read new words.'
    });
  }

  // Fluency analysis
  if (scores.FLUENCY >= STRENGTH_THRESHOLD) {
    strengths.push({
      skill: 'Reading Fluency',
      score: scores.FLUENCY,
      message: 'You read with good speed, accuracy, and expression.'
    });
  } else if (scores.FLUENCY < NEEDS_PRACTICE_THRESHOLD) {
    weaknesses.push({
      skill: 'Reading Fluency',
      score: scores.FLUENCY,
      message: 'Reading smoothly and at a good pace is something to work on.'
    });
    priorities.push('FLUENCY');

    // Check if fluency issue is linked to phonics
    if (scores.PHONICS_DECODING < NEEDS_PRACTICE_THRESHOLD) {
      recommendations.push({
        skill: 'FLUENCY',
        activities: ['repeated_reading', 'timed_reading', 'guided_reading', 'phonics_practice'],
        message: 'Your reading fluency may be affected by difficulty decoding words. Improving phonics will help fluency too.'
      });
    } else {
      recommendations.push({
        skill: 'FLUENCY',
        activities: ['repeated_reading', 'timed_reading', 'guided_reading'],
        message: 'Daily reading practice, especially reading passages aloud more than once, will build fluency.'
      });
    }
  }

  // Vocabulary analysis
  if (scores.VOCABULARY >= STRENGTH_THRESHOLD) {
    strengths.push({
      skill: 'Vocabulary',
      score: scores.VOCABULARY,
      message: 'You know many words and understand their meanings well.'
    });
  } else if (scores.VOCABULARY < NEEDS_PRACTICE_THRESHOLD) {
    weaknesses.push({
      skill: 'Vocabulary',
      score: scores.VOCABULARY,
      message: 'Academic vocabulary is making some passages harder to understand.'
    });
    priorities.push('VOCABULARY');
    recommendations.push({
      skill: 'VOCABULARY',
      activities: ['word_meaning', 'context_clues', 'synonyms_antonyms', 'academic_vocabulary', 'word_usage'],
      message: 'Vocabulary is a priority. Building your word bank will make everything you read easier to understand.'
    });
  }

  // Comprehension analysis
  if (scores.COMPREHENSION >= STRENGTH_THRESHOLD) {
    strengths.push({
      skill: 'Reading Comprehension',
      score: scores.COMPREHENSION,
      message: 'You understand what you read and can find the main ideas well.'
    });
  } else if (scores.COMPREHENSION < NEEDS_PRACTICE_THRESHOLD) {
    weaknesses.push({
      skill: 'Reading Comprehension',
      score: scores.COMPREHENSION,
      message: 'Understanding and remembering what you read needs more practice.'
    });
    priorities.push('COMPREHENSION');

    // Check if comprehension is limited by vocabulary
    if (scores.VOCABULARY >= STRENGTH_THRESHOLD) {
      recommendations.push({
        skill: 'COMPREHENSION',
        activities: ['main_idea', 'inference', 'evidence', 'summarization', 'cause_effect'],
        message: 'You know the words, but you may need more comprehension strategy practice to deeply understand texts.'
      });
    } else {
      recommendations.push({
        skill: 'COMPREHENSION',
        activities: ['main_idea', 'inference', 'evidence', 'summarization', 'vocabulary_context'],
        message: 'Working on both vocabulary and comprehension strategies will help you better understand what you read.'
      });
    }
  }

  // If strengths list is empty, add a positive note for the highest score
  if (strengths.length === 0) {
    const allScores = [
      { skill: 'Phonemic Awareness', area: 'PHONEMIC_AWARENESS', score: scores.PHONEMIC_AWARENESS, message: 'This is your strongest area right now.' },
      { skill: 'Phonics & Decoding', area: 'PHONICS_DECODING', score: scores.PHONICS_DECODING, message: 'This is your strongest area right now.' },
      { skill: 'Reading Fluency', area: 'FLUENCY', score: scores.FLUENCY, message: 'This is your strongest area right now.' },
      { skill: 'Vocabulary', area: 'VOCABULARY', score: scores.VOCABULARY, message: 'This is your strongest area right now.' },
      { skill: 'Comprehension', area: 'COMPREHENSION', score: scores.COMPREHENSION, message: 'This is your strongest area right now.' }
    ].sort((a, b) => b.score - a.score);

    strengths.push(allScores[0]);
  }

  return {
    strengths,
    weaknesses,
    priorities,
    recommendations
  };
};

// Generate a personalized 6-week learning plan
export const generateLearningPlan = (
  diagnostics: Diagnostics,
  grade: Grade
): Array<{
  weekNumber: number;
  title: string;
  goals: string[];
  activities: Array<{ skillArea: string; title: string; description: string }>;
}> => {
  const weeks: Array<{
    weekNumber: number;
    title: string;
    goals: string[];
    activities: Array<{ skillArea: string; title: string; description: string }>;
  }> = [];

  const { priorities, recommendations } = diagnostics;

  // Week templates for each skill combination
  const weekTemplates = {
    VOCABULARY: [
      {
        title: 'Academic Vocabulary Foundations',
        goals: ['Learn 10 new academic words', 'Practice using context clues', 'Review vocabulary in reading passages'],
        activities: [
          { skillArea: 'VOCABULARY', title: 'Academic Word Practice', description: 'Learn 10 key academic vocabulary words with definitions, examples, and practice.' },
          { skillArea: 'VOCABULARY', title: 'Context Clues Challenge', description: 'Practice figuring out word meanings from the surrounding text.' },
          { skillArea: 'VOCABULARY', title: 'Vocabulary in Action', description: 'Read passages and identify how new words are used in context.' }
        ]
      },
      {
        title: 'Word Power Building',
        goals: ['Explore synonyms and antonyms', 'Practice word usage in sentences', 'Apply vocabulary to reading'],
        activities: [
          { skillArea: 'VOCABULARY', title: 'Synonyms & Antonyms', description: 'Build word relationships by exploring similar and opposite words.' },
          { skillArea: 'VOCABULARY', title: 'Word Usage Practice', description: 'Practice using new words correctly in sentences.' },
          { skillArea: 'COMPREHENSION', title: 'Vocabulary in Reading', description: 'Apply your vocabulary knowledge while reading grade-appropriate passages.' }
        ]
      }
    ],
    FLUENCY: [
      {
        title: 'Fluency Fundamentals',
        goals: ['Practice reading passages aloud', 'Improve reading rate', 'Work on accuracy'],
        activities: [
          { skillArea: 'FLUENCY', title: 'Read Aloud Practice', description: 'Practice reading grade-appropriate passages aloud with focus on accuracy.' },
          { skillArea: 'FLUENCY', title: 'Repeated Reading', description: 'Read the same passage 3 times to build speed and confidence.' },
          { skillArea: 'FLUENCY', title: 'Timed Reading Challenge', description: 'Measure and track your words per minute while reading accurately.' }
        ]
      }
    ],
    COMPREHENSION: [
      {
        title: 'Understanding What You Read',
        goals: ['Find the main idea in passages', 'Practice inference skills', 'Support answers with evidence'],
        activities: [
          { skillArea: 'COMPREHENSION', title: 'Main Idea Mastery', description: 'Learn strategies for identifying the main idea and key details in texts.' },
          { skillArea: 'COMPREHENSION', title: 'Making Inferences', description: 'Practice reading between the lines to draw logical conclusions.' },
          { skillArea: 'COMPREHENSION', title: 'Evidence & Support', description: 'Learn to find and use evidence from the text to support your answers.' }
        ]
      },
      {
        title: 'Deeper Reading',
        goals: ['Summarize reading passages', 'Understand cause and effect', 'Identify author\'s purpose'],
        activities: [
          { skillArea: 'COMPREHENSION', title: 'Summarization Skills', description: 'Practice writing brief, accurate summaries of what you read.' },
          { skillArea: 'COMPREHENSION', title: 'Cause & Effect', description: 'Identify how events in a text are connected through cause and effect.' },
          { skillArea: 'COMPREHENSION', title: 'Author\'s Purpose', description: 'Learn to recognize why an author wrote a text and how it shapes meaning.' }
        ]
      }
    ],
    PHONICS_DECODING: [
      {
        title: 'Decoding New Words',
        goals: ['Practice vowel patterns', 'Work on multisyllabic words', 'Build word recognition'],
        activities: [
          { skillArea: 'PHONICS_DECODING', title: 'Vowel Patterns Practice', description: 'Master common vowel patterns that appear in many English words.' },
          { skillArea: 'PHONICS_DECODING', title: 'Multisyllabic Words', description: 'Learn strategies for breaking long words into syllables to read them.' },
          { skillArea: 'PHONICS_DECODING', title: 'Prefixes & Suffixes', description: 'Understand how prefixes and suffixes change word meanings.' }
        ]
      }
    ],
    PHONEMIC_AWARENESS: [
      {
        title: 'Sound Awareness',
        goals: ['Practice blending sounds', 'Work on segmenting words', 'Develop phoneme manipulation'],
        activities: [
          { skillArea: 'PHONEMIC_AWARENESS', title: 'Sound Blending', description: 'Practice blending individual sounds together to form words.' },
          { skillArea: 'PHONEMIC_AWARENESS', title: 'Word Segmenting', description: 'Break words apart into their individual sounds.' },
          { skillArea: 'PHONEMIC_AWARENESS', title: 'Rhyme & Pattern', description: 'Use rhyming patterns to build phonemic awareness.' }
        ]
      }
    ]
  };

  // Always end with a review and reassessment week
  let weekCount = 0;

  // Assign weeks based on priorities
  priorities.forEach((priority) => {
    const templates = weekTemplates[priority as keyof typeof weekTemplates] || [];
    templates.forEach((template, idx) => {
      if (weekCount < 5) {
        weekCount++;
        weeks.push({
          weekNumber: weekCount,
          title: template.title,
          goals: template.goals,
          activities: template.activities
        });
      }
    });
  });

  // Fill remaining weeks with general practice
  while (weekCount < 5) {
    weekCount++;
    weeks.push({
      weekNumber: weekCount,
      title: 'Mixed Skills Practice',
      goals: ['Review all skill areas', 'Practice reading passages', 'Build confidence'],
      activities: [
        { skillArea: 'VOCABULARY', title: 'Vocabulary Review', description: 'Review and reinforce vocabulary words from previous weeks.' },
        { skillArea: 'COMPREHENSION', title: 'Reading Practice', description: 'Read grade-level passages and practice comprehension strategies.' },
        { skillArea: 'FLUENCY', title: 'Fluency Challenge', description: 'Practice reading aloud with a focus on smooth, accurate reading.' }
      ]
    });
  }

  // Final week: Reassessment preparation
  weeks.push({
    weekNumber: 6,
    title: 'Progress Check & Celebration',
    goals: ['Review all skills', 'Prepare for reassessment', 'Celebrate progress'],
    activities: [
      { skillArea: 'COMPREHENSION', title: 'Full Passage Review', description: 'Practice with a complete grade-level reading passage.' },
      { skillArea: 'VOCABULARY', title: 'Final Vocabulary Check', description: 'Review all vocabulary words learned in the plan.' },
      { skillArea: 'FLUENCY', title: 'Final Fluency Practice', description: 'Read aloud to demonstrate your improved fluency.' }
    ]
  });

  return weeks;
};
