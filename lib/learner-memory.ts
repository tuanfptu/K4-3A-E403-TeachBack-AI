"use client";

import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseApp } from "@/lib/firebase";

export interface LearnerQuestionMemory {
  masteredPointIds: string[];
  attempts: number;
}

function memoryKey(userId: string, lessonId: number, questionId: number): string {
  return `teachback_memory:${userId}:${lessonId}:${questionId}`;
}

function sanitizeMemory(value: unknown): LearnerQuestionMemory | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<LearnerQuestionMemory>;
  return {
    masteredPointIds: Array.isArray(candidate.masteredPointIds)
      ? candidate.masteredPointIds.filter((id): id is string => typeof id === "string")
      : [],
    attempts: Number.isFinite(candidate.attempts) ? Math.max(0, Number(candidate.attempts)) : 0,
  };
}

export async function loadLearnerQuestionMemory(
  userId: string,
  lessonId: number,
  questionId: number
): Promise<LearnerQuestionMemory | null> {
  const key = memoryKey(userId, lessonId, questionId);
  let local: LearnerQuestionMemory | null = null;
  try {
    local = sanitizeMemory(JSON.parse(localStorage.getItem(key) || "null"));
  } catch {
    localStorage.removeItem(key);
  }
  try {
    const snapshot = await getDoc(
      doc(getFirestore(getFirebaseApp()), "learnerMemory", userId, "questions", `${lessonId}_${questionId}`)
    );
    const remote = snapshot.exists() ? sanitizeMemory(snapshot.data()) : null;
    if (remote) localStorage.setItem(key, JSON.stringify(remote));
    return remote ?? local;
  } catch (error) {
    console.warn("[LearnerMemory] Firestore read unavailable; using local cache.", error);
    return local;
  }
}

export async function saveLearnerQuestionMemory(
  userId: string,
  lessonId: number,
  questionId: number,
  memory: LearnerQuestionMemory
): Promise<void> {
  const key = memoryKey(userId, lessonId, questionId);
  localStorage.setItem(key, JSON.stringify(memory));
  try {
    await setDoc(
      doc(getFirestore(getFirebaseApp()), "learnerMemory", userId, "questions", `${lessonId}_${questionId}`),
      { ...memory, lessonId, questionId, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (error) {
    console.warn("[LearnerMemory] Firestore write unavailable; progress remains in local cache.", error);
  }
}
