import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  convertArabicNumerals,
  normalizeFieldName,
  ARABIC_TO_CANONICAL,
} from './materialSubtypes';

// Unit conversion reference data
const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
  // Length units (base: mm)
  length: {
    'mm': 1, 'مم': 1, 'مل': 1, 'ملم': 1, 'ميلي متر': 1,
    'cm': 10, 'سم': 10, 'سنتي متر': 10,
    'm': 1000, 'متر': 1000, 'م': 1000,
    'km': 1000000, 'كم': 1000000, 'كيلو متر': 1000000,
    'in': 25.4, 'بوصة': 25.4,
    'ft': 304.8, 'قدم': 304.8,
  },
  // Weight units (base: kg)
  weight: {
    'g': 0.001, 'جرام': 0.001, 'غ': 0.001, 'غرام': 0.001,
    'kg': 1, 'كغ': 1, 'كجم': 1, 'كيلو': 1, 'كيلو جرام': 1,
    'ton': 1000, 'طن': 1000, 'tonne': 1000, 'mt': 1000,
    'lb': 0.453592, 'رطل': 0.453592,
  },
  // Area units (base: mm²)
  area: {
    'mm²': 1, 'mm2': 1, 'مم²': 1, 'مم٢': 1,
    'cm²': 100, 'cm2': 100, 'سم²': 100, 'سم٢': 100,
    'm²': 1000000, 'm2': 1000000, 'م²': 1000000, 'م٢': 1000000,
  },
  // Pressure units (base: bar)
  pressure: {
    'bar': 1, 'بار': 1,
    'pa': 0.00001, 'باسكال': 0.00001,
    'kpa': 0.01,
    'mpa': 10, 'ميغا باسكال': 10,
    'psi': 0.0689476,
  },
  // Voltage units (base: V)
  voltage: {
    'v': 1, 'فولت': 1, 'ف': 1,
    'kv': 1000, 'كيلو فولت': 1000, 'ك.ف': 1000, 'كف': 1000,
    'mv': 0.001,
  },
  // Strength units (base: MPa)
  strength: {
    'mpa': 1, 'ميغا باسكال': 1,
    'kpa': 0.001,
    'pa': 0.000001, 'باسكال': 0.000001,
    'psi': 0.00689476,
  }
};

// Unit category mappings
const UNIT_CATEGORY_MAP: Record<string, string[]> = {
  length: ['mm', 'مم', 'مل', 'ملم', 'cm', 'سم', 'm', 'متر', 'م', 'km', 'كم', 'in', 'بوصة', 'ft', 'قدم'],
  weight: ['g', 'جرام', 'غ', 'kg', 'كغ', 'كجم', 'ton', 'طن', 'lb', 'رطل'],
  area: ['mm²', 'mm2', 'مم²', 'cm²', 'cm2', 'سم²', 'm²', 'm2', 'م²'],
  pressure: ['bar', 'بار', 'pa', 'باسكال', 'kpa', 'mpa', 'ميغا باسكال', 'psi', 'pn', 'PN'],
  voltage: ['v', 'فولت', 'ف', 'kv', 'كيلو فولت', 'ك.ف', 'كف', 'mv'],
  strength: ['mpa', 'ميغا باسكال', 'kpa', 'pa', 'باسكال', 'psi'],
};

// Canonical field to expected unit mapping
const FIELD_TO_UNIT: Record<string, { unit: string; category: string }> = {
  'od_mm': { unit: 'mm', category: 'length' },
  'id_mm': { unit: 'mm', category: 'length' },
  'thickness_mm': { unit: 'mm', category: 'length' },
  'size_mm': { unit: 'mm', category: 'length' },
  'length_m': { unit: 'm', category: 'length' },
  'width_m': { unit: 'm', category: 'length' },
  'nps_in': { unit: 'in', category: 'length' },
  'bag_weight_kg': { unit: 'kg', category: 'weight' },
  'area_mm2': { unit: 'mm²', category: 'area' },
  'pressure_class': { unit: '', category: 'pressure' },
  'voltage_kv': { unit: 'kV', category: 'voltage' },
  'compressive_strength_mpa': { unit: 'MPa', category: 'strength' },
};

/**
 * Reference tool for unit conversions, field mappings, and unit information.
 * Consult this tool when encountering unclear units or needing conversion help.
 */
export const unitsReference = createTool({
  id: 'units-reference',
  description: `Reference data source for units, conversions, and field mappings.
  Consult when encountering severely damaged/unclear unit abbreviations or needing conversion help.

  Query types:
  - "unit_synonym": Check if a unit abbreviation is valid (e.g., "Is مل valid for length?")
  - "conversion": Convert between units (e.g., "50 cm to mm")
  - "field_mapping": Get canonical field name (e.g., "What's canonical for القطر?")
  - "field_info": Get expected unit for a field (e.g., "What unit for od_mm?")`,

  inputSchema: z.object({
    query_type: z.enum(['unit_synonym', 'conversion', 'field_mapping', 'field_info']),
    query: z.string().describe('Natural language query or specific question'),
    // Optional parameters for structured queries
    unit: z.string().optional().describe('Unit abbreviation to check'),
    value: z.number().optional().describe('Numeric value to convert'),
    from_unit: z.string().optional().describe('Source unit for conversion'),
    to_unit: z.string().optional().describe('Target unit for conversion'),
    field_name: z.string().optional().describe('Field name (Arabic or English) to look up'),
  }),

  outputSchema: z.object({
    answer: z.string().describe('Direct answer to the query'),
    data: z.any().optional().describe('Structured reference data'),
    suggestions: z.array(z.string()).optional().describe('Alternative suggestions or related info'),
  }),

  execute: async ({ context }) => {
    const { query_type, query, unit, value, from_unit, to_unit, field_name } = context;

    // UNIT SYNONYM LOOKUP
    if (query_type === 'unit_synonym') {
      const checkUnit = unit || query;
      const normalized = convertArabicNumerals(checkUnit).toLowerCase().trim();

      // Find which category this unit belongs to
      let foundCategory: string | null = null;
      let foundSynonyms: string[] = [];

      for (const [category, units] of Object.entries(UNIT_CATEGORY_MAP)) {
        if (units.some(u => u.toLowerCase() === normalized)) {
          foundCategory = category;
          foundSynonyms = units;
          break;
        }
      }

      if (foundCategory) {
        const conversions = UNIT_CONVERSIONS[foundCategory];
        const canonicalUnit = Object.keys(conversions)[0]; // First is canonical

        return {
          answer: `Yes, "${checkUnit}" is a valid ${foundCategory} unit. Common synonyms include: ${foundSynonyms.slice(0, 8).join(', ')}`,
          data: {
            unit: checkUnit,
            category: foundCategory,
            canonical: canonicalUnit,
            synonyms: foundSynonyms,
            valid: true,
          }
        };
      } else {
        return {
          answer: `"${checkUnit}" is not recognized as a standard unit. Common categories: length (mm, m), weight (kg), pressure (bar, MPa), voltage (kV).`,
          data: { unit: checkUnit, valid: false },
          suggestions: ['mm', 'cm', 'm', 'kg', 'bar', 'MPa', 'kV']
        };
      }
    }

    // CONVERSION
    if (query_type === 'conversion') {
      if (!value || !from_unit || !to_unit) {
        return {
          answer: 'Conversion requires value, from_unit, and to_unit parameters.',
          data: null
        };
      }

      const normalizedFrom = convertArabicNumerals(from_unit).toLowerCase().trim();
      const normalizedTo = convertArabicNumerals(to_unit).toLowerCase().trim();

      // Find category
      let category: string | null = null;
      for (const [cat, units] of Object.entries(UNIT_CATEGORY_MAP)) {
        if (units.some(u => u.toLowerCase() === normalizedFrom)) {
          category = cat;
          break;
        }
      }

      if (!category) {
        return {
          answer: `Unknown unit category for "${from_unit}".`,
          data: null
        };
      }

      const conversions = UNIT_CONVERSIONS[category];
      const fromFactor = conversions[normalizedFrom];
      const toFactor = conversions[normalizedTo];

      if (fromFactor === undefined || toFactor === undefined) {
        return {
          answer: `Cannot convert between "${from_unit}" and "${to_unit}". One or both units not found in ${category} category.`,
          data: null
        };
      }

      const result = (value * fromFactor) / toFactor;
      const rounded = Math.round(result * 1000) / 1000;

      return {
        answer: `${value} ${from_unit} = ${rounded} ${to_unit}`,
        data: {
          value: rounded,
          from: from_unit,
          to: to_unit,
          category,
          calculation: `${value} × ${fromFactor} ÷ ${toFactor} = ${rounded}`
        }
      };
    }

    // FIELD MAPPING
    if (query_type === 'field_mapping') {
      const fieldToCheck = field_name || query;
      const canonical = normalizeFieldName(fieldToCheck);

      if (canonical === fieldToCheck.toLowerCase().trim()) {
        // Already canonical or unknown
        const arabicNames = Object.entries(ARABIC_TO_CANONICAL)
          .filter(([_, can]) => can === canonical)
          .map(([ar, _]) => ar);

        if (arabicNames.length > 0) {
          return {
            answer: `"${fieldToCheck}" is already canonical. Arabic equivalents: ${arabicNames.join(', ')}`,
            data: { canonical, arabic_names: arabicNames }
          };
        } else {
          return {
            answer: `"${fieldToCheck}" is not recognized. Common fields: od_mm, length_m, pressure_class, voltage_kv, area_mm2`,
            data: { canonical: null },
            suggestions: ['od_mm', 'length_m', 'thickness_mm', 'pressure_class', 'voltage_kv', 'area_mm2']
          };
        }
      }

      return {
        answer: `"${fieldToCheck}" → canonical: "${canonical}"`,
        data: {
          original: fieldToCheck,
          canonical,
          expected_unit: FIELD_TO_UNIT[canonical]?.unit || 'unknown'
        }
      };
    }

    // FIELD INFO
    if (query_type === 'field_info') {
      const fieldToCheck = field_name || query;
      const canonical = normalizeFieldName(fieldToCheck);
      const info = FIELD_TO_UNIT[canonical];

      if (info) {
        return {
          answer: `Field "${canonical}" expects unit: ${info.unit || '(dimensionless)'}, category: ${info.category}`,
          data: {
            field: canonical,
            expected_unit: info.unit,
            category: info.category
          }
        };
      } else {
        return {
          answer: `No information found for field "${fieldToCheck}". Common fields: od_mm, length_m, pressure_class, voltage_kv`,
          data: null,
          suggestions: Object.keys(FIELD_TO_UNIT)
        };
      }
    }

    return {
      answer: 'Unknown query type. Supported: unit_synonym, conversion, field_mapping, field_info',
      data: null
    };
  }
});
