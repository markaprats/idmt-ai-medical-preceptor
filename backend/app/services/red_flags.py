"""Red Flag Service - Static catalog with dynamic matching"""
import json
from pathlib import Path
from typing import Dict, Any, List
from dataclasses import dataclass


@dataclass
class RedFlagResult:
    """Red flag matching result"""
    universal: List[str]
    category_specific: List[str]
    confidence: float
    matched_category: str = None
    message: str = None


class RedFlagService:
    """Service for red flag matching using static catalog"""
    
    def __init__(self):
        """Initialize with catalog"""
        self.catalog = self._load_catalog()
        self.universal_red_flags = self.catalog.get("universal_red_flags", [])
        self.categories = self.catalog.get("chief_complaint_categories", {})
    
    def _load_catalog(self) -> Dict:
        """Load red flag catalog from JSON"""
        catalog_path = Path(__file__).parent.parent.parent / "data" / "red_flags_catalog.json"
        
        if catalog_path.exists():
            with open(catalog_path, "r") as f:
                return json.load(f)
        
        # Fallback to hardcoded defaults
        return {
            "universal_red_flags": [
                "Airway compromise",
                "Severe respiratory distress",
                "Hemodynamic instability",
                "Altered mental status",
                "Uncontrolled bleeding",
                "Severe pain out of proportion",
                "Rapid clinical deterioration",
                "Inability to obtain vital signs"
            ],
            "chief_complaint_categories": {}
        }
    
    def get_red_flags(self, chief_complaint: str) -> RedFlagResult:
        """Get red flags for a chief complaint using keyword matching"""
        complaint_lower = chief_complaint.lower()
        
        # Find matching categories
        matches = []
        for category_name, category_data in self.categories.items():
            keywords = category_data.get("keywords", [])
            score = self._calculate_match_score(complaint_lower, keywords)
            if score > 0:
                matches.append({
                    "category": category_name,
                    "score": score,
                    "red_flags": category_data.get("red_flags", [])
                })
        
        # Sort by score descending
        matches.sort(key=lambda x: x["score"], reverse=True)
        
        # Apply confidence thresholds
        if not matches:
            return RedFlagResult(
                universal=self.universal_red_flags,
                category_specific=[],
                confidence=0.0,
                matched_category=None,
                message="No specific red flag category matched. Use universal red flags."
            )
        
        top_match = matches[0]
        confidence = top_match["score"]
        
        if confidence >= 0.75:
            return RedFlagResult(
                universal=self.universal_red_flags,
                category_specific=top_match["red_flags"],
                confidence=confidence,
                matched_category=top_match["category"],
                message=None
            )
        elif confidence >= 0.50:
            top_2 = matches[:2]
            combined_flags = []
            for m in top_2:
                combined_flags.extend(m["red_flags"])
            
            return RedFlagResult(
                universal=self.universal_red_flags,
                category_specific=combined_flags[:6],
                confidence=confidence,
                matched_category=top_match["category"],
                message="Multiple categories possible. Select the most appropriate."
            )
        else:
            return RedFlagResult(
                universal=self.universal_red_flags,
                category_specific=[],
                confidence=confidence,
                matched_category=None,
                message="No specific red flag category matched. Use universal red flags."
            )
    
    def _calculate_match_score(self, complaint: str, keywords: List[str]) -> float:
        """Calculate match score using keyword matching"""
        matches = 0
        total = len(keywords)
        
        if total == 0:
            return 0.0
        
        for keyword in keywords:
            if keyword.lower() in complaint:
                matches += 1
            keyword_parts = keyword.split()
            for part in keyword_parts:
                if len(part) > 3 and part.lower() in complaint:
                    matches += 0.5
        
        return min(matches / total, 1.0)
    
    def get_all_categories(self) -> List[str]:
        """Get list of all available categories"""
        return list(self.categories.keys())