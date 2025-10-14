import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { connectToMongoDB } from '@/lib/mongodb';

function featuresFromPatient(patient) {
    try {

    
  const today = new Date();
    console.log("Calculating started")
  // --- Helpers ---
  const toDate = (d) => d ? new Date(d) : null;
  const daysBetween = (a, b = today) => Math.floor((b - a) / (1000*60*60*24));
  const num = (x) => (x === null || x === undefined || x === '') ? null : Number(x);

  // latest obs by description/code
  const obs = Array.isArray(patient.observations) ? patient.observations : [];
  const latestObs = (pred) => {
    const cand = obs
      .filter(pred)
      .sort((a,b) => new Date(b.date) - new Date(a.date))[0];
    return cand ? (cand.type === 'numeric' ? num(cand.value) : cand.value) : null;
  };
  const byDesc = (s) => (o) => (o.description || '').toLowerCase().includes(s.toLowerCase());
  const byCode = (c) => (o) => (o.code || '').toString() === c.toString();

  // --- Patient core fields ---
  // DOB may be in patient.age (DOB Date) or patient.BIRTHDATE
  const dob = toDate(patient.BIRTHDATE || patient.age);
  let Age = null;
  if (dob) {
    Age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) Age--;
  }

  // --- Observations (latest) ---
  const heightCm = latestObs(byDesc('Body Height')) ?? latestObs(byCode('8302-2'));
  const weightKg = latestObs(byDesc('Body Weight')) ?? latestObs(byCode('29463-7'));

  const systolic = latestObs(byDesc('Systolic Blood Pressure')) ?? latestObs(byCode('8480-6'));
  const diastolic = latestObs(byDesc('Diastolic Blood Pressure')) ?? latestObs(byCode('8462-4'));

  const glucose = latestObs(byDesc('Glucose')); // add code if available
  const hba1cVal = latestObs(byDesc('Hemoglobin A1c')) ?? latestObs(byDesc('HbA1c')) ?? latestObs(byCode('4548-4'));

  const tg = latestObs(byDesc('Triglycerides'));
  const hdl = latestObs(byDesc('HDL'));
  const ldl = latestObs(byDesc('LDL'));

  const smokingVal = latestObs(byDesc('Tobacco smoking status NHIS'));

  // --- Derived from observations ---
  const heightM = heightCm ? heightCm/100 : null;
  const BMI = (weightKg && heightM) ? (weightKg / (heightM*heightM)) : null;

  let BMI_Category = null;
  if (BMI != null) {
    if (BMI < 25) BMI_Category = 'Normal';
    else if (BMI < 30) BMI_Category = 'Overweight';
    else BMI_Category = 'Obese';
  }

  // BP per your rule: High if >=140/90, else Normal
  let BloodPressure_Status = null;
  if (systolic != null && diastolic != null) {
    BloodPressure_Status = (systolic >= 140 || diastolic >= 90) ? 'High' : 'Normal';
  }

  let Glucose_Status = null;
  if (glucose != null) {
    Glucose_Status = (glucose < 100) ? 'Normal' : (glucose < 126) ? 'Prediabetes' : 'Diabetes';
  }

  let HbA1c_Status = null;
  if (hba1cVal != null) {
    HbA1c_Status = (hba1cVal < 5.7) ? 'Normal' : (hba1cVal < 6.5) ? 'Prediabetes' : 'Diabetes';
  }

  // If LDL/HDL missing but Total Chol & TG exist, you can derive using Friedewald if you add Total Chol extraction.
  let Dyslipidemia_Flag = null;
  if (tg != null && hdl != null && ldl != null) {
    Dyslipidemia_Flag = (tg > 150 || hdl < 40 || ldl > 130) ? 1 : 0;
  }

  const Smoking_Flag = (typeof smokingVal === 'string')
    ? (smokingVal.toLowerCase().includes('never') ? 0 : 1)
    : 0;

  // --- Conditions ---
  const conds = Array.isArray(patient.conditions) ? patient.conditions : [];
  // Count only specific chronic diseases per table
  const chronicSet = ['diabetes','hypertension','dyslipidemia'];
  const Chronic_Conditions_Count = conds.filter(c =>
    chronicSet.some(k => (c.description || '').toLowerCase().includes(k))
  ).length;

  // Duration = sum over conditions; if STOP empty/undefined -> today
  const Condition_Duration_Days = conds.reduce((sum, c) => {
    const start = toDate(c.start || c.START);
    const stop = toDate(c.stop || c.STOP) || today;
    return start ? (sum + daysBetween(start, stop)) : sum;
  }, 0);

  // --- Encounters ---
  const encs = Array.isArray(patient.encounters) ? patient.encounters : [];
  const Encounters_Last_12m = encs.filter(e => {
    const s = toDate(e.start || e.START);
    return s && (today - s) <= 365*24*60*60*1000;
  }).length;

  let Time_Since_Last_Encounter_Days = null;
  if (encs.length) {
    const last = encs
      .map(e => toDate(e.start || e.START))
      .filter(Boolean)
      .sort((a,b) => b - a)[0];
    if (last) Time_Since_Last_Encounter_Days = daysBetween(last, today);
  }

  const Has_Reason_For_Encounter = encs.some(e => String(e.has_reason || e.HAS_REASON).toLowerCase() === 'yes') ? 1 : 0;
  const Insurance_Coverage_Flag = encs.some(e => (num(e.payer_coverage || e.PAYER_COVERAGE) || 0) > 0) ? 1 : 0;

  // --- Medications ---
  const meds = Array.isArray(patient.medications) ? patient.medications : [];
  // Adherence: sum of DISPENSES_CAP per table, then bucket
  const totalDispensesCap = meds.reduce((s, m) => s + (num(m.dispenses_cap || m.DISPENSES_CAP) || 0), 0);
  const Medication_Adherence_Level = (totalDispensesCap >= 12) ? 'High' : (totalDispensesCap >= 6) ? 'Medium' : 'Low';

  // Chronic meds: description contains antidiabetic/antihypertensive/statin
  const Chronic_Medications_Count = meds.filter(m => {
    const d = (m.description || m.DESCRIPTION || '').toLowerCase();
    return d.includes('antidiabetic') || d.includes('antihypertensive') || d.includes('statin');
  }).length;

  const Active_Medication_Flag = meds.some(m => String(m.is_active || m.IS_ACTIVE).toLowerCase() === 'yes') ? 1 : 0;

  return {
    patient_id: patient.id,
    Age,
    BMI: BMI ?? null,
    BMI_Category,
    BloodPressure_Status,
    Glucose_Status,
    HbA1c_Status,
    Dyslipidemia_Flag,
    Smoking_Flag,
    Chronic_Conditions_Count,
    Condition_Duration_Days,
    Encounters_Last_12m,
    Time_Since_Last_Encounter_Days,
    Medication_Adherence_Level,
    Chronic_Medications_Count,
    Active_Medication_Flag,
    Has_Reason_For_Encounter,
    Insurance_Coverage_Flag
  };
  } catch(err){
    console.log("Error in calculation for patient:", patient.id, err);
    return null;
  }
}

export const mongoDBTool = createTool({
    id: 'mongodb-tool',
    description: 'Read patients from MongoDB with all related data (medications, conditions, observations, encounters) joined automatically. No input parameters required.',
    inputSchema: z.object({}),
    outputSchema: z.object({
        success: z.boolean(),
        //totalPatients: z.number(),
    }),
    execute: async () => {
        try {
            // Connect to MongoDB
            const { db } = await connectToMongoDB();

            // Get patients collection
            const patientsCollection = db.collection('patients');

            // Build aggregation pipeline with lookups
            const pipeline = [
                {
                    $lookup: {
                        from: 'medications',
                        localField: 'id',
                        foreignField: 'patient',
                        as: 'medications'
                    }
                },
                {
                    $lookup: {
                        from: 'conditions',
                        localField: 'id',
                        foreignField: 'patient',
                        as: 'conditions'
                    }
                },
                {
                    $lookup: {
                        from: 'observations',
                        localField: 'id',
                        foreignField: 'patient',
                        as: 'observations'
                    }
                },
                {
                    $lookup: {
                        from: 'encounters',
                        localField: 'id',
                        foreignField: 'patient',
                        as: 'encounters'
                    }
                },
                { $skip: 1150 },
                { $limit: 100 },
            ];

            // Execute aggregation
            const patients = await patientsCollection.aggregate(pipeline).toArray();

            // Get features collection
            const featuresCollection = db.collection('features');

            // Loop through each patient and perform calculations
            console.log(`Processing ${patients.length} patients...`);

            const features = patients.map((patient, index) => {
                console.log(`Processing patient ${index + 1}/${patients.length}`);
                const result = featuresFromPatient(patient);
                console.log(`Patient ${index + 1} result:`, result ? 'success' : 'failed');
                return result;
            }).filter(f => f !== null && f !== undefined);

            console.log(`Successfully calculated ${features.length} features`);

            // Insert features into features collection
            if (features.length > 0) {
                console.log(`Inserting ${features.length} features...`);
                await featuresCollection.insertMany(features);
                console.log(`Successfully inserted ${features.length} features into features collection`);
            } else {
                console.log('No features to insert');
            }

            return {
                success: true,
            }

        } catch (error) {
            console.error('[MongoDB Tool] Error:', error);
            return {
                success: false,
                totalPatients: 0,
            };
        }
    },
});
