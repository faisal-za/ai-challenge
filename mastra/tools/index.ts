import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createVectorQueryTool } from "@mastra/rag";
import { google } from "@ai-sdk/google"
import { Api } from "@/lib/icdApi"
import { icdAuthService } from '@/lib/icdAuth';
import axios from 'axios';

// ============================================================================
// ICD-11 DIAGNOSTIC TOOL
// ============================================================================

// Enums for structured inputs
const SexEnum = z.enum(['male', 'female', 'other', 'unknown']);
const SeverityEnum = z.enum(['mild', 'moderate', 'severe', 'critical']);

// Enhanced input schema with clinical context for improved diagnostic accuracy
const icdInputSchema = z.object({
    // === CRITICAL INPUTS ===
    query: z.string().min(3).describe('Primary symptom, condition, or diagnostic query'),

    sex: SexEnum.optional().describe('(B) Agent-only: Patient sex - used to exclude gender-specific conditions'),

    age: z.union([
        z.number().int().min(0).max(120),
        z.string().regex(/^P\d+[YMD]$/) // ISO 8601 duration like "P55Y"
    ]).optional().describe('(B) Agent-only: Patient age in years or ISO 8601 format - influences age-appropriate differential'),

    // === HELPFUL CLINICAL CONTEXT (Optional) ===
    symptomOnset: z.string().optional().describe('(B) Agent-only: When symptoms started (e.g., "2 days ago", "sudden onset this morning")'),

    symptomDuration: z.string().optional().describe('(B) Agent-only: How long symptoms have persisted - helps distinguish acute vs chronic'),

    severity: SeverityEnum.optional().describe('(B) Agent-only: Symptom severity - influences urgency and differential weighting'),

    anatomicalLocation: z.string().optional().describe('(A) Partial API support via post-coordination: Body location of symptoms'),

    medicalHistory: z.array(z.string()).optional().describe('(B) Agent-only: Past diagnoses/conditions - weights differential diagnoses'),

    currentMedications: z.array(z.string()).optional().describe('(B) Agent-only: Current medications - identifies drug-related causes'),

    allergies: z.array(z.string()).optional().describe('(B) Agent-only: Known allergies - excludes allergic conditions if not relevant'),

    isPregnant: z.boolean().optional().describe('(B) Agent-only: Pregnancy status - excludes/includes pregnancy-related conditions'),

    recentTravel: z.string().optional().describe('(B) Agent-only: Recent travel locations - weights infectious disease differential'),

    familyHistory: z.array(z.string()).optional().describe('(B) Agent-only: Family medical history - weights hereditary conditions'),

    vitalSigns: z.object({
        temperature: z.number().optional().describe('Body temperature in Celsius'),
        heartRate: z.number().optional().describe('Heart rate in BPM'),
        bloodPressure: z.string().optional().describe('BP in mmHg (e.g., "120/80")'),
        respiratoryRate: z.number().optional().describe('Respiratory rate per minute'),
        oxygenSaturation: z.number().optional().describe('SpO2 percentage'),
    }).optional().describe('(B) Agent-only: Vital signs - confirms/excludes physiological conditions'),

    labResults: z.record(z.string(), z.any()).optional().describe('(B) Agent-only: Lab test results - confirms/excludes conditions'),

    // === API-SPECIFIC PARAMETERS ===
    mode: z.enum(['autocoding', 'search', 'lookup']).default('autocoding').describe(
        'Query mode: "autocoding" for best match, "search" for multiple results, "lookup" for code reference'
    ),
    chapterFilter: z.string().optional().describe('Optional chapter codes filter (e.g., "01;05;21")'),
    subtreesFilter: z.string().optional().describe('Optional comma-separated URIs to limit search scope'),
    language: z.string().default('en').describe('Language code (default: "en")'),
});

// Comprehensive output schema
const icdOutputSchema = z.object({
    // Primary diagnosis
    primaryDiagnosis: z.object({
        code: z.string().describe('ICD-11 code (e.g., "1A00" or "1A00&XN62R")'),
        title: z.string().describe('Official diagnostic title'),
        definition: z.string().optional().describe('Clinical definition'),
        longDefinition: z.string().optional().describe('Extended clinical definition'),
        fullySpecifiedName: z.string().optional().describe('Fully specified diagnostic name'),
        browserUrl: z.string().describe('Direct link to ICD-11 browser'),
        foundationUri: z.string().optional().describe('Foundation component URI'),
        linearizationUri: z.string().optional().describe('MMS linearization URI'),
        matchScore: z.number().optional().describe('Confidence score (0-1)'),
    }),

    // Alternative diagnoses
    alternatives: z.array(z.object({
        code: z.string(),
        title: z.string(),
        matchScore: z.number(),
        browserUrl: z.string(),
    })).optional().describe('Top alternative diagnoses (if mode=search)'),

    // Clinical details (comprehensive)
    clinicalDetails: z.object({
        classKind: z.string().optional().describe('Entity type: chapter, block, category'),
        inclusions: z.array(z.string()).optional().describe('Conditions included in this diagnosis'),
        exclusions: z.array(z.string()).optional().describe('Conditions excluded from this diagnosis'),
        indexTerms: z.array(z.string()).optional().describe('Synonyms and index terms'),
        postcoordinationAxes: z.array(z.object({
            axisName: z.string(),
            required: z.boolean(),
            allowMultiple: z.boolean(),
        })).optional().describe('Available post-coordination axes (for complex coding)'),
    }).optional(),

    // Post-coordination breakdown (if applicable)
    postcoordination: z.object({
        stemCode: z.string().describe('Base code'),
        axes: z.array(z.object({
            name: z.string(),
            values: z.array(z.string()),
        })),
    }).optional().describe('Breakdown of complex post-coordinated codes'),

    // Agent reasoning and clinical decision support
    agentReasoning: z.object({
        inputsProvided: z.array(z.string()).describe('Clinical inputs provided by user'),
        queryRefinements: z.array(z.string()).describe('How the query was modified based on clinical context'),
        excludedConditions: z.array(z.object({
            reason: z.string(),
            examples: z.array(z.string()),
        })).describe('Conditions excluded due to patient demographics/context'),
        includedConsiderations: z.array(z.string()).describe('Conditions prioritized due to clinical context'),
        confidenceLevel: z.enum(['high', 'medium', 'low']).describe('Diagnostic confidence based on inputs and match score'),
        recommendations: z.array(z.string()).describe('Clinical recommendations (e.g., "Consider additional workup", "Rule out X")'),
    }),

    // Metadata
    metadata: z.object({
        releaseId: z.string().describe('ICD-11 release version'),
        queryMode: z.string().describe('Mode used for this query'),
        executionTime: z.number().describe('Query execution time (ms)'),
    }),
});

// ============================================================================
// QUERY REFINEMENT HELPERS
// ============================================================================

// Type for clinical context extraction
type ClinicalContext = z.infer<typeof icdInputSchema>;

/**
 * Apply agent reasoning to clinical inputs and generate query refinements
 * Returns modified query, filters, and reasoning explanations
 */
function applyAgentReasoning(context: ClinicalContext): {
    modifiedQuery: string;
    chapterFilter?: string;
    subtreesFilter?: string;
    reasoning: {
        inputsProvided: string[];
        queryRefinements: string[];
        excludedConditions: Array<{ reason: string; examples: string[] }>;
        includedConsiderations: string[];
    };
} {
    let modifiedQuery = context.query;
    const inputsProvided: string[] = [];
    const queryRefinements: string[] = [];
    const excludedConditions: Array<{ reason: string; examples: string[] }> = [];
    const includedConsiderations: string[] = [];
    let chapterFilter = context.chapterFilter;

    // Track which inputs were provided
    if (context.sex) inputsProvided.push(`sex: ${context.sex}`);
    if (context.age) inputsProvided.push(`age: ${context.age}`);
    if (context.severity) inputsProvided.push(`severity: ${context.severity}`);
    if (context.symptomDuration) inputsProvided.push(`duration: ${context.symptomDuration}`);
    if (context.medicalHistory?.length) inputsProvided.push(`medical history: ${context.medicalHistory.length} conditions`);
    if (context.currentMedications?.length) inputsProvided.push(`medications: ${context.currentMedications.length} drugs`);
    if (context.isPregnant !== undefined) inputsProvided.push(`pregnancy: ${context.isPregnant}`);
    if (context.recentTravel) inputsProvided.push(`travel: ${context.recentTravel}`);
    if (context.vitalSigns) inputsProvided.push('vital signs provided');
    if (context.labResults) inputsProvided.push('lab results provided');

    // === AGE-BASED REASONING ===
    const ageValue = typeof context.age === 'number' ? context.age :
                     typeof context.age === 'string' ? parseInt(context.age.match(/\d+/)?.[0] || '0') : null;

    if (ageValue !== null) {
        if (ageValue < 2) {
            modifiedQuery = `neonatal infant ${modifiedQuery}`;
            queryRefinements.push('Added "neonatal infant" prefix for age < 2 years');
            includedConsiderations.push('Prioritizing pediatric/congenital conditions');
        } else if (ageValue < 12) {
            modifiedQuery = `pediatric child ${modifiedQuery}`;
            queryRefinements.push('Added "pediatric child" prefix for age < 12 years');
            includedConsiderations.push('Prioritizing childhood diseases');
        } else if (ageValue >= 65) {
            modifiedQuery = `geriatric elderly ${modifiedQuery}`;
            queryRefinements.push('Added "geriatric elderly" prefix for age ≥ 65 years');
            includedConsiderations.push('Prioritizing age-related degenerative conditions');
        }
    }

    // === SEX-BASED EXCLUSIONS ===
    if (context.sex === 'male') {
        // Exclude chapter 18 (Pregnancy, childbirth and puerperium)
        const excludedChapters = ['18'];
        chapterFilter = chapterFilter
            ? `${chapterFilter};${excludedChapters.join(';')}`
            : excludedChapters.join(';');

        excludedConditions.push({
            reason: 'Patient is male',
            examples: [
                'Pregnancy-related conditions',
                'Ovarian pathology',
                'Uterine conditions',
                'Ectopic pregnancy',
            ],
        });
    } else if (context.sex === 'female' && !context.isPregnant) {
        excludedConditions.push({
            reason: 'Patient is female but not pregnant',
            examples: ['Pregnancy complications (unless considering pregnancy as differential)'],
        });
    }

    // === PREGNANCY-SPECIFIC REASONING ===
    if (context.isPregnant === true) {
        modifiedQuery = `pregnancy ${modifiedQuery}`;
        queryRefinements.push('Added "pregnancy" prefix due to pregnancy status');
        includedConsiderations.push('Prioritizing pregnancy-related complications');
        includedConsiderations.push('Considering conditions common in pregnancy (gestational diabetes, preeclampsia)');
    }

    // === DURATION-BASED REASONING ===
    if (context.symptomDuration) {
        const durationLower = context.symptomDuration.toLowerCase();

        if (durationLower.includes('week') || durationLower.includes('month') || durationLower.includes('year') || durationLower.includes('chronic')) {
            modifiedQuery = `chronic ${modifiedQuery}`;
            queryRefinements.push('Added "chronic" qualifier based on duration');
            excludedConditions.push({
                reason: 'Chronic presentation (weeks to months)',
                examples: ['Acute infections', 'Sudden-onset emergencies'],
            });
        } else if (durationLower.includes('hour') || durationLower.includes('day') || durationLower.includes('acute') || durationLower.includes('sudden')) {
            modifiedQuery = `acute ${modifiedQuery}`;
            queryRefinements.push('Added "acute" qualifier based on duration');
            excludedConditions.push({
                reason: 'Acute presentation (hours to days)',
                examples: ['Chronic degenerative diseases', 'Long-standing conditions'],
            });
        }
    }

    // === TRAVEL-BASED REASONING ===
    if (context.recentTravel) {
        modifiedQuery = `${modifiedQuery} travel-related infection`;
        queryRefinements.push(`Added "travel-related infection" due to travel to: ${context.recentTravel}`);
        includedConsiderations.push('Considering tropical/endemic diseases based on travel history');

        const travelLower = context.recentTravel.toLowerCase();
        if (travelLower.includes('tropical') || travelLower.includes('africa') || travelLower.includes('asia')) {
            includedConsiderations.push('Malaria, dengue, typhoid in differential');
        }
    }

    // === MEDICATION-RELATED REASONING ===
    if (context.currentMedications?.length) {
        includedConsiderations.push('Considering drug-induced conditions/side effects');

        const hasAnticoagulants = context.currentMedications.some(med =>
            med.toLowerCase().includes('warfarin') ||
            med.toLowerCase().includes('heparin') ||
            med.toLowerCase().includes('rivaroxaban')
        );

        if (hasAnticoagulants && context.query.toLowerCase().includes('bleed')) {
            includedConsiderations.push('Anticoagulant use increases bleeding risk - prioritize hemorrhagic conditions');
        }
    }

    // === VITAL SIGNS REASONING ===
    if (context.vitalSigns) {
        const vitals = context.vitalSigns;

        if (vitals.temperature && vitals.temperature > 38.0) {
            modifiedQuery = `febrile ${modifiedQuery}`;
            queryRefinements.push('Added "febrile" due to elevated temperature');
            includedConsiderations.push('Prioritizing infectious/inflammatory conditions');
        }

        if (vitals.oxygenSaturation && vitals.oxygenSaturation < 92) {
            includedConsiderations.push('Hypoxia present - prioritizing respiratory/cardiac conditions');
        }
    }

    return {
        modifiedQuery: modifiedQuery.trim(),
        chapterFilter,
        subtreesFilter: context.subtreesFilter,
        reasoning: {
            inputsProvided,
            queryRefinements,
            excludedConditions,
            includedConsiderations,
        },
    };
}

/**
 * Compute confidence level based on match score and clinical context
 */
function computeConfidence(
    matchScore: number | undefined,
    inputsProvidedCount: number,
    alternativesCount: number
): 'high' | 'medium' | 'low' {
    // High confidence: good match score + sufficient clinical context
    if (matchScore && matchScore >= 0.8 && inputsProvidedCount >= 3) {
        return 'high';
    }

    // High confidence: excellent match score even with minimal context
    if (matchScore && matchScore >= 0.95) {
        return 'high';
    }

    // Low confidence: poor match score or many alternatives
    if (!matchScore || matchScore < 0.5 || alternativesCount > 10) {
        return 'low';
    }

    // Medium confidence: everything else
    return 'medium';
}

/**
 * Generate clinical recommendations based on confidence and context
 */
function generateRecommendations(
    confidence: 'high' | 'medium' | 'low',
    context: ClinicalContext,
    alternativesCount: number
): string[] {
    const recommendations: string[] = [];

    if (confidence === 'low') {
        recommendations.push('Low diagnostic confidence - consider additional clinical workup');
        recommendations.push('Review differential diagnoses carefully');
    }

    if (alternativesCount > 5) {
        recommendations.push('Multiple possible diagnoses - use clinical judgment and additional testing');
    }

    if (!context.vitalSigns) {
        recommendations.push('Vital signs not provided - obtain complete vital signs for better assessment');
    }

    if (!context.labResults) {
        recommendations.push('No lab results provided - consider ordering appropriate diagnostic tests');
    }

    if (context.severity === 'severe' || context.severity === 'critical') {
        recommendations.push('SEVERE presentation - immediate clinical evaluation recommended');
    }

    if (!context.medicalHistory?.length) {
        recommendations.push('Medical history not provided - obtain complete history for context');
    }

    if (context.isPregnant === true) {
        recommendations.push('Patient is pregnant - ensure medications/treatments are pregnancy-safe');
    }

    return recommendations;
}

/**
 * Refine query by removing filler words and medical stopwords
 * Based on ICD API best practices
 */
function refineQuery(query: string, attempt: number): string {
    // Medical stopwords to remove (common but low-value terms)
    const stopwords = [
        'patient', 'has', 'having', 'with', 'the', 'a', 'an', 'for', 'days', 'weeks',
        'months', 'years', 'persistent', 'chronic', 'acute', 'severe', 'mild',
        'moderate', 'history', 'of', 'in', 'on', 'at', 'by', 'from', 'to',
        'complains', 'presenting', 'diagnosed', 'suspected'
    ];

    let refined = query.toLowerCase();

    switch (attempt) {
        case 1:
            // Attempt 1: Remove stopwords, keep core medical terms
            refined = refined
                .split(/\s+/)
                .filter(word => !stopwords.includes(word))
                .join(' ')
                .trim();
            break;

        case 2:
            // Attempt 2: Extract only primary symptoms/conditions (first 2-3 words)
            const words = refined
                .split(/\s+/)
                .filter(word => !stopwords.includes(word));
            refined = words.slice(0, Math.min(3, words.length)).join(' ');
            break;

        case 3:
            // Attempt 3: Add wildcard to each remaining word for broader matching
            refined = refined
                .split(/\s+/)
                .filter(word => !stopwords.includes(word) && word.length > 3)
                .map(word => `${word}%`)
                .join(' ');
            break;

        default:
            refined = refined
                .split(/\s+/)
                .filter(word => !stopwords.includes(word))
                .join(' ');
    }

    return refined || query; // Fallback to original if refinement produces empty string
}

/**
 * Check if API response indicates "no results" (404 or empty data)
 */
function isNoResultsError(error: any): boolean {
    if (!error) return false;

    // Check for 404 status
    if (error.status === 404 || error.response?.status === 404) {
        return true;
    }

    // Check for 500 with "not found" message
    if (error.status === 500 || error.response?.status === 500) {
        const errorMsg = error.message?.toLowerCase() || error.response?.data?.toLowerCase() || '';
        return errorMsg.includes('not found') || errorMsg.includes('no results');
    }

    // Check error message content
    const message = error.message?.toLowerCase() || '';
    return message.includes('not found') ||
           message.includes('no results') ||
           message.includes('no match');
}

/**
 * Perform search mode with progressive fallback (normal → flexible search)
 */
async function performSearchMode(
    client: any,
    linearization: string,
    releaseId: string,
    query: string,
    chapterFilter?: string,
    subtreesFilter?: string,
    startTime?: number
): Promise<any> {
    let searchResult;
    let useFlexible = false;

    // Try regular search first
    try {
        console.log(`[ICD API] Search mode attempt 1 (regular) with query: "${query}"`);
        searchResult = await client.icd.searchLinearization(linearization, releaseId, {
            q: query,
            chapterFilter,
            subtreesFilter,
            flatResults: true,
            medicalCodingMode: true,
        });
    } catch (error) {
        if (isNoResultsError(error)) {
            console.log('[ICD API] Regular search failed, trying flexible search');
            useFlexible = true;
        } else {
            throw error;
        }
    }

    // Try flexible search if regular failed
    if (useFlexible) {
        console.log(`[ICD API] Search mode attempt 2 (flexible) with query: "${query}"`);
        searchResult = await client.icd.searchLinearization(linearization, releaseId, {
            q: query,
            chapterFilter,
            subtreesFilter,
            flatResults: true,
            medicalCodingMode: true,
            useFlexisearch: true, // Enable flexible matching
        });
    }

    const entities = searchResult.data.destinationEntities || [];

    if (entities.length === 0) {
        throw new Error(
            `No ICD-11 codes found for query: "${query}". ` +
            `Try using more specific medical terminology or check spelling.`
        );
    }

    const topEntity = entities[0];

    // Fetch primary entity details
    const primaryId = topEntity.stemId?.split('/').pop() || topEntity.theCode || '';
    const primaryEntity = await client.icd.getLinearizationEntity(
        linearization,
        releaseId,
        primaryId,
        { include: 'ancestor' }
    );

    return {
        primaryDiagnosis: {
            code: topEntity.theCode || '',
            title: topEntity.title?.replace(/<[^>]*>/g, '') || '', // Strip HTML tags
            definition: primaryEntity.data.definition?.['@value'],
            longDefinition: primaryEntity.data.longDefinition?.['@value'],
            fullySpecifiedName: primaryEntity.data.fullySpecifiedName?.['@value'],
            browserUrl: primaryEntity.data.browserUrl || '',
            foundationUri: topEntity.stemId,
            linearizationUri: topEntity.id,
            matchScore: topEntity.score,
        },
        alternatives: entities.slice(1, 6).map(ent => ({
            code: ent.theCode || '',
            title: ent.title?.replace(/<[^>]*>/g, '') || '',
            matchScore: ent.score || 0,
            browserUrl: `https://icd.who.int/browse/${releaseId}/mms/en#${ent.theCode}`,
        })),
        clinicalDetails: {
            classKind: primaryEntity.data.classKind,
            inclusions: primaryEntity.data.inclusion?.map(t => t.label?.['@value'] || '').filter(Boolean),
            exclusions: primaryEntity.data.exclusion?.map(t => t.label?.['@value'] || '').filter(Boolean),
            indexTerms: primaryEntity.data.indexTerm?.map(t => t.label?.['@value'] || '').filter(Boolean),
            postcoordinationAxes: primaryEntity.data.postcoordinationScale?.map(axis => ({
                axisName: axis.axisName || '',
                required: axis.requiredPostcoordination === 'true',
                allowMultiple: axis.allowMultipleValues !== 'NotAllowed',
            })),
        },
        metadata: {
            releaseId,
            queryMode: useFlexible ? 'search-flexible' : 'search',
            executionTime: startTime ? Date.now() - startTime : 0,
        },
    };
}

// ICD API client factory with OAuth2 auto-refresh using axios
const createIcdClient = async () => {
    // Get valid token (auto-refreshes if expired)
    const token = await icdAuthService.getToken();

    return new Api({
        baseUrl: 'https://id.who.int',
        customFetch: async (url, options = {}) => {
            console.log(`[ICD API] Request: ${url}`);

            try {
                const response = await axios({
                    url: url.toString(),
                    method: (options.method as string) || 'GET',
                    headers: {
                        ...options.headers,
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Accept-Language': 'en',
                        'API-Version': 'v2',
                    },
                    data: options.body,
                    validateStatus: () => true, // Don't throw on any status
                });

                // Convert axios response to fetch Response format
                return new Response(
                    response.data ? JSON.stringify(response.data) : null,
                    {
                        status: response.status,
                        statusText: response.statusText,
                        headers: new Headers(response.headers as any),
                    }
                );
            } catch (error) {
                console.error('[ICD API] Request failed:', error);
                throw error;
            }
        },
    });
};

// Main tool definition
export const icdDiagnosticTool = createTool({
    id: 'icd-lookup',
    description: 'Perform ICD-11 diagnostic lookups for clinical decision support. Supports symptom autocoding, multi-result search, and code reference lookup with comprehensive clinical details.',
    inputSchema: icdInputSchema,
    outputSchema: icdOutputSchema,
    execute: async ({ context }) => {
        const startTime = Date.now();
        const client = await createIcdClient();

        const RELEASE_ID = '2025-01'; // Latest stable release
        const LINEARIZATION = 'mms'; // Mortality and Morbidity Statistics

        // === APPLY AGENT REASONING ===
        const agentResult = applyAgentReasoning(context);
        const refinedQuery = agentResult.modifiedQuery;
        const refinedChapterFilter = agentResult.chapterFilter;
        const refinedSubtreesFilter = agentResult.subtreesFilter;

        console.log('[Agent Reasoning] Original query:', context.query);
        console.log('[Agent Reasoning] Refined query:', refinedQuery);
        console.log('[Agent Reasoning] Inputs provided:', agentResult.reasoning.inputsProvided);
        console.log('[Agent Reasoning] Query refinements:', agentResult.reasoning.queryRefinements);

        try {
            // Mode 1: AUTOCODING - Best single match WITH INTELLIGENT RETRY
            if (context.mode === 'autocoding') {
                let result;
                let currentQuery = refinedQuery; // Start with agent-refined query
                let attemptNumber = 0;
                let lastError;

                // Retry strategy: 3 attempts with progressive query refinement
                while (attemptNumber < 3) {
                    attemptNumber++;
                    console.log(`[ICD API] Autocoding attempt ${attemptNumber} with query: "${currentQuery}"`);

                    try {
                        result = await client.icd.autoCode(LINEARIZATION, RELEASE_ID, {
                            searchText: currentQuery,
                            subtreesFilter: refinedSubtreesFilter,
                        });

                        // Success! Break the retry loop
                        break;
                    } catch (error: any) {
                        lastError = error;
                        console.log(`[ICD API] Attempt ${attemptNumber} failed:`, error.status, error.message);

                        // Check if this is a "no results" error (404/500)
                        if (isNoResultsError(error)) {
                            console.log('[ICD API] No results found, refining query...');

                            // Refine query for next attempt
                            currentQuery = refineQuery(refinedQuery, attemptNumber);

                            if (currentQuery === refinedQuery && attemptNumber === 1) {
                                // If refinement didn't change query, skip to search mode
                                console.log('[ICD API] Query refinement had no effect, switching to search mode');
                                break;
                            }
                        } else {
                            // Real error (auth, network, etc.) - don't retry
                            throw error;
                        }
                    }
                }

                // If all autocoding attempts failed, fall back to SEARCH mode
                if (!result) {
                    console.log('[ICD API] Autocoding failed after retries, falling back to SEARCH mode');
                    const searchResult = await performSearchMode(
                        client,
                        LINEARIZATION,
                        RELEASE_ID,
                        refineQuery(refinedQuery, 1),
                        refinedChapterFilter,
                        refinedSubtreesFilter,
                        startTime
                    );

                    // Add agent reasoning to search result
                    const confidence = computeConfidence(
                        searchResult.primaryDiagnosis.matchScore,
                        agentResult.reasoning.inputsProvided.length,
                        searchResult.alternatives?.length || 0
                    );

                    return {
                        ...searchResult,
                        agentReasoning: {
                            ...agentResult.reasoning,
                            confidenceLevel: confidence,
                            recommendations: generateRecommendations(
                                confidence,
                                context,
                                searchResult.alternatives?.length || 0
                            ),
                        },
                    };
                }

                console.log('[ICD API] Autocode result:', JSON.stringify(result.data, null, 2));

                // Validate that we have a linearization URI
                if (!result.data.linearizationURI) {
                    throw new Error(
                        `No linearization URI returned from autocoding. ` +
                        `This might mean no match was found for query: "${refinedQuery}"`
                    );
                }

                // Parse linearization URI to extract entity ID and residual suffix
                // Possible formats:
                // - http://id.who.int/icd/release/11/2025-01/mms/2074372855
                // - http://id.who.int/icd/release/11/2025-01/mms/2074372855/unspecified
                // - http://id.who.int/icd/release/11/2025-01/mms/2074372855/other
                const linearizationURI = result.data.linearizationURI;
                console.log('[ICD API] Full linearization URI:', linearizationURI);

                const uriParts = linearizationURI.split('/').filter(Boolean); // Remove empty strings
                const lastPart = uriParts[uriParts.length - 1];
                const secondLastPart = uriParts[uriParts.length - 2];

                console.log('[ICD API] URI parts:', { lastPart, secondLastPart, allParts: uriParts });

                // Check if last part is a residual category (unspecified/other)
                const residualCategories = ['unspecified', 'other'];
                const isResidual = residualCategories.includes(lastPart?.toLowerCase() || '');

                const entityId = isResidual ? secondLastPart : lastPart;
                const residualType = isResidual ? lastPart : undefined;

                console.log('[ICD API] Parsed:', { entityId, residualType, isResidual });

                // Validate entity ID
                if (!entityId || entityId === 'mms' || entityId === LINEARIZATION) {
                    throw new Error(
                        `Invalid entity ID extracted: "${entityId}" from URI: ${linearizationURI}`
                    );
                }

                // Use appropriate API method based on whether it's a residual entity
                const entity = residualType
                    ? await client.icd.getLinearizationResidualEntity(
                        LINEARIZATION,
                        RELEASE_ID,
                        entityId,
                        residualType,
                        { include: 'ancestor' }
                    )
                    : await client.icd.getLinearizationEntity(
                        LINEARIZATION,
                        RELEASE_ID,
                        entityId,
                        { include: 'ancestor,descendant' }
                    );

                // Calculate confidence and recommendations
                const confidence = computeConfidence(
                    result.data.matchScore,
                    agentResult.reasoning.inputsProvided.length,
                    0 // autocoding returns single result
                );

                return {
                    primaryDiagnosis: {
                        code: result.data.theCode || '',
                        title: result.data.matchingText || entity.data.title?.['@value'] || '',
                        definition: entity.data.definition?.['@value'],
                        longDefinition: entity.data.longDefinition?.['@value'],
                        fullySpecifiedName: entity.data.fullySpecifiedName?.['@value'],
                        browserUrl: result.data.linearizationURI || entity.data.browserUrl || '',
                        foundationUri: result.data.foundationURI,
                        linearizationUri: result.data.linearizationURI,
                        matchScore: result.data.matchScore,
                    },
                    clinicalDetails: {
                        classKind: entity.data.classKind,
                        inclusions: entity.data.inclusion?.map(t => t.label?.['@value'] || '').filter(Boolean),
                        exclusions: entity.data.exclusion?.map(t => t.label?.['@value'] || '').filter(Boolean),
                        indexTerms: entity.data.indexTerm?.map(t => t.label?.['@value'] || '').filter(Boolean),
                        postcoordinationAxes: entity.data.postcoordinationScale?.map(axis => ({
                            axisName: axis.axisName || '',
                            required: axis.requiredPostcoordination === 'true',
                            allowMultiple: axis.allowMultipleValues !== 'NotAllowed',
                        })),
                    },
                    agentReasoning: {
                        ...agentResult.reasoning,
                        confidenceLevel: confidence,
                        recommendations: generateRecommendations(confidence, context, 0),
                    },
                    metadata: {
                        releaseId: RELEASE_ID,
                        queryMode: 'autocoding',
                        executionTime: Date.now() - startTime,
                    },
                };
            }

            // Mode 2: SEARCH - Multiple results
            if (context.mode === 'search') {
                const searchResult = await client.icd.searchLinearization(LINEARIZATION, RELEASE_ID, {
                    q: refinedQuery,
                    chapterFilter: refinedChapterFilter,
                    subtreesFilter: refinedSubtreesFilter,
                    flatResults: true,
                    medicalCodingMode: true,
                });

                const entities = searchResult.data.destinationEntities || [];
                const topEntity = entities[0];

                if (!topEntity) {
                    throw new Error(`No results found for query: "${refinedQuery}"`);
                }

                // Fetch primary entity details
                const primaryId = topEntity.stemId?.split('/').pop() || topEntity.theCode || '';
                const primaryEntity = await client.icd.getLinearizationEntity(
                    LINEARIZATION,
                    RELEASE_ID,
                    primaryId,
                    { include: 'ancestor' }
                );

                // Calculate confidence and recommendations
                const confidence = computeConfidence(
                    topEntity.score,
                    agentResult.reasoning.inputsProvided.length,
                    entities.length
                );

                return {
                    primaryDiagnosis: {
                        code: topEntity.theCode || '',
                        title: topEntity.title?.replace(/<[^>]*>/g, '') || '', // Strip HTML tags
                        definition: primaryEntity.data.definition?.['@value'],
                        longDefinition: primaryEntity.data.longDefinition?.['@value'],
                        fullySpecifiedName: primaryEntity.data.fullySpecifiedName?.['@value'],
                        browserUrl: primaryEntity.data.browserUrl || '',
                        foundationUri: topEntity.stemId,
                        linearizationUri: topEntity.id,
                        matchScore: topEntity.score,
                    },
                    alternatives: entities.slice(1, 6).map(ent => ({
                        code: ent.theCode || '',
                        title: ent.title?.replace(/<[^>]*>/g, '') || '',
                        matchScore: ent.score || 0,
                        browserUrl: `https://icd.who.int/browse/${RELEASE_ID}/mms/en#${ent.theCode}`,
                    })),
                    clinicalDetails: {
                        classKind: primaryEntity.data.classKind,
                        inclusions: primaryEntity.data.inclusion?.map(t => t.label?.['@value'] || '').filter(Boolean),
                        exclusions: primaryEntity.data.exclusion?.map(t => t.label?.['@value'] || '').filter(Boolean),
                        indexTerms: primaryEntity.data.indexTerm?.map(t => t.label?.['@value'] || '').filter(Boolean),
                        postcoordinationAxes: primaryEntity.data.postcoordinationScale?.map(axis => ({
                            axisName: axis.axisName || '',
                            required: axis.requiredPostcoordination === 'true',
                            allowMultiple: axis.allowMultipleValues !== 'NotAllowed',
                        })),
                    },
                    agentReasoning: {
                        ...agentResult.reasoning,
                        confidenceLevel: confidence,
                        recommendations: generateRecommendations(confidence, context, entities.length),
                    },
                    metadata: {
                        releaseId: RELEASE_ID,
                        queryMode: 'search',
                        executionTime: Date.now() - startTime,
                    },
                };
            }

            // Mode 3: LOOKUP - Code reference
            if (context.mode === 'lookup') {
                // Check if query is a complex post-coordinated code
                const isPostcoordinated = context.query.includes('&') || context.query.includes('/');

                if (isPostcoordinated) {
                    const codeInfo = await client.icd.getCodeInfo(LINEARIZATION, RELEASE_ID, context.query, {
                        flexiblemode: true,
                    });

                    // Fetch stem entity details
                    const stemId = codeInfo.data.stemId?.split('/').pop() || codeInfo.data.stemCode || '';
                    const stemEntity = await client.icd.getLinearizationEntity(
                        LINEARIZATION,
                        RELEASE_ID,
                        stemId
                    );

                    const confidence = computeConfidence(
                        1.0, // Lookup mode has exact match
                        agentResult.reasoning.inputsProvided.length,
                        0
                    );

                    return {
                        primaryDiagnosis: {
                            code: codeInfo.data.code || context.query,
                            title: stemEntity.data.title?.['@value'] || '',
                            definition: stemEntity.data.definition?.['@value'],
                            longDefinition: stemEntity.data.longDefinition?.['@value'],
                            fullySpecifiedName: stemEntity.data.fullySpecifiedName?.['@value'],
                            browserUrl: stemEntity.data.browserUrl || '',
                            foundationUri: codeInfo.data.stemId,
                        },
                        postcoordination: {
                            stemCode: codeInfo.data.stemCode || '',
                            axes: Object.entries(codeInfo.data)
                                .filter(([key, value]) => Array.isArray(value) && value.length > 0)
                                .map(([key, value]) => ({
                                    name: key,
                                    values: value as string[],
                                })),
                        },
                        clinicalDetails: {
                            classKind: stemEntity.data.classKind,
                            inclusions: stemEntity.data.inclusion?.map(t => t.label?.['@value'] || '').filter(Boolean),
                            exclusions: stemEntity.data.exclusion?.map(t => t.label?.['@value'] || '').filter(Boolean),
                        },
                        agentReasoning: {
                            ...agentResult.reasoning,
                            confidenceLevel: confidence,
                            recommendations: generateRecommendations(confidence, context, 0),
                        },
                        metadata: {
                            releaseId: RELEASE_ID,
                            queryMode: 'lookup',
                            executionTime: Date.now() - startTime,
                        },
                    };
                } else {
                    // Simple code lookup
                    const entity = await client.icd.getLinearizationEntity(
                        LINEARIZATION,
                        RELEASE_ID,
                        context.query,
                        { include: 'ancestor,descendant' }
                    );

                    const confidence = computeConfidence(
                        1.0, // Lookup mode has exact match
                        agentResult.reasoning.inputsProvided.length,
                        0
                    );

                    return {
                        primaryDiagnosis: {
                            code: entity.data.code || context.query,
                            title: entity.data.title?.['@value'] || '',
                            definition: entity.data.definition?.['@value'],
                            longDefinition: entity.data.longDefinition?.['@value'],
                            fullySpecifiedName: entity.data.fullySpecifiedName?.['@value'],
                            browserUrl: entity.data.browserUrl || '',
                            foundationUri: entity.data.source,
                            linearizationUri: entity.data['@id'],
                        },
                        clinicalDetails: {
                            classKind: entity.data.classKind,
                            inclusions: entity.data.inclusion?.map(t => t.label?.['@value'] || '').filter(Boolean),
                            exclusions: entity.data.exclusion?.map(t => t.label?.['@value'] || '').filter(Boolean),
                            indexTerms: entity.data.indexTerm?.map(t => t.label?.['@value'] || '').filter(Boolean),
                            postcoordinationAxes: entity.data.postcoordinationScale?.map(axis => ({
                                axisName: axis.axisName || '',
                                required: axis.requiredPostcoordination === 'true',
                                allowMultiple: axis.allowMultipleValues !== 'NotAllowed',
                            })),
                        },
                        agentReasoning: {
                            ...agentResult.reasoning,
                            confidenceLevel: confidence,
                            recommendations: generateRecommendations(confidence, context, 0),
                        },
                        metadata: {
                            releaseId: RELEASE_ID,
                            queryMode: 'lookup',
                            executionTime: Date.now() - startTime,
                        },
                    };
                }
            }

            throw new Error(`Invalid mode: ${context.mode}`);

        } catch (error: any) {
            console.error('ICD-11 Tool Error Details:', {
                message: error?.message,
                status: error?.status,
                data: error?.data,
                error: error,
            });
            throw new Error(
                `ICD-11 API Error: ${error?.message || 'Unknown error'}\nStatus: ${error?.status || 'N/A'}`
            );
        }
    },
});


export const pineconeQueryTool = createVectorQueryTool({
    vectorStoreName: "pinecone",
    indexName: "tickets-gemini",
    model: google.textEmbeddingModel("text-embedding-004")
});