export type Article = {
  id: string;
  category: string;
  title: string;
  intro: string;
  paragraphs: string[];
  source: string;
  sourceTitle: string;
  stages: string[];
};
export const articles: Article[] = [
  {
    id: 'cycle',
    category: 'MENSTRUAL HEALTH',
    title: 'Understanding your cycle',
    intro: 'Your pattern is more useful than a perfect 28-day calendar.',
    paragraphs: [
      'Count a cycle from the first day of one period to the first day of the next. Recording bleeding, pain and how symptoms affect your day can help a clinician understand your experience.',
      'Bleeding between periods or after sex, heavy bleeding, or a persistent change in your pattern deserves a medical discussion. This app records your history; it does not diagnose the cause or predict safe days for contraception.',
    ],
    source: 'https://www.acog.org/womens-health/faqs/abnormal-uterine-bleeding',
    sourceTitle: 'ACOG · Abnormal uterine bleeding',
    stages: ['cycle', 'preconception', 'none'],
  },
  {
    id: 'visit',
    category: 'YOUR CARE',
    title: 'Make room for your questions',
    intro: 'You do not have to remember everything at your appointment.',
    paragraphs: [
      'Before a visit, note what has changed, when it started and how it affects everyday life. Bring your current medicines, supplements and any previous results.',
      'Ask what the next step is, when you should return, and who to contact between appointments. Save the instructions your clinician gives you in your care notes.',
    ],
    source: 'https://www.who.int/publications/i/item/9789241549912',
    sourceTitle: 'WHO · Antenatal care',
    stages: [
      'none',
      'pregnancy',
      'cycle',
      'preconception',
      'postpartum',
      'recovery',
    ],
  },
  {
    id: 'postpartum',
    category: 'POSTPARTUM',
    title: 'Your recovery matters, too',
    intro: 'Care continues after birth, and your needs deserve attention.',
    paragraphs: [
      'Ask your care team about follow-up for your recovery, feeding support and emotional wellbeing. Recovery is individual; a calendar date does not mean you must feel fully recovered.',
      'WHO recommends additional postnatal contacts at 48–72 hours, 7–14 days and six weeks for healthy women and newborns. Your clinician may arrange more frequent care. App check-ins do not replace these contacts.',
    ],
    source:
      'https://www.who.int/news/item/30-03-2022-who-urges-quality-care-for-women-and-newborns-in-critical-first-weeks-after-childbirth',
    sourceTitle: 'WHO · Care after childbirth',
    stages: ['postpartum', 'pregnancy'],
  },
  {
    id: 'prepare',
    category: 'PRECONCEPTION',
    title: 'Start with a conversation',
    intro: 'Preparing for pregnancy is about your health, not just dates.',
    paragraphs: [
      'Discuss existing conditions, previous pregnancy experiences, medicines and herbal preparations with a qualified clinician. Do not stop a prescribed medicine on your own.',
      'Ask about nutrition, vaccinations and folic acid before pregnancy. If you are trying to conceive, cycle estimates cannot confirm ovulation or guarantee conception.',
    ],
    source:
      'https://www.asrm.org/practice-guidance/practice-committee-documents/prepregnancy-counseling-2019/',
    sourceTitle: 'ACOG / ASRM · Prepregnancy counselling',
    stages: ['preconception', 'cycle'],
  },
  {
    id: 'movement',
    category: 'PREGNANCY',
    title: 'Know your baby’s usual movements',
    intro: 'A change in your baby’s movement deserves prompt attention.',
    paragraphs: [
      'If your baby is moving less than usual, has stopped moving, or their usual pattern has changed, contact your maternity unit immediately. Do not wait until tomorrow.',
      'There is no single number of movements that is normal for every baby. A home Doppler or an app cannot confirm that your baby is well.',
    ],
    source: 'https://www.nhs.uk/pregnancy/keeping-well/your-babys-movements/',
    sourceTitle: 'NHS · Your baby’s movements',
    stages: ['pregnancy'],
  },
  {
    id: 'birth',
    category: 'BIRTH PREPARATION',
    title: 'Plan the journey to care',
    intro: 'A contact, a destination and a way to get there.',
    paragraphs: [
      'Discuss when to come in with your maternity team. Keep the facility contact, a backup destination and transport arrangements accessible. Your personal circumstances matter.',
      'Contact maternity services immediately for waters breaking, vaginal bleeding, reduced movements, or possible labour before 37 weeks. A contraction timer should not decide whether it is safe to stay home.',
    ],
    source:
      'https://www.nhs.uk/pregnancy/labour-and-birth/signs-that-labour-has-begun/',
    sourceTitle: 'NHS · Signs of labour',
    stages: ['pregnancy'],
  },
  {
    id: 'contraception',
    category: 'REPRODUCTIVE HEALTH',
    title: 'Fertility can return before periods',
    intro: 'Breastfeeding alone does not guarantee protection from pregnancy.',
    paragraphs: [
      'You can become pregnant before your periods return, including while breastfeeding. Discuss contraception that fits your health and preferences with your clinician.',
      'Do not use the absence of periods, or the dates in this app, to decide you cannot become pregnant.',
    ],
    source:
      'https://www.nhs.uk/baby/support-and-services/sex-and-contraception-after-birth/',
    sourceTitle: 'NHS · Contraception after birth',
    stages: ['postpartum', 'cycle'],
  },
  {
    id: 'wellbeing',
    category: 'EMOTIONAL WELLBEING',
    title: 'You deserve support',
    intro: 'Struggling is a reason to ask for help, not a failure.',
    paragraphs: [
      'If low mood, anxiety or feeling unable to cope persists or worsens, speak with a healthcare professional. You do not need to wait for an app score or a scheduled visit.',
      'If you feel at risk of harming yourself or your baby, seek immediate help from emergency care and a trusted person who can stay with you.',
    ],
    source: 'https://www.nhs.uk/mental-health/conditions/postnatal-depression/',
    sourceTitle: 'NHS · Postnatal depression',
    stages: ['postpartum', 'pregnancy', 'recovery'],
  },
  {
    id: 'loss',
    category: 'RECOVERY & SUPPORT',
    title: 'Space for your own pace',
    intro: 'You can pause the pregnancy journey without losing your history.',
    paragraphs: [
      'If your pregnancy has ended or you need a pause, choose Recovery & a pause in My journey. Pregnancy countdowns and baby-development prompts will stop.',
      'A qualified clinician can help with physical recovery and follow-up. Ask for emotional or bereavement support if you would find it helpful. For severe symptoms, use urgent care rather than waiting for a routine visit.',
    ],
    source: 'https://www.nhs.uk/conditions/miscarriage/afterwards/',
    sourceTitle: 'NHS · After a miscarriage',
    stages: ['recovery'],
  },
  {
    id: 'newborn',
    category: 'EARLY MOTHERHOOD',
    title: 'Recognizing newborn warning signs',
    intro: 'A baby who seems unwell needs professional assessment.',
    paragraphs: [
      'Seek prompt medical care for poor feeding, reduced activity, difficult breathing, abnormal temperature or convulsions. Do not wait for the next vaccination appointment.',
      'Keep the baby’s healthcare contact and vaccination card available. Your baby’s clinician should confirm the applicable Nigerian schedule.',
    ],
    source:
      'https://www.who.int/europe/news-room/fact-sheets/item/newborn-health',
    sourceTitle: 'WHO · Newborn health',
    stages: ['postpartum'],
  },
];
export const starterTasks: Record<string, string[]> = {
  none: ['Choose my current journey', 'Save my healthcare contact'],
  cycle: [
    'Note changes to discuss with my clinician',
    'Bring my cycle history to my next visit',
  ],
  preconception: [
    'Discuss medicines and supplements',
    'Ask about preconception care',
    'Discuss folic acid with my clinician',
  ],
  pregnancy: [
    'Save my maternity unit contact',
    'Prepare questions for my next visit',
    'Discuss my birth and transport plan',
    'Ask about care after birth',
  ],
  postpartum: [
    'Confirm my follow-up appointment',
    'Ask for feeding support if needed',
    'Discuss contraception options',
    'Arrange practical help and rest',
  ],
  recovery: [
    'Confirm any follow-up instructions',
    'Identify someone I can talk to',
    'Write down questions for my clinician',
  ],
};
