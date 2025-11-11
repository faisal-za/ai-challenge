import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  Subtype,
  Family,
  detectSubtypeFromText,
  FAMILY_BY_SUBTYPE,
  REQUIRED_FIELDS,
  EXPECTED_STANDARDS,
  ALLOWED_VALUES,
  FIELD_DISPLAY_NAMES,
} from './materialSubtypes';

export const catalogLookupTool = createTool({
  id: 'catalog-lookup',
  description: `Detects material subtype from item description (Arabic or English).

  INPUT: Simple material description with material type (e.g., "HDPE pipe", "كابل نحاسي", "لوح جبس")
  - Standards are optional in the description
  - Just the material type is enough to detect subtype

  Supported subtypes:
  - HDPE_ISO4427: HDPE pipes, بولي إيثيلين، polyethylene
  - PVC_ASTMD1785: PVC pipes
  - MV_CU_IEC60502_2: Cables (كابل، cable، copper cable، كابل نحاسي)
  - GYPSUM_ASTMC1396: Gypsum boards (جبس، لوح جبس، gypsum)
  - CMU_ASTMC90: Concrete blocks (طابوق، بلك، طوب خرساني، CMU، concrete block)
  - CEM_PORTLAND_C150: Cement (اسمنت، سمنت، cement، بورتلاند، portland)

  Returns the detected subtype, material family, required fields, and expected standards.

  IMPORTANT: Call this tool ONLY ONCE per item. If matched=false, do not retry.
  `,

  inputSchema: z.object({
    itemDescription: z.string().describe('Raw material description in English or Arabic (e.g., "HDPE pipe ISO 4427 DN50", "كابل 6/10 كيلو فولت")'),
  }),
  outputSchema: z.object({
    matched: z.boolean().describe('Whether a subtype was detected'),
    subtype: z.string().nullable().describe('Detected material subtype code (e.g., "HDPE_ISO4427", "MV_CU_IEC60502_2")'),
    family: z.string().nullable().describe('Material family (e.g., "pipe", "cable", "cement")'),
    requiredFields: z.array(z.string()).describe('List of required canonical field names for this subtype'),
    expectedStandards: z.array(z.string()).describe('Valid standards for this subtype'),
    allowedValues: z.record(z.array(z.string())).describe('Allowed enum values for specific fields'),
    fieldDisplayNames: z.record(z.string()).describe('Human-readable names for required fields'),
    confidence: z.number().min(0).max(1).describe('Detection confidence (0-1)'),
  }),

  execute: async ({ context }) => {
    const { itemDescription } = context;

    // Detect subtype using the pattern-based detector
    const detectedSubtype = detectSubtypeFromText(itemDescription);

    if (!detectedSubtype) {
      return {
        matched: false,
        subtype: null,
        family: null,
        requiredFields: [],
        expectedStandards: [],
        allowedValues: {},
        fieldDisplayNames: {},
        confidence: 0,
      };
    }

    // Get metadata for the detected subtype
    const family = FAMILY_BY_SUBTYPE[detectedSubtype];
    const requiredFields = REQUIRED_FIELDS[detectedSubtype];
    const expectedStandards = EXPECTED_STANDARDS[detectedSubtype];
    const allowedValues = ALLOWED_VALUES[detectedSubtype] || {};

    // Build field display names for required fields
    const fieldDisplayNames: Record<string, string> = {};
    for (const field of requiredFields) {
      fieldDisplayNames[field] = FIELD_DISPLAY_NAMES[field] || field;
    }

    return {
      matched: true,
      subtype: detectedSubtype,
      family,
      requiredFields,
      expectedStandards,
      allowedValues,
      fieldDisplayNames,
      confidence: 0.9, // High confidence for pattern-matched subtypes
    };
  }
});
