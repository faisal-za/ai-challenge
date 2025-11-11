// Priority subtypes per family (edit as you learn real data)
export type Family = "pipe" | "cable" | "cement" | "board" | "block";
export type Subtype =
  | "HDPE_ISO4427"        // pipe
  | "PVC_ASTMD1785"       // pipe
  | "MV_CU_IEC60502_2"    // cable
  | "GYPSUM_ASTMC1396"    // board
  | "CMU_ASTMC90"         // block
  | "CEM_PORTLAND_C150";  // cement

export const FAMILY_BY_SUBTYPE: Record<Subtype, Family> = {
  HDPE_ISO4427: "pipe",
  PVC_ASTMD1785: "pipe",
  MV_CU_IEC60502_2: "cable",
  GYPSUM_ASTMC1396: "board",
  CMU_ASTMC90: "block",
  CEM_PORTLAND_C150: "cement",
};

export const PRIORITY_SUBTYPES: Subtype[] = [
  "HDPE_ISO4427",
  "MV_CU_IEC60502_2",
  "CEM_PORTLAND_C150",
  "GYPSUM_ASTMC1396",
  "CMU_ASTMC90",
];

// Minimal required fields per subtype (deterministic gate)
export const REQUIRED_FIELDS: Record<Subtype, string[]> = {
  HDPE_ISO4427: ["od_mm", "pressure_class", "sdr", "material_grade", "length_m", "standard"],
  PVC_ASTMD1785: ["nps_in", "schedule", "length_m", "standard"],
  MV_CU_IEC60502_2: ["cores", "area_mm2", "voltage_kv", "insulation", "conductor_class", "sheath", "screen_or_armor", "standard"],
  GYPSUM_ASTMC1396: ["thickness_mm", "width_m", "length_m", "edge_type", "type_code", "standard"],
  CMU_ASTMC90: ["size_mm", "density_class", "compressive_strength_mpa", "void_type", "standard"],
  CEM_PORTLAND_C150: ["standard", "astm_type", "bag_weight_kg"],
};

// Lightweight alias cues (AR/EN) → subtype hints
export const SUBTYPE_CUES: Array<{ cues: RegExp[]; subtype: Subtype }> = [
  { cues: [/hdpe|بولي\s*إيثيلين/i, /iso\s*4427/i], subtype: "HDPE_ISO4427" },
  { cues: [/pvc/i, /astm\s*d1785/i], subtype: "PVC_ASTMD1785" },
  { cues: [/كابل|cable/i, /(6\/10|6-10)\s*k?v/i, /iec\s*60502-2/i], subtype: "MV_CU_IEC60502_2" },
  { cues: [/جبس|gypsum/i, /c1396/i], subtype: "GYPSUM_ASTMC1396" },
  { cues: [/خرساني|block|cmu|طابوق|بلك/i, /c90/i], subtype: "CMU_ASTMC90" },
  { cues: [/اسمنت|سمنت|cement/i, /c150/i], subtype: "CEM_PORTLAND_C150" },
];

export function detectSubtypeFromText(text: string): Subtype | null {
  for (const r of SUBTYPE_CUES) if (r.cues.every(rx => rx.test(text))) return r.subtype;
  return null;
}

// Arabic → Canonical field name mapping
export const ARABIC_TO_CANONICAL: Record<string, string> = {
  // Common fields
  'القطر': 'od_mm',
  'قطر': 'od_mm',
  'القطر الخارجي': 'od_mm',
  'الطول': 'length_m',
  'طول': 'length_m',
  'العرض': 'width_m',
  'عرض': 'width_m',
  'السمك': 'thickness_mm',
  'سمك': 'thickness_mm',
  'السماكة': 'thickness_mm',
  'النوع': 'type',
  'نوع': 'type',
  'المادة': 'material',
  'مادة': 'material',
  'الدرجة': 'grade',
  'درجة': 'grade',
  'المعيار': 'standard',
  'معيار': 'standard',
  'المواصفة': 'standard',

  // Pipe-specific
  'ضغط': 'pressure_class',
  'فئة الضغط': 'pressure_class',
  'الضغط': 'pressure_class',
  'جدول': 'schedule',
  'الجدول': 'schedule',
  'نسبة البعد القياسي': 'sdr',
  'درجة المادة': 'material_grade',

  // Cable-specific
  'عدد الموصلات': 'cores',
  'الموصلات': 'cores',
  'مساحة المقطع': 'area_mm2',
  'المقطع': 'area_mm2',
  'الجهد': 'voltage_kv',
  'جهد': 'voltage_kv',
  'العزل': 'insulation',
  'عزل': 'insulation',
  'الغلاف': 'sheath',
  'غلاف': 'sheath',
  'التدريع': 'screen_or_armor',
  'تدريع': 'screen_or_armor',
  'فئة الموصل': 'conductor_class',
  'صنف الموصل': 'conductor_class',

  // Gypsum-specific
  'نوع الحافة': 'edge_type',
  'الحافة': 'edge_type',
  'رمز النوع': 'type_code',
  'كود النوع': 'type_code',

  // CMU-specific
  'الحجم': 'size_mm',
  'حجم': 'size_mm',
  'الأبعاد': 'size_mm',
  'فئة الكثافة': 'density_class',
  'الكثافة': 'density_class',
  'مقاومة الضغط': 'compressive_strength_mpa',
  'قوة الضغط': 'compressive_strength_mpa',
  'نوع الفراغ': 'void_type',
  'الفراغ': 'void_type',

  // Cement-specific
  'وزن الكيس': 'bag_weight_kg',
  'وزن الشوال': 'bag_weight_kg',
  'نوع ASTM': 'astm_type',
  'النوع حسب ASTM': 'astm_type',
};

// Allowed values for enum fields per subtype
export const ALLOWED_VALUES: Record<Subtype, Record<string, string[]>> = {
  HDPE_ISO4427: {
    pressure_class: ['PN4', 'PN6', 'PN8', 'PN10', 'PN12.5', 'PN16', 'PN20', 'PN25'],
    material_grade: ['PE80', 'PE100'],
    sdr: ['SDR41', 'SDR33', 'SDR26', 'SDR21', 'SDR17', 'SDR13.6', 'SDR11', 'SDR9', 'SDR7.4'],
  },
  PVC_ASTMD1785: {
    schedule: ['Schedule 40', 'Schedule 80', 'SDR 21', 'SDR 26'],
  },
  MV_CU_IEC60502_2: {
    insulation: ['XLPE', 'EPR'],
    sheath: ['PVC', 'LSZH', 'PE'],
    screen_or_armor: ['SWA', 'AWA', 'CTS', 'STA', 'None'],
    conductor_class: ['Class 1', 'Class 2', 'Class 5'],
  },
  GYPSUM_ASTMC1396: {
    edge_type: ['Tapered', 'Square', 'Beveled', 'Rounded'],
    type_code: ['Regular', 'Type X', 'Type C', 'MR', 'FR', 'Mold-Resistant'],
  },
  CMU_ASTMC90: {
    density_class: ['Lightweight', 'Medium Weight', 'Normal Weight'],
    void_type: ['Hollow', 'Solid', '2-Core', '3-Core'],
  },
  CEM_PORTLAND_C150: {
    astm_type: ['Type I', 'Type II', 'Type III', 'Type IV', 'Type V'],
  },
};

// Convert Arabic/Eastern Arabic numerals to Western
export function convertArabicNumerals(text: string): string {
  const arabicNumerals: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  };

  return text.replace(/[٠-٩۰-۹]/g, (match) => arabicNumerals[match] || match);
}

// Normalize field name (Arabic → Canonical)
export function normalizeFieldName(fieldName: string): string {
  const normalized = fieldName.trim().toLowerCase();

  // Check Arabic mapping first
  if (ARABIC_TO_CANONICAL[normalized]) {
    return ARABIC_TO_CANONICAL[normalized];
  }

  // Check if already canonical or English variant
  const commonEnglishMappings: Record<string, string> = {
    'diameter': 'od_mm',
    'outer diameter': 'od_mm',
    'od': 'od_mm',
    'length': 'length_m',
    'width': 'width_m',
    'thickness': 'thickness_mm',
    'type': 'type',
    'material': 'material',
    'grade': 'grade',
    'standard': 'standard',
    'pressure': 'pressure_class',
    'pressure class': 'pressure_class',
    'pn': 'pressure_class',
    'sdr': 'sdr',
    'material grade': 'material_grade',
    'schedule': 'schedule',
    'cores': 'cores',
    'conductor area': 'area_mm2',
    'area': 'area_mm2',
    'voltage': 'voltage_kv',
    'insulation': 'insulation',
    'sheath': 'sheath',
    'armor': 'screen_or_armor',
    'armour': 'screen_or_armor',
    'conductor class': 'conductor_class',
    'edge type': 'edge_type',
    'edge': 'edge_type',
    'type code': 'type_code',
    'size': 'size_mm',
    'dimensions': 'size_mm',
    'density class': 'density_class',
    'density': 'density_class',
    'compressive strength': 'compressive_strength_mpa',
    'strength': 'compressive_strength_mpa',
    'void type': 'void_type',
    'void': 'void_type',
    'bag weight': 'bag_weight_kg',
    'weight': 'bag_weight_kg',
    'astm type': 'astm_type',
  };

  return commonEnglishMappings[normalized] || fieldName;
}

// Human-readable field names for clarification questions
export const FIELD_DISPLAY_NAMES: Record<string, string> = {
  od_mm: 'Outer Diameter (mm)',
  length_m: 'Length (m)',
  width_m: 'Width (m)',
  thickness_mm: 'Thickness (mm)',
  pressure_class: 'Pressure Class (PN)',
  sdr: 'SDR Ratio',
  material_grade: 'Material Grade',
  schedule: 'Schedule',
  cores: 'Number of Cores',
  area_mm2: 'Conductor Area (mm²)',
  voltage_kv: 'Voltage Rating (kV)',
  insulation: 'Insulation Type',
  sheath: 'Sheath Material',
  screen_or_armor: 'Screen/Armor',
  conductor_class: 'Conductor Class',
  edge_type: 'Edge Type',
  type_code: 'Type Code',
  size_mm: 'Size/Dimensions (mm)',
  density_class: 'Density Class',
  compressive_strength_mpa: 'Compressive Strength (MPa)',
  void_type: 'Void Type',
  bag_weight_kg: 'Bag Weight (kg)',
  astm_type: 'ASTM Type',
  standard: 'Standard',
};

// Expected standards per subtype
export const EXPECTED_STANDARDS: Record<Subtype, string[]> = {
  HDPE_ISO4427: ['ISO 4427', 'ISO 4427-1', 'ISO 4427-2'],
  PVC_ASTMD1785: ['ASTM D1785'],
  MV_CU_IEC60502_2: ['IEC 60502-2', 'BS 6622'],
  GYPSUM_ASTMC1396: ['ASTM C1396', 'ASTM C36'],
  CMU_ASTMC90: ['ASTM C90'],
  CEM_PORTLAND_C150: ['ASTM C150'],
};

// Default standards per subtype (when not specified)
export const DEFAULT_STANDARDS: Record<Subtype, string> = {
  HDPE_ISO4427: 'ISO 4427',
  PVC_ASTMD1785: 'ASTM D1785',
  MV_CU_IEC60502_2: 'IEC 60502-2',
  GYPSUM_ASTMC1396: 'ASTM C1396',
  CMU_ASTMC90: 'ASTM C90',
  CEM_PORTLAND_C150: 'ASTM C150',
};

// Type code normalizations (Arabic → English codes)
export const TYPE_CODE_NORMALIZATIONS: Record<string, string> = {
  // Gypsum board type codes
  'مقاوم للرطوبة': 'MR',
  'مقاوم للحريق': 'FR',
  'مقاوم للصدمات': 'Type X',
  'عادي': 'Regular',
  'نوع x': 'Type X',
  'نوع c': 'Type C',
  'mr': 'MR',
  'fr': 'FR',
  'type x': 'Type X',
  'type c': 'Type C',
  'regular': 'Regular',
  'مقاوم للعفن': 'Mold-Resistant',

  // Density classes
  'خفيف': 'Lightweight',
  'متوسط': 'Medium Weight',
  'ثقيل': 'Normal Weight',
  'lightweight': 'Lightweight',
  'medium': 'Medium Weight',
  'heavy': 'Normal Weight',
  'normal': 'Normal Weight',

  // Void types
  'مفرغ': 'Hollow',
  'مصمت': 'Solid',
  'hollow': 'Hollow',
  'solid': 'Solid',

  // Edge types
  'مشطوف': 'Tapered',
  'مربع': 'Square',
  'مائل': 'Beveled',
  'tapered': 'Tapered',
  'square': 'Square',
  'beveled': 'Beveled',
};

// Canonical quantity units
export const CANONICAL_QUANTITY_UNITS: Record<string, string> = {
  // Arabic
  'قطعة': 'piece',
  'قطع': 'piece',
  'لوح': 'piece',
  'ألواح': 'piece',
  'طوبة': 'piece',
  'طوب': 'piece',
  'بلكة': 'piece',
  'بلك': 'piece',
  'كيس': 'bag',
  'أكياس': 'bag',
  'شوال': 'bag',
  'شوالات': 'bag',
  'متر': 'm',
  'أمتار': 'm',
  'م': 'm',
  'كيلومتر': 'km',

  // English
  'piece': 'piece',
  'pieces': 'piece',
  'pcs': 'piece',
  'pc': 'piece',
  'unit': 'piece',
  'units': 'piece',
  'bag': 'bag',
  'bags': 'bag',
  'sack': 'bag',
  'sacks': 'bag',
  'meter': 'm',
  'meters': 'm',
  'm': 'm',
  'metre': 'm',
  'metres': 'm',
  'kilometer': 'km',
  'km': 'km',
  'roll': 'roll',
  'rolls': 'roll',
};

// Parse size_mm for CMU (e.g., "400x200x200" → {w:200, h:200, l:400})
export function parseSizeMM(sizeStr: string): { w: number; h: number; l: number } | null {
  const converted = convertArabicNumerals(sizeStr);
  const normalized = converted.toLowerCase().trim();

  // Match patterns like "400x200x200", "400 x 200 x 200", "400*200*200"
  const pattern = /^(\d+\.?\d*)\s*[x*×]\s*(\d+\.?\d*)\s*[x*×]\s*(\d+\.?\d*)$/;
  const match = normalized.match(pattern);

  if (!match) return null;

  const dim1 = parseFloat(match[1]);
  const dim2 = parseFloat(match[2]);
  const dim3 = parseFloat(match[3]);

  if (isNaN(dim1) || isNaN(dim2) || isNaN(dim3)) return null;

  // Convention: l x w x h (length x width x height)
  return { w: dim2, h: dim3, l: dim1 };
}

// Normalize type codes (e.g., "مقاوم للرطوبة" → "MR")
export function normalizeTypeCode(value: string): string {
  const normalized = value.trim().toLowerCase();
  return TYPE_CODE_NORMALIZATIONS[normalized] || value.trim();
}
