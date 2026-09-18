# TeachBack AI

**An evidence-grounded AI tutor that helps learners understand by explaining concepts in their own words.**

TeachBack AI turns passive reading into an active learning loop. Instead of immediately giving the answer, the tutor listens to the learner’s explanation, recognises the parts they understand, corrects misconceptions, and guides them through one missing idea at a time. Every learning response is grounded in a specific Day/Slide reference.

> Hackathon project by group **E403** for the VinUni AI20K K4 AI Product Hackathon.

## Why TeachBack?

Mining `13,494` anonymised VLearn tutor interactions revealed a clear learning gap:

- `95.3%` of interactions were one-way explanations.
- Only `0.21%` used a probing question to test understanding.
- No interaction was labelled as question clarification.

TeachBack AI addresses this gap with a Socratic learning loop:

```text
Learner explanation
        ↓
Intent and scope check
        ↓
LLM teacher response + lesson evidence
        ↓
Deterministic concept-state tracker
        ↓
Recognise correct ideas / repair misconceptions / ask one next question
        ↓
Continue until the learner demonstrates mastery
```

The complete evidence, product decisions, risk scenarios and quality bar are documented in [`spec.md`](spec.md).

## Key features

- **Natural TeachBack conversation:** the LLM behaves like a patient teacher rather than a rigid answer checker.
- **Persistent concept state:** correct ideas remain recognised across turns, even when the recent conversation becomes long.
- **Semantic mastery tracking:** everyday wording and minor spelling mistakes are accepted; learners do not need to repeat slide text.
- **Socratic guidance:** vague answers trigger clarification, while “I don’t understand” triggers a simpler example instead of another assessment.
- **Scope control:** off-topic questions are declined briefly and redirected to the current lesson.
- **Misconception repair:** correct and incorrect claims are separated so one mistake does not erase valid understanding.
- **Grounded citations:** each response identifies the relevant Day/Slide and provides an in-app slide viewer.
- **Provider resilience:** a secondary OpenRouter model and a conservative local lesson rubric keep the learning flow available when the primary model fails.
- **Authentication and model selection:** Firebase authentication and configurable OpenRouter models are integrated into the playground.

## Learning content

The working prototype currently covers eight guided questions:

| Lesson | Concepts |
|---|---|
| **Day 1 — AI & LLM Foundation** | Next-token prediction and hallucination, Context Window, Grounding and RAG, Temperature |
| **Day 2 — Defining AI Problems** | Google PAIR Reframe, Quick Problem Card, Rule vs Workflow vs Agent, Human-in-the-loop |

## Architecture

```text
Browser /playground
  ├─ Firebase authentication
  ├─ Conversation and progress UI
  └─ Slide citation viewer
            │
            ▼
POST /api/teach
  ├─ Input validation and scope state
  ├─ Lesson retrieval from lib/lesson-data.ts
  ├─ Teacher system prompt
  ├─ OpenRouter primary model
  ├─ OpenRouter fallback model
  ├─ Semantic concept-state guardrail
  └─ Local lesson fallback
            │
            ▼
Response
  ├─ Natural teacher message
  ├─ partial / needs_revision / mastered
  ├─ mastered and missing concept IDs
  ├─ misconception corrections
  └─ Day/Slide citation
```

The LLM generates the teaching dialogue. A deterministic state tracker independently maintains mastery so the interface does not become stuck when a model explains an idea correctly but omits a structured ID.

## Technology

- Vinext, Vite and Next.js-compatible App Router
- React 19 and TypeScript
- Tailwind CSS and shadcn-style UI primitives
- OpenRouter for model access
- Firebase Authentication
- VLearn transcripts and lesson slides for local grounding

## Getting started

### Requirements

- Node.js `>=22.13.0`
- npm
- Git
- An OpenRouter API key
- A Firebase Web App configuration

### 1. Clone and install

```bash
git clone https://github.com/tuanfptu/K4-3A-E403-TeachBack-AI.git
cd K4-3A-E403-TeachBack-AI
npm install
```

### 2. Configure environment variables

Copy the example configuration:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Set the following values in `.env.local`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=google/gemini-2.5-flash
OPENROUTER_FALLBACK_MODEL=openai/gpt-4o-mini

NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

Never commit `.env.local` or an API key.

### 3. Prepare the VLearn data pack

The dataset is intentionally excluded from this repository. Obtain authorised access to the organiser’s `data/vlearn-pack` and place it locally as follows:

```text
data/vlearn-pack/
  chatlog/
  transcript/
  slides/
```

Expected lesson PDFs:

```text
data/vlearn-pack/slides/d1-slide-hackathon.pdf
data/vlearn-pack/slides/d2-slide-hackathon.pdf
```

The slide viewer expects rendered pages under:

```text
public/slides/day-1/slide-1.jpg ... slide-29.jpg
public/slides/day-2/slide-1.jpg ... slide-29.jpg
```

Both `data/` and `public/slides/` are ignored by Git. Do not commit or redistribute the organiser’s dataset.

### 4. Start the app

```bash
npm run dev
```

Open:

**[http://localhost:5173/playground](http://localhost:5173/playground)**

> The API requires outbound network access to reach OpenRouter. If local development is running inside a restricted sandbox, allow network access for the dev server; otherwise the app will use its conservative local fallback.

## Using the playground

1. Sign in and choose Day 1 or Day 2.
2. Explain the current concept in your own words.
3. Review the recognised ideas, corrections and one next teaching prompt.
4. Use **Need a hint?** when blocked.
5. Open **Nguồn đối chiếu** to inspect the cited slide.
6. Continue when all required concepts are demonstrated.

Greetings, acknowledgements and requests for help are not counted as failed attempts. The progress card only counts substantive answers.

## Quality and evaluation

The CP3 baseline evaluated 20 cases across eight lesson concepts:

| Metric | Result |
|---|---:|
| Full-contract pass rate | `16/20` — `80%` |
| Correct response-mode classification | `18/20` — `90%` |
| Misconceptions detected and corrected | `7/7` — `100%` |
| Responses with lesson citations | `20/20` — `100%` |

Subsequent regression fixes added deterministic semantic tracking for Context Window, RAG and Temperature, and verified the following progress paths:

```text
Day 1 Question 1: 1/3 → 2/3 → 3/3
Day 1 Question 2: 1/3 → 3/3
Day 1 Question 3: 3/3 in one complete answer
Day 1 Question 4: 3/3 in one complete answer
```

Supporting artifacts:

- [`spec.md`](spec.md) — product decisions, risks and fixed quality bar
- [`CP3-TEST-REPORT.md`](CP3-TEST-REPORT.md) — measured CP3 results and failure analysis
- [`eval/mining_evidence.md`](eval/mining_evidence.md) — reproducible VLearn evidence mining
- [`eval/golden_set.json`](eval/golden_set.json) — golden evaluation cases
- [`eval/eval_results.md`](eval/eval_results.md) — evaluation output

Run local verification:

```bash
npx tsc --noEmit
npm run build
```

## Project structure

```text
app/
  api/teach/route.ts       TeachBack orchestration and model fallback
  playground/page.tsx      Main learner experience
components/
  auth-modal.tsx           Firebase sign-in and registration
lib/
  feynman-prompt.ts        Socratic teacher system prompt and response contract
  lesson-data.ts           Fixed questions, required concepts and slide sources
  transcript-retriever.ts  Local VLearn transcript retrieval
eval/                      Evidence, golden set, traces and reports
spec.md                    Hackathon AI Product Spec
```

## Privacy and data handling

- The VLearn pack contains anonymised course interactions and is used only for the authorised hackathon workflow.
- Raw chatlogs, transcripts, PDFs, rendered slides and API secrets are excluded from Git.
- The application must not attempt to re-identify learners.
- Only the minimum relevant lesson context should be sent to an external model provider.
- Repository artifacts use aggregate counts and short, traceable examples rather than republishing the complete dataset.

## Status

TeachBack AI is a working hackathon prototype. It is designed for supervised learning support and is not a production assessment system or a substitute for an instructor.

## License and dataset notice

Source-code usage follows the repository owner’s terms. The VLearn data pack remains subject to the organiser’s access and confidentiality requirements and is not included under any source-code licence for this repository.
