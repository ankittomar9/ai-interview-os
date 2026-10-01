import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('REQ-AV-6: DiagnosticReportView surfaces vault status chip and folder path while keeping manual download anchors intact', () => {
  const reportViewSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/DiagnosticReportView.tsx'),
    'utf-8'
  );

  // Assert vault status chip is rendered
  assert.equal(
    reportViewSrc.includes('Vault: {vaultInfo.status}'),
    true,
    'DiagnosticReportView must render Vault status chip'
  );

  // Assert folder path is surfaced
  assert.equal(
    reportViewSrc.includes('📁 {vaultInfo.folderPath}'),
    true,
    'DiagnosticReportView must surface folderPath'
  );

  // Assert getSessionVault is fetched
  assert.equal(
    reportViewSrc.includes('getSessionVault(report.sessionId)'),
    true,
    'DiagnosticReportView must fetch session vault metadata'
  );

  // Assert manual download anchors are NOT removed (defense in depth)
  assert.equal(
    reportViewSrc.includes('Download PDF Transcript'),
    true,
    'DiagnosticReportView must retain Download PDF Transcript anchor'
  );
  assert.equal(
    reportViewSrc.includes('Export .txt'),
    true,
    'DiagnosticReportView must retain Export .txt button'
  );
  assert.equal(
    reportViewSrc.includes('handleDownloadTranscript'),
    true,
    'DiagnosticReportView must retain handleDownloadTranscript handler'
  );
});

test('REQ-AV-6: api.ts exports getSessionVault and SessionVaultStatus interface', () => {
  const apiSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/services/api.ts'),
    'utf-8'
  );

  assert.equal(
    apiSrc.includes('export interface SessionVaultStatus'),
    true,
    'api.ts must export SessionVaultStatus interface'
  );

  assert.equal(
    apiSrc.includes('export const getSessionVault = async'),
    true,
    'api.ts must export getSessionVault function'
  );

  assert.equal(
    apiSrc.includes('/vault'),
    true,
    'getSessionVault must call /vault endpoint'
  );
});
