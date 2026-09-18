import type { AnswerEvaluationResponse } from "./feynman-prompt";
import type { Question } from "./lesson-data";

type Evaluation = AnswerEvaluationResponse["evaluation"] | undefined;

const STOP_WORDS = new Set([
  "ai",
  "ap",
  "cac",
  "cach",
  "cai",
  "can",
  "che",
  "cho",
  "co",
  "cua",
  "dong",
  "duoc",
  "giam",
  "giai",
  "giong",
  "han",
  "hoac",
  "hoat",
  "hon",
  "khi",
  "khac",
  "khai",
  "khong",
  "la",
  "lam",
  "llm",
  "minh",
  "mot",
  "nay",
  "nen",
  "niem",
  "nhu",
  "nhung",
  "phuc",
  "ro",
  "rui",
  "tien",
  "the",
  "theo",
  "thi",
  "tinh",
  "tot",
  "trong",
  "tiep",
  "ung",
  "vi",
  "voi",
]);

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLocaleLowerCase("vi")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function meaningfulTokenList(value: string): string[] {
  return normalizeText(value)
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function tokenSet(value: string): Set<string> {
  return new Set(meaningfulTokenList(value));
}

/**
 * A cheap, deterministic relevance gate. It is deliberately conservative:
 * false mastery is more harmful than asking the learner one more question.
 */
export function isLearnerAnswerRelevant(
  question: Question,
  learnerMessage: string
): boolean {
  const answer = learnerMessage.trim();
  if (answer.length < 8) return false;

  const answerTokens = tokenSet(answer);
  if (answerTokens.size < 2) return false;

  const conceptTokens = meaningfulTokenList(question.concept);
  const conceptOverlap = conceptTokens.filter((token) =>
    answerTokens.has(token)
  ).length;
  if (
    conceptTokens.length > 0 &&
    conceptOverlap >= Math.min(2, conceptTokens.length)
  ) {
    return true;
  }

  const grounding = [
    question.prompt,
    question.hint,
    question.referenceAnswer,
  ].join(" ");
  const groundingTokens = tokenSet(grounding);
  const overlap = [...answerTokens].filter((token) =>
    groundingTokens.has(token)
  ).length;

  return overlap >= 2 && overlap / answerTokens.size >= 0.12;
}

export function findDeterministicMisconception(
  question: Question,
  learnerMessage: string
): { claim: string; correction: string } | null {
  const answer = normalizeText(learnerMessage);
  const concept = normalizeText(question.concept);
  let hasMisconception = false;

  if (concept.includes("next token")) {
    hasMisconception =
      /(luon|chac chan).{0,35}(tra cuu|kiem chung|dung|chinh xac)/.test(answer) ||
      /khong bao gio.{0,30}(bia|sai|ao giac)/.test(answer) ||
      /troi chay.{0,35}(dong nghia|luon).{0,25}(dung|chinh xac)/.test(answer);
  } else if (concept.includes("context window")) {
    hasMisconception =
      /(vo han|khong gioi han).{0,25}(context|token|ngu canh)/.test(answer) ||
      /(context|ngu canh).{0,45}(cang dai|cang nhieu).{0,30}(luon|cang).{0,20}(tot|nhanh|re)/.test(answer) ||
      /(thong tin|noi dung).{0,35}(o giua|nam giua).{0,30}(khong bao gio|luon duoc).{0,20}(bo sot|chu y)/.test(answer);
  } else if (concept.includes("grounding") || concept === "rag") {
    hasMisconception =
      /(rag|grounding).{0,45}(loai bo|triet tieu|het|dung 100|chinh xac 100).{0,25}(ao giac|loi|sai)?/.test(answer) ||
      /khong can.{0,25}(kiem chung|xac minh|kiem tra).{0,30}(rag|grounding)/.test(answer);
  } else if (concept.includes("temperature")) {
    hasMisconception =
      /(temperature|nhiet do).{0,25}(cao|tang).{0,35}(thong minh hon|them kien thuc|chinh xac hon)/.test(answer) ||
      /(temperature|nhiet do).{0,25}(thap|gan 0).{0,30}(ngau nhien hon|sang tao hon)/.test(answer);
  } else if (concept.includes("google pair")) {
    hasMisconception =
      /(bat dau|uu tien|nen).{0,35}(cong nghe|chatbot|agent|ai).{0,40}(truoc|roi moi tim van de)/.test(answer);
  } else if (concept.includes("quick problem card")) {
    hasMisconception =
      /(khong can|bo qua).{0,25}(baseline|chi so|target|doi tuong|quy trinh)/.test(answer);
  } else if (concept.includes("3 cap do")) {
    hasMisconception =
      /(agent|ai).{0,35}(luon|bao gio cung).{0,25}(tot nhat|nen dung|chinh xac)/.test(answer) ||
      /(if else|logic co dinh|cong thuc co dinh).{0,35}(nen|phai).{0,20}(dung agent|dung llm)/.test(answer);
  } else if (concept.includes("human in the loop") || concept.includes("hitl")) {
    hasMisconception =
      /(khong can|bo).{0,30}(con nguoi|kiem duyet|giam sat|phe duyet)/.test(answer) ||
      /(accuracy|do chinh xac).{0,20}(cao|100).{0,30}(nen|co the).{0,20}(tu dong hoan toan|bo giam sat)/.test(answer);
  }

  if (!hasMisconception) return null;
  return {
    claim: learnerMessage.trim().slice(0, 180),
    correction: `Khẳng định này mâu thuẫn với nội dung đối chiếu ở ${question.source.range}; hãy sửa ý sai trước khi hệ thống ghi nhận tiêu chí.`,
  };
}

function isEvidenceFromLatestAnswer(
  evidence: unknown,
  learnerMessage: string
): evidence is string {
  if (typeof evidence !== "string") return false;

  const normalizedEvidence = normalizeText(evidence);
  const normalizedAnswer = normalizeText(learnerMessage);
  if (normalizedEvidence.length < 5 || normalizedAnswer.length < 5) {
    return false;
  }
  if (normalizedAnswer.includes(normalizedEvidence)) return true;

  const evidenceTokens = meaningfulTokenList(evidence);
  if (evidenceTokens.length < 2) return false;
  const answerTokens = tokenSet(learnerMessage);
  const matchingTokens = evidenceTokens.filter((token) =>
    answerTokens.has(token)
  ).length;

  return matchingTokens >= 2 && matchingTokens / evidenceTokens.length >= 0.75;
}

/**
 * Model output is a proposal, not authority. A new point is accepted only when
 * the model explicitly returns its id and attaches evidence grounded in the
 * latest learner message.
 */
export function getValidatedModelMasteryIds({
  evaluation,
  question,
  learnerMessage,
  allowedPointIds,
}: {
  evaluation: Evaluation;
  question: Question;
  learnerMessage: string;
  allowedPointIds: Set<string>;
}): string[] {
  if (
    !evaluation ||
    !Array.isArray(evaluation.newly_mastered_point_ids) ||
    !Array.isArray(evaluation.correct_points) ||
    !isLearnerAnswerRelevant(question, learnerMessage) ||
    findDeterministicMisconception(question, learnerMessage) !== null
  ) {
    return [];
  }

  const explicitlyClaimedIds = new Set(
    evaluation.newly_mastered_point_ids.filter(
      (id): id is string =>
        typeof id === "string" && allowedPointIds.has(id)
    )
  );

  return [...explicitlyClaimedIds].filter((id) =>
    evaluation.correct_points.some(
      (point) =>
        point?.id === id &&
        allowedPointIds.has(point.id) &&
        isEvidenceFromLatestAnswer(point.evidence, learnerMessage)
    )
  );
}

export function shouldMarkQuestionMastered({
  missingPointIds,
  incorrectClaims,
  modelQuestionMastered,
  modelResponseMode,
}: {
  missingPointIds: string[];
  incorrectClaims: AnswerEvaluationResponse["evaluation"]["incorrect_claims"];
  modelQuestionMastered: unknown;
  modelResponseMode: unknown;
}): boolean {
  return (
    missingPointIds.length === 0 &&
    incorrectClaims.length === 0 &&
    modelQuestionMastered === true &&
    modelResponseMode === "mastered"
  );
}

export function preventUnconfirmedFullScore({
  proposedNewPointIds,
  alreadyMasteredPointIds,
  allPointIds,
  modelQuestionMastered,
  modelResponseMode,
  modelHasIncorrectClaims,
}: {
  proposedNewPointIds: string[];
  alreadyMasteredPointIds: string[];
  allPointIds: string[];
  modelQuestionMastered: unknown;
  modelResponseMode: unknown;
  modelHasIncorrectClaims: boolean;
}): string[] {
  const proposedMastered = new Set([
    ...alreadyMasteredPointIds,
    ...proposedNewPointIds,
  ]);
  const wouldShowFullScore = allPointIds.every((id) =>
    proposedMastered.has(id)
  );
  const completionIsConfirmed =
    modelQuestionMastered === true &&
    modelResponseMode === "mastered" &&
    !modelHasIncorrectClaims;

  if (
    !wouldShowFullScore ||
    completionIsConfirmed ||
    proposedNewPointIds.length === 0
  ) {
    return proposedNewPointIds;
  }

  // Keep one criterion pending instead of presenting a contradictory 3/3 UI.
  return proposedNewPointIds.slice(0, -1);
}
