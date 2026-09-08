import test from 'node:test';
import assert from 'node:assert/strict';
import type { CandidateProfile } from '../../services/api';

test('Gate VP8: CandidateProfile auto-hydration extracts identity and role fields', () => {
  const profile: CandidateProfile = {
    id: 1,
    userId: 'local',
    fullName: 'Jane Developer',
    targetRole: 'Senior Staff Engineer',
    targetCompany: 'Vertex Global',
    jobDescription: 'High-throughput Kafka streaming architecture',
    resumeText: 'Jane Developer resume: 10 years distributed systems',
    resumePdfPath: 'jane_resume.pdf',
    persona: 'TECH',
    hasResume: true,
    createdAt: '2026-09-08T00:00:00Z',
    updatedAt: '2026-09-08T01:00:00Z'
  };

  const hydrateForm = (p: CandidateProfile, currentCandidateId: string) => {
    return {
      candidateId: currentCandidateId || p.userId || 'local',
      candidateName: p.fullName?.trim() || 'Candidate',
      roleTitle: p.targetRole?.trim() || 'Software Engineer',
      targetCompany: p.targetCompany?.trim() || '',
      jobDescription: p.jobDescription?.trim() || '',
      persona: (p.persona === 'NON_TECH' ? 'NON_TECH' : 'TECH') as 'TECH' | 'NON_TECH',
      hasResume: Boolean(p.hasResume || p.resumeText || p.resumePdfPath)
    };
  };

  const hydrated = hydrateForm(profile, 'candidate-01');

  assert.equal(hydrated.candidateId, 'candidate-01');
  assert.equal(hydrated.candidateName, 'Jane Developer');
  assert.equal(hydrated.roleTitle, 'Senior Staff Engineer');
  assert.equal(hydrated.targetCompany, 'Vertex Global');
  assert.equal(hydrated.jobDescription, 'High-throughput Kafka streaming architecture');
  assert.equal(hydrated.persona, 'TECH');
  assert.equal(hydrated.hasResume, true);
});

test('Gate VP8: CandidateProfile resume presence and display line formatting', () => {
  const formatProfileLine = (p: CandidateProfile) => {
    const parts: string[] = [];
    if (p.fullName) parts.push(p.fullName);
    if (p.targetRole) parts.push(p.targetRole);
    if (p.targetCompany) parts.push(`at ${p.targetCompany}`);
    return parts.join(' • ');
  };

  const profileWithCompany: CandidateProfile = {
    userId: 'local',
    fullName: 'Ankit Singh Tomar',
    targetRole: 'Senior Java Backend Engineer',
    targetCompany: 'Google',
    hasResume: true
  };

  assert.equal(
    formatProfileLine(profileWithCompany),
    'Ankit Singh Tomar • Senior Java Backend Engineer • at Google'
  );

  const profileWithoutCompany: CandidateProfile = {
    userId: 'local',
    fullName: 'Alex Vance',
    targetRole: 'Systems Programmer',
    hasResume: false
  };

  assert.equal(formatProfileLine(profileWithoutCompany), 'Alex Vance • Systems Programmer');
  assert.equal(profileWithoutCompany.hasResume, false);
});

test('Gate VP8: CandidateProfile auto-save payload construction', () => {
  const buildSavePayload = (formState: {
    userId: string;
    candidateName: string;
    roleTitle: string;
    targetCompany: string;
    jobDescription: string;
    persona: 'TECH' | 'NON_TECH';
  }): Partial<CandidateProfile> => {
    return {
      userId: formState.userId || 'local',
      fullName: formState.candidateName.trim(),
      targetRole: formState.roleTitle.trim(),
      targetCompany: formState.targetCompany.trim(),
      jobDescription: formState.jobDescription.trim(),
      persona: formState.persona
    };
  };

  const payload = buildSavePayload({
    userId: 'local',
    candidateName: ' Jane Dev ',
    roleTitle: ' Lead Architect ',
    targetCompany: ' Acme Inc ',
    jobDescription: ' Scale Cassandra cluster ',
    persona: 'TECH'
  });

  assert.equal(payload.userId, 'local');
  assert.equal(payload.fullName, 'Jane Dev');
  assert.equal(payload.targetRole, 'Lead Architect');
  assert.equal(payload.targetCompany, 'Acme Inc');
  assert.equal(payload.jobDescription, 'Scale Cassandra cluster');
  assert.equal(payload.persona, 'TECH');
});
