import assert from "node:assert/strict";
import test from "node:test";

import { getLesson } from "../lib/lesson-data.ts";
import {
  findDeterministicMisconception,
  getValidatedModelMasteryIds,
  isLearnerAnswerRelevant,
  preventUnconfirmedFullScore,
  shouldMarkQuestionMastered,
} from "../lib/mastery-guard.ts";

const question = getLesson(1).questions[0];
const allowedPointIds = new Set(
  question.requiredPoints.map((point) => point.id)
);

test("rejects an unrelated answer even when it contains rubric keywords", () => {
  const answer =
    "Ví dụ hôm nay tôi nấu phở. Cách hoạt động của bếp cần được cải tiến.";

  assert.equal(isLearnerAnswerRelevant(question, answer), false);
  assert.deepEqual(
    getValidatedModelMasteryIds({
      evaluation: {
        correct_points: question.requiredPoints.map((point) => ({
          id: point.id,
          evidence: answer,
          feedback: "Đúng",
        })),
        incorrect_claims: [],
        newly_mastered_point_ids: question.requiredPoints.map(
          (point) => point.id
        ),
        invalidated_point_ids: [],
      },
      question,
      learnerMessage: answer,
      allowedPointIds,
    }),
    []
  );
});

test("accepts only explicitly claimed points with evidence from the latest answer", () => {
  const answer =
    "LLM dự đoán token tiếp theo theo xác suất từ ngữ cảnh nên câu có thể trôi chảy nhưng không được kiểm chứng là đúng.";
  const firstPointId = question.requiredPoints[0].id;

  assert.equal(isLearnerAnswerRelevant(question, answer), true);
  assert.deepEqual(
    getValidatedModelMasteryIds({
      evaluation: {
        correct_points: [
          {
            id: firstPointId,
            evidence: "LLM dự đoán token tiếp theo theo xác suất từ ngữ cảnh",
            feedback: "Đúng cơ chế",
          },
          {
            id: question.requiredPoints[1].id,
            evidence: "Một bằng chứng do model tự bịa ra",
            feedback: "Không hợp lệ",
          },
        ],
        incorrect_claims: [],
        newly_mastered_point_ids: question.requiredPoints.map(
          (point) => point.id
        ),
        invalidated_point_ids: [],
      },
      question,
      learnerMessage: answer,
      allowedPointIds,
    }),
    [firstPointId]
  );
});

test("does not unlock on a contradictory model result", () => {
  const pointIds = question.requiredPoints.map((point) => point.id);
  assert.equal(
    preventUnconfirmedFullScore({
      proposedNewPointIds: pointIds,
      alreadyMasteredPointIds: [],
      allPointIds: pointIds,
      modelQuestionMastered: false,
      modelResponseMode: "partial",
      modelHasIncorrectClaims: false,
    }).length,
    pointIds.length - 1
  );

  assert.equal(
    shouldMarkQuestionMastered({
      missingPointIds: [],
      incorrectClaims: [],
      modelQuestionMastered: false,
      modelResponseMode: "partial",
    }),
    false
  );

  assert.equal(
    shouldMarkQuestionMastered({
      missingPointIds: [],
      incorrectClaims: [],
      modelQuestionMastered: true,
      modelResponseMode: "mastered",
    }),
    true
  );
});

test("rejects a confidently wrong answer even if the model proposes all points", () => {
  const answer =
    "LLM luôn tra cứu sự thật trước khi trả lời, vì vậy nó không bao giờ bịa và mọi câu trôi chảy đều chính xác.";

  assert.ok(findDeterministicMisconception(question, answer));
  assert.deepEqual(
    getValidatedModelMasteryIds({
      evaluation: {
        correct_points: question.requiredPoints.map((point) => ({
          id: point.id,
          evidence: answer,
          feedback: "Model đã chấm nhầm là đúng",
        })),
        incorrect_claims: [],
        newly_mastered_point_ids: question.requiredPoints.map(
          (point) => point.id
        ),
        invalidated_point_ids: [],
      },
      question,
      learnerMessage: answer,
      allowedPointIds,
    }),
    []
  );
});
