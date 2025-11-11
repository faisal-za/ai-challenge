/**
 * Diabetes Risk Feature Engineering Module
 *
 * Pure TypeScript module for computing leakage-safe features from patient data.
 * Uses a look-back window ending GAP_DAYS before indexDate to prevent data leakage.
 */

// ============================================================================
// Types
// ============================================================================

export type PatientInput = {
  id: string;
  gender?: 'M' | 'F' | string;
  age?: Date | string; // Birth date (field name from sample data)
  indexDate: Date | string; // Reference date for windowing

  observations: Array<{
    date: Date | string;
    value: string | number;
    description?: string;
    code?: string;
    units?: string;
    type?: string;
  }>;

  medications: Array<{
    description?: string;
    start: Date | string;
    stop?: Date | string;
    is_active?: boolean | string;
    dispenses_cap?: string | number;
  }>;

  conditions: Array<{
    code?: string;
    description?: string;
    start: Date | string;
    stop?: Date | string;
  }>;

  encounters: Array<{
    start: Date | string;
    stop?: Date | string;
    has_reason?: boolean | string;
    payer_coverage?: string | number;
  }>;
};

export type Options = {
  lookbackDays?: number;
  gapDays?: number;
  trendDays?: number;

  glucoseFastingThresholdDiabetes?: number;
  glucoseFastingThresholdPrediabetes?: number;
  hba1cHighThresholdDiabetes?: number;
  hba1cHighThresholdPrediabetes?: number;

  diabetesMedNames?: string[];
  chronicConditionKeywords?: string[];
};

export type Features = {
  age_years_at_index: number | null;
  sex_male: 0 | 1 | null;

  bmi_mean_365d: number | null;
  bmi_min_365d: number | null;
  bmi_max_365d: number | null;
  bmi_trend_90d: number | null;

  bp_sys_mean_365d: number | null;
  bp_dia_mean_365d: number | null;

  glucose_fasting_mean_365d: number | null;
  glucose_fasting_high_count_365d: number;

  hba1c_prev_mean_365d: number | null;
  hba1c_prev_high_count_365d: number;

  lipids_ldl_mean_365d: number | null;

  smoking_flag: 0 | 1 | null;
  chronic_conditions_count: number;
  encounters_last_365d: number;
  days_since_last_encounter: number | null;

  active_diabetes_meds_flag_365d: 0 | 1;
  chronic_meds_count_365d: number;

  med_adherence_level_onehot_low: 0 | 1;
  med_adherence_level_onehot_medium: 0 | 1;
  med_adherence_level_onehot_high: 0 | 1;

  insurance_coverage_flag: 0 | 1 | null;
};

/**
 * Metadata about data availability and prediction confidence
 */
export type DataAvailabilityMetadata = {
  data_completeness_score: number; // 0-1, percentage of non-null features
  missing_feature_count: number; // Count of null features
  total_feature_count: number; // Total features (23)
  confidence_tier: 'high' | 'medium' | 'low'; // Based on completeness thresholds
  critical_features_present: boolean; // Whether key features (glucose, HbA1c, BMI) are present
};

// ============================================================================
// Constants
// ============================================================================

/**
 * Feature order matching the exact insertion order in Features type.
 * Use this for ML model training/inference to ensure consistent column ordering.
 */
export const FEATURE_ORDER: readonly string[] = [
  'age_years_at_index',
  'sex_male',
  'bmi_mean_365d',
  'bmi_min_365d',
  'bmi_max_365d',
  'bmi_trend_90d',
  'bp_sys_mean_365d',
  'bp_dia_mean_365d',
  'glucose_fasting_mean_365d',
  'glucose_fasting_high_count_365d',
  'hba1c_prev_mean_365d',
  'hba1c_prev_high_count_365d',
  'lipids_ldl_mean_365d',
  'smoking_flag',
  'chronic_conditions_count',
  'encounters_last_365d',
  'days_since_last_encounter',
  'active_diabetes_meds_flag_365d',
  'chronic_meds_count_365d',
  'med_adherence_level_onehot_low',
  'med_adherence_level_onehot_medium',
  'med_adherence_level_onehot_high',
  'insurance_coverage_flag',
] as const;

const DEFAULT_OPTIONS: Required<Options> = {
  lookbackDays: 365,
  gapDays: 30,
  trendDays: 90,
  glucoseFastingThresholdDiabetes: 126,
  glucoseFastingThresholdPrediabetes: 100,
  hba1cHighThresholdDiabetes: 6.5,
  hba1cHighThresholdPrediabetes: 5.7,
  diabetesMedNames: [
    'insulin',
    'metformin',
    'glipizide',
    'glyburide',
    'glimepiride',
    'empagliflozin',
    'canagliflozin',
    'dapagliflozin',
    'ertugliflozin',
    'semaglutide',
    'liraglutide',
    'dulaglutide',
    'exenatide',
    'lixisenatide',
    'sitagliptin',
    'saxagliptin',
    'linagliptin',
    'alogliptin',
    'pioglitazone',
    'rosiglitazone',
    'repaglinide',
    'nateglinide',
    'acarbose',
    'miglitol',
  ],
  chronicConditionKeywords: ['diabetes', 'hypertension', 'dyslipidemia'],
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert a Date or string to a Date object.
 */
function toDate(d: Date | string | undefined | null): Date | null {
  if (!d) return null;
  if (d instanceof Date) return d;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Convert to number, handling string inputs.
 */
function toNumber(x: any): number | null {
  if (x === null || x === undefined || x === '') return null;
  const num = Number(x);
  return isNaN(num) ? null : num;
}

/**
 * Calculate days between two dates.
 */
function daysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date falls within a window [start, end] (inclusive).
 */
function isInWindow(date: Date, windowStart: Date, windowEnd: Date): boolean {
  return date >= windowStart && date <= windowEnd;
}

/**
 * Check if a medication overlaps with the window.
 * Handles null stop dates as ongoing (uses indexDate).
 */
export function medicationOverlapsWindow(
  medStart: Date,
  medStop: Date | null,
  windowStart: Date,
  windowEnd: Date,
  indexDate: Date
): boolean {
  const effectiveStop = medStop ?? indexDate;
  return medStart <= windowEnd && effectiveStop >= windowStart;
}

/**
 * Extract observations by code (priority) or description (fallback).
 * Returns values within the window.
 */
function extractObservations(
  observations: PatientInput['observations'],
  code: string,
  descriptionKeyword: string,
  windowStart: Date,
  windowEnd: Date
): Array<{ date: Date; value: number }> {
  const results: Array<{ date: Date; value: number }> = [];

  for (const obs of observations) {
    const obsDate = toDate(obs.date);
    if (!obsDate || !isInWindow(obsDate, windowStart, windowEnd)) continue;

    // Try code first, fallback to description
    const matchesCode = obs.code === code;
    const matchesDesc = obs.description?.toLowerCase().includes(descriptionKeyword.toLowerCase());

    if (matchesCode || matchesDesc) {
      const value = toNumber(obs.value);
      if (value !== null) {
        results.push({ date: obsDate, value });
      }
    }
  }

  return results;
}

/**
 * Calculate mean of an array of numbers.
 */
function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate min of an array of numbers.
 */
function min(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.min(...values);
}

/**
 * Calculate max of an array of numbers.
 */
function max(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.max(...values);
}

/**
 * Calculate linear regression slope for trend calculation.
 * Returns slope (value per day) or null if insufficient data.
 */
export function calculateTrend(
  observations: Array<{ date: Date; value: number }>,
  windowEnd: Date
): number | null {
  if (observations.length < 2) return null;

  // Convert dates to days since first observation
  const sortedObs = [...observations].sort((a, b) => a.date.getTime() - b.date.getTime());
  const firstDate = sortedObs[0].date;

  const points = sortedObs.map(obs => ({
    x: daysBetween(firstDate, obs.date),
    y: obs.value,
  }));

  // Simple linear regression: y = mx + b
  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);

  const denominator = n * sumX2 - sumX * sumX;
  if (Math.abs(denominator) < 1e-10) return null; // Avoid division by zero

  const slope = (n * sumXY - sumX * sumY) / denominator;
  return slope;
}

/**
 * Count observations above a threshold.
 * Deprecated: Use countDistinctDaysAboveThreshold for lab values.
 */
function countAboveThreshold(values: number[], threshold: number): number {
  return values.filter(v => v >= threshold).length;
}

/**
 * Count distinct days with observations above a threshold.
 * Collapses multiple same-day results to avoid double-counting.
 */
function countDistinctDaysAboveThreshold(
  observations: Array<{ date: Date; value: number }>,
  threshold: number
): number {
  const distinctDays = new Set<string>();

  for (const obs of observations) {
    if (obs.value >= threshold) {
      // Use YYYY-MM-DD format to ensure same calendar day
      const dayString = obs.date.toISOString().split('T')[0];
      distinctDays.add(dayString);
    }
  }

  return distinctDays.size;
}

/**
 * Extract latest smoking status within window.
 */
function getSmokingFlag(
  observations: PatientInput['observations'],
  windowStart: Date,
  windowEnd: Date
): 0 | 1 | null {
  const smokingObs = observations
    .filter(obs => {
      const obsDate = toDate(obs.date);
      return obsDate && isInWindow(obsDate, windowStart, windowEnd);
    })
    .filter(obs => {
      const matchesCode = obs.code === '72166-2';
      const matchesDesc = obs.description?.toLowerCase().includes('tobacco smoking status');
      return matchesCode || matchesDesc;
    })
    .sort((a, b) => {
      const dateA = toDate(a.date)!;
      const dateB = toDate(b.date)!;
      return dateB.getTime() - dateA.getTime();
    });

  if (smokingObs.length === 0) return null;

  const latestValue = String(smokingObs[0].value).toLowerCase();
  return latestValue.includes('never') ? 0 : 1;
}

/**
 * Count chronic conditions within window.
 */
function countChronicConditions(
  conditions: PatientInput['conditions'],
  windowStart: Date,
  windowEnd: Date,
  keywords: string[]
): number {
  const uniqueCodes = new Set<string>();

  for (const condition of conditions) {
    const startDate = toDate(condition.start);
    if (!startDate) continue;

    // Check if condition overlaps with window
    const stopDate = toDate(condition.stop);
    const effectiveStop = stopDate ?? new Date();

    if (startDate <= windowEnd && effectiveStop >= windowStart) {
      // Check if matches chronic condition keywords
      const desc = (condition.description || '').toLowerCase();
      const ischronic = keywords.some(kw => desc.includes(kw.toLowerCase()));

      if (ischronic && condition.code) {
        uniqueCodes.add(condition.code);
      }
    }
  }

  return uniqueCodes.size;
}

/**
 * Check if patient has active diabetes medications in window.
 */
function hasActiveDiabetesMeds(
  medications: PatientInput['medications'],
  windowStart: Date,
  windowEnd: Date,
  indexDate: Date,
  diabetesMedNames: string[]
): 0 | 1 {
  for (const med of medications) {
    const medStart = toDate(med.start);
    if (!medStart) continue;

    const medStop = toDate(med.stop);

    if (!medicationOverlapsWindow(medStart, medStop, windowStart, windowEnd, indexDate)) {
      continue;
    }

    // Check if medication name contains diabetes med token
    const medDesc = (med.description || '').toLowerCase();
    const isDiabetesMed = diabetesMedNames.some(token =>
      medDesc.includes(token.toLowerCase())
    );

    if (isDiabetesMed) return 1;
  }

  return 0;
}

/**
 * Count distinct chronic medications in window.
 */
function countChronicMeds(
  medications: PatientInput['medications'],
  windowStart: Date,
  windowEnd: Date,
  indexDate: Date
): number {
  const uniqueMeds = new Set<string>();

  for (const med of medications) {
    const medStart = toDate(med.start);
    if (!medStart) continue;

    const medStop = toDate(med.stop);

    if (medicationOverlapsWindow(medStart, medStop, windowStart, windowEnd, indexDate)) {
      if (med.description) {
        uniqueMeds.add(med.description);
      }
    }
  }

  return uniqueMeds.size;
}

/**
 * Calculate medication adherence level from dispenses.
 */
function calculateMedAdherence(
  medications: PatientInput['medications'],
  windowStart: Date,
  windowEnd: Date,
  indexDate: Date
): { low: 0 | 1; medium: 0 | 1; high: 0 | 1 } {
  let totalDispenses = 0;

  for (const med of medications) {
    const medStart = toDate(med.start);
    if (!medStart) continue;

    const medStop = toDate(med.stop);

    if (medicationOverlapsWindow(medStart, medStop, windowStart, windowEnd, indexDate)) {
      const dispenses = toNumber(med.dispenses_cap) ?? 0;
      totalDispenses += dispenses;
    }
  }

  // Bucket into low/medium/high
  if (totalDispenses >= 12) {
    return { low: 0, medium: 0, high: 1 };
  } else if (totalDispenses >= 6) {
    return { low: 0, medium: 1, high: 0 };
  } else {
    return { low: 1, medium: 0, high: 0 };
  }
}

/**
 * Count encounters in window.
 */
function countEncounters(
  encounters: PatientInput['encounters'],
  windowStart: Date,
  windowEnd: Date
): number {
  let count = 0;

  for (const encounter of encounters) {
    const encounterDate = toDate(encounter.start);
    if (encounterDate && isInWindow(encounterDate, windowStart, windowEnd)) {
      count++;
    }
  }

  return count;
}

/**
 * Calculate days since last encounter before indexDate.
 */
function daysSinceLastEncounter(
  encounters: PatientInput['encounters'],
  indexDate: Date
): number | null {
  const encounterDates = encounters
    .map(enc => toDate(enc.start))
    .filter((date): date is Date => date !== null && date <= indexDate)
    .sort((a, b) => b.getTime() - a.getTime());

  if (encounterDates.length === 0) return null;

  return daysBetween(encounterDates[0], indexDate);
}

/**
 * Check if patient has insurance coverage.
 */
function hasInsuranceCoverage(
  encounters: PatientInput['encounters']
): 0 | 1 | null {
  for (const encounter of encounters) {
    const coverage = toNumber(encounter.payer_coverage);
    if (coverage !== null && coverage > 0) {
      return 1;
    }
  }

  // If we have encounters but no coverage, return 0
  if (encounters.length > 0) return 0;

  // If no encounters at all, return null (unknown)
  return null;
}

/**
 * Calculate data availability metadata for confidence scoring
 */
export function calculateDataAvailability(features: Features): DataAvailabilityMetadata {
  // Count non-null features
  const featureValues = Object.values(features);
  const totalCount = featureValues.length;
  const nonNullCount = featureValues.filter(v => v !== null && v !== undefined).length;
  const missingCount = totalCount - nonNullCount;

  // Calculate completeness score (0-1)
  const completeness = nonNullCount / totalCount;

  // Check critical features (glucose, HbA1c, BMI mean)
  const criticalFeatures = [
    features.glucose_fasting_mean_365d,
    features.hba1c_prev_mean_365d,
    features.bmi_mean_365d,
  ];
  const criticalPresent = criticalFeatures.every(v => v !== null && v !== undefined);

  // Determine confidence tier
  let confidenceTier: 'high' | 'medium' | 'low';
  if (completeness >= 0.8) {
    confidenceTier = 'high';
  } else if (completeness >= 0.5) {
    confidenceTier = 'medium';
  } else {
    confidenceTier = 'low';
  }

  return {
    data_completeness_score: completeness,
    missing_feature_count: missingCount,
    total_feature_count: totalCount,
    confidence_tier: confidenceTier,
    critical_features_present: criticalPresent,
  };
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Build leakage-safe features for diabetes risk assessment.
 *
 * Uses a look-back window ending GAP_DAYS before indexDate to prevent data leakage.
 * All data within the gap and after indexDate is excluded.
 *
 * @param input - Patient data with observations, medications, conditions, encounters
 * @param opts - Optional configuration for windowing and thresholds
 * @returns Feature vector ready for ML model consumption
 *
 * @example
 * ```typescript
 * const features = buildFeatures(patientData, {
 *   lookbackDays: 365,
 *   gapDays: 30,
 *   trendDays: 90,
 * });
 * ```
 */
export function buildFeatures(input: PatientInput, opts?: Options): Features {
  const options: Required<Options> = { ...DEFAULT_OPTIONS, ...opts };

  // Parse dates
  const indexDate = toDate(input.indexDate);
  if (!indexDate) {
    throw new Error('indexDate is required and must be a valid date');
  }

  // Calculate window: [indexDate - lookbackDays, indexDate - gapDays]
  const windowEnd = new Date(indexDate);
  windowEnd.setDate(windowEnd.getDate() - options.gapDays);

  const windowStart = new Date(indexDate);
  windowStart.setDate(windowStart.getDate() - options.lookbackDays);

  const trendWindowStart = new Date(windowEnd);
  trendWindowStart.setDate(trendWindowStart.getDate() - options.trendDays);

  // DEBUG: Log window for this patient
  const DEBUG = process.env.NODE_ENV !== 'production';
  if (DEBUG) {
    console.log(`    [FeatureEngine] Patient ${input.id}:`);
    console.log(`      Index Date: ${indexDate.toISOString().split('T')[0]}`);
    console.log(`      Window: ${windowStart.toISOString().split('T')[0]} to ${windowEnd.toISOString().split('T')[0]}`);
    console.log(`      Total observations: ${input.observations.length}`);

    // Log observation date ranges to help diagnose filtering
    if (input.observations.length > 0) {
      const obsDates = input.observations
        .map(o => toDate(o.date))
        .filter((d): d is Date => d !== null)
        .sort((a, b) => a.getTime() - b.getTime());

      if (obsDates.length > 0) {
        console.log(`      Observation date range: ${obsDates[0].toISOString().split('T')[0]} to ${obsDates[obsDates.length - 1].toISOString().split('T')[0]}`);

        // Check if observations fall within window
        const obsInWindow = obsDates.filter(d => isInWindow(d, windowStart, windowEnd));
        console.log(`      Observations in window: ${obsInWindow.length}/${obsDates.length}`);

        if (obsInWindow.length === 0 && obsDates.length > 0) {
          console.warn(`      ⚠️ WARNING: No observations in window! All ${obsDates.length} observations outside [${windowStart.toISOString().split('T')[0]}, ${windowEnd.toISOString().split('T')[0]}]`);
        }
      }
    }
  }

  // Demographics
  const birthDate = toDate(input.age);
  const age_years_at_index = birthDate
    ? indexDate.getFullYear() - birthDate.getFullYear() -
      (indexDate.getMonth() < birthDate.getMonth() ||
       (indexDate.getMonth() === birthDate.getMonth() && indexDate.getDate() < birthDate.getDate())
        ? 1
        : 0)
    : null;

  const sex_male = input.gender === 'M' ? 1 : input.gender === 'F' ? 0 : null;

  // BMI features
  const bmiObs = extractObservations(input.observations, '39156-5', 'Body Mass Index', windowStart, windowEnd);
  const bmiValues = bmiObs.map(o => o.value).filter(v => v >= 10 && v <= 80); // Valid BMI range

  if (DEBUG && bmiObs.length > 0) {
    console.log(`      BMI: ${bmiObs.length} observations found, ${bmiValues.length} valid (range 10-80)`);
    console.log(`        Mean: ${mean(bmiValues)}, Min: ${min(bmiValues)}, Max: ${max(bmiValues)}`);
  }

  const bmi_mean_365d = mean(bmiValues);
  const bmi_min_365d = min(bmiValues);
  const bmi_max_365d = max(bmiValues);

  // BMI trend (last 90 days of window)
  const bmiTrendObs = bmiObs.filter(obs => obs.date >= trendWindowStart);
  const bmi_trend_90d = calculateTrend(bmiTrendObs, windowEnd);

  // Blood Pressure features
  const bpSysObs = extractObservations(input.observations, '8480-6', 'Systolic Blood Pressure', windowStart, windowEnd);
  const bpDiaObs = extractObservations(input.observations, '8462-4', 'Diastolic Blood Pressure', windowStart, windowEnd);

  const bpSysValues = bpSysObs.map(o => o.value).filter(v => v >= 60 && v <= 250); // Valid systolic BP range
  const bpDiaValues = bpDiaObs.map(o => o.value).filter(v => v >= 40 && v <= 150); // Valid diastolic BP range

  const bp_sys_mean_365d = mean(bpSysValues);
  const bp_dia_mean_365d = mean(bpDiaValues);

  if (DEBUG && (bpSysObs.length > 0 || bpDiaObs.length > 0)) {
    console.log(`      BP: Sys=${bpSysObs.length} obs (${bpSysValues.length} valid), Dia=${bpDiaObs.length} obs (${bpDiaValues.length} valid)`);
  }

  // Glucose features
  const glucoseObs = extractObservations(input.observations, '2339-0', 'Glucose', windowStart, windowEnd);
  const glucoseValues = glucoseObs.map(o => o.value).filter(v => v >= 50 && v <= 600); // Valid glucose range (mg/dL)

  // Filter glucoseObs to only include valid values for distinct day counting
  const glucoseObsValid = glucoseObs.filter(o => o.value >= 50 && o.value <= 600);

  if (DEBUG && glucoseObs.length > 0) {
    const highDayCount = countDistinctDaysAboveThreshold(glucoseObsValid, options.glucoseFastingThresholdDiabetes);
    console.log(`      Glucose: ${glucoseObs.length} observations, ${glucoseValues.length} valid (50-600 mg/dL)`);
    console.log(`        Mean: ${mean(glucoseValues)}, High days (≥126): ${highDayCount}`);
  }

  const glucose_fasting_mean_365d = mean(glucoseValues);
  const glucose_fasting_high_count_365d = countDistinctDaysAboveThreshold(
    glucoseObsValid,
    options.glucoseFastingThresholdDiabetes
  );

  // HbA1c features
  const hba1cObs = extractObservations(input.observations, '4548-4', 'Hemoglobin A1c', windowStart, windowEnd);
  const hba1cValues = hba1cObs.map(o => o.value).filter(v => v >= 4 && v <= 15); // Valid HbA1c range (%)

  // Filter hba1cObs to only include valid values for distinct day counting
  const hba1cObsValid = hba1cObs.filter(o => o.value >= 4 && o.value <= 15);

  if (DEBUG && hba1cObs.length > 0) {
    const highDayCount = countDistinctDaysAboveThreshold(hba1cObsValid, options.hba1cHighThresholdDiabetes);
    console.log(`      HbA1c: ${hba1cObs.length} observations, ${hba1cValues.length} valid (4-15%)`);
    console.log(`        Mean: ${mean(hba1cValues)}, High days (≥6.5): ${highDayCount}`);
  }

  const hba1c_prev_mean_365d = mean(hba1cValues);
  const hba1c_prev_high_count_365d = countDistinctDaysAboveThreshold(
    hba1cObsValid,
    options.hba1cHighThresholdDiabetes
  );

  // Lipids features
  const ldlObs = extractObservations(input.observations, '18262-6', 'LDL', windowStart, windowEnd);
  const ldlValues = ldlObs.map(o => o.value).filter(v => v >= 20 && v <= 300); // Valid LDL range (mg/dL)
  const lipids_ldl_mean_365d = mean(ldlValues);

  if (DEBUG && ldlObs.length > 0) {
    console.log(`      LDL: ${ldlObs.length} observations, ${ldlValues.length} valid (20-300 mg/dL), Mean: ${lipids_ldl_mean_365d}`);
  }

  // Smoking flag
  const smoking_flag = getSmokingFlag(input.observations, windowStart, windowEnd);

  // Chronic conditions
  const chronic_conditions_count = countChronicConditions(
    input.conditions,
    windowStart,
    windowEnd,
    options.chronicConditionKeywords
  );

  // Encounters
  const encounters_last_365d = countEncounters(input.encounters, windowStart, windowEnd);
  const days_since_last_encounter = daysSinceLastEncounter(input.encounters, indexDate);

  if (DEBUG) {
    console.log(`      Encounters: ${encounters_last_365d} in window, Days since last: ${days_since_last_encounter}`);
  }

  // Medications
  const active_diabetes_meds_flag_365d = hasActiveDiabetesMeds(
    input.medications,
    windowStart,
    windowEnd,
    indexDate,
    options.diabetesMedNames
  );

  const chronic_meds_count_365d = countChronicMeds(
    input.medications,
    windowStart,
    windowEnd,
    indexDate
  );

  // Medication adherence one-hot
  const adherence = calculateMedAdherence(input.medications, windowStart, windowEnd, indexDate);

  if (DEBUG && input.medications.length > 0) {
    console.log(`      Medications: ${chronic_meds_count_365d} chronic, Diabetes meds: ${active_diabetes_meds_flag_365d}, Adherence: ${adherence.high ? 'high' : adherence.medium ? 'medium' : 'low'}`);
  }

  // Insurance coverage
  const insurance_coverage_flag = hasInsuranceCoverage(input.encounters);

  return {
    age_years_at_index,
    sex_male,
    bmi_mean_365d,
    bmi_min_365d,
    bmi_max_365d,
    bmi_trend_90d,
    bp_sys_mean_365d,
    bp_dia_mean_365d,
    glucose_fasting_mean_365d,
    glucose_fasting_high_count_365d,
    hba1c_prev_mean_365d,
    hba1c_prev_high_count_365d,
    lipids_ldl_mean_365d,
    smoking_flag,
    chronic_conditions_count,
    encounters_last_365d,
    days_since_last_encounter,
    active_diabetes_meds_flag_365d,
    chronic_meds_count_365d,
    med_adherence_level_onehot_low: adherence.low,
    med_adherence_level_onehot_medium: adherence.medium,
    med_adherence_level_onehot_high: adherence.high,
    insurance_coverage_flag,
  };
}
