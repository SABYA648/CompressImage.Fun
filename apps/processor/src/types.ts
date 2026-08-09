export type SupportedFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'gif' | 'svg' | 'heif' | 'tiff';
export type OutputFormat = 'original' | 'jpeg' | 'png' | 'webp' | 'avif';

export type Operation =
  | {
      kind: 'compress';
      mode: 'smart' | 'exact' | 'quality' | 'lossless';
      format: OutputFormat;
      quality?: number;
      targetBytes?: number;
      minQuality?: number;
      preserveMetadata?: boolean;
      aggressive?: boolean;
      maxWidth?: number;
      maxHeight?: number;
    }
  | {
      kind: 'resize';
      width?: number;
      height?: number;
      percentage?: number;
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
      background?: string;
      format: OutputFormat;
      quality?: number;
      preserveMetadata?: boolean;
    }
  | {
      kind: 'crop';
      left: number;
      top: number;
      width: number;
      height: number;
      format: OutputFormat;
      quality?: number;
    }
  | { kind: 'rotate'; degrees: 90 | 180 | 270; format: OutputFormat; quality?: number }
  | {
      kind: 'convert';
      format: Exclude<OutputFormat, 'original'>;
      quality?: number;
      background?: string;
    }
  | { kind: 'metadata'; action: 'inspect' | 'remove'; format?: OutputFormat }
  | {
      kind: 'prepare';
      width: number;
      height: number;
      targetBytes?: number;
      minBytes?: number;
      format: 'jpeg' | 'png';
      quality?: number;
      background: string;
      density?: number;
      trim?: boolean;
      fit: 'cover' | 'contain';
      position?: 'centre' | 'north' | 'south' | 'east' | 'west';
    }
  | {
      kind: 'watermark';
      text: string;
      position:
        | 'northwest'
        | 'north'
        | 'northeast'
        | 'west'
        | 'center'
        | 'east'
        | 'southwest'
        | 'south'
        | 'southeast';
      opacity: number;
      scale: number;
      padding: number;
      format: OutputFormat;
    }
  | { kind: 'favicon'; fit?: 'contain' | 'cover'; background?: string };

export interface SafeMetadata {
  format: string;
  width: number;
  height: number;
  space?: string;
  channels?: number;
  depth?: string;
  density?: number;
  hasAlpha?: boolean;
  isProgressive?: boolean;
  pages?: number;
  orientation?: number;
  exif?: Record<string, string | number | boolean>;
}

export interface JobFile {
  id: string;
  role: 'source' | 'output';
  internalName: string;
  previewName?: string;
  originalName: string;
  downloadName: string;
  mime: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  sourceId?: string;
  metadata?: SafeMetadata;
  savingsPercent?: number;
  iterations?: number;
  note?: string;
}

export interface JobRecord {
  id: string;
  tokenHash: string;
  toolId: string;
  operation: Operation;
  status: 'uploading' | 'queued' | 'processing' | 'complete' | 'error';
  stage:
    | 'uploading'
    | 'queued'
    | 'reading'
    | 'optimizing'
    | 'encoding'
    | 'finalizing'
    | 'complete'
    | 'error';
  createdAt: string;
  expiresAt: string;
  files: JobFile[];
  error?: { code: string; message: string };
}

export type PublicJob = Omit<JobRecord, 'tokenHash' | 'files'> & {
  files: Array<Omit<JobFile, 'internalName' | 'previewName'>>;
  queuePosition?: number;
};
