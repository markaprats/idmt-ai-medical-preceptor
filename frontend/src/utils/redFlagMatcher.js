/**
 * Red Flag Matcher - Client-side matching utility
 * Matches chief complaint against red flag catalog
 */

import redFlagCatalog from '../red_flag_catalog.json';

/**
 * Match result structure
 * @typedef {Object} MatchResult
 * @property {string[]} universal - Universal red flags
 * @property {string[]} categorySpecific - Category-specific red flags
 * @property {string|null} matchedCategory - Matched category name
 * @property {number} confidence - Match confidence (0-1)
 * @property {string} message - Optional message
 */

/**
 * Calculate match score between complaint and keywords
 * @param {string} complaint - Chief complaint text
 * @param {string[]} keywords - Category keywords
 * @returns {number} Match score (0-1)
 */
function calculateMatchScore(complaint, keywords) {
  const complaintLower = complaint.toLowerCase();
  let matches = 0;
  const total = keywords.length;

  if (total === 0) return 0;

  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    
    // Exact match
    if (complaintLower.includes(keywordLower)) {
      matches += 1;
    }
    
    // Partial match for multi-word keywords
    const keywordParts = keywordLower.split(/\s+/);
    for (const part of keywordParts) {
      if (part.length > 3 && complaintLower.includes(part)) {
        matches += 0.5;
      }
    }
  }

  return Math.min(matches / total, 1.0);
}

/**
 * Match chief complaint against red flag catalog
 * @param {string} chiefComplaint - The chief complaint text
 * @returns {MatchResult} Match result with red flags
 */
export function matchChiefComplaint(chiefComplaint) {
  if (!chiefComplaint || typeof chiefComplaint !== 'string') {
    return {
      universal: redFlagCatalog.universal_red_flags,
      categorySpecific: [],
      matchedCategory: null,
      confidence: 0,
      message: 'Invalid chief complaint provided'
    };
  }

  const categories = redFlagCatalog.chief_complaint_categories;
  const universal = redFlagCatalog.universal_red_flags;
  
  // Find best matching category
  let bestMatch = null;
  let bestScore = 0;

  for (const [categoryName, categoryData] of Object.entries(categories)) {
    const score = calculateMatchScore(chiefComplaint, categoryData.keywords);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        name: categoryName,
        ...categoryData,
        score
      };
    }
  }

  // Apply confidence thresholds
  if (!bestMatch || bestScore < 0.50) {
    return {
      universal,
      categorySpecific: [],
      matchedCategory: null,
      confidence: bestScore,
      message: 'No specific red flag category matched. Use universal red flags.'
    };
  }

  if (bestScore >= 0.75) {
    return {
      universal,
      categorySpecific: bestMatch.red_flags,
      matchedCategory: bestMatch.name,
      confidence: bestScore,
      message: null
    };
  }

  if (bestScore >= 0.50) {
    return {
      universal,
      categorySpecific: bestMatch.red_flags.slice(0, 6),
      matchedCategory: bestMatch.name,
      confidence: bestScore,
      message: 'Multiple categories possible. Select the most appropriate.'
    };
  }

  return {
    universal,
    categorySpecific: [],
    matchedCategory: bestMatch.name,
    confidence: bestScore,
    message: 'Low confidence match. Monitor universal red flags.'
  };
}

/**
 * Get all available categories
 * @returns {string[]} List of category names
 */
export function getAllCategories() {
  return Object.keys(redFlagCatalog.chief_complaint_categories);
}

/**
 * Get category by name
 * @param {string} categoryName - Name of the category
 * @returns {Object|null} Category data or null
 */
export function getCategory(categoryName) {
  return redFlagCatalog.chief_complaint_categories[categoryName] || null;
}

export default {
  matchChiefComplaint,
  getAllCategories,
  getCategory
};