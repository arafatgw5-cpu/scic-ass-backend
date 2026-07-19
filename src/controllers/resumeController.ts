import { Request, Response } from 'express';
import { Resume } from '../models/Resume';

// Typed view of an authenticated request (avoids `any`).
type AuthedRequest = Request & { user?: { id?: string } };

/* ──────────────────────────────────────────────────────────────────
   Proper typed interfaces for Resume sub-documents
   ─────────────────────────────────────────────────────────────────── */
interface ResumeExperience {
  company?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

interface ResumeEducation {
  institution?: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
}

interface ResumeProject {
  name?: string;
  description?: string;
  url?: string;
  technologies?: string[];
}

interface ResumeCertification {
  name?: string;
  issuer?: string;
  date?: string;
  url?: string;
}

interface CreateResumeBody {
  title?: string;
  targetRole?: string;
  summary?: string;
  experience?: ResumeExperience[];
  education?: ResumeEducation[];
  skills?: string[];
  projects?: ResumeProject[];
  certifications?: ResumeCertification[];
  content?: Record<string, unknown>;
  atsScore?: number;
}

/* ──────────────────────────────────────────────────────────────────
   PDF payload shapes (everything optional -> safe for partial data)
   ─────────────────────────────────────────────────────────────────── */
interface PdfExperience {
  role?: string; company?: string; location?: string; employmentType?: string;
  startDate?: string; endDate?: string; currentlyWorking?: boolean;
  responsibilities?: string; achievements?: string; technologies?: string; description?: string;
}
interface PdfEducation { degree?: string; institution?: string; fieldOfStudy?: string; gpa?: string; startYear?: string; endYear?: string; }
interface PdfProject { name?: string; role?: string; description?: string; technologies?: string; duration?: string; githubLink?: string; liveDemoLink?: string; keyAchievements?: string; }
interface PdfCert { name?: string; organization?: string; issueDate?: string; expirationDate?: string; credentialId?: string; credentialUrl?: string; }
interface PdfAchievement { title?: string; type?: string; description?: string; date?: string; }
interface PdfLanguage { language?: string; proficiency?: string; }
interface PdfVolunteer { organization?: string; position?: string; duration?: string; description?: string; }
interface PdfPublication { title?: string; publisher?: string; date?: string; url?: string; }
interface PdfReference { name?: string; position?: string; company?: string; email?: string; phone?: string; }
interface PdfSkills { technical?: string[]; soft?: string[]; tools?: string[]; frameworks?: string[]; databases?: string[]; cloud?: string[]; programmingLanguages?: string[]; other?: string[]; }

interface PdfDoc {
  fullName?: string; headline?: string; email?: string; phone?: string; country?: string; city?: string;
  portfolio?: string; linkedin?: string; github?: string; personalWebsite?: string;
  professionalSummary?: string; summary?: string;
  skills?: PdfSkills | string[];
  optimizedSkills?: string[];
  experience?: PdfExperience[];
  optimizedExperience?: { company?: string; role?: string; description?: string }[];
  education?: PdfEducation[];
  projects?: PdfProject[];
  optimizedProjects?: { name?: string; description?: string }[];
  certifications?: PdfCert[];
  achievements?: PdfAchievement[];
  languages?: PdfLanguage[];
  volunteer?: PdfVolunteer[];
  publications?: PdfPublication[];
  interests?: string[];
  referencesAvailable?: boolean;
  references?: PdfReference[];
}

/* ──────────────────────────────────────────────────────────────────
   Minimal PDFKit typing (keeps strict TS happy, no `any`)
   ─────────────────────────────────────────────────────────────────── */
interface PdfTextOpts { align?: 'left' | 'right' | 'center' | 'justify'; width?: number; lineGap?: number; underline?: boolean; continued?: boolean; }
interface PdfKitDoc {
  y: number;
  fontSize: (n: number) => PdfKitDoc;
  font: (f: string) => PdfKitDoc;
  fillColor: (c: string) => PdfKitDoc;
  strokeColor: (c: string) => PdfKitDoc;
  lineWidth: (w: number) => PdfKitDoc;
  text: (str: string, xOrOpts?: number | PdfTextOpts, y?: number, opts?: PdfTextOpts) => PdfKitDoc;
  moveTo: (x: number, y: number) => PdfKitDoc;
  lineTo: (x: number, y: number) => PdfKitDoc;
  stroke: () => PdfKitDoc;
  moveDown: (n?: number) => PdfKitDoc;
  addPage: (opts?: unknown) => PdfKitDoc;
  pipe: (s: NodeJS.WritableStream) => unknown;
  end: () => void;
}

// Create a new resume
export const createResumeEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthedRequest).user?.id;
    const body = req.body as CreateResumeBody;
    const { title, targetRole, summary, experience, education, skills, projects, certifications, content, atsScore } = body;

    const resume = await Resume.create({
      userId,
      title: title || 'Untitled Resume',
      targetRole,
      summary,
      experience: experience || [],
      education: education || [],
      skills: skills || [],
      projects: projects || [],
      certifications: certifications || [],
      content,
      atsScore: atsScore || 0
    });

    res.status(201).json({ success: true, data: resume });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message });
  }
};

// Get all resumes for the current user
export const getResumes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthedRequest).user?.id;
    const resumes = await Resume.find({ userId }).sort({ updatedAt: -1 });
    res.json({ success: true, data: resumes });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message });
  }
};

// Get a specific resume by ID
export const getResumeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as AuthedRequest).user?.id;
    const resume = await Resume.findOne({ _id: id, userId });
    if (!resume) { res.status(404).json({ success: false, message: 'Resume not found' }); return; }
    res.json({ success: true, data: resume });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message });
  }
};

// Update a resume
export const updateResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as AuthedRequest).user?.id;
    const updatedResume = await Resume.findOneAndUpdate({ _id: id, userId }, req.body, { new: true, runValidators: true });
    if (!updatedResume) { res.status(404).json({ success: false, message: 'Resume not found' }); return; }
    res.json({ success: true, data: updatedResume });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message });
  }
};

// Delete a resume
export const deleteResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as AuthedRequest).user?.id;
    const deletedResume = await Resume.findOneAndDelete({ _id: id, userId });
    if (!deletedResume) { res.status(404).json({ success: false, message: 'Resume not found' }); return; }
    res.json({ success: true, data: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message });
  }
};

/* ══════════════════════════════════════════════════════════════════
   ✅ FULL PDF GENERATOR — renders EVERY section the builder collects
   ═══════════════════════════════════════════════════════════════════ */
export const generatePdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const d = (req.body as { resumeData?: PdfDoc }).resumeData;
    if (!d) {
      res.status(400).json({ success: false, message: 'Resume data is required to generate PDF' });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PDFDocument = require('pdfkit') as new (opts?: { margin?: number; size?: string }) => PdfKitDoc;
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    doc.pipe(res);

    const ACCENT = '#2563eb';
    const GREY = '#555555';
    const PAGE_BOTTOM = 790;

    // ── helpers ──────────────────────────────────────────────────
    const ensureSpace = (h: number) => { if (doc.y + h > PAGE_BOTTOM) doc.addPage(); };

    const addSection = (title: string) => {
      ensureSpace(46);
      const y = doc.y;
      doc.font('Helvetica-Bold').fontSize(12).fillColor(ACCENT).text(title.toUpperCase(), 50, y, { lineGap: 1 });
      const lineY = doc.y + 1;
      doc.moveTo(50, lineY).lineTo(545, lineY).strokeColor(ACCENT).lineWidth(0.6).stroke();
      doc.y = lineY + 6;
      doc.fillColor('#000000');
    };

    const bulletize = (text?: string): string => {
      if (!text) return '';
      return text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => (/^[•\-*]\s/.test(l) ? l : `• ${l}`))
        .join('\n');
    };

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fmtMonth = (m?: string): string => {
      if (!m) return '';
      const [yr, mo] = m.split('-');
      if (!mo) return yr || '';
      const idx = parseInt(mo, 10) - 1;
      return `${MONTHS[idx] ?? mo} ${yr}`;
    };
    const dateRange = (s?: string, e?: string, current?: boolean): string => {
      const a = fmtMonth(s);
      const b = current ? 'Present' : fmtMonth(e);
      if (!a && !b) return '';
      return `${a}${a && b ? ' – ' : ''}${b}`;
    };

    const twoCol = (left: string, right: string, leftBold = true) => {
      const top = doc.y;
      doc.font(leftBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(11).fillColor('#111111').text(left, 50, top, { width: 360, lineGap: 1 });
      const afterLeft = doc.y;
      if (right) doc.font('Helvetica').fontSize(9).fillColor(GREY).text(right, 410, top, { width: 135, align: 'right' });
      doc.y = Math.max(afterLeft, top + 13);
      doc.fillColor('#000000');
    };

    const metaLine = (parts: (string | undefined)[]) => {
      const line = parts.filter(Boolean).join('  •  ');
      if (line) { doc.font('Helvetica').fontSize(9.5).fillColor(GREY).text(line, 50, doc.y, { width: 495, lineGap: 1 }); doc.fillColor('#000000'); }
    };

    const bodyText = (text: string) => {
      if (!text) return;
      ensureSpace(20);
      doc.font('Helvetica').fontSize(9.5).fillColor('#222222').text(text, 50, doc.y, { width: 495, lineGap: 1.5 });
      doc.fillColor('#000000');
    };

    // ── HEADER (personal info) ───────────────────────────────────
    const name = d.fullName || 'Your Name';
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#111111').text(name, 50, 50, { width: 495 });
    if (d.headline) doc.font('Helvetica').fontSize(11).fillColor(ACCENT).text(d.headline, 50, doc.y + 1, { width: 495 });
    const contacts = [d.email, d.phone, [d.city, d.country].filter(Boolean).join(', '), d.linkedin, d.github, d.portfolio, d.personalWebsite].filter(Boolean).join('   |   ');
    if (contacts) doc.font('Helvetica').fontSize(9).fillColor(GREY).text(contacts, 50, doc.y + 2, { width: 495 });
    const headerLineY = doc.y + 4;
    doc.moveTo(50, headerLineY).lineTo(545, headerLineY).strokeColor('#cccccc').lineWidth(0.8).stroke();
    doc.y = headerLineY + 12;
    doc.fillColor('#000000');

    // ── PROFESSIONAL SUMMARY ─────────────────────────────────────
    const summaryText = d.professionalSummary || d.summary;
    if (summaryText && summaryText.trim()) {
      addSection('Professional Summary');
      bodyText(summaryText.trim());
      doc.moveDown(0.6);
    }

    // ── SKILLS (category-aware) ──────────────────────────────────
    const cat = d.skills && !Array.isArray(d.skills) ? (d.skills as PdfSkills) : null;
    const SKILL_LABELS: { key: keyof PdfSkills; label: string }[] = [
      { key: 'technical', label: 'Technical' }, { key: 'programmingLanguages', label: 'Languages' },
      { key: 'frameworks', label: 'Frameworks' }, { key: 'tools', label: 'Tools' },
      { key: 'databases', label: 'Databases' }, { key: 'cloud', label: 'Cloud' },
      { key: 'soft', label: 'Soft Skills' }, { key: 'other', label: 'Other' },
    ];
    const hasCat = !!cat && SKILL_LABELS.some((s) => (cat[s.key] || []).length > 0);
    const flatSkills: string[] = hasCat
      ? SKILL_LABELS.flatMap((s) => cat![s.key] || [])
      : (Array.isArray(d.skills) ? (d.skills as string[]) : (Array.isArray(d.optimizedSkills) ? (d.optimizedSkills as string[]) : []));

    if (hasCat || flatSkills.length > 0) {
      addSection('Skills');
      if (hasCat && cat) {
        for (const s of SKILL_LABELS) {
          const items = cat[s.key] || [];
          if (items.length === 0) continue;
          ensureSpace(16);
          doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#111111').text(`${s.label}: `, 50, doc.y, { continued: true, width: 495 });
          doc.font('Helvetica').fontSize(9.5).fillColor('#333333').text(items.join(',  '), { width: 495, lineGap: 1 });
          doc.fillColor('#000000');
        }
      } else {
        bodyText(flatSkills.join(',  '));
      }
      doc.moveDown(0.6);
    }

    // ── EXPERIENCE ───────────────────────────────────────────────
    let expList: PdfExperience[] = Array.isArray(d.experience) ? (d.experience as PdfExperience[]) : [];
    if (expList.length === 0 && Array.isArray(d.optimizedExperience)) {
      expList = (d.optimizedExperience as { company?: string; role?: string; description?: string }[])
        .map((o) => ({ role: o.role, company: o.company, description: o.description }));
    }
    if (expList.length > 0) {
      addSection('Experience');
      for (const exp of expList) {
        ensureSpace(60);
        const role = exp.role || exp.description ? (exp.role || 'Role') : 'Role';
        twoCol(role, dateRange(exp.startDate, exp.endDate, exp.currentlyWorking));
        metaLine([exp.company, exp.location, exp.employmentType]);
        const body = [exp.description, bulletize(exp.responsibilities), bulletize(exp.achievements)].filter(Boolean).join('\n');
        if (body) bodyText(body);
        if (exp.technologies) { doc.font('Helvetica-Oblique').fontSize(9).fillColor(GREY).text(`Technologies: ${exp.technologies}`, 50, doc.y, { width: 495, lineGap: 1 }); doc.fillColor('#000000'); }
        doc.moveDown(0.7);
      }
    }

    // ── EDUCATION ────────────────────────────────────────────────
    const eduList = Array.isArray(d.education) ? (d.education as PdfEducation[]) : [];
    if (eduList.length > 0) {
      addSection('Education');
      for (const edu of eduList) {
        ensureSpace(34);
        const deg = [edu.degree, edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''].filter(Boolean).join(' ') || 'Degree';
        twoCol(deg, [edu.startYear, edu.endYear].filter(Boolean).join(' – '));
        metaLine([edu.institution, edu.gpa ? `GPA: ${edu.gpa}` : undefined]);
        doc.moveDown(0.5);
      }
    }

    // ── PROJECTS ─────────────────────────────────────────────────
    let projList: PdfProject[] = Array.isArray(d.projects) ? (d.projects as PdfProject[]) : [];
    if (projList.length === 0 && Array.isArray(d.optimizedProjects)) {
      projList = (d.optimizedProjects as { name?: string; description?: string }[]).map((p) => ({ name: p.name, description: p.description }));
    }
    if (projList.length > 0) {
      addSection('Projects');
      for (const p of projList) {
        ensureSpace(46);
        twoCol(p.name || 'Project', p.duration || '');
        if (p.role) metaLine([p.role]);
        if (p.description) bodyText(p.description);
        if (p.keyAchievements) bodyText(bulletize(p.keyAchievements));
        if (p.technologies) { doc.font('Helvetica-Oblique').fontSize(9).fillColor(GREY).text(`Tech: ${p.technologies}`, 50, doc.y, { width: 495, lineGap: 1 }); doc.fillColor('#000000'); }
        const links = [p.githubLink ? `GitHub: ${p.githubLink}` : undefined, p.liveDemoLink ? `Demo: ${p.liveDemoLink}` : undefined].filter(Boolean).join('   |   ');
        if (links) { doc.font('Helvetica').fontSize(9).fillColor(ACCENT).text(links, 50, doc.y, { width: 495, lineGap: 1 }); doc.fillColor('#000000'); }
        doc.moveDown(0.6);
      }
    }

    // ── CERTIFICATIONS ───────────────────────────────────────────
    const certList = Array.isArray(d.certifications) ? (d.certifications as PdfCert[]) : [];
    if (certList.length > 0) {
      addSection('Certifications');
      for (const c of certList) {
        ensureSpace(30);
        twoCol(c.name || 'Certification', dateRange(c.issueDate, c.expirationDate));
        metaLine([c.organization, c.credentialId ? `ID: ${c.credentialId}` : undefined, c.credentialUrl]);
        doc.moveDown(0.4);
      }
    }

    // ── ACHIEVEMENTS ─────────────────────────────────────────────
    const achList = Array.isArray(d.achievements) ? (d.achievements as PdfAchievement[]) : [];
    if (achList.length > 0) {
      addSection('Achievements & Awards');
      for (const a of achList) {
        ensureSpace(28);
        twoCol([a.title, a.type ? `(${a.type})` : ''].filter(Boolean).join(' ') || 'Achievement', fmtMonth(a.date));
        if (a.description) bodyText(a.description);
        doc.moveDown(0.4);
      }
    }

    // ── LANGUAGES ────────────────────────────────────────────────
    const langList = Array.isArray(d.languages) ? (d.languages as PdfLanguage[]) : [];
    if (langList.length > 0) {
      addSection('Languages');
      bodyText(langList.map((l) => (l.proficiency ? `${l.language} — ${l.proficiency}` : l.language)).filter(Boolean).join('   •   '));
      doc.moveDown(0.6);
    }

    // ── VOLUNTEER ────────────────────────────────────────────────
    const volList = Array.isArray(d.volunteer) ? (d.volunteer as PdfVolunteer[]) : [];
    if (volList.length > 0) {
      addSection('Volunteer Experience');
      for (const v of volList) {
        ensureSpace(34);
        twoCol(v.position || 'Volunteer', v.duration || '');
        if (v.organization) metaLine([v.organization]);
        if (v.description) bodyText(v.description);
        doc.moveDown(0.4);
      }
    }

    // ── PUBLICATIONS ─────────────────────────────────────────────
    const pubList = Array.isArray(d.publications) ? (d.publications as PdfPublication[]) : [];
    if (pubList.length > 0) {
      addSection('Publications');
      for (const p of pubList) {
        ensureSpace(28);
        twoCol(p.title || 'Publication', fmtMonth(p.date));
        metaLine([p.publisher, p.url]);
        doc.moveDown(0.4);
      }
    }

    // ── INTERESTS ────────────────────────────────────────────────
    if (Array.isArray(d.interests) && (d.interests as string[]).length > 0) {
      addSection('Interests');
      bodyText((d.interests as string[]).join('   •   '));
      doc.moveDown(0.6);
    }

    // ── REFERENCES ───────────────────────────────────────────────
    const refList = Array.isArray(d.references) ? (d.references as PdfReference[]) : [];
    if (d.referencesAvailable || refList.length > 0) {
      addSection('References');
      if (d.referencesAvailable || refList.length === 0) {
        bodyText('Available upon request.');
      } else {
        for (const r of refList) {
          ensureSpace(28);
          twoCol(r.name || 'Reference', [r.position, r.company].filter(Boolean).join(', '));
          metaLine([r.email, r.phone]);
          doc.moveDown(0.3);
        }
      }
      doc.moveDown(0.4);
    }

    doc.end();
  } catch (error) {
    console.error('PDF Generation Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate PDF' });
    }
  }
};