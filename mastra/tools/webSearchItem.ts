import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { tavily } from '@tavily/core';

export const webSearchItemTool = createTool({
  id: 'web-search-item',
  description: `Searches the web for unknown construction materials when catalog lookup fails.
  Uses Tavily search API to find material specifications, common units, and classification.
  Should be used as a fallback when item is not in the standard catalog.
  Searches in the SAME LANGUAGE as the input (Arabic → Arabic search, English → English search).`,

  inputSchema: z.object({
    itemDescription: z.string().describe('Material description to search for (e.g., "acoustic ceiling tiles", "ماسورة تحويل حراري")'),
    context: z.string().optional().describe('Additional RFQ context to refine search (e.g., "for hospital construction", "residential building")'),
    language: z.enum(['ar', 'en']).optional().default('en').describe('Search language: "ar" for Arabic, "en" for English')
  }),

  outputSchema: z.object({
    found: z.boolean().describe('Whether relevant information was found'),
    suggestedFamily: z.string().nullable().describe('Suggested material family based on search results (pipe, cable, cement, board, block, or other)'),
    suggestedSubtype: z.string().nullable().describe('Suggested subtype if identifiable (e.g., HDPE_ISO4427, MV_CU_IEC60502_2)'),
    specs: z.record(z.string()).describe('Extracted specifications from search results'),
    description: z.string().describe('Brief description of the material from search results'),
    sources: z.array(z.string()).describe('URLs of sources used'),
    confidence: z.number().min(0).max(1).describe('Confidence in the extracted information (0-1)')
  }),

  execute: async ({ context }) => {
    const { itemDescription, context: rfqContext, language } = context;

    try {
      // Initialize Tavily client (reads from TAVILY_API_KEY env var)
      const client = tavily({ apiKey: process.env.TAVILY_API_KEY });

      // Build search query with comprehensive context
      let searchQuery = '';
      if (language === 'ar') {
        searchQuery = `"${itemDescription}" أنواع ومواصفات استخدامات مواد البناء`;

        // Add category hints for specialized materials
        if (itemDescription.includes('طينة') || itemDescription.includes('لاصق')) {
          searchQuery += ' منتجات عزل تطبيقات';
        } else if (itemDescription.includes('إبوكسي') || itemDescription.includes('راتنج')) {
          searchQuery += ' درجات تطبيقات صناعية';
        } else if (itemDescription.includes('بوليمر')) {
          searchQuery += ' أنواع خصائص استخدامات';
        }

        if (rfqContext) {
          searchQuery += ` ${rfqContext}`;
        }
      } else {
        searchQuery = `"${itemDescription}" types specifications uses construction industry standards`;

        // Add category hints for specialized materials
        if (itemDescription.toLowerCase().includes('coating') || itemDescription.toLowerCase().includes('adhesive')) {
          searchQuery += ' products applications grades';
        } else if (itemDescription.toLowerCase().includes('epoxy') || itemDescription.toLowerCase().includes('resin')) {
          searchQuery += ' grades industrial applications';
        } else if (itemDescription.toLowerCase().includes('polymer')) {
          searchQuery += ' types properties uses';
        }

        if (rfqContext) {
          searchQuery += ` ${rfqContext}`;
        }
      }

      console.log(`[Web Search] Searching for: ${searchQuery}`);

      // Perform Tavily search with enhanced parameters
      const response = await client.search(searchQuery, {
        searchDepth: 'advanced',
        maxResults: 7,
        language: language,
        includeAnswer: 'advanced',
        includeRawContent: 'markdown',
        timeout: 45
      });

      // Check if we got an answer
      if (!response.answer || response.answer.trim() === '') {
        return {
          found: false,
          suggestedFamily: null,
          suggestedSubtype: null,
          specs: {},
          description: 'No information found',
          sources: [],
          confidence: 0
        };
      }

      // Use the AI-generated answer directly
      const answer = response.answer;
      const answerLower = answer.toLowerCase();

      // Identify material family from answer
      const familyPatterns = {
        pipe: /pipe|tube|أنبوب|ماسور|مواسير/i,
        cable: /cable|wire|كابل|سلك/i,
        cement: /cement|concrete|أسمنت|خرسان/i,
        board: /board|panel|لوح|بانل/i,
        block: /block|brick|بلك|طوب|طابوق/i,
      };

      let suggestedFamily: string | null = null;
      for (const [family, pattern] of Object.entries(familyPatterns)) {
        if (pattern.test(answerLower)) {
          suggestedFamily = family;
          break;
        }
      }

      // Try to identify subtype from answer
      const subtypePatterns: Record<string, RegExp> = {
        HDPE_ISO4427: /hdpe|polyethylene|بولي.*إيثيلين/i,
        PVC_ASTMD1785: /pvc/i,
        MV_CU_IEC60502_2: /(medium.*voltage|mv|6\/10.*kv)/i,
        GYPSUM_ASTMC1396: /gypsum|جبس/i,
        CMU_ASTMC90: /(cmu|concrete.*block)/i,
        CEM_PORTLAND_C150: /portland.*cement/i,
      };

      let suggestedSubtype: string | null = null;
      for (const [subtype, pattern] of Object.entries(subtypePatterns)) {
        if (pattern.test(answerLower)) {
          suggestedSubtype = subtype;
          break;
        }
      }

      // Extract potential specs from answer
      const specs: Record<string, string> = {};

      // Look for common spec patterns in answer
      const diameterMatch = answerLower.match(/(\d+)\s*(mm|مم|inch)/i);
      if (diameterMatch) {
        specs['diameter'] = diameterMatch[0];
      }

      const voltageMatch = answerLower.match(/(\d+\/\d+|\d+)\s*(kv|v|كيلو.*فولت)/i);
      if (voltageMatch) {
        specs['voltage'] = voltageMatch[0];
      }

      // Use the AI answer as description (ready to consume)
      const description = answer;

      // Collect source URLs (if available)
      const sources = response.results?.slice(0, 3).map(r => r.url) || [];

      // Calculate confidence
      let confidence = 0.6; // Base confidence from AI answer
      if (suggestedFamily) confidence += 0.2;
      if (suggestedSubtype) confidence += 0.1;
      if (Object.keys(specs).length > 0) confidence += 0.1;

      return {
        found: true,
        suggestedFamily,
        suggestedSubtype,
        specs,
        description,
        sources,
        confidence: Math.min(confidence, 0.9) // Cap at 0.9
      };

    } catch (error) {
      console.error('[Web Search Item Tool] Error:', error);
      return {
        found: false,
        suggestedFamily: null,
        suggestedSubtype: null,
        specs: {},
        description: `Search failed: ${error.message}`,
        sources: [],
        confidence: 0
      };
    }
  }
});
