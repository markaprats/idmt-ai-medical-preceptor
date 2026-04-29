/**
 * Red Flag Matcher - Client-side matching utility
 * Matches chief complaint against red flag catalog
 */

import redFlagCatalog from "../red_flag_catalog.json";

const GENERIC_TERMS = new Set([
  "pain",
  "ache",
  "hurt",
  "injury",
  "problem",
  "issue",
  "symptom"
]);

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateMatchScore(complaint, keywords) {
  const complaintLower = normalizeText(complaint);
  let bestScore = 0;

  for (const keyword of keywords) {
    const keywordLower = normalizeText(keyword);

    if (!keywordLower) continue;

    if (complaintLower.includes(keywordLower)) {
      bestScore = Math.max(bestScore, 1);
      continue;
    }

    const parts = keywordLower
      .split(" ")
      .filter((part) => part.length > 3 && !GENERIC_TERMS.has(part));

    if (parts.length === 0) continue;

    const matchedParts = parts.filter((part) => complaintLower.includes(part)).length;

    if (matchedParts > 0) {
      bestScore = Math.max(bestScore, matchedParts / parts.length);
    }
  }

  return bestScore;
}

export function matchChiefComplaint(chiefComplaint) {
  const universal = redFlagCatalog.universal_red_flags;

  if (!chiefComplaint || typeof chiefComplaint !== "string") {
    return {
      universal,
      categorySpecific: [],
      matchedCategory: null,
      confidence: 0,
      message: "Enter a chief complaint to show complaint-specific red flags."
    };
  }

  const categories = redFlagCatalog.chief_complaint_categories;

  let bestMatch = null;
  let bestScore = 0;

  for (const [categoryName, categoryData] of Object.entries(categories)) {
    const score = calculateMatchScore(chiefComplaint, categoryData.keywords || []);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        name: categoryName,
        ...categoryData,
        score
      };
    }
  }

  if (!bestMatch || bestScore < 0.5) {
    return {
      universal,
      categorySpecific: [],
      matchedCategory: null,
      confidence: bestScore,
      message: "No specific red flag category matched. Use universal red flags."
    };
  }

  return {
    universal,
    categorySpecific: bestMatch.red_flags || [],
    matchedCategory: bestMatch.name,
    confidence: bestScore,
    message: null
  };
}

export function getAllCategories() {
  return Object.keys(redFlagCatalog.chief_complaint_categories);
}

export function getCategory(categoryName) {
  return redFlagCatalog.chief_complaint_categories[categoryName] || null;
}

export default {
  matchChiefComplaint,
  getAllCategories,
  getCategory
};