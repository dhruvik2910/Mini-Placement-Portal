import { put, get, del } from '@vercel/blob';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';

export interface UploadResumeResult {
  url: string;
  name: string;
}

export interface StreamResumeResult {
  stream: NodeJS.ReadableStream;
  contentType: string;
  filename: string;
}

export class ResumeStorageService {
  /**
   * Checks whether Vercel Blob credentials are configured.
   */
  private isBlobConfigured(): boolean {
    return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  }

  /**
   * Upload a student resume to Private Vercel Blob (or local disk fallback).
   */
  async uploadResume(
    studentId: string,
    fileBuffer: Buffer,
    originalName: string
  ): Promise<UploadResumeResult> {
    const cleanFileName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safePath = `resumes/${studentId}/${Date.now()}-${cleanFileName}`;

    if (this.isBlobConfigured()) {
      // Upload directly to Private Vercel Blob
      const blob = await put(safePath, fileBuffer, {
        access: 'private',
        contentType: 'application/pdf',
        addRandomSuffix: true,
      });

      return {
        url: blob.url,
        name: originalName,
      };
    }

    // Local filesystem storage for development without Blob credentials
    const localDir = path.resolve(process.cwd(), 'uploads/resumes');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const localFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${cleanFileName}`;
    fs.writeFileSync(path.join(localDir, localFilename), fileBuffer);

    return {
      url: `/uploads/resumes/${localFilename}`,
      name: originalName,
    };
  }

  /**
   * Retrieve a resume stream for viewing or download.
   * Handles Private Vercel Blob, local disk files, and legacy demo fallbacks.
   */
  async getResumeStream(
    resumeUrl: string,
    studentName?: string
  ): Promise<StreamResumeResult> {
    // 1. Private Vercel Blob URL / HTTP URL
    if (this.isBlobConfigured() && (resumeUrl.startsWith('http://') || resumeUrl.startsWith('https://'))) {
      try {
        const blobResult = await get(resumeUrl, { access: 'private' });
        if (blobResult && blobResult.statusCode === 200 && blobResult.stream) {
          const nodeStream = Readable.fromWeb(blobResult.stream as any);
          return {
            stream: nodeStream,
            contentType: blobResult.blob.contentType || 'application/pdf',
            filename: path.basename(blobResult.blob.pathname) || 'resume.pdf',
          };
        }
      } catch (err) {
        console.error('Failed to retrieve private blob from Vercel Blob:', err);
      }
    }

    // 2. Local filesystem reference (/uploads/resumes/...)
    const possiblePaths = [
      path.resolve(process.cwd(), resumeUrl.replace(/^\//, '')),
      path.resolve(process.cwd(), 'apps/api', resumeUrl.replace(/^\//, '')),
      path.resolve(__dirname, '../../../', resumeUrl.replace(/^\//, '')),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return {
          stream: fs.createReadStream(p),
          contentType: 'application/pdf',
          filename: path.basename(p),
        };
      }
    }

    // 3. Fallback for legacy demo resumes in serverless environments
    const fallbackPdf = this.generateFallbackPdf(studentName || 'Student');
    const readable = Readable.from(Buffer.from(fallbackPdf));
    return {
      stream: readable,
      contentType: 'application/pdf',
      filename: `${(studentName || 'student').replace(/\s+/g, '_')}_resume.pdf`,
    };
  }

  /**
   * Delete a resume from Private Vercel Blob or local storage.
   */
  async deleteResume(resumeUrl: string): Promise<void> {
    if (!resumeUrl) return;

    if (this.isBlobConfigured() && (resumeUrl.startsWith('http://') || resumeUrl.startsWith('https://'))) {
      try {
        await del(resumeUrl);
      } catch (err) {
        console.error('Failed to delete blob from Vercel Blob store:', err);
      }
      return;
    }

    if (resumeUrl.startsWith('/uploads/resumes/')) {
      const localPath = path.resolve(process.cwd(), resumeUrl.replace(/^\//, ''));
      if (fs.existsSync(localPath)) {
        try {
          fs.unlinkSync(localPath);
        } catch (err) {
          console.error('Failed to delete local resume file:', err);
        }
      }
    }
  }

  /**
   * Generates a valid minimal sample PDF for demo accounts without physical files.
   */
  private generateFallbackPdf(name: string): string {
    const safeTitle = name.replace(/[()]/g, '');
    return [
      '%PDF-1.4',
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
      '4 0 obj << /Length 130 >> stream',
      'BT',
      '/F1 20 Tf',
      '100 700 Td',
      '(Placement Portal - Student Resume) Tj',
      '0 -30 Td',
      '/F1 14 Tf',
      `(Candidate: ${safeTitle}) Tj`,
      '0 -20 Td',
      '/F1 11 Tf',
      '(Verified Academic Profile & Placement Dossier) Tj',
      'ET',
      'endstream',
      'endobj',
      '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
      'xref',
      '0 6',
      '0000000000 65535 f',
      '0000000009 00000 n',
      '0000000058 00000 n',
      '0000000115 00000 n',
      '0000000227 00000 n',
      '0000000407 00000 n',
      'trailer << /Size 6 /Root 1 0 R >>',
      'startxref',
      '481',
      '%%EOF',
    ].join('\n');
  }
}

export const resumeStorageService = new ResumeStorageService();
