import {
  ATSAnalysis,
  InterviewFeedback,
  InterviewQuestion,
  QuizQuestion,
  QuizData,
  CodingProblem,
  ProjectData,
  RoadmapData,
} from '@/types'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1'
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4'
const OPENROUTER_TIMEOUT_MS = Number(process.env.OPENROUTER_TIMEOUT_MS || 15000)
const OPENROUTER_EVAL_TIMEOUT_MS = Number(process.env.OPENROUTER_EVAL_TIMEOUT_MS || 7000)
const OPENROUTER_PROJECTS_TIMEOUT_MS = Number(process.env.OPENROUTER_PROJECTS_TIMEOUT_MS || 5000)

type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function callOpenRouter(
  messages: ChatMessage[],
  maxTokens: number = 2000,
  temperature: number = 0.7,
  timeoutOverrideMs?: number
) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  const controller = new AbortController()
  const resolvedTimeout = timeoutOverrideMs ?? OPENROUTER_TIMEOUT_MS
  const timeoutMs = Number.isFinite(resolvedTimeout) && resolvedTimeout > 0
    ? resolvedTimeout
    : 15000
  const timeoutId = setTimeout(() => controller.abort('OpenRouter request timeout'), timeoutMs)

  const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'CourseCook',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeoutId)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${error}`)
  }

  return response.json()
}

function extractJson<T>(content: string): T {
  const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/)

  if (!jsonMatch) {
    throw new Error('Invalid response format')
  }

  return JSON.parse(jsonMatch[0]) as T
}

export async function generateRoadmap(
  topic: string,
  skillLevel: string,
  targetCompany?: string,
  timeline?: string,
  dailyHours?: number
): Promise<RoadmapData> {
  const prompt = `
Generate a comprehensive learning roadmap for "${topic}" at ${skillLevel} level.
${targetCompany ? `Target company: ${targetCompany}` : ''}
${timeline ? `Timeline: ${timeline}` : ''}
${dailyHours ? `Daily study hours: ${dailyHours}` : ''}

Structure the roadmap in phases from beginner to advanced. Each phase should have:
- Phase name
- Duration estimate
- Subtopics with name, status (all should be "pending"), estimated resources count, and estimated problems count

For DSA, include: Arrays, Strings, Linked Lists, Stacks, Queues, Trees, Graphs, Dynamic Programming, Greedy, Backtracking, Heaps, Tries, and interview patterns.
For Web Development, include: HTML/CSS, JavaScript, React, Node.js, Databases, Deployment, etc.

Return ONLY valid JSON in this exact format:
{
  "topic": "string",
  "phases": [
    {
      "name": "Phase 1: ...",
      "duration": "X weeks",
      "subtopics": [
        {"name": "topic", "status": "pending", "resources": 5, "problems": 20}
      ]
    }
  ]
}
`

  try {
    const response = await callOpenRouter([
      {
        role: 'system',
        content: 'You are an expert educational curriculum designer. Generate structured learning roadmaps.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], 2000, 0.7)

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('No response from AI')

    // Extract JSON from response
    return extractJson<RoadmapData>(content)
  } catch (error) {
    console.error('Error generating roadmap:', error)
    throw error
  }
}

export async function generateQuiz(
  topic: string,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD',
  questionCount: number = 10,
  weakAreas?: string[]
): Promise<QuizData> {
  const prompt = `
Generate a ${difficulty} level quiz on "${topic}" with ${questionCount} multiple-choice questions.
${weakAreas && weakAreas.length > 0 ? `Focus on these weak areas: ${weakAreas.join(', ')}` : ''}

Each question should have:
- Clear question text
- 4 options (A, B, C, D)
- Correct answer index (0-3)
- Detailed explanation
- Difficulty level

Return ONLY valid JSON in this exact format:
{
  "title": "Quiz on ${topic}",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": "q1",
      "question": "What is...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation...",
      "difficulty": "${difficulty}"
    }
  ]
}
`

  try {
    const response = await callOpenRouter([
      {
        role: 'system',
        content: 'You are an expert quiz creator. Generate high-quality educational quizzes.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], 3000, 0.8)

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('No response from AI')

    return extractJson<QuizData>(content)
  } catch (error) {
    console.error('Error generating quiz:', error)
    throw error
  }
}

export async function evaluateInterviewResponse(
  question: string,
  response: string,
  topic: string
): Promise<InterviewFeedback> {
  const prompt = `
Evaluate this interview response for a ${topic} position.

Question: "${question}"
Candidate's Response: "${response}"

Provide feedback on:
1. Technical accuracy (0-100)
2. Communication clarity (0-100)
3. Confidence level (0-100)
4. Structure and organization (0-100)
5. Overall score (0-100)
6. Strengths (list 2-3)
7. Weaknesses (list 2-3)
8. Specific improvement suggestions (list 3-5)

Return ONLY valid JSON in this exact format:
{
  "technicalScore": 85,
  "communicationScore": 80,
  "confidenceScore": 75,
  "clarityScore": 82,
  "strengths": ["Good understanding of...", "Clear explanation of..."],
  "weaknesses": ["Missing details about...", "Could improve..."],
  "improvements": ["Study...", "Practice...", "Learn about..."],
  "overallScore": 80
}
`

  try {
    const evaluationTimeoutMs = Number.isFinite(OPENROUTER_EVAL_TIMEOUT_MS) && OPENROUTER_EVAL_TIMEOUT_MS > 0
      ? OPENROUTER_EVAL_TIMEOUT_MS
      : 7000

    const response = await callOpenRouter([
      {
        role: 'system',
        content: 'You are an expert technical interviewer. Provide constructive feedback on interview responses.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], 1500, 0.7, evaluationTimeoutMs)

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('No response from AI')

    return extractJson<InterviewFeedback>(content)
  } catch (error) {
    console.error('Error evaluating interview:', error)
    throw error
  }
}

export async function analyzeResumeATS(
  resumeContent: string,
  targetRole: string,
  jobDescription?: string
): Promise<ATSAnalysis> {
  const prompt = `
Analyze this resume for ATS (Applicant Tracking System) compatibility.

Target Role: ${targetRole}
${jobDescription ? `Job Description: ${jobDescription}` : ''}

Resume Content:
${resumeContent}

Provide:
1. ATS Score (0-100)
2. Recruiter Readability Score (0-100)
3. Matched keywords
4. Missing keywords for the role
5. Readability score (0-100)
6. Role alignment score (0-100)
7. Specific recommendations (at least 5) with type, priority, description, and suggestion

Return ONLY valid JSON in this exact format:
{
  "atsScore": 75,
  "recruiterScore": 80,
  "keywordMatches": ["JavaScript", "React", "Node.js"],
  "missingKeywords": ["TypeScript", "AWS", "Docker"],
  "readabilityScore": 85,
  "roleAlignment": 70,
  "recommendations": [
    {
      "type": "keyword",
      "priority": "high",
      "description": "Missing key skill",
      "suggestion": "Add TypeScript to skills section"
    }
  ]
}
`

  try {
    const response = await callOpenRouter([
      {
        role: 'system',
        content: 'You are an expert ATS optimizer and resume consultant. Provide detailed resume analysis.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], 2000, 0.7)

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('No response from AI')

    return extractJson<ATSAnalysis>(content)
  } catch (error) {
    console.error('Error analyzing resume:', error)
    throw error
  }
}

export async function generateMentorResponse(
  userMessage: string,
  userContext?: {
    roadmap?: Record<string, unknown>
    weakAreas?: string[]
    progress?: Record<string, unknown>
    targetRole?: string
  }
): Promise<string> {
  const contextInfo = userContext
    ? `
User Context:
- Target Role: ${userContext.targetRole || 'Not specified'}
- Weak Areas: ${userContext.weakAreas?.join(', ') || 'None identified'}
- Current Progress: ${userContext.progress ? JSON.stringify(userContext.progress) : 'Not available'}
`
    : ''

  const prompt = `
You are CourseCook AI Mentor, a personalized preparation coach helping users learn, practice, and become job-ready.

Your responsibilities:
1. Explain concepts clearly and concisely
2. Recommend learning resources and next steps
3. Motivate and encourage users
4. Identify knowledge gaps and suggest improvements
5. Provide study strategies and tips
${contextInfo}

User Question: "${userMessage}"

Provide a helpful, encouraging, and informative response. Be specific and actionable. If asking about a technical concept, explain it clearly with examples. If asking about next steps, consider their current progress and goals.
`

  try {
    const response = await callOpenRouter([
      {
        role: 'system',
        content: 'You are an expert AI mentor for an edtech platform. Be encouraging, knowledgeable, and practical.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], 1000, 0.8)

    return response.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.'
  } catch (error) {
    console.error('Error generating mentor response:', error)
    return 'I apologize, but I encountered an error. Please try again later.'
  }
}

export async function generateTopicSummary(
  topic: string,
  content: string
): Promise<string> {
  const prompt = `
Create a concise summary of this ${topic} content for quick revision.

Content:
${content}

Provide:
1. Key concepts (bullet points)
2. Important formulas/patterns (if applicable)
3. Common tricks and tips
4. Interview-relevant points
5. Quick revision checklist

Make it concise, clear, and easy to review before interviews.
`

  try {
    const response = await callOpenRouter([
      {
        role: 'system',
        content: 'You are an expert at creating concise educational summaries for quick revision.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], 1500, 0.7)

    return response.choices[0]?.message?.content || 'Summary generation failed.'
  } catch (error) {
    console.error('Error generating summary:', error)
    return 'Summary generation failed. Please try again.'
  }
}

const fallbackQuizBank: Record<string, QuizQuestion[]> = {
  dsa: [
    {
      id: 'dsa-1',
      question: 'What is the average time complexity of searching in a balanced binary search tree?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correctAnswer: 1,
      explanation: 'Balanced BST operations usually take logarithmic time because tree height stays around log n.',
      difficulty: 'EASY',
    },
    {
      id: 'dsa-2',
      question: 'Which technique is most commonly used to detect cycles in a linked list with O(1) extra space?',
      options: ['Binary search', 'Hashing', 'Two pointers', 'Recursion'],
      correctAnswer: 2,
      explanation: 'Floyd’s tortoise and hare algorithm uses two pointers and constant extra space.',
      difficulty: 'MEDIUM',
    },
    {
      id: 'dsa-3',
      question: 'Which condition usually suggests a dynamic programming solution?',
      options: ['Sorted input', 'Overlapping subproblems', 'Need for hashing', 'Constant memory'],
      correctAnswer: 1,
      explanation: 'DP is a strong fit when subproblems overlap and optimal substructure exists.',
      difficulty: 'MEDIUM',
    },
  ],
  webdev: [
    {
      id: 'web-1',
      question: 'Which React hook is used for side effects like data fetching?',
      options: ['useMemo', 'useEffect', 'useRef', 'useContext'],
      correctAnswer: 1,
      explanation: 'useEffect is designed for side effects that synchronize with external systems.',
      difficulty: 'EASY',
    },
    {
      id: 'web-2',
      question: 'What does HTTP status code 201 usually mean?',
      options: ['Success with no content', 'Resource created', 'Redirect', 'Unauthorized'],
      correctAnswer: 1,
      explanation: '201 Created indicates a new resource was successfully created.',
      difficulty: 'EASY',
    },
    {
      id: 'web-3',
      question: 'Which database index primarily improves lookup speed at the cost of write overhead?',
      options: ['Foreign key', 'Primary key', 'Secondary index', 'Constraint'],
      correctAnswer: 2,
      explanation: 'Secondary indexes speed reads but add maintenance cost on writes.',
      difficulty: 'MEDIUM',
    },
  ],
  react: [
    {
      id: 'react-1',
      question: 'What problem does a key solve in a rendered React list?',
      options: ['Styling elements', 'Managing state globally', 'Helping React identify list items', 'Preventing fetch calls'],
      correctAnswer: 2,
      explanation: 'Keys help React match list items across renders for correct reconciliation.',
      difficulty: 'EASY',
    },
    {
      id: 'react-2',
      question: 'When should you generally use startTransition?',
      options: ['For urgent input updates', 'For non-urgent UI updates', 'For server-only rendering', 'For CSS animations'],
      correctAnswer: 1,
      explanation: 'startTransition marks state updates as non-urgent to keep the UI responsive.',
      difficulty: 'MEDIUM',
    },
  ],
  default: [
    {
      id: 'general-1',
      question: 'What makes practice effective for interview preparation?',
      options: ['Only reading theory', 'Random guessing', 'Consistent feedback and review', 'Skipping weak areas'],
      correctAnswer: 2,
      explanation: 'Practice improves most when paired with feedback, review, and targeted iteration.',
      difficulty: 'EASY',
    },
    {
      id: 'general-2',
      question: 'Which study plan is usually most sustainable?',
      options: ['Huge one-time sessions', 'Consistent smaller sessions', 'Only last-minute prep', 'No planning'],
      correctAnswer: 1,
      explanation: 'Smaller consistent sessions are easier to sustain and compound over time.',
      difficulty: 'EASY',
    },
    {
      id: 'general-3',
      question: 'What should you do first after scoring poorly on a mock assessment?',
      options: ['Ignore it', 'Memorize answers only', 'Review weak areas and patterns', 'Stop practicing'],
      correctAnswer: 2,
      explanation: 'The best next step is reviewing patterns in mistakes and targeting weak areas.',
      difficulty: 'MEDIUM',
    },
  ],
}

function normalizeQuizTopic(topic: string) {
  return topic.toLowerCase().replace(/[^a-z]/g, '')
}

export function getFallbackQuiz(
  topic: string,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD',
  questionCount: number = 5
): QuizData {
  const normalizedTopic = normalizeQuizTopic(topic)
  const topicQuestions =
    fallbackQuizBank[normalizedTopic] ??
    (normalizedTopic.includes('web') ? fallbackQuizBank.webdev : undefined) ??
    fallbackQuizBank.default

  const combined = [...topicQuestions, ...fallbackQuizBank.default]
  const questions = combined.slice(0, Math.max(1, questionCount)).map((question, index) => ({
    ...question,
    id: `${normalizedTopic || 'quiz'}-${index + 1}`,
    difficulty,
  }))

  return {
    title: `${topic} Quiz`,
    topic,
    difficulty,
    questions,
    timeLimit: questionCount * 2,
  }
}

const interviewQuestionBank: Record<string, InterviewQuestion[]> = {
  default: [
    {
      question: 'Tell me about yourself and why this role is a strong fit for you.',
      expectedAnswer: 'A concise overview of background, strengths, and role alignment.',
      hints: ['Keep it under 2 minutes', 'Mention impact', 'Tie back to the role'],
      difficulty: 'EASY',
    },
    {
      question: 'Describe a challenging problem you solved and how you approached it.',
      expectedAnswer: 'A structured answer covering the problem, approach, and measurable result.',
      hints: ['Use STAR', 'Focus on tradeoffs', 'Mention outcome'],
      difficulty: 'MEDIUM',
    },
    {
      question: 'What is one area you are improving right now, and what is your plan?',
      expectedAnswer: 'A realistic growth area with a concrete improvement plan.',
      hints: ['Be honest', 'Show ownership', 'End on progress'],
      difficulty: 'MEDIUM',
    },
  ],
  dsa: [
    {
      question: 'How would you decide between using a hash map and sorting for an array problem?',
      expectedAnswer: 'Compare time complexity, space tradeoffs, and problem constraints.',
      hints: ['Talk about lookup cost', 'Mention memory', 'Reference constraints'],
      difficulty: 'MEDIUM',
    },
    {
      question: 'Explain the sliding window technique and when it is useful.',
      expectedAnswer: 'A definition with examples of contiguous-subarray style problems.',
      hints: ['Mention left/right pointers', 'When the window grows or shrinks', 'Give one example'],
      difficulty: 'MEDIUM',
    },
    {
      question: 'What signals tell you a problem may require dynamic programming?',
      expectedAnswer: 'Overlapping subproblems, optimal substructure, memoization/tabulation choices.',
      hints: ['State definition matters', 'Base cases', 'Transition relation'],
      difficulty: 'HARD',
    },
  ],
  hr: [
    {
      question: 'Tell me about a time you handled a disagreement in a team.',
      expectedAnswer: 'A professional example showing empathy, communication, and resolution.',
      hints: ['Use STAR', 'Avoid blaming', 'Show the outcome'],
      difficulty: 'MEDIUM',
    },
    {
      question: 'Why do you want to work at this company?',
      expectedAnswer: 'A company-specific answer tied to mission, role, and growth.',
      hints: ['Be specific', 'Mention alignment', 'Avoid generic praise'],
      difficulty: 'EASY',
    },
    {
      question: 'Describe a time you failed and what you learned from it.',
      expectedAnswer: 'A reflective answer showing accountability and growth.',
      hints: ['Own the mistake', 'Share the lesson', 'Show what changed later'],
      difficulty: 'MEDIUM',
    },
  ],
  systemdesign: [
    {
      question: 'How would you design a URL shortener for high read traffic?',
      expectedAnswer: 'Clarify requirements, outline components, data model, scaling, and tradeoffs.',
      hints: ['Ask clarifying questions', 'Cover storage', 'Mention caching and scalability'],
      difficulty: 'HARD',
    },
    {
      question: 'How would you design a notification system?',
      expectedAnswer: 'Requirements, delivery channels, queueing, retries, and user preferences.',
      hints: ['Think async', 'Reliability matters', 'Consider observability'],
      difficulty: 'HARD',
    },
  ],
  technical: [
    {
      question: 'Explain a recent project you built and the toughest technical decision you made.',
      expectedAnswer: 'A structured walkthrough with architecture, tradeoffs, and impact.',
      hints: ['Discuss constraints', 'Mention tradeoffs', 'Quantify outcomes'],
      difficulty: 'MEDIUM',
    },
    {
      question: 'How do you debug a production issue when you do not immediately know the root cause?',
      expectedAnswer: 'A calm, systematic debugging process with prioritization and verification.',
      hints: ['Start with impact', 'Use logs/metrics', 'Verify the fix'],
      difficulty: 'MEDIUM',
    },
    {
      question: 'What makes code maintainable in a fast-moving team?',
      expectedAnswer: 'Readable abstractions, tests, observability, and thoughtful tradeoffs.',
      hints: ['Think team scale', 'Mention documentation', 'Avoid overengineering'],
      difficulty: 'MEDIUM',
    },
  ],
}

function normalizeInterviewTopic(topic: string) {
  return topic.toLowerCase().replace(/[^a-z]/g, '')
}

export function getFallbackInterviewQuestions(topic: string, count: number = 5): InterviewQuestion[] {
  const normalizedTopic = normalizeInterviewTopic(topic)
  const topicSpecific = interviewQuestionBank[normalizedTopic] ?? interviewQuestionBank.default
  const combined = [...topicSpecific, ...interviewQuestionBank.default]

  return combined.slice(0, Math.max(1, count)).map((question, index) => ({
    ...question,
    question: combined[index]?.question ?? question.question,
  }))
}

export async function generateInterviewQuestions(
  topic: string,
  interviewType: string,
  role: string,
  questionCount: number = 5
): Promise<InterviewQuestion[]> {
  const prompt = `
Generate ${questionCount} ${interviewType} interview questions for a candidate preparing for ${role || topic}.
Primary focus topic: ${topic}

Return ONLY valid JSON in this exact format:
[
  {
    "question": "string",
    "expectedAnswer": "string",
    "hints": ["string", "string", "string"],
    "difficulty": "EASY"
  }
]
`

  try {
    const response = await callOpenRouter(
      [
        {
          role: 'system',
          content:
            'You are an expert interviewer. Generate realistic interview questions with concise guidance for ideal answers.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      1600,
      0.7
    )

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    const questions = extractJson<InterviewQuestion[]>(content).filter(
      (item) => item.question && item.expectedAnswer && Array.isArray(item.hints)
    )

    return questions.length > 0 ? questions.slice(0, questionCount) : getFallbackInterviewQuestions(topic, questionCount)
  } catch (error) {
    console.error('Error generating interview questions:', error)
    return getFallbackInterviewQuestions(topic, questionCount)
  }
}

export function evaluateInterviewResponseFallback(
  question: string,
  response: string,
  topic: string
): InterviewFeedback {
  const trimmed = response.trim()
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length
  const normalized = `${question} ${topic}`.toLowerCase()
  const keywordMatches = normalized
    .split(/\W+/)
    .filter((word) => word.length > 4)
    .filter((word) => trimmed.toLowerCase().includes(word)).length

  const baseScore = Math.min(70, 35 + wordCount)
  const technicalScore = Math.min(100, baseScore + keywordMatches * 4)
  const communicationScore = Math.min(100, 40 + Math.min(wordCount, 60))
  const confidenceScore = Math.min(100, 45 + Math.min(wordCount, 40))
  const clarityScore = Math.min(100, 42 + Math.min(wordCount, 45))
  const overallScore = Math.round((technicalScore + communicationScore + confidenceScore + clarityScore) / 4)

  return {
    technicalScore,
    communicationScore,
    confidenceScore,
    clarityScore,
    overallScore,
    strengths: [
      wordCount > 40 ? 'You provided a reasonably detailed answer.' : 'You stayed concise and direct.',
      keywordMatches > 1 ? `You connected your answer back to ${topic}.` : 'Your answer addressed the core prompt.',
    ],
    weaknesses: [
      wordCount < 35 ? 'Add more depth and concrete examples to strengthen the answer.' : 'Tighten the structure so your strongest points land faster.',
      'Include clearer metrics, tradeoffs, or outcomes where possible.',
    ],
    improvements: [
      'Use a clearer beginning, middle, and end in your response.',
      'Add one concrete example or result to make the answer stronger.',
      'Practice saying the answer out loud to improve fluency and confidence.',
    ],
  }
}

type CodingProblemDraft = Omit<CodingProblem, 'id'>

export async function generateCodingProblems(
  topic: string,
  skillLevel: string,
  targetCompanies: string[] = [],
  count: number = 5
): Promise<CodingProblemDraft[]> {
  const prompt = `
Generate ${count} coding interview problems tailored to:
- Topic: ${topic}
- Candidate level: ${skillLevel}
- Target companies: ${targetCompanies.length ? targetCompanies.join(', ') : 'Not specified'}

Each problem must include:
- title (string)
- topic (string)
- difficulty ("EASY" | "MEDIUM" | "HARD")
- description (string, clear + precise)
- examples (array of { input, output, explanation? })
- constraints (string)
- hints (string[]; 2-4 items)
- editorial (string; short but useful)
- testCases (array of { input, output } ; 2-4 visible cases)
- companyTags (string[]; from target companies when relevant)
- acceptanceRate (number; 30-90)

Return ONLY valid JSON in this exact format:
[
  {
    "title": "Two Sum",
    "topic": "DSA",
    "difficulty": "EASY",
    "description": "string",
    "examples": [{"input": "string", "output": "string", "explanation": "string"}],
    "constraints": "string",
    "hints": ["string"],
    "editorial": "string",
    "testCases": [{"input": "string", "output": "string"}],
    "companyTags": ["string"],
    "acceptanceRate": 75
  }
]
`

  try {
    const response = await callOpenRouter(
      [
        {
          role: 'system',
          content: 'You are an expert competitive programming problem setter. Generate realistic, solvable interview problems with good examples and test cases.',
        },
        { role: 'user', content: prompt },
      ],
      2600,
      0.75
    )

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    const problems = extractJson<CodingProblemDraft[]>(content)
      .filter((problem) => problem?.title && problem?.description && Array.isArray(problem?.testCases))
      .slice(0, Math.max(1, count))

    if (problems.length === 0) {
      throw new Error('No valid problems generated')
    }

    return problems
  } catch (error) {
    console.error('Error generating coding problems:', error)
    return []
  }
}

type ProjectDraft = Omit<ProjectData, 'id'>

export async function generateProjects(
  topic: string,
  skillLevel: string,
  targetRole: string,
  targetCompanies: string[] = [],
  count: number = 3
): Promise<ProjectDraft[]> {
  const prompt = `
Generate ${count} portfolio project ideas tailored to:
- Topic: ${topic}
- Candidate level: ${skillLevel}
- Target role: ${targetRole || 'Not specified'}
- Target companies: ${targetCompanies.length ? targetCompanies.join(', ') : 'Not specified'}

Each project must include:
- title (string)
- description (string)
- topic (string)
- difficulty ("EASY" | "MEDIUM" | "HARD")
- techStack (string[]; realistic)
- features (string[]; 5-10)
- milestones (array of { title, description, completed: false })
- githubStructure (string; short file/folder outline)
- deploymentGuide (string; concise steps)
- resumeValue (string; 2-3 bullets combined into one paragraph)
- interviewPoints (string[]; 4-8)

Return ONLY valid JSON in this exact format:
[
  {
    "title": "string",
    "description": "string",
    "topic": "string",
    "difficulty": "MEDIUM",
    "techStack": ["string"],
    "features": ["string"],
    "milestones": [{"title": "string", "description": "string", "completed": false}],
    "githubStructure": "string",
    "deploymentGuide": "string",
    "resumeValue": "string",
    "interviewPoints": ["string"]
  }
]
`

  try {
    const projectsTimeoutMs = Number.isFinite(OPENROUTER_PROJECTS_TIMEOUT_MS) && OPENROUTER_PROJECTS_TIMEOUT_MS > 0
      ? OPENROUTER_PROJECTS_TIMEOUT_MS
      : 5000

    const response = await callOpenRouter(
      [
        {
          role: 'system',
          content: 'You are a senior engineering mentor. Generate practical portfolio projects with clear scope, milestones, and interview talking points.',
        },
        { role: 'user', content: prompt },
      ],
      2600,
      0.75,
      projectsTimeoutMs
    )

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    const projects = extractJson<ProjectDraft[]>(content)
      .filter((project) => project?.title && project?.description && Array.isArray(project?.features))
      .slice(0, Math.max(1, count))

    if (projects.length === 0) {
      throw new Error('No valid projects generated')
    }

    return projects
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AI generation error'
    console.warn('Project generation fallback triggered:', message)
    return []
  }
}
