export type SlideReference = {
  range: string;
  slide: number;
  topic: string;
  note: string;
  takeaway: string;
};

export type Question = {
  id: number;
  concept: string;
  prompt: string;
  hint: string;
  source: SlideReference;
  hasChallenge?: boolean;
  followUp: string;
  understood: string;
  stillUnsure: string;
  success: string;
  covered: string[];
};

export type Lesson = {
  id: number;
  label: string;
  shortTitle: string;
  title: string;
  description: string;
  time: string;
  accent: string;
  completionTopics: string[];
  questions: Question[];
};

export const lessons: Lesson[] = [
  {
    id: 1,
    label: "Lesson 1",
    shortTitle: "Generative AI",
    title: "Introduction to Generative AI",
    description:
      "Build a clear mental model of how generative systems learn patterns and create new content.",
    time: "10–15 min",
    accent: "from-[#5b5ce2] to-[#7778f3]",
    completionTopics: [
      "What generative AI creates",
      "How models learn from examples",
      "The role of prompts",
      "Why outputs can vary",
      "How to use generative AI responsibly",
    ],
    questions: [
      {
        id: 1,
        concept: "Generative models",
        prompt: "What makes generative AI different from traditional software?",
        hint: "Think about whether every output is written in advance or produced from patterns the system has learned.",
        source: {
          range: "Slides 3–5",
          slide: 4,
          topic: "Generative vs. rule-based systems",
          note: "Review the comparison between fixed rules and learned patterns.",
          takeaway: "Rules execute instructions. Generative models compose from learned patterns.",
        },
        hasChallenge: true,
        followUp: "Could you give me a concrete example of something it creates rather than simply retrieves?",
        understood: "Generative AI produces new outputs from patterns in examples.",
        stillUnsure: "How that differs from looking up a stored answer.",
        success: "That makes sense. The system composes a new output from learned patterns instead of following only a fixed answer path.",
        covered: ["Learned patterns", "New content generation"],
      },
      {
        id: 2,
        concept: "Training data",
        prompt: "What role does training data play in a generative AI model?",
        hint: "Think of the data as examples the model studies, not a database it copies word for word.",
        source: {
          range: "Slides 6–8",
          slide: 7,
          topic: "Learning from examples",
          note: "Review how repeated examples shape statistical patterns.",
          takeaway: "Examples shape the relationships the model learns.",
        },
        followUp: "How can the quality of those examples affect what the model produces?",
        understood: "Training examples shape the patterns available to the model.",
        stillUnsure: "Why poor examples can lead to poor output.",
        success: "I understand. Training data gives the model examples from which it learns useful patterns and relationships.",
        covered: ["Examples as learning material", "Pattern formation"],
      },
      {
        id: 3,
        concept: "Prompting",
        prompt: "Why does the way we phrase a prompt change the model’s response?",
        hint: "Consider how context, constraints, and an intended format narrow the set of likely responses.",
        source: {
          range: "Slides 9–11",
          slide: 10,
          topic: "Prompt context and constraints",
          note: "Review the examples that compare vague and specific prompts.",
          takeaway: "Clear context helps steer generation toward the intended result.",
        },
        followUp: "What kind of detail would make a vague prompt easier for the model to interpret?",
        understood: "Prompt detail gives the model stronger context and constraints.",
        stillUnsure: "Which details most directly shape the output.",
        success: "That makes sense. A prompt changes the context and constraints the model uses to generate its response.",
        covered: ["Context", "Useful constraints"],
      },
      {
        id: 4,
        concept: "Output variation",
        prompt: "Why can the same prompt produce different answers on separate attempts?",
        hint: "Think about probability: several next words can be plausible at each step.",
        source: {
          range: "Slides 12–13",
          slide: 12,
          topic: "Probabilistic generation",
          note: "Review the token probability illustration.",
          takeaway: "Generation can sample among several plausible continuations.",
        },
        followUp: "How might that variation be helpful in a creative task?",
        understood: "The model can choose among multiple plausible continuations.",
        stillUnsure: "Why those choices do not always repeat exactly.",
        success: "I understand. Generation is probabilistic, so more than one plausible continuation can be selected.",
        covered: ["Probability", "Multiple plausible outputs"],
      },
      {
        id: 5,
        concept: "Responsible use",
        prompt: "What should a person check before using AI-generated content?",
        hint: "Consider accuracy, bias, privacy, ownership, and the consequences of being wrong.",
        source: {
          range: "Slides 14–17",
          slide: 16,
          topic: "Responsible use checklist",
          note: "Review the human verification checklist.",
          takeaway: "Human judgment remains necessary before using important outputs.",
        },
        followUp: "Which check becomes most important when an answer affects someone else?",
        understood: "Important AI outputs need human review before use.",
        stillUnsure: "Which risks should be checked for the situation.",
        success: "That makes sense. We should verify important claims and consider bias, privacy, ownership, and impact before use.",
        covered: ["Human verification", "Risk awareness"],
      },
    ],
  },
  {
    id: 2,
    label: "Lesson 2",
    shortTitle: "Hallucination & grounding",
    title: "LLM, Hallucination & Grounding",
    description:
      "Explain why language models can sound convincing, and how grounding makes answers more reliable.",
    time: "10–15 min",
    accent: "from-[#0f8f82] to-[#32a99b]",
    completionTopics: [
      "How LLMs generate responses",
      "Why hallucinations happen",
      "What grounding means",
      "How RAG supports grounding",
      "When AI answers should be verified",
    ],
    questions: [
      {
        id: 1,
        concept: "LLM hallucination",
        prompt: "Why can an LLM generate an answer that sounds convincing but is factually incorrect?",
        hint: "Think about how an LLM generates the next token based on probability rather than verifying information against a trusted source.",
        source: {
          range: "Slides 14–16",
          slide: 15,
          topic: "LLM Hallucination",
          note: "Review the section explaining next-token prediction and factual grounding.",
          takeaway: "Fluent prediction and factual verification are different processes.",
        },
        hasChallenge: true,
        followUp: "If it does not know the correct answer, how can it still produce such a fluent and confident response?",
        understood: "LLMs generate text based on learned patterns.",
        stillUnsure: "How this leads to confident but incorrect answers.",
        success: "That makes sense now. The model predicts likely next tokens, so a response can be fluent and plausible without being factually verified.",
        covered: ["Next-token prediction", "Plausible but potentially incorrect output"],
      },
      {
        id: 2,
        concept: "Grounding",
        prompt: "What is grounding, and why does it help reduce hallucination?",
        hint: "Think about connecting a response to information the model can inspect at answer time.",
        source: {
          range: "Slides 17–19",
          slide: 18,
          topic: "Grounding AI responses",
          note: "Review how trusted context anchors a generated response.",
          takeaway: "Grounding connects generation to relevant, trusted context.",
        },
        followUp: "What makes a source useful enough to ground an answer?",
        understood: "Grounding gives the model relevant evidence for its response.",
        stillUnsure: "Why the reliability of the source still matters.",
        success: "I understand. Grounding gives the model relevant source material to use, which reduces unsupported claims.",
        covered: ["Trusted context", "Evidence-based responses"],
      },
      {
        id: 3,
        concept: "Retrieval-augmented generation",
        prompt: "How is RAG different from relying only on an LLM’s internal knowledge?",
        hint: "Think about what happens immediately before the model writes its answer.",
        source: {
          range: "Slides 20–23",
          slide: 21,
          topic: "RAG workflow",
          note: "Review the retrieve → add context → generate sequence.",
          takeaway: "RAG retrieves relevant external context before generation.",
        },
        followUp: "Why is retrieving information at answer time useful for recent facts?",
        understood: "RAG adds retrieved external information to the prompt.",
        stillUnsure: "How that changes the answer compared with model memory alone.",
        success: "That makes sense. RAG retrieves relevant external information at answer time and gives it to the model as context.",
        covered: ["Retrieval step", "External context"],
      },
      {
        id: 4,
        concept: "Verification",
        prompt: "When should we not trust an LLM answer immediately?",
        hint: "Consider answers that are consequential, recent, highly specific, or difficult to verify from the response itself.",
        source: {
          range: "Slides 24–26",
          slide: 25,
          topic: "When to verify",
          note: "Review the risk and confidence matrix.",
          takeaway: "Higher-stakes claims deserve stronger verification.",
        },
        followUp: "How would the cost of a wrong answer change your verification approach?",
        understood: "The need to verify grows with uncertainty and consequence.",
        stillUnsure: "Which situations deserve the strongest checks.",
        success: "I understand. We should pause and verify answers that are high-stakes, recent, highly specific, or unsupported by sources.",
        covered: ["Risk awareness", "Source verification"],
      },
      {
        id: 5,
        concept: "Practical trust",
        prompt: "What is a practical way to verify an important answer from an LLM?",
        hint: "Think about checking the claim against more than one credible, original source.",
        source: {
          range: "Slides 27–29",
          slide: 28,
          topic: "Verification workflow",
          note: "Review the trace → compare → confirm checklist.",
          takeaway: "Trace claims to credible sources and compare before acting.",
        },
        followUp: "Why is the original source usually better than a repeated claim?",
        understood: "Important claims should be traced to reliable evidence.",
        stillUnsure: "How to distinguish independent confirmation from repetition.",
        success: "That makes sense. We can trace the claim to credible original sources, compare evidence, and confirm it before acting.",
        covered: ["Credible sources", "Independent confirmation"],
      },
    ],
  },
];

export const getLesson = (id: number) => lessons.find((lesson) => lesson.id === id) ?? lessons[0];
