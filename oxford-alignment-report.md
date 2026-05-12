# Oxford Alignment Audit Report

## 1. Overview
- **Oxford 5000 Total Words**: 4958
- **App Total Unique Words**: 5361
- **Exact Matches Count**: 4924
- **Total Missing**: 34
- **Total Extra (Supplemental)**: 440
- **Total Misplaced (Level Mismatch)**: 32
- **Total Duplicates (In App)**: 84

## 2. Coverage By Level
- **A1**: 99% (890/899)
- **A2**: 99% (790/794)
- **B1**: 100% (690/693)
- **B2**: 99% (1288/1296)
- **C1**: 99% (1266/1276)

## 3. Categories of Findings

### 3.1 Extra Words (Supplemental)
Extra words are not strictly errors. They may be conversational additions, idioms, or teacher-added vocabulary.
See `extra-words.json` for the full list of 440 words.

### 3.2 Misplaced Words
Words that exist in both datasets but are assigned to different CEFR levels.
See `misplaced-words.json` for the full list of 32 words.

### 3.3 Duplicate Words
Words that appear multiple times in the app dataset.
See `duplicate-words.json` for the full list of 84 words.