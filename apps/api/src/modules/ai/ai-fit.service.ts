import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../common/errors/app-error';
import { AiJobFitScoreDto, StudentSkills } from '@placement/shared';

export class AiFitService {
  /**
   * Analyze student's profile & resume against a placement drive's JD & required skills
   */
  async analyzeJobFit(userId: string, driveId: string): Promise<AiJobFitScoreDto> {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        tenthMarks: true,
        twelfthDetails: true,
        d2dDetails: true,
      },
    });

    if (!studentProfile) {
      throw AppError.notFound('Student profile not found. Please complete your profile first.');
    }

    const drive = await prisma.recruitmentDrive.findUnique({
      where: { id: driveId },
      include: {
        company: true,
      },
    });

    if (!drive) {
      throw AppError.notFound('Placement drive not found.');
    }

    // Try Gemini API first if configured
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '') {
      try {
        const geminiResult = await this.analyzeWithGemini(studentProfile, drive);
        if (geminiResult) {
          return geminiResult;
        }
      } catch (geminiError: unknown) {
        console.warn(
          '⚠️ Gemini API call failed or encountered error, falling back to ATS Semantic Engine:',
          geminiError instanceof Error ? geminiError.message : geminiError
        );
      }
    }

    // Fallback to intelligent ATS Semantic Engine
    return this.analyzeWithAtsEngine(studentProfile, drive);
  }

  /**
   * AI-powered analysis using Gemini API (@google/genai)
   */
  private async analyzeWithGemini(studentProfile: any, drive: any): Promise<AiJobFitScoreDto | null> {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY! });
    const skills = (studentProfile.skills as StudentSkills) || {
      technical: [],
      soft: [],
      languages: [],
      tools: [],
    };

    // Check if resume file exists locally
    let resumeBufferBase64: string | null = null;
    if (studentProfile.resumeUrl) {
      try {
        const relativeResume = studentProfile.resumeUrl.replace(/^\//, '');
        const possiblePaths = [
          path.resolve(__dirname, '../../../', relativeResume),
          path.resolve(__dirname, '../../../../', relativeResume),
          path.resolve(process.cwd(), relativeResume),
          path.resolve(process.cwd(), 'apps/api', relativeResume),
        ];

        for (const p of possiblePaths) {
          if (fs.existsSync(p)) {
            const fileData = fs.readFileSync(p);
            resumeBufferBase64 = fileData.toString('base64');
            break;
          }
        }
      } catch {
        // Ignore file read error, proceed with profile text
      }
    }

    const candidateProfileContext = `
CANDIDATE DOSSIER:
- Name: ${studentProfile.firstName} ${studentProfile.lastName}
- Department: ${studentProfile.department}
- Batch Year: ${studentProfile.batchYear}
- Current CGPA: ${Number(studentProfile.currentCgpa)}
- Active Backlogs: ${studentProfile.activeBacklogs}
- Technical Skills: ${(skills.technical || []).join(', ') || 'None specified'}
- Tools & Frameworks: ${(skills.tools || []).join(', ') || 'None specified'}
- Languages: ${(skills.languages || []).join(', ') || 'None specified'}
- Soft Skills: ${(skills.soft || []).join(', ') || 'None specified'}
- Resume Document Name: ${studentProfile.resumeName || 'Not uploaded'}

JOB VACANCY DETAILS:
- Company: ${drive.company.name} (${drive.company.industry || 'Technology'})
- Job Role: ${drive.jobRole} (${drive.title})
- Package LPA: ${drive.packageLpa ? `${drive.packageLpa} LPA` : 'Not specified'}
- Required Skills: ${drive.requiredSkills.join(', ')}
- Job Description:
${drive.description || 'Standard industry role requirements.'}
`;

    const systemPrompt = `You are a Senior Technical Recruiter and ATS (Applicant Tracking System) Specialist at a premier engineering college.
Compare the candidate's technical profile and resume against the placement drive requirements.
Evaluate realistically and generate a structured JSON object matching the following TypeScript schema:

{
  "matchScore": number (integer between 0 and 100),
  "verdict": "STRONG_MATCH" | "MODERATE_MATCH" | "GROWTH_OPPORTUNITY",
  "summary": string (2-3 concise, professional sentences evaluating candidate compatibility),
  "matchingSkills": string[] (list of candidate skills directly matching the job requirements),
  "missingSkills": string[] (critical skills or technologies mentioned in the JD that the candidate lacks),
  "tailoredBulletPoints": string[] (3 tailored, high-impact resume bullet points formatted in STAR/Google X-Y-Z format that the student should add to their resume for this specific company and role),
  "keyStrengths": string[] (2-3 key competitive edges of this candidate for this role),
  "recommendations": string[] (2-3 concrete steps to improve interview readiness before applying)
}

IMPORTANT: Return ONLY valid, parseable JSON. Do not wrap in markdown quotes if possible, or use standard markdown JSON codeblock.`;

    const contents: any[] = [];

    if (resumeBufferBase64) {
      contents.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: resumeBufferBase64,
        },
      });
    }

    contents.push({
      text: `${systemPrompt}\n\n${candidateProfileContext}`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
    });

    const text = response.text;
    if (!text) return null;

    // Clean JSON markdown fences
    const cleanedJson = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleanedJson);

    return {
      matchScore: Math.min(100, Math.max(0, Math.round(parsed.matchScore || 70))),
      verdict: parsed.verdict || (parsed.matchScore >= 75 ? 'STRONG_MATCH' : parsed.matchScore >= 50 ? 'MODERATE_MATCH' : 'GROWTH_OPPORTUNITY'),
      summary: parsed.summary || 'Profile evaluation completed.',
      matchingSkills: Array.isArray(parsed.matchingSkills) ? parsed.matchingSkills : [],
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
      tailoredBulletPoints: Array.isArray(parsed.tailoredBulletPoints) ? parsed.tailoredBulletPoints : [],
      keyStrengths: Array.isArray(parsed.keyStrengths) ? parsed.keyStrengths : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      analyzedAt: new Date().toISOString(),
      isAiGenerated: true,
      modelUsed: 'gemini-2.5-flash',
    };
  }

  /**
   * Deterministic ATS Semantic Matching Engine
   * Operates completely offline without requiring third-party API keys
   */
  private analyzeWithAtsEngine(studentProfile: any, drive: any): AiJobFitScoreDto {
    const rawSkills = (studentProfile.skills as StudentSkills) || {
      technical: [],
      soft: [],
      languages: [],
      tools: [],
    };

    const studentSkillsPool: string[] = [
      ...(rawSkills.technical || []),
      ...(rawSkills.tools || []),
      ...(rawSkills.languages || []),
      ...(rawSkills.soft || []),
    ];

    // Engineering Curriculum Domain Inferences
    const dept = (studentProfile.department || '').toLowerCase();
    if (dept.includes('computer') || dept.includes('information') || dept.includes('software') || dept.includes('artificial')) {
      studentSkillsPool.push(
        'Data Structures',
        'Algorithms',
        'Object Oriented Design',
        'Database Management Systems',
        'REST APIs',
        'Operating Systems',
        'Computer Networks',
        'Git'
      );
    }

    // Normalize candidate skill set
    const candidateSkillsNormalized = studentSkillsPool.map((s) => s.trim().toLowerCase());

    const driveRequiredSkills: string[] = Array.isArray(drive.requiredSkills)
      ? drive.requiredSkills
      : [];

    const jdText = `${drive.title} ${drive.jobRole} ${drive.description || ''}`.toLowerCase();

    const matchingSkills: string[] = [];
    const missingSkills: string[] = [];

    // Helper for fuzzy skill equivalence
    const isSkillEquivalent = (req: string, candidate: string): boolean => {
      if (req === candidate) return true;
      if (candidate.includes(req) || req.includes(candidate)) return true;
      // Common synonyms
      const synonymMap: Record<string, string[]> = {
        'javascript': ['js', 'typescript', 'react', 'next.js', 'node.js'],
        'typescript': ['ts', 'javascript', 'react', 'next.js', 'node.js'],
        'rest apis': ['rest', 'api', 'apis', 'restful', 'backend', 'node.js'],
        'data structures': ['dsa', 'algorithms', 'problem solving', 'data structures'],
        'algorithms': ['dsa', 'data structures', 'problem solving'],
        'postgresql': ['postgres', 'sql', 'database', 'rdbms'],
        'sql server': ['sql', 'database', 'rdbms'],
        'react': ['react.js', 'reactjs', 'frontend', 'next.js'],
        'next.js': ['react', 'frontend', 'nextjs'],
        'node.js': ['node', 'nodejs', 'backend', 'express'],
        'docker': ['containerization', 'containers', 'devops'],
        'kubernetes': ['k8s', 'orchestration', 'devops'],
        'go': ['golang'],
        'golang': ['go'],
      };
      for (const [key, syns] of Object.entries(synonymMap)) {
        if ((req === key || syns.includes(req)) && (candidate === key || syns.includes(candidate))) {
          return true;
        }
      }
      return false;
    };

    // Analyze drive required skills
    for (const reqSkill of driveRequiredSkills) {
      const normalizedReq = reqSkill.trim().toLowerCase();
      const isMatch = candidateSkillsNormalized.some((cs) => isSkillEquivalent(normalizedReq, cs));

      if (isMatch) {
        matchingSkills.push(reqSkill);
      } else {
        missingSkills.push(reqSkill);
      }
    }

    // Check additional tech stack keywords in JD description
    const commonTechKeywords = [
      'Docker', 'AWS', 'Kubernetes', 'Redis', 'GraphQL', 'Microservices',
      'CI/CD', 'PostgreSQL', 'MongoDB', 'React', 'Node.js', 'TypeScript',
      'Python', 'Java', 'Git', 'REST APIs', 'Next.js', 'System Design'
    ];

    for (const kw of commonTechKeywords) {
      const kwLower = kw.toLowerCase();
      if (jdText.includes(kwLower) && !driveRequiredSkills.some((s) => s.toLowerCase() === kwLower)) {
        const candidateHas = candidateSkillsNormalized.some((cs) => isSkillEquivalent(kwLower, cs));
        if (candidateHas && !matchingSkills.includes(kw)) {
          matchingSkills.push(kw);
        } else if (!candidateHas && !missingSkills.includes(kw)) {
          missingSkills.push(kw);
        }
      }
    }

    // Compute Match Score (Normalized campus recruitment evaluation)
    const totalRequired = driveRequiredSkills.length || 1;
    const matchedRequiredCount = matchingSkills.filter((s) => driveRequiredSkills.includes(s)).length;
    const matchRatio = matchedRequiredCount / totalRequired;

    // Base score: 25 base + up to 45 for required skills match
    let score = 25 + Math.round(matchRatio * 45);

    // Bonus for complementary technical competencies (Docker, Git, React, etc.)
    const additionalMatches = matchingSkills.filter((s) => !driveRequiredSkills.includes(s)).length;
    score += Math.min(12, additionalMatches * 3);

    // Academic & Department synergy bonus
    const cgpa = Number(studentProfile.currentCgpa) || 7.0;
    if (cgpa >= 8.5) {
      score += 12;
    } else if (cgpa >= 7.5) {
      score += 8;
    } else if (cgpa >= 6.5) {
      score += 4;
    }

    if (studentProfile.activeBacklogs === 0) {
      score += 4;
    }

    if (studentProfile.resumeUrl) {
      score += 3;
    }

    // Bound score reasonably between 35 and 96
    const finalScore = Math.min(96, Math.max(35, score));

    // Verdict
    let verdict: 'STRONG_MATCH' | 'MODERATE_MATCH' | 'GROWTH_OPPORTUNITY' = 'MODERATE_MATCH';
    if (finalScore >= 75) {
      verdict = 'STRONG_MATCH';
    } else if (finalScore < 55) {
      verdict = 'GROWTH_OPPORTUNITY';
    }

    // Generate Tailored Bullet Points
    const primarySkill = matchingSkills[0] || 'Modern Web Technologies';
    const secondarySkill = matchingSkills[1] || 'RESTful APIs';
    const roleTitle = drive.jobRole || 'Software Engineer';
    const companyName = drive.company?.name || 'Target Company';

    const tailoredBulletPoints: string[] = [
      `Engineered end-to-end features using ${primarySkill} and ${secondarySkill}, enhancing application performance by 25% and reducing response latency across critical endpoints.`,
      `Designed scalable, modular architectures aligned with ${companyName}'s ${roleTitle} tech stack, implementing automated unit testing and clean code design patterns.`,
      `Integrated robust database schemas and optimized data pipelines, supporting concurrent user transactions and maintaining 99.9% uptime during peak loads.`
    ];

    // Generate Key Strengths
    const keyStrengths: string[] = [];
    if (matchingSkills.length > 0) {
      keyStrengths.push(
        `Direct alignment in core competencies: ${matchingSkills.slice(0, 3).join(', ')}.`
      );
    }
    if (cgpa >= 8.0) {
      keyStrengths.push(`Strong academic track record (CGPA ${cgpa.toFixed(2)}) with zero active backlogs.`);
    } else {
      keyStrengths.push(`Consistent academic progression in ${studentProfile.department}.`);
    }
    if (studentProfile.resumeUrl) {
      keyStrengths.push(`Verified resume document on file ready for recruiter ATS screening.`);
    }

    // Generate Recommendations
    const recommendations: string[] = [];
    if (missingSkills.length > 0) {
      recommendations.push(
        `Bridge priority skill gaps in ${missingSkills.slice(0, 3).join(', ')} by adding a mini-project or coursework certifications.`
      );
    }
    recommendations.push(
      `Review core data structures, algorithms, and system design concepts commonly evaluated in ${companyName} technical rounds.`
    );
    recommendations.push(
      `Adopt the tailored STAR bullet points above into your resume before final submission to maximize ATS keyword ranking.`
    );

    const summary = `${studentProfile.firstName} exhibits a ${verdict.replace('_', ' ').toLowerCase()} for the ${drive.jobRole} role at ${companyName}, demonstrating proficiency in ${matchingSkills.length} of ${driveRequiredSkills.length} required competencies with a strong foundation in ${studentProfile.department}.`;

    return {
      matchScore: finalScore,
      verdict,
      summary,
      matchingSkills,
      missingSkills,
      tailoredBulletPoints,
      keyStrengths,
      recommendations,
      analyzedAt: new Date().toISOString(),
      isAiGenerated: false,
      modelUsed: 'ATS-Semantic-Engine-v1',
    };
  }
}

export const aiFitService = new AiFitService();
