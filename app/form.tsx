'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CreateThreadWithMessage } from './actions';
import { Loader2Icon } from 'lucide-react';

const patientFormSchema = z.object({
    // CRITICAL INPUTS (Required by agent for accurate diagnosis)
    symptoms: z.string().min(3, { message: 'Symptoms required (min 3 characters)' }),
    age: z.coerce.number().min(0, { message: 'Age is required' }).max(120, { message: 'Age must be less than 120' }),
    sex: z.enum(['male', 'female'], {
        required_error: 'Sex is required for accurate diagnosis'
    }),

    // HELPFUL INPUTS (Optional but improve diagnostic accuracy)
    symptomOnset: z.string().optional(),
    symptomDuration: z.string().optional(),
    severity: z.enum(['mild', 'moderate', 'severe', 'critical']).optional(),
    anatomicalLocation: z.string().optional(),
    medicalHistory: z.string().optional(),
    currentMedications: z.string().optional(),
    allergies: z.string().optional(),
    isPregnant: z.boolean().default(false),
    recentTravel: z.string().optional(),
    familyHistory: z.string().optional(),
    temperature: z.coerce.number().optional(),
    heartRate: z.coerce.number().optional(),
    bloodPressure: z.string().optional(),
    respiratoryRate: z.coerce.number().optional(),
    oxygenSaturation: z.coerce.number().min(0).max(100).optional(),
    labResults: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

export default function PatientIntakeForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const form = useForm<PatientFormValues>({
        resolver: zodResolver(patientFormSchema),
        defaultValues: {
            symptoms: '',
            age: '' as any, // Empty string for number input to avoid uncontrolled warning
            sex: undefined,
            symptomOnset: '',
            symptomDuration: '',
            severity: undefined,
            anatomicalLocation: '',
            medicalHistory: '',
            currentMedications: '',
            allergies: '',
            isPregnant: false,
            recentTravel: '',
            familyHistory: '',
            temperature: '' as any,
            heartRate: '' as any,
            bloodPressure: '',
            respiratoryRate: '' as any,
            oxygenSaturation: '' as any,
            labResults: '',
        },
        mode: 'onBlur', // Validate on blur for better UX
    });

    async function onSubmit(data: PatientFormValues) {
        setError(null);

        // Build natural language message from form data
        const parts: string[] = [];

        if (data.age) parts.push(`${data.age} year old`);
        if (data.sex) parts.push(data.sex);
        parts.push(`patient presenting with ${data.symptoms}`);

        if (data.symptomDuration) parts.push(`for ${data.symptomDuration}`);
        if (data.symptomOnset) parts.push(`(onset: ${data.symptomOnset})`);
        if (data.severity) parts.push(`- severity: ${data.severity}`);
        if (data.anatomicalLocation) parts.push(`located at ${data.anatomicalLocation}`);

        const context: string[] = [];
        if (data.medicalHistory) context.push(`Medical history: ${data.medicalHistory}`);
        if (data.currentMedications) context.push(`Medications: ${data.currentMedications}`);
        if (data.allergies) context.push(`Allergies: ${data.allergies}`);
        if (data.isPregnant) context.push(`Patient is pregnant`);
        if (data.recentTravel) context.push(`Recent travel: ${data.recentTravel}`);
        if (data.familyHistory) context.push(`Family history: ${data.familyHistory}`);

        const vitals: string[] = [];
        if (data.temperature) vitals.push(`Temp: ${data.temperature}°C`);
        if (data.heartRate) vitals.push(`HR: ${data.heartRate} bpm`);
        if (data.bloodPressure) vitals.push(`BP: ${data.bloodPressure}`);
        if (data.respiratoryRate) vitals.push(`RR: ${data.respiratoryRate}/min`);
        if (data.oxygenSaturation) vitals.push(`SpO2: ${data.oxygenSaturation}%`);
        if (vitals.length > 0) context.push(`Vitals: ${vitals.join(', ')}`);

        if (data.labResults) context.push(`Labs: ${data.labResults}`);

        let message = parts.join(' ');
        if (context.length > 0) message += `\n\n${context.join('\n')}`;

        console.log('=== PATIENT FORM SUBMITTED ===');
        console.log(message);
        console.log('================================');

        // Create thread and redirect to conversation
        startTransition(async () => {
            try {
                const result = await CreateThreadWithMessage({ message });

                // Redirect to conversation page with the thread ID and initial message in URL
                router.push(`/chat/${result.threadId}?initialMessage=${encodeURIComponent(message)}`);
            } catch (err) {
                console.error('Failed to create thread:', err);
                setError('Failed to create patient case. Please try again.');
            }
        });
    }

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Patient Intake Form</CardTitle>
                <CardDescription>ICD-11 Diagnostic Analysis</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold">Critical Information</h3>

                            <FormField
                                control={form.control}
                                name="symptoms"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Symptoms <span className="text-red-600">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Describe symptoms" className="min-h-[80px]" {...field} />
                                        </FormControl>
                                        <FormDescription>Primary symptoms or chief complaint (Required)</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="age"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Age <span className="text-red-600">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="55" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs">Influences pediatric/geriatric diagnosis</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="sex"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Sex <span className="text-red-600">*</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select sex" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription className="text-xs">Filters gender-specific conditions</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h3 className="font-semibold">Symptom Details</h3>

                            <div className="grid md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="symptomOnset"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Onset</FormLabel>
                                            <FormControl>
                                                <Input placeholder="2 days ago" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="symptomDuration"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Duration</FormLabel>
                                            <FormControl>
                                                <Input placeholder="5 days" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="severity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Severity</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="mild">Mild</SelectItem>
                                                    <SelectItem value="moderate">Moderate</SelectItem>
                                                    <SelectItem value="severe">Severe</SelectItem>
                                                    <SelectItem value="critical">Critical</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="anatomicalLocation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Location</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Chest, abdomen, etc." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h3 className="font-semibold">Medical Context</h3>

                            <FormField
                                control={form.control}
                                name="medicalHistory"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Medical History</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Past conditions" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="currentMedications"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Medications</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Current medications" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="allergies"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Allergies</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Known allergies" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="isPregnant"
                                    render={({ field }) => (
                                        <FormItem className="flex items-start space-x-3 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Pregnant</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="recentTravel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Recent Travel</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Location" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="familyHistory"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Family History</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Family medical history" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h3 className="font-semibold">Vital Signs</h3>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="temperature"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Temp (°C)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.1" placeholder="37.5" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="heartRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>HR (bpm)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="80" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="bloodPressure"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>BP</FormLabel>
                                            <FormControl>
                                                <Input placeholder="120/80" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="respiratoryRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>RR (/min)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="16" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="oxygenSaturation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SpO2 (%)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="98" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h3 className="font-semibold">Lab Results</h3>

                            <FormField
                                control={form.control}
                                name="labResults"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lab Results</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="WBC, CRP, etc." className="min-h-[80px]" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                    Creating Patient Case...
                                </>
                            ) : (
                                'Submit Patient Information'
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
