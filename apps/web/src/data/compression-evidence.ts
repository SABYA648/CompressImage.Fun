export interface ExactSizeEvidenceRow {
  fixture: string;
  license: string;
  inputBytes: number;
  targetKB: number;
  success: boolean;
  outputBytes?: number;
  width?: number;
  height?: number;
  quality?: number;
  iterations?: number;
  elapsedMs?: number;
  note: string;
}

export interface CompressionEvidence {
  generatedAt: string;
  engine: string;
  settings: {
    minQuality: number;
    preserveMetadata: boolean;
    fixtures: string;
  };
  visualQualityLimitation: string;
  rows: ExactSizeEvidenceRow[];
}

export const compressionEvidence: CompressionEvidence = {
  generatedAt: 'pending-local-docker-run',
  engine: 'compressimage.fun exact-size optimizer (quality search, then dimension walk)',
  settings: {
    minQuality: 35,
    preserveMetadata: false,
    fixtures:
      'Deterministic synthetic photograph.jpg and illustration.png from scripts/generate-fixtures.mjs. Not third-party stock photos.',
  },
  visualQualityLimitation:
    'These rows report bytes, dimensions, quality, and search iterations. They do not score perceived quality. Synthetic fixtures are useful for regression, not as a claim about every camera JPEG.',
  rows: [],
};
