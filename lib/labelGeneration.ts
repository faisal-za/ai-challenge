/**
 * Diabetes Label Generation Module
 *
 * Computes label_diabetes_12m (0/1/null) based on forward-looking 12-month window
 * after indexDate.
 *
 * Label Window: (indexDate, indexDate + 1 year] (right-inclusive, excludes indexDate)
 *
 * Labeling Criteria (priority order):
 * 1. HbA1c ≥ 6.5% → label=1
 * 2. Fasting glucose ≥126 mg/dL on ≥2 distinct days → label=1
 * 3. Glucose ≥200 mg/dL on ≥2 distinct days (if no fasting flag) → label=1
 * 4. Diabetes medication overlap ≥14 days → label=1
 * 5. Has follow-up beyond window but no diabetes evidence → label=0
 * 6. Insufficient follow-up → label=null
 */

// ==================== Type Definitions ====================

export type Observation = {
  date: Date | string;
  code?: string; // LOINC code
  description?: string;
  value?: string | number;
  unit?: string;
  type?: 'numeric' | 'text';
  // Optional fasting flag
  fasting?: boolean;
};

export type Medication = {
  description: string;
  start: Date | string;
  stop?: Date | string | null;
  dispenses_cap?: number;
};

export type Encounter = {
  start: Date | string;
  stop?: Date | string | null;
};

export type Condition = {
  start: Date | string;
  stop?: Date | string | null;
};

export type LabelInput = {
  id: string;
  indexDate: Date | string;
  observations: Observation[];
  medications: Medication[];
  encounters: Encounter[];
  conditions: Condition[];
};

export type LabelResult = {
  label_diabetes_12m: 0 | 1 | null;
  label_reason: string;
};

// ==================== LOINC Code Mappings ====================

/**
 * HbA1c LOINC codes (% units)
 * Source: https://loinc.org/
 */
export const HBA1C_LOINC_CODES = [
  '4548-4',   // Hemoglobin A1c/Hemoglobin.total in Blood
  '4549-2',   // Hemoglobin A1c/Hemoglobin.total in Blood by HPLC
  '17856-6',  // Hemoglobin A1c/Hemoglobin.total in Blood by calculation
  '17855-8',  // Hemoglobin A1c [Mass/volume] in Blood
  '41995-2',  // Hemoglobin A1c [Mass/volume] in Blood by IFCC protocol
  '59261-8',  // Hemoglobin A1c/Hemoglobin.total in Blood by IFCC protocol
  '62388-4',  // Hemoglobin A1c/Hemoglobin.total in Blood by JDS/JSCC protocol
  '71875-9',  // Hemoglobin A1c/Hemoglobin.total in Blood by calculation
] as const;

/**
 * Glucose LOINC codes (mg/dL units)
 */
export const GLUCOSE_LOINC_CODES = [
  '2339-0',   // Glucose [Mass/volume] in Blood
  '2345-7',   // Glucose [Mass/volume] in Serum or Plasma
  '1558-6',   // Glucose [Mass/volume] in Serum or Plasma --fasting
  '1521-4',   // Glucose [Mass/volume] in Serum or Plasma --post meal
  '41653-7',  // Glucose [Mass/volume] in Capillary blood
  '6689-4',   // Glucose [Mass/volume] in Capillary blood --fasting
  '14771-0',  // Glucose [Mass/volume] in Capillary blood by Glucometer
  '2340-8',   // Glucose [Mass/volume] in Blood by Glucometer
] as const;

/**
 * LOINC codes that indicate fasting glucose
 */
export const FASTING_GLUCOSE_LOINC_CODES = [
  '1558-6',   // Glucose [Mass/volume] in Serum or Plasma --fasting
  '6689-4',   // Glucose [Mass/volume] in Capillary blood --fasting
] as const;

// ==================== Medication Definitions ====================

/**
 * Diabetes medication keywords (case-insensitive matching)
 * Organized by drug class for documentation
 */
export const DIABETES_MEDICATION_KEYWORDS = [
  // Insulins
  'insulin',
  'humalog',
  'novolog',
  'lantus',
  'levemir',
  'tresiba',
  'toujeo',
  'basaglar',
  'humulin',
  'novolin',

  // Metformin
  'metformin',
  'glucophage',
  'glumetza',
  'fortamet',

  // Sulfonylureas
  'glipizide',
  'glyburide',
  'glimepiride',
  'glucotrol',
  'diabeta',
  'micronase',
  'amaryl',

  // SGLT2 inhibitors
  'empagliflozin',
  'canagliflozin',
  'dapagliflozin',
  'ertugliflozin',
  'jardiance',
  'invokana',
  'farxiga',
  'steglatro',

  // GLP-1 receptor agonists
  'semaglutide',
  'liraglutide',
  'dulaglutide',
  'exenatide',
  'lixisenatide',
  'ozempic',
  'wegovy',
  'victoza',
  'saxenda',
  'trulicity',
  'byetta',
  'bydureon',
  'adlyxin',

  // DPP-4 inhibitors
  'sitagliptin',
  'saxagliptin',
  'linagliptin',
  'alogliptin',
  'januvia',
  'onglyza',
  'tradjenta',
  'nesina',

  // Thiazolidinediones (TZD)
  'pioglitazone',
  'rosiglitazone',
  'actos',
  'avandia',

  // Meglitinides
  'repaglinide',
  'nateglinide',
  'prandin',
  'starlix',

  // Alpha-glucosidase inhibitors
  'acarbose',
  'miglitol',
  'precose',
  'glyset',
] as const;

// ==================== Utility Functions ====================

/**
 * Convert string or Date to Date object
 */
function toDate(input: Date | string | undefined | null): Date | null {
  if (!input) return null;
  if (input instanceof Date) return input;
  const date = new Date(input);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Parse numeric value from observation
 * Handles string numbers and direct numbers
 */
function parseNumericValue(value: string | number | undefined): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Normalize HbA1c to percent (%)
 * Valid range: 4-15%
 */
function normalizeHbA1c(value: number, unit?: string): number | null {
  // Most HbA1c values are already in %
  // Some might be in mmol/mol (IFCC units): conversion = (mmol/mol / 10.929) + 2.15

  if (unit?.toLowerCase().includes('mmol/mol')) {
    const percent = (value / 10.929) + 2.15;
    if (percent >= 4 && percent <= 15) return percent;
    return null;
  }

  // Assume % if no unit
  if (value >= 4 && value <= 15) return value;

  return null;
}

/**
 * Normalize glucose to mg/dL
 * Valid range: 50-600 mg/dL
 */
function normalizeGlucose(value: number, unit?: string): number | null {
  // mg/dL is standard in US
  // mmol/L (SI units): conversion = mmol/L * 18.0182

  if (unit?.toLowerCase().includes('mmol')) {
    const mgdl = value * 18.0182;
    if (mgdl >= 50 && mgdl <= 600) return mgdl;
    return null;
  }

  // Assume mg/dL if no unit
  if (value >= 50 && value <= 600) return value;

  return null;
}

/**
 * Check if observation date is in label window
 * Label window: (indexDate, indexDate + 1 year] (right-inclusive)
 */
function isInLabelWindow(obsDate: Date, indexDate: Date, windowEnd: Date): boolean {
  return obsDate > indexDate && obsDate <= windowEnd;
}

/**
 * Check if medication is a diabetes medication
 */
function isDiabetesMedication(description: string): boolean {
  const lowerDesc = description.toLowerCase();
  return DIABETES_MEDICATION_KEYWORDS.some(keyword => lowerDesc.includes(keyword));
}

/**
 * Calculate medication overlap days with label window
 * Returns number of days the medication overlaps with (indexDate, indexDate + 1 year]
 */
function calculateMedicationOverlapDays(
  medStart: Date,
  medStop: Date | null,
  indexDate: Date,
  windowEnd: Date
): number {
  // If medication has no stop date, assume it continues through windowEnd
  const effectiveStop = medStop ?? windowEnd;

  // Medication must start before or within window and stop after window starts
  const overlapStart = medStart > indexDate ? medStart : new Date(indexDate.getTime() + 1); // Label window excludes indexDate
  const overlapEnd = effectiveStop < windowEnd ? effectiveStop : windowEnd;

  // No overlap if medication ends before window starts or starts after window ends
  if (effectiveStop <= indexDate || medStart > windowEnd) {
    return 0;
  }

  // Calculate days (inclusive)
  const days = Math.max(0, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  return days;
}

/**
 * Check if patient has follow-up data beyond label window
 */
function hasFollowUpBeyondWindow(
  observations: Observation[],
  medications: Medication[],
  encounters: Encounter[],
  conditions: Condition[],
  windowEnd: Date
): boolean {
  // Check observations
  for (const obs of observations) {
    const obsDate = toDate(obs.date);
    if (obsDate && obsDate > windowEnd) return true;
  }

  // Check medications
  for (const med of medications) {
    const medStart = toDate(med.start);
    if (medStart && medStart > windowEnd) return true;
  }

  // Check encounters
  for (const enc of encounters) {
    const encStart = toDate(enc.start);
    if (encStart && encStart > windowEnd) return true;
  }

  // Check conditions
  for (const cond of conditions) {
    const condStart = toDate(cond.start);
    if (condStart && condStart > windowEnd) return true;
  }

  return false;
}

/**
 * Get distinct calendar days from observations
 * Used for "2 distinct days" criteria
 */
function getDistinctDays(observations: Array<{ date: Date; value: number }>): number {
  const daySet = new Set<string>();
  for (const obs of observations) {
    // Use YYYY-MM-DD format to ensure same calendar day
    const dayString = obs.date.toISOString().split('T')[0];
    daySet.add(dayString);
  }
  return daySet.size;
}

// ==================== Core Label Generation ====================

/**
 * Generate diabetes label based on 12-month forward-looking window
 *
 * @param input Patient data with indexDate
 * @returns Label result with label (0/1/null) and reason
 */
export function generateDiabetesLabel(input: LabelInput): LabelResult {
  const indexDate = toDate(input.indexDate);
  if (!indexDate) {
    throw new Error('indexDate is required and must be a valid date');
  }

  // Calculate label window: (indexDate, indexDate + 1 year]
  const windowEnd = new Date(indexDate);
  windowEnd.setFullYear(windowEnd.getFullYear() + 1);

  // ==================== Criterion 1: HbA1c ≥ 6.5% ====================

  for (const obs of input.observations) {
    const obsDate = toDate(obs.date);
    if (!obsDate) continue;

    // Check if in label window
    if (!isInLabelWindow(obsDate, indexDate, windowEnd)) continue;

    // Check if HbA1c observation (by LOINC code or description)
    const isHbA1c =
      (obs.code && HBA1C_LOINC_CODES.includes(obs.code as any)) ||
      (obs.description?.toLowerCase().includes('hemoglobin a1c')) ||
      (obs.description?.toLowerCase().includes('hba1c'));

    if (!isHbA1c) continue;

    // Parse and normalize value
    const rawValue = parseNumericValue(obs.value);
    if (rawValue === null) continue;

    const normalizedValue = normalizeHbA1c(rawValue, obs.unit);
    if (normalizedValue === null) continue;

    // Check threshold
    if (normalizedValue >= 6.5) {
      return {
        label_diabetes_12m: 1,
        label_reason: 'hba1c',
      };
    }
  }

  // ==================== Criterion 2: Fasting Glucose ≥126 mg/dL on ≥2 distinct days ====================

  const fastingGlucoseReadings: Array<{ date: Date; value: number }> = [];

  for (const obs of input.observations) {
    const obsDate = toDate(obs.date);
    if (!obsDate) continue;

    // Check if in label window
    if (!isInLabelWindow(obsDate, indexDate, windowEnd)) continue;

    // Check if fasting glucose (by LOINC code or fasting flag)
    const isFastingGlucose =
      (obs.code && FASTING_GLUCOSE_LOINC_CODES.includes(obs.code as any)) ||
      (obs.fasting === true);

    if (!isFastingGlucose) continue;

    // Parse and normalize value
    const rawValue = parseNumericValue(obs.value);
    if (rawValue === null) continue;

    const normalizedValue = normalizeGlucose(rawValue, obs.unit);
    if (normalizedValue === null) continue;

    // Check threshold
    if (normalizedValue >= 126) {
      fastingGlucoseReadings.push({ date: obsDate, value: normalizedValue });
    }
  }

  if (getDistinctDays(fastingGlucoseReadings) >= 2) {
    return {
      label_diabetes_12m: 1,
      label_reason: 'fpg_two_readings',
    };
  }

  // ==================== Criterion 3: Glucose ≥200 mg/dL on ≥2 distinct days (no fasting flag) ====================

  const highGlucoseReadings: Array<{ date: Date; value: number }> = [];

  for (const obs of input.observations) {
    const obsDate = toDate(obs.date);
    if (!obsDate) continue;

    // Check if in label window
    if (!isInLabelWindow(obsDate, indexDate, windowEnd)) continue;

    // Check if glucose observation (any type)
    const isGlucose =
      (obs.code && GLUCOSE_LOINC_CODES.includes(obs.code as any)) ||
      (obs.description?.toLowerCase().includes('glucose'));

    if (!isGlucose) continue;

    // Parse and normalize value
    const rawValue = parseNumericValue(obs.value);
    if (rawValue === null) continue;

    const normalizedValue = normalizeGlucose(rawValue, obs.unit);
    if (normalizedValue === null) continue;

    // Check threshold
    if (normalizedValue >= 200) {
      highGlucoseReadings.push({ date: obsDate, value: normalizedValue });
    }
  }

  if (getDistinctDays(highGlucoseReadings) >= 2) {
    return {
      label_diabetes_12m: 1,
      label_reason: 'glucose_two_high_random',
    };
  }

  // ==================== Criterion 4: Diabetes Medication Overlap ≥14 days ====================

  let totalDiabetesMedOverlapDays = 0;

  for (const med of input.medications) {
    // Check if diabetes medication
    if (!isDiabetesMedication(med.description)) continue;

    const medStart = toDate(med.start);
    if (!medStart) continue;

    const medStop = toDate(med.stop);

    // Calculate overlap days
    const overlapDays = calculateMedicationOverlapDays(medStart, medStop, indexDate, windowEnd);
    totalDiabetesMedOverlapDays += overlapDays;
  }

  if (totalDiabetesMedOverlapDays >= 14) {
    return {
      label_diabetes_12m: 1,
      label_reason: 'med_overlap',
    };
  }

  // ==================== Criterion 5: Has follow-up beyond 12m window ====================

  // Guard: Only assign label=0 if patient has data BEYOND the 12-month label window.
  // This ensures we have sufficient observability to confirm absence of diabetes.
  // If no follow-up beyond windowEnd, return null (insufficient observability).

  const hasFollowUp = hasFollowUpBeyondWindow(
    input.observations,
    input.medications,
    input.encounters,
    input.conditions,
    windowEnd
  );

  if (hasFollowUp) {
    // Patient has data beyond 12-month window AND no diabetes evidence found
    return {
      label_diabetes_12m: 0,
      label_reason: 'none_observed',
    };
  }

  // ==================== Criterion 6: Insufficient follow-up ====================

  // No data beyond windowEnd means we cannot confirm diabetes absence.
  // Do NOT coerce to label=0. Return null and exclude from training.
  return {
    label_diabetes_12m: null,
    label_reason: 'insufficient_followup',
  };
}

/**
 * Default export for convenience
 */
export default generateDiabetesLabel;
