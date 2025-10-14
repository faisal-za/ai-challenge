'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CreateThreadWithMessage } from './actions';
import { Loader2Icon } from 'lucide-react';

// Schema based on Risk Assessment Agent scoring rules
const riskAssessmentFormSchema = z.object({
    // DEMOGRAPHICS (Required)
    Age: z.coerce.number().min(0, { message: 'Age is required' }).max(120),
    Gender: z.enum(['Male', 'Female'], {
        required_error: 'Gender is required'
    }),
    Smoking_Flag: z.boolean().default(false),

    // BODY METRICS (Required)
    BMI: z.coerce.number().min(10, { message: 'BMI is required' }).max(60),
    BMI_Category: z.enum(['Normal', 'Overweight', 'Obese', 'Underweight']).optional(),

    // BLOOD TESTS (Required)
    HbA1c: z.coerce.number().min(3, { message: 'HbA1c is required' }).max(15),
    Glucose: z.coerce.number().min(50, { message: 'Glucose is required' }).max(400),

    // BLOOD PRESSURE (Required)
    BloodPressure: z.string().optional(),
    BloodPressure_Status: z.enum(['Normal', 'High'], {
        required_error: 'Blood Pressure Status is required'
    }),

    // CHRONIC CONDITIONS
    Chronic_Conditions_Count: z.coerce.number().min(0).optional(),
    Condition_Duration_Days: z.coerce.number().min(0).optional(),

    // MEDICATIONS
    Chronic_Medications_Count: z.coerce.number().min(0).optional(),
    Medication_Adherence_Level: z.enum(['Low', 'Medium', 'Good', 'Excellent']).optional(),
    Active_Medication_Flag: z.boolean().default(false),

    // HEALTHCARE ACCESS
    Encounters_Last_12m: z.coerce.number().min(0).optional(),
    Time_Since_Last_Encounter_Days: z.coerce.number().min(0).optional(),
    Has_Reason_For_Encounter: z.boolean().default(true),
    Insurance_Coverage_Flag: z.boolean().default(true),
});

type RiskAssessmentFormValues = z.infer<typeof riskAssessmentFormSchema>;

export default function RiskAssessmentForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const form = useForm<RiskAssessmentFormValues>({
        resolver: zodResolver(riskAssessmentFormSchema),
        defaultValues: {
            Age: '' as any,
            Gender: undefined,
            Smoking_Flag: false,
            BMI: '' as any,
            BMI_Category: undefined,
            HbA1c: '' as any,
            Glucose: '' as any,
            BloodPressure: '',
            BloodPressure_Status: undefined,
            Chronic_Conditions_Count: '' as any,
            Condition_Duration_Days: '' as any,
            Chronic_Medications_Count: '' as any,
            Medication_Adherence_Level: undefined,
            Active_Medication_Flag: false,
            Encounters_Last_12m: '' as any,
            Time_Since_Last_Encounter_Days: '' as any,
            Has_Reason_For_Encounter: true,
            Insurance_Coverage_Flag: true,
        },
        mode: 'onBlur',
    });

    async function onSubmit(data: RiskAssessmentFormValues) {
        setError(null);

        // Build natural language message for risk assessment
        const parts: string[] = [];

        // Demographics
        parts.push(`## Patient Information`);
        parts.push(`- **Age:** ${data.Age} years old`);
        parts.push(`- **Gender:** ${data.Gender}`);
        if (data.Smoking_Flag) parts.push(`- **Smoking Status:** Active smoker`);

        // Body Metrics
        if (data.BMI || data.BMI_Category) {
            parts.push(``);
            parts.push(`## Body Metrics`);
            if (data.BMI) parts.push(`- **BMI:** ${data.BMI}`);
            if (data.BMI_Category) parts.push(`- **BMI Category:** ${data.BMI_Category}`);
        }

        // Blood Tests
        if (data.HbA1c || data.Glucose) {
            parts.push(``);
            parts.push(`## Blood Tests`);
            if (data.HbA1c) parts.push(`- **HbA1c:** ${data.HbA1c}%`);
            if (data.Glucose) parts.push(`- **Glucose:** ${data.Glucose} mg/dL`);
        }

        // Blood Pressure
        if (data.BloodPressure || data.BloodPressure_Status) {
            parts.push(``);
            parts.push(`## Blood Pressure`);
            if (data.BloodPressure) parts.push(`- **Reading:** ${data.BloodPressure} mmHg`);
            if (data.BloodPressure_Status) parts.push(`- **Status:** ${data.BloodPressure_Status}`);
        }

        // Chronic Conditions
        if (data.Chronic_Conditions_Count || data.Condition_Duration_Days) {
            parts.push(``);
            parts.push(`## Chronic Conditions`);
            if (data.Chronic_Conditions_Count) parts.push(`- **Number of Conditions:** ${data.Chronic_Conditions_Count}`);
            if (data.Condition_Duration_Days) parts.push(`- **Duration:** ${data.Condition_Duration_Days} days since diagnosis`);
        }

        // Medications
        if (data.Chronic_Medications_Count || data.Medication_Adherence_Level || data.Active_Medication_Flag) {
            parts.push(``);
            parts.push(`## Medications`);
            if (data.Chronic_Medications_Count) parts.push(`- **Number of Medications:** ${data.Chronic_Medications_Count}`);
            if (data.Medication_Adherence_Level) parts.push(`- **Adherence Level:** ${data.Medication_Adherence_Level}`);
            if (data.Active_Medication_Flag) parts.push(`- **Currently Taking Medication:** Yes`);
        }

        // Healthcare Access
        if (data.Encounters_Last_12m || data.Time_Since_Last_Encounter_Days || !data.Has_Reason_For_Encounter || !data.Insurance_Coverage_Flag) {
            parts.push(``);
            parts.push(`## Healthcare Access`);
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
                            <h3 className="font-semibold text-lg">Demographics</h3>

                            <div className="grid md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="Age"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Age <span className="text-red-600">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="45" {...field} />
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
                                    name="Smoking_Flag"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center space-x-3 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Smoker</FormLabel>
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
                                <FormField
                                    control={form.control}
                                    name="BMI"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                BMI <span className="text-red-600">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.1" placeholder="25.5" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs">Body Mass Index</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="BMI_Category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>BMI Category</FormLabel>
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
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Blood Tests Section */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Blood Tests</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="HbA1c"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                HbA1c (%) <span className="text-red-600">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.1" placeholder="5.7" {...field} />
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
                                                <Input type="number" placeholder="100" {...field} />
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
                                <FormField
                                    control={form.control}
                                    name="BloodPressure"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Blood Pressure</FormLabel>
                                            <FormControl>
                                                <Input placeholder="120/80" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs">Systolic/Diastolic (mmHg)</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="BloodPressure_Status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                BP Status <span className="text-red-600">*</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Normal">Normal</SelectItem>
                                                    <SelectItem value="High">High</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Chronic Conditions Section */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Chronic Conditions</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="Chronic_Conditions_Count"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Number of Chronic Conditions</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="Condition_Duration_Days"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Condition Duration (Days)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="365" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs">Days since diagnosis</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Medications Section */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Medications</h3>

                            <div className="grid md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="Chronic_Medications_Count"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Number of Medications</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="Medication_Adherence_Level"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Adherence Level</FormLabel>
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

                                <FormField
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
                                />
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
                                            <FormLabel>Encounters (Last 12 Months)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} />
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
                                            <FormLabel>Days Since Last Visit</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="30" {...field} />
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

                        {error && (
                            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
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
