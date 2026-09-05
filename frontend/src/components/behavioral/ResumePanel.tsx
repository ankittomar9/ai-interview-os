import React, { useState, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Code2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import type { ResumeDocument } from '../../types';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { updateSessionResume, uploadSessionResumeFile } from '../../services/api';

interface ResumePanelProps {
  sessionId: number;
  resume: ResumeDocument | null;
  onUpdateResume: (newResume: ResumeDocument) => void;
  isPlayground?: boolean;
  transcriptText?: string;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ResumePanel: React.FC<ResumePanelProps> = ({
  sessionId,
  resume,
  onUpdateResume,
  isPlayground: _isPlayground = false,
  transcriptText: _transcriptText = '',
  className = '',
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'update'>('profile');
  const [updateMode, setUpdateMode] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractSuccess, setExtractSuccess] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultSkills = [
    'Java 21',
    'Spring Boot',
    'Microservices',
    'Kafka',
    'PostgreSQL',
    'System Design',
    'Redis',
    'Docker'
  ];

  const currentSkills = resume?.skills && resume.skills.length > 0 ? resume.skills : defaultSkills;

  const handleFileUpload = async (file: File) => {
    setIsExtracting(true);
    setExtractError(null);
    setExtractSuccess(null);

    try {
      const doc = await uploadSessionResumeFile(sessionId, file, resume?.candidateName || 'Candidate');
      onUpdateResume(doc);
      setExtractSuccess(`Extracted ${doc.skills?.length || 0} skills from ${file.name}!`);
      setTimeout(() => {
        setActiveTab('profile');
        setExtractSuccess(null);
      }, 1500);
    } catch (err: any) {
      setExtractError(err?.message || 'Failed to parse resume file.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pastedText.trim()) return;
    setIsExtracting(true);
    setExtractError(null);
    setExtractSuccess(null);

    try {
      const doc = await updateSessionResume(sessionId, {
        resumeText: pastedText,
        candidateName: resume?.candidateName || 'Candidate',
        resumeTitle: 'Updated Session Resume'
      });
      onUpdateResume(doc);
      setExtractSuccess(`Extracted ${doc.skills?.length || 0} skills from pasted text!`);
      setPastedText('');
      setTimeout(() => {
        setActiveTab('profile');
        setExtractSuccess(null);
      }, 1500);
    } catch (err: any) {
      setExtractError(err?.message || 'Failed to extract resume text.');
    } finally {
      setIsExtracting(false);
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-elevated border-l border-border flex flex-col items-center py-4 justify-between h-full select-none">
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Expand Resume & STAR Panel"
          className="p-2 rounded-lg bg-surface border border-border text-text-3 hover:text-text cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="[writing-mode:vertical-rl] font-bold text-xs text-text-3 uppercase tracking-widest flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span>Resume &amp; STAR</span>
        </div>
        <div />
      </div>
    );
  }

  return (
    <div className={`w-80 lg:w-96 bg-elevated/40 border-l border-border flex flex-col h-full overflow-hidden select-text ${className}`}>
      {/* Header Bar */}
      <div className="h-11 bg-elevated border-b border-border px-3.5 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold text-text uppercase tracking-wider">Candidate Grounding</h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-surface text-text border border-border'
                : 'text-text-3 hover:text-text'
            }`}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('update')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'update'
                ? 'bg-surface text-primary border border-primary/30'
                : 'text-text-3 hover:text-text'
            }`}
          >
            <RefreshCw className="w-3 h-3" />
            <span>Update</span>
          </button>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Collapse Panel"
              className="p-1 rounded text-text-3 hover:text-text ml-1 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: PROFILE & SKILLS */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* Resume Summary Card */}
            <div className="bg-surface border border-border rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-text flex items-center gap-1.5">
                    <span>{resume?.resumeTitle || 'Grounded Technical Resume'}</span>
                  </div>
                  <div className="text-[11px] text-text-3">
                    Candidate: <strong className="text-text-2">{resume?.candidateName || 'Candidate'}</strong>
                  </div>
                </div>

                <Chip variant="primary" size="sm">
                  {resume?.yearsOfExperience ? `${resume.yearsOfExperience} Yrs Exp` : 'Senior / Staff'}
                </Chip>
              </div>

              {resume?.summary ? (
                <p className="text-xs text-text-2 leading-relaxed bg-elevated/60 rounded-lg p-2.5 border border-border/80">
                  {resume.summary}
                </p>
              ) : (
                <p className="text-xs text-text-3 italic bg-elevated/40 rounded-lg p-2 border border-border/60">
                  AI interviewer is grounded in your distributed systems, backend engineering, and architectural track experience.
                </p>
              )}
            </div>

            {/* Extracted Skills Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-text">
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-primary" />
                  <span>Grounded Technical Skills ({currentSkills.length})</span>
                </span>
                <span className="text-[10px] text-text-3 font-normal">Active in Prompts</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {currentSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-surface border border-border text-[11px] font-mono font-medium text-text hover:border-primary/50 transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Project Highlights (if present) */}
            {resume?.projectExperiences && resume.projectExperiences.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-border">
                <div className="text-xs font-bold text-text flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-text-3" />
                  <span>Project &amp; Architecture Highlights</span>
                </div>
                <ul className="space-y-1.5 text-xs text-text-2">
                  {resume.projectExperiences.map((proj, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-surface p-2 rounded-lg border border-border/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span className="leading-snug">{proj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}


          </div>
        )}

        {/* TAB 2: UPDATE RESUME FORM */}
        {activeTab === 'update' && (
          <div className="space-y-3.5">
            <div className="text-xs text-text-2 leading-relaxed">
              Upload an updated resume (PDF/Text) or paste text to regenerate questions and ground the AI in your latest projects.
            </div>

            {/* Update Mode Switch */}
            <div className="grid grid-cols-2 gap-1.5 bg-surface p-1 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setUpdateMode('upload')}
                className={`py-1 text-xs font-semibold rounded-md cursor-pointer transition-all ${
                  updateMode === 'upload' ? 'bg-primary text-white shadow-xs' : 'text-text-3 hover:text-text'
                }`}
              >
                Upload File (.pdf/.txt)
              </button>
              <button
                type="button"
                onClick={() => setUpdateMode('paste')}
                className={`py-1 text-xs font-semibold rounded-md cursor-pointer transition-all ${
                  updateMode === 'paste' ? 'bg-primary text-white shadow-xs' : 'text-text-3 hover:text-text'
                }`}
              >
                Paste Plain Text
              </button>
            </div>

            {/* Upload File Zone */}
            {updateMode === 'upload' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary rounded-xl p-6 text-center cursor-pointer bg-surface/50 hover:bg-surface transition-all space-y-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.txt,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFileUpload(file);
                  }}
                />
                <UploadCloud className="w-8 h-8 mx-auto text-primary animate-bounce" />
                <div className="text-xs font-bold text-text">Click or drag &amp; drop resume file</div>
                <div className="text-[11px] text-text-3">Supports PDF, TXT up to 10MB</div>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste your LinkedIn summary, key project descriptions, technical skills, or work history..."
                  rows={8}
                  className="w-full bg-surface border border-border rounded-xl p-3 text-xs font-mono text-text placeholder:text-text-3 focus:outline-none focus:border-primary transition-all resize-y leading-relaxed"
                />
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!pastedText.trim() || isExtracting}
                  onClick={handlePasteSubmit}
                  className="w-full"
                  icon={isExtracting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                >
                  {isExtracting ? 'Parsing & Extracting Skills...' : 'Extract & Ground Interview'}
                </Button>
              </div>
            )}

            {/* Success / Error Feedback */}
            {extractSuccess && (
              <div className="p-3 rounded-lg bg-success/15 border border-success/30 text-success text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{extractSuccess}</span>
              </div>
            )}

            {extractError && (
              <div className="p-3 rounded-lg bg-danger/15 border border-danger/30 text-danger text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{extractError}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
