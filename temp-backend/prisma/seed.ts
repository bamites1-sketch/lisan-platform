import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('ðŸŒ± Seeding ReadPath database...');

  // Clean existing data
  await prisma.chatMessage.deleteMany();
  await prisma.progressLog.deleteMany();
  await prisma.studentBadge.deleteMany();
  await prisma.practiceResponse.deleteMany();
  await prisma.practiceHistory.deleteMany();
  await prisma.learningActivity.deleteMany();
  await prisma.learningWeek.deleteMany();
  await prisma.learningPlan.deleteMany();
  await prisma.readingProfile.deleteMany();
  await prisma.assessmentResponse.deleteMany();
  await prisma.assessmentScore.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.fluencyAssessment.deleteMany();
  await prisma.fluencyRecording.deleteMany();
  await prisma.contentAssignment.deleteMany();
  await prisma.question.deleteMany();
  await prisma.passage.deleteMany();
  await prisma.vocabulary.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.student.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('password123', 10);

  // ============================================================
  // ADMIN
  // ============================================================
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@readpath.com',
      password,
      role: 'ADMIN',
      admin: {
        create: {
          firstName: 'Admin',
          lastName: 'ReadPath'
        }
      }
    }
  });
  console.log('âœ… Admin created');

  // ============================================================
  // TEACHERS
  // ============================================================
  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@readpath.com',
      password,
      role: 'TEACHER',
      teacher: {
        create: {
          firstName: 'Tigist',
          lastName: 'Bekele'
        }
      }
    },
    include: { teacher: true }
  });
  console.log('âœ… Teacher created');

  // ============================================================
  // PARENTS
  // ============================================================
  const parentUser1 = await prisma.user.create({
    data: {
      email: 'parent1@readpath.com',
      password,
      role: 'PARENT',
      parent: {
        create: {
          firstName: 'Almaz',
          lastName: 'Tadesse'
        }
      }
    },
    include: { parent: true }
  });

  const parentUser2 = await prisma.user.create({
    data: {
      email: 'parent2@readpath.com',
      password,
      role: 'PARENT',
      parent: {
        create: {
          firstName: 'Solomon',
          lastName: 'Girma'
        }
      }
    },
    include: { parent: true }
  });
  console.log('âœ… Parents created');

  // ============================================================
  // STUDENTS
  // ============================================================
  const studentSara = await prisma.user.create({
    data: {
      email: 'sara@readpath.com',
      password,
      role: 'STUDENT',
      student: {
        create: {
          firstName: 'Sara',
          lastName: 'Tadesse',
          grade: "GRADE_6",
          parentId: parentUser1.parent!.id,
          teacherId: teacherUser.teacher!.id,
          xp: 450,
          level: 3,
          streakDays: 7,
          lastActiveAt: new Date()
        }
      }
    },
    include: { student: true }
  });

  const studentHana = await prisma.user.create({
    data: {
      email: 'hana@readpath.com',
      password,
      role: 'STUDENT',
      student: {
        create: {
          firstName: 'Hana',
          lastName: 'Girma',
          grade: "GRADE_7",
          parentId: parentUser2.parent!.id,
          teacherId: teacherUser.teacher!.id,
          xp: 290,
          level: 2,
          streakDays: 3,
          lastActiveAt: new Date()
        }
      }
    },
    include: { student: true }
  });

  const studentAbel = await prisma.user.create({
    data: {
      email: 'abel@readpath.com',
      password,
      role: 'STUDENT',
      student: {
        create: {
          firstName: 'Abel',
          lastName: 'Haile',
          grade: "GRADE_5",
          teacherId: teacherUser.teacher!.id,
          xp: 120,
          level: 1,
          streakDays: 0,
          lastActiveAt: new Date(Date.now() - 86400000 * 3)
        }
      }
    },
    include: { student: true }
  });

  const studentDawit = await prisma.user.create({
    data: {
      email: 'dawit@readpath.com',
      password,
      role: 'STUDENT',
      student: {
        create: {
          firstName: 'Dawit',
          lastName: 'Bekele',
          grade: "GRADE_6",
          teacherId: teacherUser.teacher!.id,
          xp: 780,
          level: 5,
          streakDays: 14,
          lastActiveAt: new Date()
        }
      }
    },
    include: { student: true }
  });

  console.log('âœ… Students created (Sara, Hana, Abel, Dawit)');

  // ============================================================
  // PASSAGES (Ethiopian-relevant content)
  // ============================================================
  const passage1 = await prisma.passage.create({
    data: {
      title: 'The Ethiopian Highlands',
      content: `Ethiopia is home to some of the most dramatic landscapes in Africa. The Ethiopian Highlands stretch across much of the country, with towering peaks and deep valleys carved by ancient rivers. The Blue Nile River, known locally as the Abbay, begins its long journey in the highlands near Lake Tana before flowing north toward Egypt. Farmers in the highlands have cultivated the rich volcanic soil for thousands of years, growing crops like teff, barley, and wheat. The cool climate of the highlands makes it suitable for coffee cultivation, and Ethiopia is widely considered the birthplace of coffee. Today, coffee remains one of the country's most important exports.`,
      grade: "GRADE_6",
      difficulty: "MEDIUM",
      topic: 'Geography',
      wordCount: 112
    }
  });

  const passage2 = await prisma.passage.create({
    data: {
      title: 'The Great Rift Valley',
      content: `The Great Rift Valley is one of the most fascinating geological features on Earth. It stretches from the Middle East all the way down through eastern Africa, passing through Ethiopia, Kenya, and Tanzania. Scientists believe the African continent is slowly splitting apart along this valley. The evidence includes frequent earthquakes, active volcanoes, and a chain of lakes that formed as the land sank between two geological faults. Some of Ethiopia's lakes, including Lake Langano and Lake Abijata, were formed this way. Fossils of early human ancestors have been discovered in the Rift Valley, making it an important place in the story of human history.`,
      grade: "GRADE_7",
      difficulty: "MEDIUM",
      topic: 'Science',
      wordCount: 118
    }
  });

  const passage3 = await prisma.passage.create({
    data: {
      title: 'The Market Day',
      content: `Every Saturday, Amara walked with her grandmother to the local market. She loved the sounds and colors of the busy square. Vendors called out to customers, showing bright fabrics, fresh vegetables, and spices. The smell of roasting coffee beans filled the air. Amara helped carry the empty baskets there and the full ones home. She asked her grandmother, "Why do people come from so far away?" Her grandmother smiled. "Because here, we share more than just goods. We share news, laughter, and friendship." Amara thought about this as she watched a group of women chatting happily by a stall of colorful baskets.`,
      grade: "GRADE_5",
      difficulty: "EASY",
      topic: 'Culture',
      wordCount: 111
    }
  });

  const passage4 = await prisma.passage.create({
    data: {
      title: 'Water and Life',
      content: `In many parts of rural Ethiopia, finding clean water is a daily challenge. Women and children often walk several kilometers to reach the nearest water source. The water they collect may not always be clean, which can lead to illness. In recent years, organizations have worked to build wells and water systems in these communities. When a new well is installed, it changes everything. Children have more time for school because they no longer spend hours fetching water. Women can start small businesses or grow more food in their gardens. Clean water is more than just a drink â€” it is the foundation of a healthier community.`,
      grade: "GRADE_6",
      difficulty: "MEDIUM",
      topic: 'Social Issues',
      wordCount: 118
    }
  });

  console.log('âœ… Passages created');

  // ============================================================
  // VOCABULARY ITEMS
  // ============================================================
  const vocabItems = [
    {
      word: 'observe',
      definition: 'To watch carefully and pay attention to details',
      exampleSentence: 'The scientist decided to observe the experiment closely for any changes.',
      grade: "GRADE_5",
      difficulty: "MEDIUM",
      synonyms: 'watch, study, examine',
      antonyms: 'ignore, overlook',
      partOfSpeech: 'verb',
      amharicTranslation: 'á‰°áˆá‰°áˆˆ / á‰°áŠ¨á‰³á‰°áˆˆ'
    },
    {
      word: 'cultivate',
      definition: 'To prepare and use land for growing crops; to develop or improve something',
      exampleSentence: 'The farmers cultivated their fields early in the morning before the heat.',
      grade: "GRADE_6",
      difficulty: "MEDIUM",
      synonyms: 'grow, farm, develop',
      antonyms: 'neglect, ignore',
      partOfSpeech: 'verb',
      amharicTranslation: 'áŠ áˆ¨áˆ°'
    },
    {
      word: 'evidence',
      definition: 'Facts, signs, or objects that show something is true',
      exampleSentence: 'The scientists found evidence that the valley was once covered by water.',
      grade: "GRADE_6",
      difficulty: "MEDIUM",
      synonyms: 'proof, indication, sign',
      antonyms: 'disproof, refutation',
      partOfSpeech: 'noun'
    },
    {
      word: 'geological',
      definition: 'Related to geology â€” the study of the Earth, its rocks, and its history',
      exampleSentence: 'The geological features of the rift valley show how the land changed over millions of years.',
      grade: "GRADE_7",
      difficulty: "HARD",
      synonyms: 'earthly, terrestrial',
      partOfSpeech: 'adjective'
    },
    {
      word: 'export',
      definition: 'A product sold and sent to another country',
      exampleSentence: 'Coffee is one of Ethiopia\'s most valuable exports.',
      grade: "GRADE_5",
      difficulty: "EASY",
      synonyms: 'goods, trade product',
      antonyms: 'import',
      partOfSpeech: 'noun'
    },
    {
      word: 'foundation',
      definition: 'The base or most important part that everything else is built on',
      exampleSentence: 'A strong education is the foundation of a successful future.',
      grade: "GRADE_6",
      difficulty: "MEDIUM",
      synonyms: 'base, basis, cornerstone',
      partOfSpeech: 'noun',
      amharicTranslation: 'áˆ˜áˆ áˆ¨á‰µ'
    },
    {
      word: 'dramatic',
      definition: 'Very noticeable or impressive; like something from a drama or play',
      exampleSentence: 'The view from the mountain was dramatic, with steep cliffs dropping to a green valley below.',
      grade: "GRADE_6",
      difficulty: "MEDIUM",
      synonyms: 'striking, impressive, vivid',
      antonyms: 'ordinary, plain',
      partOfSpeech: 'adjective'
    },
    {
      word: 'inference',
      definition: 'A conclusion you reach based on evidence and reasoning, not direct statements',
      exampleSentence: 'Based on the wet umbrella, I made the inference that it had rained outside.',
      grade: "GRADE_7",
      difficulty: "HARD",
      synonyms: 'conclusion, deduction',
      partOfSpeech: 'noun'
    }
  ];

  for (const vocab of vocabItems) {
    await prisma.vocabulary.create({ data: vocab });
  }
  console.log('âœ… Vocabulary items created');

  // ============================================================
  // QUESTIONS
  // ============================================================
  const questions = [
    // Phonemic Awareness Questions
    {
      skillArea: "PHONEMIC_AWARENESS",
      subskill: 'beginning_sound',
      questionText: 'What sound does the word "cat" start with?',
      questionType: 'multiple_choice',
      options: JSON.stringify(['k', 's', 't', 'p']),
      correctAnswer: 'k',
      explanation: 'The word "cat" starts with the letter C, which makes the /k/ sound.',
      grade: "GRADE_1",
      difficulty: "EASY",
      successRate: 0.85
    },
    {
      skillArea: "PHONEMIC_AWARENESS",
      subskill: 'rhyming',
      questionText: 'Which word rhymes with "rain"?',
      questionType: 'multiple_choice',
      options: JSON.stringify(['run', 'train', 'rope', 'right']),
      correctAnswer: 'train',
      explanation: 'Rain and train both end with the "-ain" sound, making them rhyme.',
      grade: "GRADE_2",
      difficulty: "EASY",
      successRate: 0.78
    },
    {
      skillArea: "PHONEMIC_AWARENESS",
      subskill: 'blending',
      questionText: 'Blend these sounds together: /s/ /t/ /o/ /p/ â€” what word do they make?',
      questionType: 'multiple_choice',
      options: JSON.stringify(['stem', 'stop', 'step', 'spot']),
      correctAnswer: 'stop',
      explanation: 'When you blend /s/, /t/, /o/, and /p/ together, you get the word "stop".',
      grade: "GRADE_2",
      difficulty: "MEDIUM",
      successRate: 0.70
    },

    // Phonics & Decoding Questions
    {
      skillArea: "PHONICS_DECODING",
      subskill: 'vowel_patterns',
      questionText: 'Which vowel sound do you hear in the word "rain"?',
      questionType: 'multiple_choice',
      options: JSON.stringify(['short a', 'long a', 'short e', 'long e']),
      correctAnswer: 'long a',
      explanation: 'In "rain," the letters "ai" make the long a sound, like in "cake" or "lake".',
      grade: "GRADE_3",
      difficulty: "EASY",
      successRate: 0.72
    },
    {
      skillArea: "PHONICS_DECODING",
      subskill: 'silent_e',
      questionText: 'What does the silent "e" do in the word "kite"?',
      questionType: 'multiple_choice',
      options: JSON.stringify(['It makes the k sound', 'It makes the i long', 'It changes the t sound', 'It makes the word plural']),
      correctAnswer: 'It makes the i long',
      explanation: 'The silent "e" at the end of a word usually makes the vowel before the consonant say its long (name) sound. In "kite," the silent e makes the "i" long.',
      grade: "GRADE_3",
      difficulty: "MEDIUM",
      successRate: 0.60
    },
    {
      skillArea: "PHONICS_DECODING",
      subskill: 'prefixes',
      questionText: 'What does the prefix "un-" mean in the word "unhappy"?',
      questionType: 'multiple_choice',
      options: JSON.stringify(['very', 'not', 'before', 'again']),
      correctAnswer: 'not',
      explanation: 'The prefix "un-" means "not." So "unhappy" means "not happy."',
      grade: "GRADE_4",
      difficulty: "MEDIUM",
      successRate: 0.68
    },

    // Vocabulary Questions
    {
      skillArea: "VOCABULARY",
      subskill: 'context_clues',
      questionText: 'Read this sentence: "The scientist carefully observed the colorful bird, watching it feed for nearly an hour." What does "observed" most likely mean?',
      questionType: 'multiple_choice',
      options: JSON.stringify(['chased', 'watched carefully', 'painted', 'captured']),
      correctAnswer: 'watched carefully',
      explanation: 'The clues "carefully" and "watching it feed for nearly an hour" tell us that observed means watching with close attention.',
      grade: "GRADE_5",
      difficulty: "MEDIUM",
      successRate: 0.65
    },
    {
      skillArea: "VOCABULARY",
      subskill: 'synonyms',
      questionText: 'Which word is the best synonym (similar meaning) for "dramatic"?',
      questionType: 'multiple_choice',
      options: JSON.stringify(['boring', 'striking', 'quiet', 'small']),
      correctAnswer: 'striking',
      explanation: '"Striking" means noticeably impressive â€” similar to "dramatic," which means very noticeable or impressive.',
      grade: "GRADE_6",
      difficulty: "MEDIUM",
      successRate: 0.58
    },
    {
      skillArea: "VOCABULARY",
      subskill: 'word_meaning',
      questionText: 'Based on the sentence "The foundation of the bridge was made from strong concrete," what does "foundation" mean?',
      questionType: 'multiple_choice',
      options: JSON.stringify(['top section', 'the roof', 'the base and supporting structure', 'a type of metal']),
      correctAnswer: 'the base and supporting structure',
      explanation: '"Foundation" means the base or most important part that supports everything else.',
      grade: "GRADE_5",
      difficulty: "MEDIUM",
      successRate: 0.62
    },
    {
      skillArea: "VOCABULARY",
      subskill: 'academic_vocabulary',
      questionText: 'Fill in the blank: The farmers decided to _______ the new land, clearing trees and preparing the soil for planting.',
      questionType: 'multiple_choice',
      options: JSON.stringify(['destroy', 'cultivate', 'abandon', 'flood']),
      correctAnswer: 'cultivate',
      explanation: '"Cultivate" means to prepare land for growing crops. The clues "clearing trees" and "preparing the soil for planting" point to this meaning.',
      grade: "GRADE_6",
      difficulty: "MEDIUM",
      successRate: 0.55
    },

    // Comprehension Questions
    {
      skillArea: "COMPREHENSION",
      subskill: 'main_idea',
      questionText: 'Based on "The Ethiopian Highlands" passage, what is the main idea?',
      questionType: 'multiple_choice',
      options: JSON.stringify([
        'Ethiopia has many rivers',
        'The Blue Nile begins near Lake Tana',
        'The Ethiopian Highlands are a significant and productive landscape that shapes Ethiopia\'s geography and agriculture',
        'Ethiopian farmers grow teff'
      ]),
      correctAnswer: 'The Ethiopian Highlands are a significant and productive landscape that shapes Ethiopia\'s geography and agriculture',
      explanation: 'The passage covers the geography, rivers, farming, and products of the Ethiopian Highlands â€” showing their overall importance to the country.',
      grade: "GRADE_6",
      difficulty: "MEDIUM",
      successRate: 0.55,
      passageId: passage1.id
    },
    {
      skillArea: "COMPREHENSION",
      subskill: 'inference',
      questionText: 'In "The Market Day," what can you infer about Amara\'s relationship with her grandmother?',
      questionType: 'multiple_choice',
      options: JSON.stringify([
        'They do not get along',
        'They are distant and rarely see each other',
        'They share a warm, close relationship and the grandmother uses daily moments to teach',
        'The grandmother is strict and serious'
      ]),
      correctAnswer: 'They share a warm, close relationship and the grandmother uses daily moments to teach',
      explanation: 'The passage shows Amara helping her grandmother and asking questions, and the grandmother responding with a wise, warm lesson. This points to a close, teaching relationship.',
      grade: "GRADE_5",
      difficulty: "MEDIUM",
      successRate: 0.50,
      passageId: passage3.id
    },
    {
      skillArea: "COMPREHENSION",
      subskill: 'cause_effect',
      questionText: 'According to "Water and Life," what happens BECAUSE new wells are installed?',
      questionType: 'multiple_choice',
      options: JSON.stringify([
        'Families move away from the area',
        'Children spend more time at home',
        'Children have more time for school and women can start businesses',
        'Farming becomes harder'
      ]),
      correctAnswer: 'Children have more time for school and women can start businesses',
      explanation: 'The passage states that when clean water is closer, children no longer spend hours fetching it, giving them time for school. Women can also start businesses or grow more food.',
      grade: "GRADE_6",
      difficulty: "MEDIUM",
      successRate: 0.60,
      passageId: passage4.id
    },
    {
      skillArea: "COMPREHENSION",
      subskill: 'supporting_details',
      questionText: 'According to "The Great Rift Valley," which of these is NOT evidence that the African continent is splitting apart?',
      questionType: 'multiple_choice',
      options: JSON.stringify([
        'Frequent earthquakes',
        'Active volcanoes',
        'A chain of lakes',
        'The discovery of human fossils'
      ]),
      correctAnswer: 'The discovery of human fossils',
      explanation: 'The passage lists earthquakes, volcanoes, and lakes as evidence that the continent is splitting. Human fossils are mentioned separately as proof of human history in the region, not as evidence of splitting.',
      grade: "GRADE_7",
      difficulty: "HARD",
      successRate: 0.45,
      passageId: passage2.id
    },

    // Fluency (reading-related metrics questions)
    {
      skillArea: "FLUENCY",
      subskill: 'expression',
      questionText: 'When reading aloud, what should you do at a period (.)?',
      questionType: 'multiple_choice',
      options: JSON.stringify(['Speed up', 'Pause briefly', 'Raise your voice', 'Skip to the next sentence']),
      correctAnswer: 'Pause briefly',
      explanation: 'A period marks the end of a sentence. When reading aloud, you should pause briefly at a period â€” this helps listeners follow along and understand the meaning.',
      grade: "GRADE_4",
      difficulty: "EASY",
      successRate: 0.75
    }
  ];

  for (const q of questions) {
    await prisma.question.create({ data: q as any });
  }
  console.log('âœ… Questions created');

  // ============================================================
  // LESSONS
  // ============================================================
  const lessons = [
    {
      skillArea: "VOCABULARY",
      subskill: 'context_clues',
      title: 'Using Context Clues to Understand New Words',
      grade: "GRADE_6",
      difficulty: "MEDIUM",
      explanation: 'When you come across a word you don\'t know, you don\'t always need a dictionary! The words and sentences around the unfamiliar word often give you clues about its meaning. These are called **context clues**.',
      examples: JSON.stringify([
        {
          sentence: 'The abandoned house was dilapidated â€” its roof was caving in, windows were broken, and weeds had taken over the yard.',
          word: 'dilapidated',
          clue: 'The description of the roof, windows, and weeds helps you understand that dilapidated means in a bad state of repair or neglected.'
        },
        {
          sentence: 'She was so famished after the long hike that she ate three sandwiches immediately.',
          word: 'famished',
          clue: 'Eating three sandwiches "immediately" tells you the person was extremely hungry. Famished means very hungry.'
        }
      ]),
      tips: JSON.stringify([
        'Look for defining phrases right after the word (often introduced by "means," "is," "which is," or a dash)',
        'Look for examples that illustrate the word\'s meaning',
        'Look for contrast clues â€” words like "but," "however," or "unlike" often signal the opposite meaning',
        'Consider the overall tone and topic of the passage'
      ]),
      demonstrationSteps: JSON.stringify([
        { step: 1, instruction: 'Find the unfamiliar word in the sentence', example: 'Identify "dilapidated" in the example sentence' },
        { step: 2, instruction: 'Read the whole sentence carefully', example: 'Read about the roof, windows, and weeds' },
        { step: 3, instruction: 'Look for clue words before and after', example: 'The description of damage tells us the meaning' },
        { step: 4, instruction: 'Form a guess at the meaning', example: '"Dilapidated probably means broken down or run-down"' },
        { step: 5, instruction: 'Substitute your guess back into the sentence to check', example: 'Does "broken down house" make sense? Yes!' }
      ]),
      guidedPractice: JSON.stringify([
        {
          sentence: 'The tenacious runner never gave up, even when she was far behind and everyone expected her to stop.',
          word: 'tenacious',
          hints: ['What is the runner doing?', 'What do "never gave up" and "even when far behind" tell us?'],
          answer: 'persistent, determined, not giving up'
        }
      ]),
      independentPractice: JSON.stringify([
        {
          sentence: 'The children were apprehensive about crossing the bridge because it looked old and shaky.',
          word: 'apprehensive',
          question: 'What does "apprehensive" mean in this sentence?',
          options: ['excited', 'worried or fearful', 'happy', 'bored']
        }
      ]),
      order: 1
    },
    {
      skillArea: "COMPREHENSION",
      subskill: 'main_idea',
      title: 'Finding the Main Idea',
      grade: "GRADE_6",
      difficulty: "MEDIUM",
      explanation: 'The **main idea** is the most important point the author wants you to understand from a passage. It\'s the "big message" of the whole text â€” not just one small detail, and not a simple topic like "dogs." It\'s what the author says ABOUT the topic.',
      examples: JSON.stringify([
        {
          paragraph: 'Dogs make wonderful pets for many reasons. They are loyal and provide companionship. They can be trained to help people with disabilities. Many dogs also protect their owners from danger. Their playful nature can reduce stress and make people feel happier.',
          mainIdea: 'Dogs make wonderful pets because of their loyalty, helpfulness, and positive effect on their owners.',
          notMainIdea: '"Dogs" is just the topic. The main idea tells us what the author says about dogs â€” that they make wonderful pets for many reasons.'
        }
      ]),
      tips: JSON.stringify([
        'Ask yourself: "What is this mostly about?"',
        'The main idea is often in the first or last sentence, but not always',
        'Details support the main idea â€” they are NOT the main idea themselves',
        'If you remove the main idea, the paragraph falls apart. Details can be removed and the paragraph still makes sense.'
      ]),
      demonstrationSteps: JSON.stringify([
        { step: 1, instruction: 'Read the whole passage', example: 'Read once without stopping to understand the overall meaning' },
        { step: 2, instruction: 'Identify the topic (one or two words)', example: 'For the dogs passage: "dogs as pets"' },
        { step: 3, instruction: 'Find what the author says about the topic', example: '"Dogs are wonderful pets for many reasons"' },
        { step: 4, instruction: 'Check: do the details support your main idea?', example: 'Loyalty, training, protection, stress reduction â€” all support the main idea' },
        { step: 5, instruction: 'Write the main idea in your own words', example: '"Dogs are beneficial pets because of their loyalty and helpful qualities"' }
      ]),
      guidedPractice: JSON.stringify([
        {
          paragraph: 'Regular exercise is important for both your body and mind. It helps your heart stay strong and your muscles grow. Exercise can also improve your mood by releasing chemicals in the brain that make you feel happier. People who exercise regularly sleep better and have more energy during the day.',
          question: 'What is the main idea?',
          hints: [
            'What is the paragraph about?',
            'What does the author want you to understand about exercise?',
            'Do all the details (heart, mood, sleep, energy) connect to one big idea?'
          ],
          answer: 'Regular exercise is important because it benefits both your physical health and mental well-being.'
        }
      ]),
      independentPractice: JSON.stringify([]),
      order: 1
    },
    {
      skillArea: "FLUENCY",
      subskill: 'repeated_reading',
      title: 'Repeated Reading for Fluency',
      grade: "GRADE_6",
      difficulty: "MEDIUM",
      explanation: '**Repeated reading** means reading the same passage more than once. This is one of the most powerful techniques for improving reading fluency. Each time you read the same text, your brain recognizes the words faster, your reading becomes smoother, and you can focus on understanding the meaning.',
      examples: JSON.stringify([
        {
          text: 'First read: You focus on reading every word correctly. Some words might trip you up.',
          detail: 'It\'s okay to go slowly. Accuracy first!'
        },
        {
          text: 'Second read: You already know the words, so you can read more smoothly and at a better pace.',
          detail: 'Notice how much easier it feels the second time.'
        },
        {
          text: 'Third read: Now you can add expression and read like you\'re telling a story.',
          detail: 'This is reading fluency â€” accurate, smooth, and expressive!'
        }
      ]),
      tips: JSON.stringify([
        'Read aloud for best results â€” you can hear your own improvement',
        'Record yourself and listen back to notice improvements',
        'Don\'t skip words â€” accuracy matters more than speed',
        'Aim for a comfortable, natural pace â€” not rushing',
        'Even 10 minutes of repeated reading practice each day makes a big difference'
      ]),
      demonstrationSteps: JSON.stringify([
        { step: 1, instruction: 'Choose a passage at your reading level', example: 'Pick a passage your teacher recommends' },
        { step: 2, instruction: 'First read: Focus on accuracy', example: 'Read slowly and carefully, saying each word correctly' },
        { step: 3, instruction: 'Second read: Focus on smoothness', example: 'Try to read without long pauses or hesitations' },
        { step: 4, instruction: 'Third read: Focus on expression', example: 'Read with natural rhythm, pause at punctuation, change your voice for different parts' }
      ]),
      guidedPractice: JSON.stringify([]),
      independentPractice: JSON.stringify([]),
      order: 1
    }
  ];

  const createdLessons = [];
  for (const lesson of lessons) {
    const created = await prisma.lesson.create({ data: lesson as any });
    createdLessons.push(created);
  }
  console.log('âœ… Lessons created');

  // ============================================================
  // ASSESSMENTS & READING PROFILES FOR DEMO STUDENTS
  // ============================================================

  // Sara's assessment history - showing improvement
  const saraAssessment1 = await prisma.assessment.create({
    data: {
      studentId: studentSara.student!.id,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 86400000 * 30),
      completedAt: new Date(Date.now() - 86400000 * 30),
      overallScore: 64,
      readinessScore: 64,
      targetGrade: "GRADE_7"
    }
  });

  await prisma.assessmentScore.createMany({
    data: [
      { assessmentId: saraAssessment1.id, skillArea: "PHONEMIC_AWARENESS", score: 91 },
      { assessmentId: saraAssessment1.id, skillArea: "PHONICS_DECODING", score: 74 },
      { assessmentId: saraAssessment1.id, skillArea: "FLUENCY", score: 52, accuracy: 88.5, wordsPerMinute: 89, correctWordsPerMinute: 57, pauses: 6 },
      { assessmentId: saraAssessment1.id, skillArea: "VOCABULARY", score: 47 },
      { assessmentId: saraAssessment1.id, skillArea: "COMPREHENSION", score: 68 }
    ]
  });

  const saraProfile1 = await prisma.readingProfile.create({
    data: {
      studentId: studentSara.student!.id,
      assessmentId: saraAssessment1.id,
      readinessScore: 64,
      currentGrade: "GRADE_6",
      targetGrade: "GRADE_7",
      phonemicAwarenessScore: 91,
      phonicsDecodingScore: 74,
      fluencyScore: 52,
      vocabularyScore: 47,
      comprehensionScore: 68,
      strengths: JSON.stringify([
        { skill: 'Phonemic Awareness', score: 91, message: 'You are strong at recognizing and working with sounds in words.' }
      ],
      weaknesses: JSON.stringify([
        { skill: 'Vocabulary', score: 47, message: 'Academic vocabulary is making some passages harder to understand.' },
        { skill: 'Reading Fluency', score: 52, message: 'Reading smoothly and at a good pace is something to work on.' }
      ],
      priorities: JSON.stringify(['VOCABULARY', 'FLUENCY', 'PHONICS_DECODING'],
      recommendations: JSON.stringify([
        { skill: 'VOCABULARY', activities: ['word_meaning', 'context_clues', 'synonyms_antonyms', 'academic_vocabulary'], message: 'Vocabulary is a priority. Building your word bank will make everything you read easier to understand.' },
        { skill: 'FLUENCY', activities: ['repeated_reading', 'timed_reading', 'guided_reading'], message: 'Daily reading practice, especially reading passages aloud more than once, will build fluency.' }
      ]
    }
  });

  // Create Sara's learning plan
  const saraLearningPlan = await prisma.learningPlan.create({
    data: {
      studentId: studentSara.student!.id,
      readingProfileId: saraProfile1.id,
      title: 'Sara\'s 6-Week Reading Plan',
      durationWeeks: 6,
      status: 'active'
    }
  });

  const saraWeeks = [
    {
      weekNumber: 1,
      title: 'Academic Vocabulary Foundations',
      goals: ['Learn 10 new academic words', 'Practice using context clues', 'Review vocabulary in reading passages'],
      activities: [
        { skillArea: "VOCABULARY", title: 'Academic Word Practice', description: 'Learn 10 key academic vocabulary words', order: 1, completed: true },
        { skillArea: "VOCABULARY", title: 'Context Clues Challenge', description: 'Practice figuring out word meanings from context', order: 2, completed: true },
        { skillArea: "VOCABULARY", title: 'Vocabulary in Action', description: 'Apply vocabulary knowledge while reading', order: 3, completed: false }
      ]
    },
    {
      weekNumber: 2,
      title: 'Fluency Fundamentals',
      goals: ['Practice reading passages aloud', 'Improve reading rate', 'Work on accuracy'],
      activities: [
        { skillArea: "FLUENCY", title: 'Read Aloud Practice', description: 'Practice reading grade-appropriate passages aloud', order: 1, completed: false },
        { skillArea: "FLUENCY", title: 'Repeated Reading', description: 'Read the same passage 3 times to build speed', order: 2, completed: false },
        { skillArea: "FLUENCY", title: 'Timed Reading Challenge', description: 'Measure and track words per minute', order: 3, completed: false }
      ]
    },
    {
      weekNumber: 3,
      title: 'Word Power Building',
      goals: ['Explore synonyms and antonyms', 'Practice word usage', 'Build vocabulary'],
      activities: [
        { skillArea: "VOCABULARY", title: 'Synonyms & Antonyms', description: 'Build word relationships', order: 1, completed: false },
        { skillArea: "VOCABULARY", title: 'Word Usage Practice', description: 'Practice using new words in sentences', order: 2, completed: false },
        { skillArea: "COMPREHENSION", title: 'Vocabulary in Reading', description: 'Apply vocabulary in reading passages', order: 3, completed: false }
      ]
    },
    {
      weekNumber: 4,
      title: 'Understanding What You Read',
      goals: ['Find the main idea', 'Practice inference skills', 'Support answers with evidence'],
      activities: [
        { skillArea: "COMPREHENSION", title: 'Main Idea Mastery', description: 'Learn to identify main idea and key details', order: 1, completed: false },
        { skillArea: "COMPREHENSION", title: 'Making Inferences', description: 'Practice reading between the lines', order: 2, completed: false },
        { skillArea: "COMPREHENSION", title: 'Evidence & Support', description: 'Find and use evidence from text', order: 3, completed: false }
      ]
    },
    {
      weekNumber: 5,
      title: 'Decoding & Fluency',
      goals: ['Practice multisyllabic words', 'Build fluency with expression', 'Connect phonics to reading'],
      activities: [
        { skillArea: "PHONICS_DECODING", title: 'Multisyllabic Words', description: 'Break long words into syllables', order: 1, completed: false },
        { skillArea: "FLUENCY", title: 'Expression Practice', description: 'Read with natural rhythm and expression', order: 2, completed: false },
        { skillArea: "PHONICS_DECODING", title: 'Prefixes & Suffixes', description: 'Understand word parts', order: 3, completed: false }
      ]
    },
    {
      weekNumber: 6,
      title: 'Progress Check & Celebration',
      goals: ['Review all skills', 'Prepare for reassessment', 'Celebrate progress'],
      activities: [
        { skillArea: "COMPREHENSION", title: 'Full Passage Review', description: 'Practice with a complete grade-level passage', order: 1, completed: false },
        { skillArea: "VOCABULARY", title: 'Final Vocabulary Check', description: 'Review all vocabulary words learned', order: 2, completed: false },
        { skillArea: "FLUENCY", title: 'Final Fluency Practice', description: 'Read aloud to demonstrate improved fluency', order: 3, completed: false }
      ]
    }
  ];

  for (const week of saraWeeks) {
    const createdWeek = await prisma.learningWeek.create({
      data: {
        learningPlanId: saraLearningPlan.id,
        weekNumber: week.weekNumber,
        title: week.title,
        goals: week.goals
      }
    });
    for (const activity of week.activities) {
      await prisma.learningActivity.create({
        data: {
          learningWeekId: createdWeek.id,
          skillArea: activity.skillArea,
          title: activity.title,
          description: activity.description,
          order: activity.order,
          completed: activity.completed,
          completedAt: activity.completed ? new Date(Date.now() - 86400000 * 10) : null
        }
      });
    }
  }

  // Sara's second assessment (improvement)
  const saraAssessment2 = await prisma.assessment.create({
    data: {
      studentId: studentSara.student!.id,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 86400000 * 5),
      completedAt: new Date(Date.now() - 86400000 * 5),
      overallScore: 72,
      readinessScore: 72,
      targetGrade: "GRADE_7"
    }
  });

  await prisma.assessmentScore.createMany({
    data: [
      { assessmentId: saraAssessment2.id, skillArea: "PHONEMIC_AWARENESS", score: 93 },
      { assessmentId: saraAssessment2.id, skillArea: "PHONICS_DECODING", score: 77 },
      { assessmentId: saraAssessment2.id, skillArea: "FLUENCY", score: 61, accuracy: 91.2, wordsPerMinute: 98, correctWordsPerMinute: 72, pauses: 3 },
      { assessmentId: saraAssessment2.id, skillArea: "VOCABULARY", score: 63 },
      { assessmentId: saraAssessment2.id, skillArea: "COMPREHENSION", score: 71 }
    ]
  });

  await prisma.readingProfile.create({
    data: {
      studentId: studentSara.student!.id,
      assessmentId: saraAssessment2.id,
      readinessScore: 72,
      currentGrade: "GRADE_6",
      targetGrade: "GRADE_7",
      phonemicAwarenessScore: 93,
      phonicsDecodingScore: 77,
      fluencyScore: 61,
      vocabularyScore: 63,
      comprehensionScore: 71,
      strengths: JSON.stringify([
        { skill: 'Phonemic Awareness', score: 93, message: 'You are strong at recognizing and working with sounds in words.' },
        { skill: 'Phonics & Decoding', score: 77, message: 'You are good at sounding out and reading unfamiliar words.' }
      ],
      weaknesses: JSON.stringify([
        { skill: 'Vocabulary', score: 63, message: 'Academic vocabulary is getting better but still needs practice.' }
      ],
      priorities: JSON.stringify(['VOCABULARY', 'COMPREHENSION'],
      recommendations: JSON.stringify([
        { skill: 'VOCABULARY', activities: ['word_meaning', 'context_clues', 'academic_vocabulary'], message: 'Keep building vocabulary â€” great progress!' }
      ]
    }
  });

  // Progress logs for Sara
  const saraProgressDates = [30, 25, 20, 15, 10, 5, 0];
  const saraScores = [64, 64, 66, 68, 70, 72, 72];
  for (let i = 0; i < saraProgressDates.length; i++) {
    await prisma.progressLog.create({
      data: {
        studentId: studentSara.student!.id,
        metric: 'readiness_score',
        value: saraScores[i],
        date: new Date(Date.now() - 86400000 * saraProgressDates[i])
      }
    });
  }

  // Sara's badges
  await prisma.studentBadge.createMany({
    data: [
      { studentId: studentSara.student!.id, badgeType: "STREAK_WARRIOR", earnedAt: new Date(Date.now() - 86400000 * 2) },
      { studentId: studentSara.student!.id, badgeType: "VOCABULARY_EXPLORER", earnedAt: new Date(Date.now() - 86400000 * 10) },
      { studentId: studentSara.student!.id, badgeType: "FLUENCY_STARTER", earnedAt: new Date(Date.now() - 86400000 * 8) }
    ]
  });

  console.log('âœ… Sara\'s assessment data created');

  // ============================================================
  // HANA's data
  // ============================================================
  const hanaAssessment = await prisma.assessment.create({
    data: {
      studentId: studentHana.student!.id,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 86400000 * 14),
      completedAt: new Date(Date.now() - 86400000 * 14),
      overallScore: 58,
      readinessScore: 58,
      targetGrade: "GRADE_8"
    }
  });

  await prisma.assessmentScore.createMany({
    data: [
      { assessmentId: hanaAssessment.id, skillArea: "PHONEMIC_AWARENESS", score: 82 },
      { assessmentId: hanaAssessment.id, skillArea: "PHONICS_DECODING", score: 55 },
      { assessmentId: hanaAssessment.id, skillArea: "FLUENCY", score: 48, accuracy: 85.0, wordsPerMinute: 75, correctWordsPerMinute: 48, pauses: 9 },
      { assessmentId: hanaAssessment.id, skillArea: "VOCABULARY", score: 52 },
      { assessmentId: hanaAssessment.id, skillArea: "COMPREHENSION", score: 54 }
    ]
  });

  await prisma.readingProfile.create({
    data: {
      studentId: studentHana.student!.id,
      assessmentId: hanaAssessment.id,
      readinessScore: 58,
      currentGrade: "GRADE_7",
      targetGrade: "GRADE_8",
      phonemicAwarenessScore: 82,
      phonicsDecodingScore: 55,
      fluencyScore: 48,
      vocabularyScore: 52,
      comprehensionScore: 54,
      strengths: JSON.stringify([
        { skill: 'Phonemic Awareness', score: 82, message: 'You are good at recognizing sounds in words.' }
      ],
      weaknesses: JSON.stringify([
        { skill: 'Reading Fluency', score: 48, message: 'Reading fluency may be affected by difficulty decoding words.' },
        { skill: 'Phonics & Decoding', score: 55, message: 'Decoding and sounding out new words is challenging for you.' },
        { skill: 'Vocabulary', score: 52, message: 'Academic words are making passages harder to understand.' }
      ],
      priorities: JSON.stringify(['FLUENCY', 'PHONICS_DECODING', 'VOCABULARY'],
      recommendations: JSON.stringify([
        { skill: 'FLUENCY', activities: ['repeated_reading', 'phonics_practice', 'timed_reading'], message: 'Your reading fluency may be affected by difficulty decoding words. Improving phonics will help fluency too.' },
        { skill: 'PHONICS_DECODING', activities: ['vowel_patterns', 'multisyllabic_words', 'prefixes'], message: 'Practicing word patterns will improve your ability to read new words.' }
      ]
    }
  });

  console.log('âœ… Hana\'s assessment data created');

  // ============================================================
  // ABEL's data (Grade 5, needs significant support)
  // ============================================================
  const abelAssessment = await prisma.assessment.create({
    data: {
      studentId: studentAbel.student!.id,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 86400000 * 7),
      completedAt: new Date(Date.now() - 86400000 * 7),
      overallScore: 45,
      readinessScore: 45,
      targetGrade: "GRADE_6"
    }
  });

  await prisma.assessmentScore.createMany({
    data: [
      { assessmentId: abelAssessment.id, skillArea: "PHONEMIC_AWARENESS", score: 68 },
      { assessmentId: abelAssessment.id, skillArea: "PHONICS_DECODING", score: 41 },
      { assessmentId: abelAssessment.id, skillArea: "FLUENCY", score: 35, accuracy: 78.0, wordsPerMinute: 55, correctWordsPerMinute: 31, pauses: 14 },
      { assessmentId: abelAssessment.id, skillArea: "VOCABULARY", score: 38 },
      { assessmentId: abelAssessment.id, skillArea: "COMPREHENSION", score: 44 }
    ]
  });

  await prisma.readingProfile.create({
    data: {
      studentId: studentAbel.student!.id,
      assessmentId: abelAssessment.id,
      readinessScore: 45,
      currentGrade: "GRADE_5",
      targetGrade: "GRADE_6",
      phonemicAwarenessScore: 68,
      phonicsDecodingScore: 41,
      fluencyScore: 35,
      vocabularyScore: 38,
      comprehensionScore: 44,
      strengths: JSON.stringify([
        { skill: 'Phonemic Awareness', score: 68, message: 'This is your strongest area right now. Keep building on it!' }
      ],
      weaknesses: JSON.stringify([
        { skill: 'Reading Fluency', score: 35, message: 'Reading fluency needs focused practice.' },
        { skill: 'Vocabulary', score: 38, message: 'Building vocabulary will help you understand what you read much better.' },
        { skill: 'Phonics & Decoding', score: 41, message: 'Improving phonics will help with both reading speed and accuracy.' }
      ],
      priorities: JSON.stringify(['PHONICS_DECODING', 'FLUENCY', 'VOCABULARY', 'COMPREHENSION'],
      recommendations: JSON.stringify([
        { skill: 'PHONICS_DECODING', activities: ['letter_sounds', 'word_building', 'vowel_patterns'], message: 'Strong phonics skills are the foundation for everything else. Let\'s start here.' },
        { skill: 'FLUENCY', activities: ['repeated_reading', 'guided_reading'], message: 'As phonics improves, fluency will follow. Practice reading short passages daily.' }
      ]
    }
  });

  console.log('âœ… Abel\'s assessment data created');

  // ============================================================
  // DAWIT's data (Grade 6, high performer)
  // ============================================================
  const dawitAssessment = await prisma.assessment.create({
    data: {
      studentId: studentDawit.student!.id,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 86400000 * 21),
      completedAt: new Date(Date.now() - 86400000 * 21),
      overallScore: 84,
      readinessScore: 84,
      targetGrade: "GRADE_7"
    }
  });

  await prisma.assessmentScore.createMany({
    data: [
      { assessmentId: dawitAssessment.id, skillArea: "PHONEMIC_AWARENESS", score: 96 },
      { assessmentId: dawitAssessment.id, skillArea: "PHONICS_DECODING", score: 88 },
      { assessmentId: dawitAssessment.id, skillArea: "FLUENCY", score: 79, accuracy: 94.5, wordsPerMinute: 118, correctWordsPerMinute: 95, pauses: 2 },
      { assessmentId: dawitAssessment.id, skillArea: "VOCABULARY", score: 82 },
      { assessmentId: dawitAssessment.id, skillArea: "COMPREHENSION", score: 76 }
    ]
  });

  await prisma.readingProfile.create({
    data: {
      studentId: studentDawit.student!.id,
      assessmentId: dawitAssessment.id,
      readinessScore: 84,
      currentGrade: "GRADE_6",
      targetGrade: "GRADE_7",
      phonemicAwarenessScore: 96,
      phonicsDecodingScore: 88,
      fluencyScore: 79,
      vocabularyScore: 82,
      comprehensionScore: 76,
      strengths: JSON.stringify([
        { skill: 'Phonemic Awareness', score: 96, message: 'Excellent! You have very strong phonemic awareness.' },
        { skill: 'Phonics & Decoding', score: 88, message: 'You are great at sounding out and reading unfamiliar words.' },
        { skill: 'Vocabulary', score: 82, message: 'You know many words and understand their meanings well.' }
      ],
      weaknesses: JSON.stringify([
        { skill: 'Reading Comprehension', score: 76, message: 'You may need more comprehension strategy practice to deeply understand complex texts.' }
      ],
      priorities: JSON.stringify(['COMPREHENSION'],
      recommendations: JSON.stringify([
        { skill: 'COMPREHENSION', activities: ['main_idea', 'inference', 'evidence', 'summarization'], message: 'You have strong vocabulary, so the next step is deepening your comprehension strategies for complex texts.' }
      ]
    }
  });

  // Dawit's badges
  await prisma.studentBadge.createMany({
    data: [
      { studentId: studentDawit.student!.id, badgeType: "VOCABULARY_EXPLORER", earnedAt: new Date(Date.now() - 86400000 * 15) },
      { studentId: studentDawit.student!.id, badgeType: "STREAK_WARRIOR", earnedAt: new Date(Date.now() - 86400000 * 7) },
      { studentId: studentDawit.student!.id, badgeType: "PERFECT_SCORE", earnedAt: new Date(Date.now() - 86400000 * 5) },
      { studentId: studentDawit.student!.id, badgeType: "FLUENCY_STARTER", earnedAt: new Date(Date.now() - 86400000 * 20) }
    ]
  });

  console.log('âœ… Dawit\'s assessment data created');

  // ============================================================
  // SAMPLE CHAT MESSAGES FOR SARA
  // ============================================================
  await prisma.chatMessage.createMany({
    data: [
      {
        studentId: studentSara.student!.id,
        role: 'assistant',
        message: 'Hi Sara! ðŸ‘‹ I\'m Pathy, your reading coach. I\'ve looked at your reading profile and I know exactly where we should focus. Ready to make some great progress today?'
      },
      {
        studentId: studentSara.student!.id,
        role: 'user',
        message: 'I don\'t understand what "cultivate" means'
      },
      {
        studentId: studentSara.student!.id,
        role: 'assistant',
        message: 'Great question about "cultivate"! ðŸ“–\n\nInstead of just giving you the definition, let\'s figure it out together.\n\nHere\'s the sentence it was in: *"The farmers cultivated the new land, clearing trees and preparing the soil for planting."*\n\nðŸ’¡ What are the farmers doing in the sentence? What specific actions are described?\n\nTake a guess â€” there\'s no wrong answer!'
      },
      {
        studentId: studentSara.student!.id,
        role: 'user',
        message: 'They are clearing trees and planting things?'
      },
      {
        studentId: studentSara.student!.id,
        role: 'assistant',
        message: 'Exactly right! ðŸŽ‰ You got it!\n\n**Cultivate** means to prepare land for growing crops â€” which is exactly what you described: clearing and preparing for planting.\n\nAnd here\'s a bonus: "cultivate" can also mean to develop or improve something, like "cultivate a friendship" or "cultivate good habits."\n\nSee how you figured that out from context? That\'s a superpower skill! ðŸ’ª'
      }
    ]
  });

  console.log('âœ… Sample chat messages created');
  console.log('\nðŸŽ‰ Database seeded successfully!');
  console.log('\nðŸ“§ Test accounts:');
  console.log('Admin:   admin@readpath.com / password123');
  // Content admin account
  await prisma.user.create({
    data: {
      email: 'content@readpath.com', password, role: 'ADMIN',
      admin: { create: { firstName: 'Content', lastName: 'Manager' } }
    }
  });

  // Seed fluency recordings so teacher dashboard has data
  await prisma.fluencyRecording.createMany({
    data: [
      {
        studentId: studentSara.student!.id,
        teacherId: teacherUser.teacher!.id,
        passageTitle: 'The Market Day',
        durationSeconds: 62, wpm: 98, accuracy: 91, cwpm: 89,
        totalWords: 101, pauseCount: 4, hesitationCount: 2, score: 72,
        reviewed: true, teacherNote: 'Good pacing. Work on expression at punctuation.',
        teacherRating: 3, recordedAt: new Date(Date.now() - 86400000 * 5),
        reviewedAt: new Date(Date.now() - 86400000 * 4),
      },
      {
        studentId: studentHana.student!.id,
        teacherId: teacherUser.teacher!.id,
        passageTitle: 'The Great Rift Valley',
        durationSeconds: 85, wpm: 72, accuracy: 83, cwpm: 60,
        totalWords: 101, pauseCount: 9, hesitationCount: 5, score: 55,
        reviewed: false, recordedAt: new Date(Date.now() - 86400000 * 3),
      },
      {
        studentId: studentAbel.student!.id,
        teacherId: teacherUser.teacher!.id,
        passageTitle: 'The Ethiopian Highlands',
        durationSeconds: 110, wpm: 55, accuracy: 78, cwpm: 43,
        totalWords: 101, pauseCount: 14, hesitationCount: 8, score: 38,
        reviewed: false, recordedAt: new Date(Date.now() - 86400000 * 1),
      },
      {
        studentId: studentDawit.student!.id,
        teacherId: teacherUser.teacher!.id,
        passageTitle: 'The Market Day',
        durationSeconds: 51, wpm: 119, accuracy: 95, cwpm: 113,
        totalWords: 101, pauseCount: 1, hesitationCount: 1, score: 88,
        reviewed: false, recordedAt: new Date(),
      },
    ]
  });

  // Seed a content assignment
  await prisma.contentAssignment.create({
    data: { contentType: 'passage', contentId: passage1.id, grade: 'GRADE_6', assignedBy: 'Admin', note: 'Focus on main idea', status: 'active' }
  });

  console.log('âœ… Fluency recordings + content assignments seeded');
  console.log('Teacher: teacher@readpath.com / password123');
  console.log('Parent:  parent1@readpath.com / password123');
  console.log('Sara:    sara@readpath.com / password123');
  console.log('Hana:    hana@readpath.com / password123');
  console.log('Abel:    abel@readpath.com / password123');
  console.log('Dawit:   dawit@readpath.com / password123');
  console.log('Admin:   admin@readpath.com / password123');
  console.log('Content: content@readpath.com / password123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

