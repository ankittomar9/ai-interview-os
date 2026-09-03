import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { uploadResumeFile, uploadResumeText } from '../../services/api';
import type { ResumeDocument } from '../../types';

interface ResumeSectionProps {
  candidateId: string;
  candidateName: string;
  onResumeUploaded?: (resume: ResumeDocument) => void;
}

export const ResumeSection: React.FC<ResumeSectionProps> = ({
  candidateId,
  candidateName,
  onResumeUploaded
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [resumeText, setResumeText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [parsedSkills, setParsedSkills] = useState<string[]>([]);
  const [parsedProfile, setParsedProfile] = useState<ResumeDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const response = await uploadResumeFile(file, candidateId || 'candidate-01', candidateName || 'Candidate');
      setUploadSuccess(true);
      setParsedProfile(response);
      if (response.skills && Array.isArray(response.skills)) {
        setParsedSkills(response.skills);
      }
      if (onResumeUploaded) onResumeUploaded(response);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload and parse resume file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!resumeText.trim()) return;

    setIsUploading(true);
    setError(null);
    try {
      const response = await uploadResumeText({
        candidateId: candidateId || 'candidate-01',
        candidateName: candidateName || 'Candidate',
        resumeText
      });
      setUploadSuccess(true);
      setParsedProfile(response);
      if (response.skills && Array.isArray(response.skills)) {
        setParsedSkills(response.skills);
      }
      if (onResumeUploaded) onResumeUploaded(response);
    } catch (err: any) {
      setError(err?.message || 'Failed to ingest resume text.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-text">
          <FileText className="w-4 h-4 text-primary" />
          <span>Resume Grounding (PDF or Raw Text)</span>
        </div>

        <div className="flex items-center gap-1 bg-elevated p-0.5 rounded-md text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-2.5 py-0.5 rounded transition-colors cursor-pointer ${
              activeTab === 'upload' ? 'bg-surface text-text font-semibold shadow-xs' : 'text-text-3'
            }`}
          >
            PDF Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-2.5 py-0.5 rounded transition-colors cursor-pointer ${
              activeTab === 'text' ? 'bg-surface text-text font-semibold shadow-xs' : 'text-text-3'
            }`}
          >
            Paste Text
          </button>
        </div>
      </div>

      {activeTab === 'upload' ? (
        <label className="border-2 border-dashed border-border hover:border-primary/60 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
          <Upload className="w-6 h-6 text-text-3 mb-1.5" />
          <span className="text-xs font-medium text-text">Click to upload resume PDF</span>
          <span className="text-[10px] text-text-3 mt-0.5">Supports PDF up to 10MB</span>
          <input
            type="file"
            accept=".pdf,.txt,.docx"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      ) : (
        <div className="space-y-2">
          <textarea
            rows={3}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume work history, projects, and tech stack here..."
            className="w-full bg-elevated border border-border rounded-lg p-2.5 text-xs text-text focus:outline-none focus:border-primary resize-none font-mono"
          />
          <button
            type="button"
            onClick={handleTextSubmit}
            disabled={isUploading || !resumeText.trim()}
            className="px-3 py-1 bg-primary text-on-accent text-xs font-semibold rounded-md hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
          >
            Ingest Resume
          </button>
        </div>
      )}

      {isUploading && (
        <div className="flex items-center gap-2 text-xs text-primary">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Parsing resume document &amp; extracting competency signals...</span>
        </div>
      )}

      {uploadSuccess && (
        <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-xs space-y-2">
          <div className="flex items-center justify-between text-success">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Resume parsed: {parsedProfile?.candidateName || 'Candidate'}</span>
            </div>
            {parsedProfile?.inferredRoleLevel && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/20 text-primary border border-primary/30">
                Level: {parsedProfile.inferredRoleLevel}
              </span>
            )}
          </div>
          {parsedProfile?.email && (
            <div className="text-[11px] text-text-2">
              📧 {parsedProfile.email}
            </div>
          )}
          {parsedSkills.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {parsedSkills.slice(0, 6).map((skill, idx) => (
                <span key={idx} className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] text-text">
                  {skill}
                </span>
              ))}
              {parsedSkills.length > 6 && (
                <span className="text-[10px] text-text-3 self-center">+{parsedSkills.length - 6} more</span>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-2 rounded-lg bg-danger/10 border border-danger/30 text-xs text-danger flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
