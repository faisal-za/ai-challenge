'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CreateThreadWithMessage } from './actions';
import { Loader2Icon } from 'lucide-react';

// Schema based on Risk Assessment Agent scoring rules
const riskAssessmentFormSchema = z.object({
    // DEMOGRAPHICS (Required)
    Age: z.coerce.number().min(1, { message: 'Age is required' }).max(99),
    Gender: z.enum(['Male', 'Female'], {
        required_error: 'Gender is required'
    }),
    nationality: z.enum(["saudi", "non-saudi"], {
        required_error: 'Nationality is required'
    }),
    martial_status: z.enum(["single", "married"], {
        required_error: 'Marital status is required'
    }),
    Smoking_Flag: z.enum(["yes", "no"], {
        required_error: 'Smoking status is required'
    }),
    Family_History_Diabetes: z.enum(["yes", "no"], {
        required_error: 'Family history of diabetes is required'
    }),

    // BODY METRICS (Required)
    BMI: z.coerce.number().min(10, { message: 'BMI is required' }).max(60),
    BMI_Category: z.enum(['Normal', 'Overweight', 'Obese', 'Underweight']).optional(),

    // BLOOD TESTS (Required)
    HbA1c: z.coerce.number().min(3.5, { message: 'HbA1c is required' }).max(20),
    Glucose: z.coerce.number().min(30, { message: 'Glucose is required' }).max(1000),
    Sample_Condition: z.enum(['FBG', 'Random', 'OGTT'], {
        required_error: 'Sample condition is required'
    }),

    // BLOOD PRESSURE (Required)
    BloodPressure: z.string().min(1, { message: 'Blood Pressure is required' }),
    BloodPressure_Status: z.enum(['Normal', 'High', 'Low'], {
        required_error: 'Blood Pressure Status is required'
    }),

    // CHRONIC CONDITIONS (Required)
    Chronic_Conditions_Count: z.coerce.number().min(0, { message: 'Number of chronic conditions is required' }),
    Condition_Duration_Days: z.coerce.number().min(0, { message: 'Condition duration is required' }).optional(),

    // MEDICATIONS (Required)
    Chronic_Medications_Count: z.coerce.number().min(0, { message: 'Number of medications is required' }),
    Medication_Adherence_Level: z.enum(['Low', 'Medium', 'Good', 'Excellent']).optional(),
    Active_Medication_Flag: z.boolean().default(false),

    // HEALTHCARE ACCESS (Required)
    Encounters_Last_12m: z.coerce.number().min(0, { message: 'Number of encounters is required' }),
    Time_Since_Last_Encounter_Days: z.coerce.number().min(0, { message: 'Days since last visit is required' }),
    Has_Reason_For_Encounter: z.boolean().default(true),
    Insurance_Coverage_Flag: z.boolean().default(true),
});

function calculateBMI(weightKg: number, heightCm: number) {
    const heightM = heightCm / 100;
    return +(weightKg / (heightM ** 2)).toFixed(1);
}


type RiskAssessmentFormValues = z.infer<typeof riskAssessmentFormSchema>;

export default function RiskAssessmentForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [knowsBMI, setKnowsBMI] = useState<string | undefined>(undefined);
    const [height, setHeight] = useState<number | undefined>(undefined);
    const [weight, setWeight] = useState<number | undefined>(undefined);
    const [knowsBP, setKnowsBP] = useState<string | undefined>(undefined);
    const [systolic, setSystolic] = useState<number | undefined>(undefined);
    const [diastolic, setDiastolic] = useState<number | undefined>(undefined);

    const form = useForm<RiskAssessmentFormValues>({
        resolver: zodResolver(riskAssessmentFormSchema),
        defaultValues: {
            Age: undefined,
            Gender: undefined,
            nationality: undefined,
            martial_status: undefined,
            Smoking_Flag: undefined,
            Family_History_Diabetes: undefined,
            BMI: undefined,
            BMI_Category: undefined,
            HbA1c: undefined,
            Glucose: undefined,
            Sample_Condition: undefined,
            BloodPressure: '',
            BloodPressure_Status: undefined,
            Chronic_Conditions_Count: undefined,
            Condition_Duration_Days: undefined,
            Chronic_Medications_Count: undefined,
            Medication_Adherence_Level: undefined,
            Active_Medication_Flag: false,
            Encounters_Last_12m: undefined,
            Time_Since_Last_Encounter_Days: undefined,
            Has_Reason_For_Encounter: true,
            Insurance_Coverage_Flag: true,
        },
        mode: 'onSubmit',
        reValidateMode: 'onBlur',
    });

    async function onSubmit(data: RiskAssessmentFormValues) {
        console.log("submitting")
        setError(null);
        // Build natural language message for risk assessment
        const parts: string[] = [];

        // Demographics
        parts.push(`- **Age:** ${data.Age} years old`);
        parts.push(`- **Gender:** ${data.Gender}`);
        parts.push(`- **Nationality:** ${data.nationality}`);
        parts.push(`- **Marital Status:** ${data.martial_status}`);

        // Medical History
        parts.push(``);
        parts.push(`- **Smoker:** ${data.Smoking_Flag === 'yes' ? 'Yes' : 'No'}`);
        parts.push(`- **Family History of Diabetes:** ${data.Family_History_Diabetes === 'yes' ? 'Yes' : 'No'}`);

        // Body Metrics
        if (data.BMI || data.BMI_Category) {
            parts.push(``);
            if (data.BMI) parts.push(`- **BMI:** ${data.BMI}`);
            if (data.BMI_Category) parts.push(`- **BMI Category:** ${data.BMI_Category}`);
        }

        // Blood Tests
        if (data.HbA1c || data.Glucose || data.Sample_Condition) {
            parts.push(``);
            if (data.HbA1c) parts.push(`- **HbA1c:** ${data.HbA1c}%`);
            if (data.Glucose) parts.push(`- **Glucose:** ${data.Glucose} mg/dL`);
            if (data.Sample_Condition) {
                const conditionMap: Record<string, string> = {
                    'FBG': 'Fasting blood glucose - FBG',
                    'Random': 'Random glucose',
                    'OGTT': 'OGTT'
                };
                parts.push(`- **Sample Condition:** ${conditionMap[data.Sample_Condition]}`);
            }
        }

        // Blood Pressure
        if (data.BloodPressure || data.BloodPressure_Status) {
            parts.push(``);
            if (data.BloodPressure) parts.push(`- **Reading:** ${data.BloodPressure} mmHg`);
            if (data.BloodPressure_Status) parts.push(`- **Status:** ${data.BloodPressure_Status}`);
        }

        // Chronic Conditions
        if (data.Chronic_Conditions_Count || data.Condition_Duration_Days) {
            parts.push(``);
            if (data.Chronic_Conditions_Count) parts.push(`- **Number of Conditions:** ${data.Chronic_Conditions_Count}`);
            if (data.Condition_Duration_Days) parts.push(`- **Duration:** ${data.Condition_Duration_Days} days since diagnosis`);
        }

        // Medications
        if (data.Chronic_Medications_Count || data.Medication_Adherence_Level) {
            parts.push(``);
            if (data.Chronic_Medications_Count) parts.push(`- **Number of Medications:** ${data.Chronic_Medications_Count}`);
            if (data.Medication_Adherence_Level) parts.push(`- **Adherence Level:** ${data.Chronic_Medications_Count > 0 ? data.Medication_Adherence_Level : "high"}`);
            parts.push(`- **Currently Taking Medication:** ${data.Chronic_Medications_Count > 0 ? "yes" : "no"}`);
        }

        // Healthcare Access
        if (data.Encounters_Last_12m || data.Time_Since_Last_Encounter_Days || !data.Has_Reason_For_Encounter || !data.Insurance_Coverage_Flag) {
            parts.push(``);
            if (data.Encounters_Last_12m !== undefined) parts.push(`- **Encounters (Last 12 months):** ${data.Encounters_Last_12m}`);
            if (data.Time_Since_Last_Encounter_Days !== undefined) parts.push(`- **Days Since Last Visit:** ${data.Time_Since_Last_Encounter_Days}`);
            if (!data.Has_Reason_For_Encounter) parts.push(`- **Has Reason for Visit:** No`);
            if (!data.Insurance_Coverage_Flag) parts.push(`- **Insurance Coverage:** No`);
        }

        const message = parts.join('\n');

        console.log('=== RISK ASSESSMENT FORM SUBMITTED ===');
        console.log(message);
        console.log('=======================================');

        // Create thread and redirect to conversation
        startTransition(async () => {
            try {
                const result = await CreateThreadWithMessage({ message });
                router.push(`/chat/${result.threadId}?initialMessage=${encodeURIComponent(message)}`);
            } catch (err) {
                console.error('Failed to create thread:', err);
                setError('Failed to create risk assessment. Please try again.');
            }
        });
    }
    // async function onSubmit(d) {
    //     console.log("subnited", d)
    // }

    useEffect(() => {
        if (Object.keys(form.formState.errors).length) {
            console.error("errors", form.formState.errors);
        }
    }, [form.formState.errors]);


    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Diabetes Risk Assessment Form</CardTitle>
                <CardDescription>Patient Risk Evaluation System</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Demographics Section */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Patient Information</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="Age"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Age <span className="text-red-600">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="from 1 to 99 years Old"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="Gender"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Gender <span className="text-red-600">*</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Male">Male</SelectItem>
                                                    <SelectItem value="Female">Female</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="nationality"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Nationality <span className="text-red-600">*</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Nationality" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="saudi">Saudi</SelectItem>
                                                    <SelectItem value="non-saudi">Non-Saudi</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="martial_status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Marital Status <span className="text-red-600">*</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="single">Single</SelectItem>
                                                    <SelectItem value="married">Married</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Medical History Section */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Medical History</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="Smoking_Flag"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Smoking Status <span className="text-red-600">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    className="flex gap-4 mt-2"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="yes" id="smoking-yes" />
                                                        <label htmlFor="smoking-yes" className="text-sm font-normal cursor-pointer">
                                                            Yes
                                                        </label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="no" id="smoking-no" />
                                                        <label htmlFor="smoking-no" className="text-sm font-normal cursor-pointer">
                                                            No
                                                        </label>
                                                    </div>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="Family_History_Diabetes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Does the patient have a family history of diabetes? <span className="text-red-600">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    className="flex gap-4 mt-2"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="yes" id="family-history-yes" />
                                                        <label htmlFor="family-history-yes" className="text-sm font-normal cursor-pointer">
                                                            Yes
                                                        </label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="no" id="family-history-no" />
                                                        <label htmlFor="family-history-no" className="text-sm font-normal cursor-pointer">
                                                            No
                                                        </label>
                                                    </div>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="Chronic_Conditions_Count"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Does the patient have chronic conditions? <span className="text-red-600">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    value={field.value === 3 ? 'yes' : field.value === 0 ? 'no' : undefined}
                                                    onValueChange={(value) => {
                                                        const newValue = value === 'yes' ? 3 : 0;
                                                        field.onChange(newValue);
                                                        // Set Condition_Duration_Days to 0 when "no" is selected
                                                        if (value === 'no') {
                                                            form.setValue('Condition_Duration_Days', 0);
                                                        }
                                                    }}
                                                    className="flex gap-4"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="yes" id="chronic-conditions-yes" />
                                                        <label htmlFor="chronic-conditions-yes" className="text-sm font-normal cursor-pointer">
                                                            Yes
                                                        </label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="no" id="chronic-conditions-no" />
                                                        <label htmlFor="chronic-conditions-no" className="text-sm font-normal cursor-pointer">
                                                            No
                                                        </label>
                                                    </div>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {form.watch('Chronic_Conditions_Count') === 3 && (
                                    <FormField
                                        control={form.control}
                                        name="Condition_Duration_Days"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Condition Duration <span className="text-red-600">*</span>
                                                </FormLabel>
                                                <Select
                                                    onValueChange={(value) => field.onChange(Number(value))}
                                                    value={field.value?.toString()}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select duration" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="100">Less than 1 year</SelectItem>
                                                        <SelectItem value="356">From 1 to 3 years</SelectItem>
                                                        <SelectItem value="2000">Bigger than 5 years</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="Chronic_Medications_Count"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Is the patient currently taking any medications that may affect blood glucose levels (e.g., corticosteroids, antihypertensive drugs, or psychiatric medications)? <span className="text-red-600">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <RadioGroup
                                                        value={field.value === 4 ? 'yes' : field.value === 0 ? 'no' : undefined}
                                                        onValueChange={(value) => {
                                                            field.onChange(value === 'yes' ? 4 : 0);
                                                        }}
                                                        className="flex gap-4 mt-2"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="yes" id="medications-yes" />
                                                            <label htmlFor="medications-yes" className="text-sm font-normal cursor-pointer">
                                                                Yes
                                                            </label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="no" id="medications-no" />
                                                            <label htmlFor="medications-no" className="text-sm font-normal cursor-pointer">
                                                                No
                                                            </label>
                                                        </div>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">

                                {form.watch("Chronic_Medications_Count") > 0 && (
                                    <FormField
                                        control={form.control}
                                        name="Medication_Adherence_Level"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Adherence Level <span className="text-red-600">*</span>
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Low">Low</SelectItem>
                                                        <SelectItem value="Medium">Medium</SelectItem>
                                                        <SelectItem value="Good">Good</SelectItem>
                                                        <SelectItem value="Excellent">Excellent</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                {/* <FormField
                                    control={form.control}
                                    name="Active_Medication_Flag"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center space-x-3 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Currently Taking Medication</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                /> */}
                            </div>
                        </div>

                        <Separator />

                        {/* Healthcare Access Section */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Healthcare Access</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="Encounters_Last_12m"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Encounters (Last 12 Months) <span className="text-red-600">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs">Doctor visits in past year</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="Time_Since_Last_Encounter_Days"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Days Since Last Visit <span className="text-red-600">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="30"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="Has_Reason_For_Encounter"
                                    render={({ field }) => (
                                        <FormItem className="flex items-start space-x-3 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Has Reason for Visit</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="Insurance_Coverage_Flag"
                                    render={({ field }) => (
                                        <FormItem className="flex items-start space-x-3 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Has Insurance Coverage</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Body Metrics Section */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Body Metrics</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium leading-none">
                                            {" Do you know the Patient's BMI?"} <span className="text-red-600">*</span>
                                        </label>
                                        <RadioGroup
                                            value={knowsBMI}
                                            onValueChange={(value) => {
                                                setKnowsBMI(value);
                                                // if (value === 'no') {
                                                //     form.setValue('BMI', undefined);
                                                // }
                                            }}
                                            className="flex gap-4"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="yes" id="bmi-yes" />
                                                <label htmlFor="bmi-yes" className="text-sm font-normal cursor-pointer">
                                                    Yes
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="no" id="bmi-no" />
                                                <label htmlFor="bmi-no" className="text-sm font-normal cursor-pointer">
                                                    No
                                                </label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>
                            </div>

                            {knowsBMI === 'no' && (
                                <>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium leading-none">
                                                Height (cm) <span className="text-red-600">*</span>
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="170"
                                                value={height ?? ''}
                                                onChange={(e) => {
                                                    const value = e.target.value === '' ? undefined : Number(e.target.value);
                                                    setHeight(value);
                                                    if (value && weight && value >= 50 && value <= 250 && weight >= 10 && weight <= 300) {
                                                        const calculatedBMI = calculateBMI(weight, value);
                                                        form.setValue('BMI', calculatedBMI);
                                                    }
                                                }}
                                                min={50}
                                                max={250}
                                                className="mt-2"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">Range: 50-250 cm</p>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium leading-none">
                                                Weight (kg) <span className="text-red-600">*</span>
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="70"
                                                value={weight ?? ''}
                                                onChange={(e) => {
                                                    const value = e.target.value === '' ? undefined : Number(e.target.value);
                                                    setWeight(value);
                                                    if (value && height && value >= 10 && value <= 300 && height >= 50 && height <= 250) {
                                                        const calculatedBMI = calculateBMI(value, height);
                                                        form.setValue('BMI', calculatedBMI);
                                                    }
                                                }}
                                                min={10}
                                                max={300}
                                                className="mt-2"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">Range: 10-300 kg</p>
                                        </div>
                                    </div>

                                    {height && weight && height >= 50 && height <= 250 && weight >= 10 && weight <= 300 && (
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium leading-none">
                                                    BMI
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={calculateBMI(weight, height)}
                                                    readOnly
                                                    className="mt-2 bg-muted"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">BMI = weight (kg) ÷ (height (cm))²</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {knowsBMI === 'yes' && (
                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="BMI"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    BMI <span className="text-red-600">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="25.5"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-xs">Body Mass Index</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* <FormField
                                        control={form.control}
                                        name="BMI_Category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    BMI Category <span className="text-red-600">*</span>
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Underweight">Underweight</SelectItem>
                                                        <SelectItem value="Normal">Normal</SelectItem>
                                                        <SelectItem value="Overweight">Overweight</SelectItem>
                                                        <SelectItem value="Obese">Obese</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    /> */}
                                </div>)}
                        </div>

                        <Separator />

                        {/* Blood Tests Section */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Blood Tests</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="Sample_Condition"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Sample Condition <span className="text-red-600">*</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="FBG">Fasting blood glucose - FBG</SelectItem>
                                                    <SelectItem value="Random">Random glucose</SelectItem>
                                                    <SelectItem value="OGTT">OGTT</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="HbA1c"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                HbA1c (%) <span className="text-red-600">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    placeholder="Must be between 3.5-20"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs">Hemoglobin A1c</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="Glucose"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Glucose (mg/dL) <span className="text-red-600">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Must be between 30-1000"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs">Blood glucose level</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Blood Pressure Section */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Blood Pressure</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <FormLabel>
                                        {"Do you know the Patient's Blood Pressure?"} <span className="text-red-600">*</span>
                                    </FormLabel>
                                    <RadioGroup
                                        value={knowsBP}
                                        onValueChange={(value) => {
                                            setKnowsBP(value);
                                            // if (value === 'yes') {
                                            //     form.setValue('BloodPressure_Status', undefined);
                                            // } else if (value === 'no') {
                                            //     form.setValue('BloodPressure', '');
                                            // }
                                        }}
                                        className="flex gap-4 mt-2"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="yes" id="bp-yes" />
                                            <label htmlFor="bp-yes" className="text-sm font-normal cursor-pointer">
                                                Yes
                                            </label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="no" id="bp-no" />
                                            <label htmlFor="bp-no" className="text-sm font-normal cursor-pointer">
                                                No
                                            </label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            </div>

                            {knowsBP === 'yes' && (
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <FormLabel>
                                            Blood Pressure (mmHg) <span className="text-red-600">*</span>
                                        </FormLabel>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex-1">
                                                <Input
                                                    type="number"
                                                    placeholder="120"
                                                    value={systolic && systolic > 180 ? '' : (systolic ?? '')}
                                                    onChange={(e) => {
                                                        const value = e.target.value === '' ? undefined : Number(e.target.value);
                                                        setSystolic(value);
                                                        if (value !== undefined && diastolic !== undefined) {
                                                            const systolicDisplay = value > 180 ? '180+' : value.toString();
                                                            const diastolicDisplay = diastolic > 120 ? '120+' : diastolic.toString();
                                                            form.setValue('BloodPressure', `${systolicDisplay}/${diastolicDisplay}`);
                                                        }
                                                    }}
                                                    min={70}
                                                />
                                                {systolic !== undefined && systolic > 180 && (
                                                    <Input
                                                        type="text"
                                                        value="180+"
                                                        readOnly
                                                        className="mt-2 bg-muted"
                                                    />
                                                )}
                                            </div>
                                            <span className="text-muted-foreground">/</span>
                                            <div className="flex-1">
                                                <Input
                                                    type="number"
                                                    placeholder="80"
                                                    value={diastolic && diastolic > 120 ? '' : (diastolic ?? '')}
                                                    onChange={(e) => {
                                                        const value = e.target.value === '' ? undefined : Number(e.target.value);
                                                        setDiastolic(value);
                                                        if (systolic !== undefined && value !== undefined) {
                                                            const systolicDisplay = systolic > 180 ? '180+' : systolic.toString();
                                                            const diastolicDisplay = value > 120 ? '120+' : value.toString();
                                                            form.setValue('BloodPressure', `${systolicDisplay}/${diastolicDisplay}`);
                                                        }
                                                    }}
                                                    min={40}
                                                />
                                                {diastolic !== undefined && diastolic > 120 && (
                                                    <Input
                                                        type="text"
                                                        value="120+"
                                                        readOnly
                                                        className="mt-2 bg-muted"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Systolic (70-180) / Diastolic (40-120)
                                        </p>
                                    </div>
                                </div>
                            )}

                            {knowsBP === 'no' && (
                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="BloodPressure_Status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    BP Status <span className="text-red-600">*</span>
                                                </FormLabel>
                                                <Select
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        // Set systolic and diastolic values based on status
                                                        if (value === 'Low') {
                                                            setSystolic(75);
                                                            setDiastolic(45);
                                                            form.setValue('BloodPressure', '75/45');
                                                        } else if (value === 'Normal') {
                                                            setSystolic(90);
                                                            setDiastolic(60);
                                                            form.setValue('BloodPressure', '90/60');
                                                        } else if (value === 'High') {
                                                            setSystolic(145);
                                                            setDiastolic(91);
                                                            form.setValue('BloodPressure', '145/91');
                                                        }
                                                    }}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Low">Low</SelectItem>
                                                        <SelectItem value="Normal">Normal</SelectItem>
                                                        <SelectItem value="High">High</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full cursor-pointer" size="lg" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2Icon className="size-4 mr-2 animate-spin" />
                                    Assessing Risk...
                                </>
                            ) : (
                                'Calculate Diabetes Risk'
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
