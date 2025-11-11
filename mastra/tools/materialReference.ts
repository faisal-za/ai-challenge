import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  Subtype,
  REQUIRED_FIELDS,
  EXPECTED_STANDARDS,
  DEFAULT_STANDARDS,
  ALLOWED_VALUES,
  FIELD_DISPLAY_NAMES,
} from './materialSubtypes';

/**
 * Reference tool for material subtype information, required fields, and allowed values.
 * Consult when needing to verify subtype requirements or validate enum values.
 */
export const materialReference = createTool({
  id: 'material-reference',
  description: `Reference data source for material subtypes, required fields, and allowed values.
  Consult when needing to verify material requirements or allowed enum values.

  Query types:
  - "required_fields": Get required fields for a subtype (e.g., "What fields for HDPE_ISO4427?")
  - "allowed_values": Get allowed values for enum fields (e.g., "Valid material_grade for HDPE?")
  - "standards": Get expected standards for a subtype (e.g., "What standard for cables?")
  - "subtype_list": List all available subtypes and families
  - "field_display": Get display name for a canonical field`,

  inputSchema: z.object({
    query_type: z.enum(['required_fields', 'allowed_values', 'standards', 'subtype_list', 'field_display']),
    query: z.string().optional().describe('Natural language query'),
    subtype: z.string().optional().describe('Material subtype (e.g., HDPE_ISO4427)'),
    field: z.string().optional().describe('Field name for allowed_values or display queries'),
  }),

  outputSchema: z.object({
    answer: z.string().describe('Direct answer to the query'),
    data: z.any().optional().describe('Structured reference data'),
    suggestions: z.array(z.string()).optional().describe('Related info or examples'),
  }),

  execute: async ({ context }) => {
    const { query_type, query, subtype, field } = context;

    // REQUIRED FIELDS
    if (query_type === 'required_fields') {
      const subtypeKey = (subtype || query) as Subtype;
      const requiredFields = REQUIRED_FIELDS[subtypeKey];

      if (!requiredFields) {
        return {
          answer: `Unknown subtype "${subtypeKey}". Valid subtypes: ${Object.keys(REQUIRED_FIELDS).join(', ')}`,
          data: null,
          suggestions: Object.keys(REQUIRED_FIELDS)
        };
      }

      const displayNames = requiredFields.map(f => FIELD_DISPLAY_NAMES[f] || f);

      return {
        answer: `Required fields for ${subtypeKey}: ${displayNames.join(', ')}`,
        data: {
          subtype: subtypeKey,
          required_fields: requiredFields,
          display_names: displayNames,
          count: requiredFields.length
        }
      };
    }

    // ALLOWED VALUES
    if (query_type === 'allowed_values') {
      const subtypeKey = (subtype || query.split(' ')[0]) as Subtype;
      const fieldName = field || query;

      if (!subtypeKey || !ALLOWED_VALUES[subtypeKey]) {
        return {
          answer: `Subtype "${subtypeKey}" not found or has no enum constraints.`,
          data: null,
          suggestions: Object.keys(ALLOWED_VALUES)
        };
      }

      const allowedForSubtype = ALLOWED_VALUES[subtypeKey];
      const values = allowedForSubtype[fieldName];

      if (!values) {
        return {
          answer: `No allowed values defined for field "${fieldName}" in ${subtypeKey}.`,
          data: {
            subtype: subtypeKey,
            field: fieldName,
            available_fields: Object.keys(allowedForSubtype)
          },
          suggestions: Object.keys(allowedForSubtype)
        };
      }

      return {
        answer: `Allowed values for "${fieldName}" in ${subtypeKey}: ${values.join(', ')}`,
        data: {
          subtype: subtypeKey,
          field: fieldName,
          allowed_values: values
        }
      };
    }

    // STANDARDS
    if (query_type === 'standards') {
      const subtypeKey = (subtype || query) as Subtype;
      const expectedStandards = EXPECTED_STANDARDS[subtypeKey];
      const defaultStandard = DEFAULT_STANDARDS[subtypeKey];

      if (!expectedStandards && !defaultStandard) {
        return {
          answer: `No standard information for "${subtypeKey}". Valid subtypes: ${Object.keys(EXPECTED_STANDARDS).join(', ')}`,
          data: null,
          suggestions: Object.keys(EXPECTED_STANDARDS)
        };
      }

      return {
        answer: `Standards for ${subtypeKey}: Expected: ${expectedStandards?.join(', ') || 'N/A'}, Default: ${defaultStandard || 'N/A'}`,
        data: {
          subtype: subtypeKey,
          expected_standards: expectedStandards || [],
          default_standard: defaultStandard
        }
      };
    }

    // SUBTYPE LIST
    if (query_type === 'subtype_list') {
      const subtypes = Object.keys(REQUIRED_FIELDS) as Subtype[];

      // Create family mapping
      const familyMap: Record<string, Subtype[]> = {
        pipe: ['HDPE_ISO4427', 'PVC_ASTMD1785'],
        cable: ['MV_CU_IEC60502_2'],
        board: ['GYPSUM_ASTMC1396'],
        block: ['CMU_ASTMC90'],
        cement: ['CEM_PORTLAND_C150'],
      };

      return {
        answer: `Available subtypes: ${subtypes.join(', ')}`,
        data: {
          subtypes,
          by_family: familyMap,
          count: subtypes.length
        }
      };
    }

    // FIELD DISPLAY
    if (query_type === 'field_display') {
      const fieldName = field || query;
      const displayName = FIELD_DISPLAY_NAMES[fieldName];

      if (!displayName) {
        return {
          answer: `No display name found for "${fieldName}". Common fields: od_mm, length_m, pressure_class`,
          data: null,
          suggestions: Object.keys(FIELD_DISPLAY_NAMES)
        };
      }

      return {
        answer: `Display name for "${fieldName}": ${displayName}`,
        data: {
          canonical: fieldName,
          display_name: displayName
        }
      };
    }

    return {
      answer: 'Unknown query type. Supported: required_fields, allowed_values, standards, subtype_list, field_display',
      data: null
    };
  }
});
