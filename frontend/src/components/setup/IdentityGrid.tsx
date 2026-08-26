import React from 'react';
import { User, Building, Briefcase, FileText } from 'lucide-react';

interface IdentityGridProps {
  candidateId: string;
  onChangeCandidateId: (val: string) => void;
  candidateName: string;
  onChangeCandidateName: (val: string) => void;
  roleTitle: string;
  onChangeRoleTitle: (val: string) => void;
  targetCompany: string;
  onChangeTargetCompany: (val: string) => void;
  jobDescription: string;
  onChangeJobDescription: (val: string) => void;
}

export const IdentityGrid: React.FC<IdentityGridProps> = ({
  candidateId,
  onChangeCandidateId,
  candidateName,
  onChangeCandidateName,
  roleTitle,
  onChangeRoleTitle,
  targetCompany,
  onChangeTargetCompany,
  jobDescription,
  onChangeJobDescription
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Candidate ID */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-primary" />
            <span>Candidate Identifier</span>
          </label>
          <input
            type="text"
            value={candidateId}
            onChange={(e) => onChangeCandidateId(e.target.value)}
            placeholder="e.g. candidate-01"
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-primary font-mono"
          />
        </div>

        {/* Candidate Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-primary" />
            <span>Full Name</span>
          </label>
          <input
            type="text"
            value={candidateName}
            onChange={(e) => onChangeCandidateName(e.target.value)}
            placeholder="e.g. Ankit Singh Tomar"
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-primary"
          />
        </div>

        {/* Target Role Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-primary" />
            <span>Target Role Title</span>
          </label>
          <input
            type="text"
            value={roleTitle}
            onChange={(e) => onChangeRoleTitle(e.target.value)}
            placeholder="e.g. Senior Java Backend Engineer"
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-primary"
          />
        </div>

        {/* Target Company */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-primary" />
            <span>Target Company</span>
          </label>
          <input
            type="text"
            value={targetCompany}
            onChange={(e) => onChangeTargetCompany(e.target.value)}
            placeholder="e.g. Google, Stripe, Meta"
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Job Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-text flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span>Job Description / Target Competencies</span>
          </div>
          <span className="text-[10px] text-text-3">Optional grounding</span>
        </label>
        <textarea
          rows={2}
          value={jobDescription}
          onChange={(e) => onChangeJobDescription(e.target.value)}
          placeholder="Paste key requirements or tech stack to tailor questions..."
          className="w-full bg-surface border border-border rounded-lg p-2.5 text-xs text-text focus:outline-none focus:border-primary resize-none"
        />
      </div>
    </div>
  );
};
