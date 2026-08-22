import React from 'react';
import { Terminal, ChevronUp, ChevronDown, X, Trash2 } from 'lucide-react';
import { Chip } from './Chip';

export interface TestConsoleProps {
  status: 'idle' | 'running' | 'passed' | 'failed';
  output: string | null;
  height: number;
  onClear: () => void;
  onClose: () => void;
  onToggleExpand?: () => void;
  isExpanded?: boolean;
  className?: string;
}

export const TestConsole: React.FC<TestConsoleProps> = ({
  status,
  output,
  height,
  onClear,
  onClose,
  onToggleExpand,
  isExpanded = false,
  className = ''
}) => {
  const getStatusChip = () => {
    switch (status) {
      case 'running':
        return <Chip variant="warning" size="sm">Running...</Chip>;
      case 'passed':
        return <Chip variant="success" size="sm">All Tests Passed</Chip>;
      case 'failed':
        return <Chip variant="danger" size="sm">Failed / Non-Zero</Chip>;
      default:
        return <Chip variant="neutral" size="sm">Ready</Chip>;
    }
  };

  return (
    <div
      className={`bg-surface border-t border-border flex flex-col transition-all overflow-hidden ${className}`}
      style={{ height: `${height}px` }}
    >
      {/* Console Top Toolbar */}
      <div className="h-8 bg-elevated border-b border-border px-3 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-text-3" />
          <span className="text-xs font-bold text-text-2">Execution Console</span>
          {getStatusChip()}
        </div>

        <div className="flex items-center gap-1">
          {output && (
            <button
              onClick={onClear}
              title="Clear output"
              className="p-1 text-text-3 hover:text-text hover:bg-surface rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              title={isExpanded ? 'Collapse Console' : 'Expand Console'}
              className="p-1 text-text-3 hover:text-text hover:bg-surface rounded transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={onClose}
            title="Close Console"
            className="p-1 text-text-3 hover:text-danger hover:bg-surface rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Output Stream */}
      <pre
        className={`flex-1 p-3 m-0 overflow-auto font-mono text-xs leading-relaxed whitespace-pre-wrap ${
          status === 'passed'
            ? 'text-success'
            : status === 'failed'
            ? 'text-danger'
            : 'text-text-2'
        }`}
      >
        {output || 'Ready to execute. Click "Run Test Suite" to test your solution against sandbox fixtures.'}
      </pre>
    </div>
  );
};
