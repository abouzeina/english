# Oxford Alignment Audit Report

## 1. Overview
- **Oxford 5000 Total Words**: 4958
- **App Total Unique Words**: 4436
- **Exact Matches Count**: 4019
- **Total Missing**: 939
- **Total Extra (Supplemental)**: 420
- **Total Misplaced (Level Mismatch)**: 30
- **Total Duplicates (In App)**: 282

## 2. Coverage By Level
- **A1**: 92% (829/899)
- **A2**: 97% (769/794)
- **B1**: 80% (557/693)
- **B2**: 73% (946/1296)
- **C1**: 72% (918/1276)

## 3. Categories of Findings

### 3.1 Extra Words (Supplemental)
Extra words are not strictly errors. They may be conversational additions, idioms, or teacher-added vocabulary.
See `extra-words.json` for the full list of 420 words.

### 3.2 Misplaced Words
Words that exist in both datasets but are assigned to different CEFR levels.
See `misplaced-words.json` for the full list of 30 words.

### 3.3 Duplicate Words
Words that appear multiple times in the app dataset.
See `duplicate-words.json` for the full list of 282 words.