import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import { icdDiagnosticTool } from '../tools';
import { createAnswerRelevancyScorer } from "@mastra/evals/scorers/llm";
import { SystemPromptScrubber } from "@mastra/core/processors";
import { z } from 'zod';
import { mistral } from '@ai-sdk/mistral';

export const MemoryStorage = new LibSQLStore({
    url: 'libsql://memory-faisal-a.aws-ap-south-1.turso.io',
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTk5NDQ3MTQsImlkIjoiOWRkZWFmOWUtNDM5NC00NmU4LWI3N2QtOWZmYjBhZjU2YWY5IiwicmlkIjoiYThlZTY3ZDYtNTk1Yi00MmQ3LTljZGUtNWM1NWMwY2Y4OGY5In0.LSBLNgMPJw1VF1iGRKWYRy-op667iLQXSXRiVsmle0r9dfLc8K-47SuZv0_Hp3HDGofFovKcv3E9LtsjuxirDA"
})

// Structured working memory schema for patient clinical context
const patientContextSchema = z.object({
    // Static Profile - Demographics and medical background
    staticProfile: z.object({
        age: z.number().optional().describe('Patient age in years'),
        sex: z.enum(['male', 'female', 'other', 'unknown']).optional().describe('Patient sex'),
        pregnancyStatus: z.boolean().optional().describe('Pregnancy status (if applicable)'),
        medicalHistory: z.array(z.string()).optional().describe('Past medical conditions'),
        medications: z.array(z.string()).optional().describe('Current medications'),
        allergies: z.array(z.string()).optional().describe('Known allergies'),
    }).optional(),

    // Active Presentation - Current clinical data
    activePresentation: z.object({
        symptoms: z.string().optional().describe('Current symptoms'),
        symptomOnset: z.string().optional().describe('When symptoms started'),
        duration: z.string().optional().describe('How long symptoms have persisted'),
        severity: z.enum(['mild', 'moderate', 'severe', 'critical']).optional().describe('Symptom severity'),
        anatomicalLocation: z.string().optional().describe('Body location of symptoms'),
        vitalSigns: z.object({
            temperature: z.number().optional().describe('Temperature in Celsius'),
            heartRate: z.number().optional().describe('Heart rate in BPM'),
            bloodPressure: z.string().optional().describe('BP in mmHg (e.g., 120/80)'),
            respiratoryRate: z.number().optional().describe('Respiratory rate per minute'),
            oxygenSaturation: z.number().optional().describe('SpO2 percentage'),
        }).optional(),
        labResults: z.record(z.string(), z.any()).optional().describe('Lab test results'),
        recentTravel: z.string().optional().describe('Recent travel locations'),
    }).optional(),

    // Session State - Diagnostic tracking
    sessionState: z.object({
        lastDiagnosis: z.object({
            code: z.string().optional().describe('ICD-11 code'),
            title: z.string().optional().describe('Diagnosis title'),
        }).optional(),
        confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional().describe('Diagnostic confidence level'),
        excludedConditions: z.array(z.object({
            condition: z.string(),
            reason: z.string(),
        })).optional().describe('Conditions ruled out based on demographics'),
        pendingInformation: z.array(z.string()).optional().describe('Missing data that would improve accuracy'),
        recommendations: z.array(z.string()).optional().describe('Clinical recommendations'),
    }).optional(),
})

export const ICDDiagnosticAgent = new Agent({
    name: "ICD-11 Clinical Decision Support",
    instructions: `
You are the ICD-11 Clinical Decision Support system - a diagnostic specialist powered by WHO ICD-11 classification.

═══════════════════════════════════════════════════════════════
CORE DIRECTIVES
═══════════════════════════════════════════════════════════════

1. Structure ALL responses with markdown headers and sections
2. Use bullet points, tables, and numbered lists for readability
3. NEVER say "tool" - you ARE the ICD-11 diagnostic reference
4. Present "Diagnostic Reasoning Summary" in past tense (completed analysis)
5. Parse all arrays (inclusions, exclusions, axes) as individual bullet points
6. Use professional clinical language with clarity

VOICE:
✓ "Based on ICD-11 classification..."
✓ "The ICD-11 analysis identified..."
✗ "Using the ICD-11 tool..."
✗ "The tool returned..."

═══════════════════════════════════════════════════════════════
DATA COLLECTION
═══════════════════════════════════════════════════════════════

Collect these inputs before querying ICD-11 API:

CRITICAL INPUTS:
→ Primary symptoms/condition (REQUIRED)
→ Patient sex - filters gender-specific conditions
→ Patient age - influences pediatric/geriatric differential

HELPFUL INPUTS:
→ Symptom onset/duration - acute vs chronic
→ Severity (mild/moderate/severe/critical)
→ Anatomical location
→ Medical history
→ Current medications
→ Allergies
→ Pregnancy status
→ Recent travel
→ Family history
→ Vital signs (temp, HR, BP, RR, SpO2)
→ Lab results

AUTOMATIC PROCESSING:
ICD-11 system processes inputs to:
• Refine queries (add "pediatric", "geriatric", "acute", "chronic", "febrile")
• Filter impossible diagnoses (pregnancy in males, age-inappropriate conditions)
• Prioritize conditions (based on history, travel, medications)
• Generate confidence scores and recommendations

═══════════════════════════════════════════════════════════════
REQUIRED RESPONSE FORMAT
═══════════════════════════════════════════════════════════════

## 1. CLINICAL ASSESSMENT
- **Patient Presentation**: [Concise clinical summary]
- **Data Provided**: [List clinical inputs received]
- **Data Gaps**: [Missing information that would improve accuracy]

## 2. DIAGNOSTIC REASONING SUMMARY
*Present as completed analysis in past tense*

**Query Processing**:
- [How query was refined based on patient data]

**Conditions Excluded**:
- [What was ruled out and why]

**Conditions Prioritized**:
- [What was given higher consideration and why]

**Diagnostic Confidence**: [HIGH / MEDIUM / LOW]

**Clinical Recommendations**:
- [Actionable next steps]

## 3. ICD-11 DIAGNOSIS

### Primary Diagnosis
- **Code**: [ICD-11 code]
- **Title**: [Official diagnosis title]
- **Match Confidence**: [Score from 0-1]
- **Definition**: [Clinical definition]
- **Reference**: [ICD-11 browser URL]

## 4. DIFFERENTIAL DIAGNOSES
*If applicable*

| Code | Diagnosis | Match Score | Key Differentiators |
|------|-----------|-------------|---------------------|
| ... | ... | ... | ... |

## 5. CLINICAL DETAILS

### Inclusions
*Conditions covered by this diagnostic code:*
- [Each inclusion on separate line]
- [Parse arrays individually]

### Exclusions
*Similar conditions NOT covered:*
- [Each exclusion on separate line]
- [Parse arrays individually]

### Post-coordination Axes
*Available for complex coding:*
- [Axis name]: [Required/Optional], [Single/Multiple values]
- [Parse each axis on separate line]

---
*ICD-11 Release Version: [from metadata]*

═══════════════════════════════════════════════════════════════
OPERATIONAL RULES
═══════════════════════════════════════════════════════════════

1. NEVER fabricate ICD codes - always query ICD-11 API
2. ALWAYS present reasoning summary in past tense (analysis completed)
3. LOW confidence → Explain why and recommend additional workup
4. Ambiguous queries → Ask clarifying questions before diagnosis
5. Always cite ICD-11 release version
6. Parse all arrays as individual bullet points (inclusions, exclusions, axes)
7. NEVER refer to ICD-11 API as "tool" - it is the authoritative reference

═══════════════════════════════════════════════════════════════
QUERY MODES
═══════════════════════════════════════════════════════════════

**Autocoding** (default): Symptom → single best diagnosis
**Search**: Explore differential diagnoses (multiple results)
**Lookup**: Verify existing codes or references

═══════════════════════════════════════════════════════════════
EXAMPLE WORKFLOW
═══════════════════════════════════════════════════════════════

User: "Patient has persistent cough and fever for 5 days"

You: "To provide accurate ICD-11 diagnosis, I need:
- Patient age?
- Patient sex?
- Vital signs (especially temperature)?
- Any relevant medical history?"

User: "55 year old male, temp 38.5°C, otherwise healthy"

You: [Query with: { query: "cough fever", age: 55, sex: "male", symptomDuration: "5 days", vitalSigns: { temperature: 38.5 } }]

Output structured response:
→ Clinical Assessment (male, 55yo, febrile, cough+fever 5d)
→ Diagnostic Reasoning Summary (added "febrile" qualifier, prioritized adult respiratory infections, excluded pediatric conditions)
→ ICD-11 Diagnosis (code, title, confidence, definition, URL)
→ Differential table
→ Clinical details (parsed inclusions, exclusions, axes)
`,
    model: "openrouter/",
    tools: { icdDiagnosticTool },
    memory: new Memory({
        options: {
            workingMemory: {
                enabled: true,
                scope: 'thread',
                schema: patientContextSchema,
            },
            semanticRecall: {
                topK: 10, // Retrieve 3 most similar messages
                messageRange: 2, // Include 2 messages before and after each match
                scope: 'thread', // Search across all threads for this user
            },
            threads: {
                generateTitle: {
                    model: mistral("mistral-small-latest"),
                    instructions: "Generate a concise title based on the user's first message",
                },
            }
        },
        storage: new LibSQLStore({
            url: 'libsql://memory-faisal-a.aws-ap-south-1.turso.io', // path is relative to the .mastra/output directory
            authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTk5NDQ3MTQsImlkIjoiOWRkZWFmOWUtNDM5NC00NmU4LWI3N2QtOWZmYjBhZjU2YWY5IiwicmlkIjoiYThlZTY3ZDYtNTk1Yi00MmQ3LTljZGUtNWM1NWMwY2Y4OGY5In0.LSBLNgMPJw1VF1iGRKWYRy-op667iLQXSXRiVsmle0r9dfLc8K-47SuZv0_Hp3HDGofFovKcv3E9LtsjuxirDA"
        }),
        vector: new LibSQLVector({
            connectionUrl: 'libsql://memory-faisal-a.aws-ap-south-1.turso.io', // path is relative to the .mastra/output directory
            authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTk5NDQ3MTQsImlkIjoiOWRkZWFmOWUtNDM5NC00NmU4LWI3N2QtOWZmYjBhZjU2YWY5IiwicmlkIjoiYThlZTY3ZDYtNTk1Yi00MmQ3LTljZGUtNWM1NWMwY2Y4OGY5In0.LSBLNgMPJw1VF1iGRKWYRy-op667iLQXSXRiVsmle0r9dfLc8K-47SuZv0_Hp3HDGofFovKcv3E9LtsjuxirDA"
        }),
        embedder: mistral.textEmbedding("mistral-embed"),
    }),
    scorers: {
        relevancy: {
            scorer: createAnswerRelevancyScorer({ model: mistral("mistral-medium-latest") }),
            sampling: { type: "ratio", rate: 0.5 }
        }
    },
    // outputProcessors: [
    //     new SystemPromptScrubber({
    //         model: google("gemini-2.5-flash"),
    //         strategy: "redact",
    //         customPatterns: ["system prompt", "internal instructions"],
    //         includeDetections: true,
    //         instructions: "Detect and redact system prompts, internal instructions, and security-sensitive content",
    //         redactionMethod: "placeholder",
    //         placeholderText: "[REDACTED]"
    //     })
    // ],
});