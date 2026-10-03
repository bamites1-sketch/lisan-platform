// ─── Lisan Enriched Bilingual Ethiopian Dictionary & Stories ─────────────────
// High-fidelity English to Amharic (አማርኛ) reading dictionary with phonetics,
// grammatical parts of speech, and bilingual sentence glossing.

export interface BilingualWord {
  word: string
  phonetic: string
  pos: 'noun' | 'verb' | 'adjective' | 'adverb' | 'conjunction'
  amharic: string           // Amharic script
  amharicPhonetic: string   // English phonetic pronunciation of the Amharic word
  definition: string        // Simple student-friendly English definition
  exampleEn: string         // Contextual English sentence
  exampleAm: string         // Contextual Amharic sentence
  culturalNote?: string     // Ethiopian context note
}

export const BILINGUAL_DICTIONARY: Record<string, BilingualWord> = {
  magnificent: {
    word: 'magnificent',
    phonetic: '/mæɡˈnɪf.ə.sənt/',
    pos: 'adjective',
    amharic: 'ድንቅ፣ ግሩም፣ እጅግ የሚያምር',
    amharicPhonetic: 'dink, girum, ijig yemiyamir',
    definition: 'Extremely beautiful, elaborate, or impressive.',
    exampleEn: 'The magnificent mountains of Simien were covered in morning mist.',
    exampleAm: 'ድንቁ የሰሜን ተራራ በማለዳ ጉም ተሸፍኖ ነበር።',
    culturalNote: 'Often used to describe Ethiopia’s UNESCO World Heritage landscapes.',
  },
  ancient: {
    word: 'ancient',
    phonetic: '/ˈeɪn.ʃənt/',
    pos: 'adjective',
    amharic: 'ጥንታዊ፣ የቀደመ፣ አንጋፋ',
    amharicPhonetic: 'tintawi, yekedeme',
    definition: 'Belonging to the very distant past; having existed for thousands of years.',
    exampleEn: 'Lalibela is famous for its ancient rock-hewn churches.',
    exampleAm: 'ላሊበላ በጥንታዊ የውቅር አብያተ ክርስቲያናቱ ይታወቃል።',
    culturalNote: 'Ethiopia has over 3,000 years of recorded ancient civilization.',
  },
  harvest: {
    word: 'harvest',
    phonetic: '/ˈhɑːr.vəst/',
    pos: 'noun',
    amharic: 'መከር፣ እህል መሰብሰብ',
    amharicPhonetic: 'meker, ihil mesebseb',
    definition: 'The process or season of gathering ripe agricultural crops from the fields.',
    exampleEn: 'Farmers celebrate with singing after a successful teff harvest.',
    exampleAm: 'ገበሬዎች የተሳካ የጤፍ መከር ከተሰበሰበ በኋላ በደስታ ይዘፍናሉ።',
    culturalNote: 'Teff harvesting in Ethiopia is a communal celebration known as Debo (ደቦ).',
  },
  journey: {
    word: 'journey',
    phonetic: '/ˈdʒɜːr.ni/',
    pos: 'noun',
    amharic: 'ጉዞ፣ መንገደኝነት',
    amharicPhonetic: 'guzo, mengedegnet',
    definition: 'The act of traveling from one place to another over a distance.',
    exampleEn: 'The camel caravan began its journey across the Danakil desert.',
    exampleAm: 'የግመል ተጓዦች በዳናኪል በረሃ ጉዟቸውን ጀመሩ።',
  },
  courage: {
    word: 'courage',
    phonetic: '/ˈkɜːr.ɪdʒ/',
    pos: 'noun',
    amharic: 'ድፍረት፣ ጀግንነት፣ ወኔ',
    amharicPhonetic: 'defret, jegninet, wone',
    definition: 'The strength of mind to face danger, difficulty, or pain without fear.',
    exampleEn: 'She showed great courage when speaking in front of the school.',
    exampleAm: 'በትምህርት ቤቱ ፊት ስትናገር ታላቅ ጀግንነት አሳየች።',
  },
  whisper: {
    word: 'whisper',
    phonetic: '/ˈwɪs.pər/',
    pos: 'verb',
    amharic: 'ሹክሹክታ፣ በዝግታ መናገር',
    amharicPhonetic: 'shukshukta, bezigta menager',
    definition: 'To speak very softly using breath rather than the vocal cords.',
    exampleEn: 'The evening wind seemed to whisper through the tall eucalyptus trees.',
    exampleAm: 'የምሽቱ ንፋስ በረጃጅሞቹ የባህር ዛፎች መሃል የሚሹከሹክ ይመስል ነበር።',
  },
  curiosity: {
    word: 'curiosity',
    phonetic: '/ˌkjʊr.iˈɑː.sə.ti/',
    pos: 'noun',
    amharic: 'የማወቅ ጉጉት፣ ማወቅ መሻት',
    amharicPhonetic: 'yemawek gugut, mawek meshat',
    definition: 'A strong urge or desire to learn, investigate, or know about things.',
    exampleEn: 'His curiosity about the night sky inspired him to read astronomy books.',
    exampleAm: 'ስለ ሰማዩ ከዋክብት ያለው የማወቅ ጉጉት መጽሐፍትን እንዲያነብ አነሳሳው።',
  },
  flourish: {
    word: 'flourish',
    phonetic: '/ˈflɜːr.ɪʃ/',
    pos: 'verb',
    amharic: 'ለምለም መሆን፣ መበልጸግ፣ ማበብ',
    amharicPhonetic: 'lemlem mehon, mebeltseg, mabeb',
    definition: 'To grow or develop in a healthy, vigorous, and prosperous way.',
    exampleEn: 'After the rainy season, the green valleys of Shewa begin to flourish.',
    exampleAm: 'ከክረምቱ ዝናብ በኋላ የሸዋ ለምለም ሸለቆዎች ያብባሉ።',
  },
  discover: {
    word: 'discover',
    phonetic: '/dɪˈskʌv.ər/',
    pos: 'verb',
    amharic: 'ማግኘት፣ ማወቅ፣ አዲስ ነገር መፍጠር',
    amharicPhonetic: 'magnet, mawek',
    definition: 'To find something unexpectedly or gain knowledge of something previously unknown.',
    exampleEn: 'Legend says a young goat herder named Kaldi discovered the coffee bean.',
    exampleAm: 'ካልዲ የተባለ ወጣት ፍየል ጠባቂ የቡና ፍሬን እንዳገኘ አፈ ታሪክ ይናገራል።',
  },
  protect: {
    word: 'protect',
    phonetic: '/prəˈtekt/',
    pos: 'verb',
    amharic: 'መጠበቅ፣ መከላከል፣ መንከባከብ',
    amharicPhonetic: 'metebek, mekelakel',
    definition: 'To keep someone or something safe from harm, injury, or loss.',
    exampleEn: 'Wildlife scouts protect the endangered Walia ibex in the national park.',
    exampleAm: 'የዱር እንስሳት ጠባቂዎች በብሔራዊ ፓርኩ ውስጥ ዋሊያ አይቤክስን ይጠብቃሉ።',
  },
  community: {
    word: 'community',
    phonetic: '/kəˈmjuː.nə.ti/',
    pos: 'noun',
    amharic: 'ማህበረሰብ፣ ህብረተሰብ',
    amharicPhonetic: 'mahbereseb, hibireteseb',
    definition: 'A group of people living together or sharing common values, history, and goals.',
    exampleEn: 'The entire community gathered at the village square to help build the school.',
    exampleAm: 'መላው ማህበረሰብ ትምህርት ቤቱን ለመገንባት በመንደሩ አደባባይ ተሰበሰበ።',
  },
  stream: {
    word: 'stream',
    phonetic: '/striːm/',
    pos: 'noun',
    amharic: 'ወራጅ ወንዝ፣ ጅረት',
    amharicPhonetic: 'weraj wenz, jiret',
    definition: 'A small, narrow river of continuous flowing freshwater.',
    exampleEn: 'Cold, clear water tumbled down the rocky mountain stream.',
    exampleAm: 'ቀዝቃዛና ንጹህ ውሃ በድንጋያማው የተራራ ጅረት ላይ ይፈስሳል።',
  },
  eager: {
    word: 'eager',
    phonetic: '/ˈiː.ɡər/',
    pos: 'adjective',
    amharic: 'የጓጓ፣ በጣም የሚፈልግ፣ ንቁ',
    amharicPhonetic: 'yeguaga, betam yemifelg, niku',
    definition: 'Having enthusiasm and a strong desire to do or experience something.',
    exampleEn: 'The young students were eager to recite their reading assignment.',
    exampleAm: 'ወጣቶቹ ተማሪዎች የንባብ መልመጃቸውን ለማቅረብ በጉጉት ተዘጋጅተው ነበር።',
  },
  patience: {
    word: 'patience',
    phonetic: '/ˈpeɪ.ʃəns/',
    pos: 'noun',
    amharic: 'ትዕግሥት፣ ፅናት',
    amharicPhonetic: "ti'igist, tsinat",
    definition: 'The capacity to endure delay, trouble, or hardship calmly without getting upset.',
    exampleEn: 'Mastering fluent English reading takes daily practice and great patience.',
    exampleAm: 'እንግሊዝኛን አቀላጥፎ ማንበብ የየዕለት ልምምድ እና ታላቅ ትዕግሥት ይጠይቃል።',
  },
  legend: {
    word: 'legend',
    phonetic: '/ˈledʒ.ənd/',
    pos: 'noun',
    amharic: 'አፈ ታሪክ፣ የጥንት ወግ',
    amharicPhonetic: 'afe tarik, yetint weg',
    definition: 'A traditional story sometimes regarded as historical but not authenticated.',
    exampleEn: 'According to legend, King Lalibela was guided by angels in his sleep.',
    exampleAm: 'እንደ አፈ ታሪኩ ከሆነ ንጉሥ ላሊበላ በሕልሙ በመላእክት ይመራ ነበር።',
  },
  wisdom: {
    word: 'wisdom',
    phonetic: '/ˈwɪz.dəm/',
    pos: 'noun',
    amharic: 'ጥበብ፣ ማስተዋል፣ እውቀት',
    amharicPhonetic: 'tibeb, mastewal, iwqet',
    definition: 'The quality of having experience, knowledge, and good judgment.',
    exampleEn: 'The village elders shared their wisdom under the giant sycamore tree.',
    exampleAm: 'የመንደሩ ሽማግሌዎች በትልቁ የዋርካ ዛፍ ሥር ጥበባቸውን አካፈሉ።',
    culturalNote: 'In Ethiopian tradition, elders gather under the Warka tree (ዋርካ) to pass on oral wisdom.',
  },
  generous: {
    word: 'generous',
    phonetic: '/ˈdʒen.ər.əs/',
    pos: 'adjective',
    amharic: 'ልበ ሰፊ፣ ለጋስ፣ ቸር',
    amharicPhonetic: 'libe sefi, legas, cher',
    definition: 'Showing readiness to give more of something than is strictly necessary.',
    exampleEn: 'Her grandmother was always generous, offering fresh injera to travelers.',
    exampleAm: 'አያቷ ምንጊዜም ለጋስ ነበረች፤ ለመንገደኞች ትኩስ እንጀራ ታቀርብ ነበር።',
  },
  bravery: {
    word: 'bravery',
    phonetic: '/ˈbreɪ.vər.i/',
    pos: 'noun',
    amharic: 'ጀግንነት፣ ቆራጥነት',
    amharicPhonetic: 'jegninet, koratnet',
    definition: 'Courageous behavior or character when facing adversary.',
    exampleEn: 'The runners demonstrated exceptional bravery enduring the high altitude race.',
    exampleAm: 'ሯጮቹ በከፍተኛ ቦታ በተደረገው ውድድር አስደናቂ ጀግንነት አሳይተዋል።',
  },
  endurance: {
    word: 'endurance',
    phonetic: '/ɪnˈdʊr.əns/',
    pos: 'noun',
    amharic: 'የመቋቋም አቅም፣ ጽናት',
    amharicPhonetic: 'yemequaquam akim, tsinat',
    definition: 'The ability to withstand an unpleasant or difficult process or situation.',
    exampleEn: 'Ethiopian marathon champions are world renowned for their endurance.',
    exampleAm: 'ኢትዮጵያውያን የማራቶን ሻምፒዮኖች በጽናታቸው በዓለም ይታወቃሉ።',
  },
  celebrate: {
    word: 'celebrate',
    phonetic: '/ˈsel.ə.breɪt/',
    pos: 'verb',
    amharic: 'ማክበር፣ ደስታን መግለጽ',
    amharicPhonetic: 'makber, destan meglets',
    definition: 'To acknowledge a significant happy day or event with a social gathering.',
    exampleEn: 'Families celebrate Enkutatash with yellow flowers and joyful songs.',
    exampleAm: 'ቤተሰቦች የእንቁጣጣሽ በዓልን በቢጫ አበባና በደስታ ዝማሬ ያከብራሉ።',
  },
  friendship: {
    word: 'friendship',
    phonetic: '/ˈfrend.ʃɪp/',
    pos: 'noun',
    amharic: 'ጓደኝነት፣ ወዳጅነት',
    amharicPhonetic: 'guadegnet, wedajnet',
    definition: 'The emotions or conduct of friends; the state of being friends.',
    exampleEn: 'True friendship is built on honesty and mutual respect.',
    exampleAm: 'እውነተኛ ጓደኝነት በታማኝነትና በጋራ መከባበር ላይ የተገነባ ነው።',
  },
  adventure: {
    word: 'adventure',
    phonetic: '/ədˈven.tʃər/',
    pos: 'noun',
    amharic: 'ጀብዱ፣ አደገኛና አስደሳች ጉዞ',
    amharicPhonetic: 'jebdu, guzo',
    definition: 'An unusual, exciting, and typically hazardous experience or activity.',
    exampleEn: 'Exploring the caves of Sof Omar was an unforgettable adventure.',
    exampleAm: 'የሶፍ ዑመርን ዋሻዎች መጎብኘት የማይረሳ ጀብዱ ነበር።',
  },
  harmony: {
    word: 'harmony',
    phonetic: '/ˈhɑːr.mə.ni/',
    pos: 'noun',
    amharic: 'ስምምነት፣ ህብረት፣ ሰላም',
    amharicPhonetic: 'simimnet, hibret, selam',
    definition: 'Agreement or concord; peaceful coexistence without conflict.',
    exampleEn: 'The villagers lived in complete harmony, supporting one another.',
    exampleAm: 'የመንደሩ ነዋሪዎች እርስ በርሳቸው እየተደጋገፉ በፍጹም ሰላምና ስምምነት ይኖሩ ነበር።',
  },
  heritage: {
    word: 'heritage',
    phonetic: '/ˈher.ɪ.tɪdʒ/',
    pos: 'noun',
    amharic: 'ቅርስ፣ ባህላዊ ውርስ',
    amharicPhonetic: 'kirs, bahilawi wirs',
    definition: 'Property, cultural traditions, and historical sites inherited from the past.',
    exampleEn: 'Ethiopia takes great pride in preserving its rich historical heritage.',
    exampleAm: 'ኢትዮጵያ የበለጸገውን ታሪካዊ ቅርሷን በመጠበቅ ታላቅ ኩራት ይሰማታል።',
  },
}

// ─── Pre-translated Bilingual Ethiopian Stories ──────────────────────────────
export interface BilingualStorySentence {
  en: string
  am: string
}

export interface BilingualStory {
  id: string
  titleEn: string
  titleAm: string
  gradeLevel: string
  difficulty: 'Easy' | 'Medium' | 'Advanced'
  wordCount: number
  readTimeMin: number
  category: 'Folktale' | 'History' | 'Nature' | 'Science'
  summaryEn: string
  summaryAm: string
  sentences: BilingualStorySentence[]
  keyVocabulary: string[]
}

export const BILINGUAL_STORIES: BilingualStory[] = [
  {
    id: 'story-coffee-kaldi',
    titleEn: 'Kaldi and the Magic Coffee Beans',
    titleAm: 'ካልዲ እና የቡናው ተአምር',
    gradeLevel: 'Grade 3-5',
    difficulty: 'Easy',
    wordCount: 125,
    readTimeMin: 2,
    category: 'Folktale',
    summaryEn: 'Discover the ancient legend of Kaldi, the Ethiopian goat herder who found the world’s first coffee plant in the lush hills of Kaffa.',
    summaryAm: 'በከፋ ለምለም ኮረብቶች ላይ የመጀመሪያውን የቡና ፍሬ ያገኘውን የኢትዮጵያዊውን ወጣት ፍየል ጠባቂ የካልዲን ታሪክ ይማሩ።',
    keyVocabulary: ['discover', 'harvest', 'eager', 'whisper', 'legend'],
    sentences: [
      {
        en: 'Long ago in the green highlands of Kaffa, a young goat herder named Kaldi took his goats to pasture.',
        am: 'ከብዙ ዘመናት በፊት በከፋ አረንጓዴ ደጋማ ቦታዎች፣ ካልዲ የተባለ ወጣት ፍየል ጠባቂ ፍየሎቹን ለማሰማራት ወጣ።',
      },
      {
        en: 'One afternoon, Kaldi noticed something strange about his herd.',
        am: 'አንድ ቀን ከሰዓት በኋላ፣ ካልዲ በመንጋው ላይ ያልተለመደ ነገር አስተዋለ።',
      },
      {
        en: 'The goats were jumping and dancing with incredible energy after chewing bright red berries from a wild bush.',
        am: 'ፍየሎቹ ከዱር ቁጥቋጦ ላይ ደማቅ ቀይ ፍሬዎችን ካኘኩ በኋላ በማይታመን ጉልበት ይዘሉና ይጨፍሩ ነበር።',
      },
      {
        en: 'Driven by curiosity, Kaldi plucked a few sweet berries and tasted them himself.',
        am: 'በማወቅ ጉጉት ተነሳስቶ፣ ካልዲ ጥቂት ጣፋጭ ፍሬዎችን ለቅሞ ራሱ ቀመሳቸው።',
      },
      {
        en: 'Immediately, his fatigue vanished, and he felt alert, joyful, and full of courage.',
        am: 'ወዲያውኑ ድካሙ ጠፋ፤ ንቁ፣ ደስተኛ እና በብርታት የተሞላ ሆነ።',
      },
      {
        en: 'He gathered a basket of berries and brought them to the village monastery.',
        am: 'አንድ ቅርጫት ፍሬዎችን ሰብስቦ ወደ መንደሩ ገዳም ይዞ ሄደ።',
      },
      {
        en: 'The wise monks boiled the beans into a dark, fragrant brew that kept them awake for evening prayers.',
        am: 'ብልሆቹ መነኮሳት ፍሬዎቹን አፍልተው ለምሽት ጸሎት ንቁ ሆነው እንዲቆዩ የሚያስችላቸውን ጥቁርና ጥሩ መዓዛ ያለው መጠጥ አዘጋጁ።',
      },
      {
        en: 'Today, the gift of Ethiopian coffee is celebrated by millions of people across the entire world.',
        am: 'ዛሬ የኢትዮጵያ ቡና ስጦታ በዓለም ዙሪያ በሚሊዮኖች በሚቆጠሩ ሰዎች ዘንድ ይከበራል።',
      },
    ],
  },
  {
    id: 'story-walia-ibex',
    titleEn: 'The King of the Simien Peaks',
    titleAm: 'የሰሜን ተራሮች ንጉሥ',
    gradeLevel: 'Grade 4-6',
    difficulty: 'Medium',
    wordCount: 148,
    readTimeMin: 2,
    category: 'Nature',
    summaryEn: 'Ascend the rugged cliffs of the Simien Mountains to follow the magnificent Walia ibex, found nowhere else on earth.',
    summaryAm: 'በዓለም ላይ በየትኛውም ቦታ የማይገኘውን ግሩሙን ዋሊያ አይቤክስን ለመመልከት ወደ ሰሜን ተራሮች ቋጥኞች እንጓዝ።',
    keyVocabulary: ['magnificent', 'protect', 'courage', 'endurance', 'heritage'],
    sentences: [
      {
        en: 'High above the clouds, the Simien Mountains rise like giant stone fortresses carved by nature.',
        am: 'ከደመናዎች በላይ፣ የሰሜን ተራሮች በተፈጥሮ እንደተቀረጹ ግዙፍ የድንጋይ ምሽጎች ሆነው ይታያሉ።',
      },
      {
        en: 'These precipitous cliffs are the exclusive home of the magnificent Walia ibex.',
        am: 'እነዚህ ገደላማ ቋጥኞች የድንቁ ዋሊያ አይቤክስ ብቸኛ መኖሪያ ናቸው።',
      },
      {
        en: 'With curved horns sweeping backward like crowns, the males balance effortlessly on sheer rock edges.',
        am: 'እንደ አክሊል ወደ ኋላ የተጣመሙ ቀንዶቻቸውን ይዘው፣ ወንዶቹ ዋሊያዎች በአቀበት ድንጋዮች ላይ በቀላሉ ይራመዳሉ።',
      },
      {
        en: 'Young kids leap between narrow ledges, learning the supreme balance and courage required to survive.',
        am: 'ትናንሽ ግልገሎች በጠባብ ቋጥኞች መካከል እየዘለሉ፣ ለመትረፍ የሚያስፈልገውን ሚዛንና ድፍረት ይማራሉ።',
      },
      {
        en: 'Dedicated park rangers walk for hours across mountain ridges to protect this precious Ethiopian treasure from poachers.',
        am: 'ታማኝ የፓርክ ጠባቂዎች ይህንን ውድ የኢትዮጵያ ቅርስ ከአዳኞች ለመጠበቅ በተራራ ጫፎች ላይ ለሰዓታት ይራመዳሉ።',
      },
      {
        en: 'Through tireless conservation, the Walia population continues to flourish and inspire future generations.',
        am: 'በማያቋርጥ ጥበቃ ምክንያት፣ የዋሊያ ቁጥር እየበዛ በመምጣት ለቀጣዩ ትውልድ አርአያ መሆኑን ቀጥሏል።',
      },
    ],
  },
  {
    id: 'story-lalibela-wonder',
    titleEn: 'The Secret Churches of Lalibela',
    titleAm: 'የላሊበላ ድንቅ ውቅር አብያተ ክርስቲያናት',
    gradeLevel: 'Grade 5-8',
    difficulty: 'Advanced',
    wordCount: 165,
    readTimeMin: 3,
    category: 'History',
    summaryEn: 'Explore the eleven monolithic churches chiseled straight down into volcanic rock over eight hundred years ago.',
    summaryAm: 'ከስምንት መቶ ዓመታት በፊት በቀጥታ ከቀይ ድንጋይ ተፈልፍለው የተሰሩትን አስራ አንዱን የላሊበላ አብያተ ክርስቲያናት ሚስጥር ይመርምሩ።',
    keyVocabulary: ['ancient', 'wisdom', 'patience', 'heritage', 'flourish'],
    sentences: [
      {
        en: 'In the rugged mountains of Lasta stands one of the greatest architectural wonders on Earth.',
        am: 'በላስታ ወጣ ገባ ተራሮች ውስጥ በምድር ላይ ካሉ ታላላቅ የስነ-ህንፃ ድንቆች አንዱ ይገኛል።',
      },
      {
        en: 'Rather than building upward toward the sky, ancient stonemasons chiseled eleven magnificent churches straight down into solid red volcanic rock.',
        am: 'ጥንታውያን ግንበኞች ወደ ሰማይ ከመገንባት ይልቅ፣ አስራ አንድ ድንቅ አብያተ ክርስቲያናትን በቀጥታ ከቀይ ድንጋይ ወደ ታች ፈልፍለው ሰሩ።',
      },
      {
        en: 'The most renowned of these is Bet Giyorgis, meticulously carved in the perfect shape of a Greek cross.',
        am: 'ከእነዚህ ውስጥ በጣም ታዋቂው የቅዱስ ጊዮርጊስ ቤተ ክርስቲያን ሲሆን፣ በትክክለኛ የመስቀል ቅርጽ በጥንቃቄ የተቀረጸ ነው።',
      },
      {
        en: 'Deep underground trenches and secret tunnels connect each sanctuary in an astonishing maze.',
        am: 'ጥልቅ የምድር ውስጥ ቦዮችና ሚስጥራዊ ዋሻዎች እያንዳንዱን መቅደስ በሚያስደንቅ ሁኔታ ያገናኛሉ።',
      },
      {
        en: 'Historians still marvel at the architectural wisdom, engineering patience, and spiritual devotion required to finish the work.',
        am: 'ታሪክ ጸሐፊዎች ሥራውን ለማጠናቀቅ በፈጀው የስነ-ህንፃ ጥበብ፣ የምህንድስና ትዕግሥት እና መንፈሳዊ ተነሳሽነት አሁንም ይደነቃሉ።',
      },
      {
        en: 'Today, Lalibela remains an active sanctuary of living faith, cultural heritage, and universal wonder.',
        am: 'ዛሬም ላሊበላ የሕያው እምነት፣ የባህል ቅርስ እና የዓለም ድንቅ መቅደስ ሆኖ ጸንቷል።',
      },
    ],
  },
]

// ─── Fast Word Lookup with Punctuation & Suffix Normalization ────────────────
export function lookupBilingualWord(rawWord: string): BilingualWord | null {
  if (!rawWord) return null
  const clean = rawWord.toLowerCase().replace(/[^a-z]/g, '')
  if (!clean) return null

  // Direct match
  if (BILINGUAL_DICTIONARY[clean]) {
    return BILINGUAL_DICTIONARY[clean]
  }

  // Remove common suffixes (ing, ed, s, es, ly, tion)
  const suffixes = ['ing', 'ed', 'es', 's', 'ly']
  for (const s of suffixes) {
    if (clean.endsWith(s) && clean.length > s.length + 3) {
      const stem = clean.slice(0, -s.length)
      if (BILINGUAL_DICTIONARY[stem]) return BILINGUAL_DICTIONARY[stem]
      // check if dropping final e happened (e.g. dancing -> dance)
      if (BILINGUAL_DICTIONARY[stem + 'e']) return BILINGUAL_DICTIONARY[stem + 'e']
    }
  }

  return null
}
