import React, { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownProblemProps {
  statement: string;
}

export const MarkdownProblem: React.FC<MarkdownProblemProps> = ({ statement }) => {
  const html = useMemo(() => {
    if (!statement) return '';
    try {
      return marked.parse(statement, { async: false, gfm: true, breaks: true }) as string;
    } catch {
      return statement;
    }
  }, [statement]);

  return (
    <div
      className="markdown-problem text-xs text-text-2 leading-relaxed space-y-2.5
        [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-text [&_h1]:mt-3 [&_h1]:mb-1.5
        [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-text [&_h2]:mt-2.5 [&_h2]:mb-1
        [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-text [&_h3]:mt-2.5 [&_h3]:mb-1 [&_h3]:uppercase [&_h3]:tracking-wider
        [&_p]:leading-relaxed [&_p]:my-1.5
        [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-1 [&_ul]:my-1.5
        [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:space-y-1 [&_ol]:my-1.5
        [&_li]:text-text-2
        [&_code]:font-mono [&_code]:text-[11px] [&_code]:bg-elevated [&_code]:text-primary-2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:border [&_code]:border-border-subtle
        [&_pre]:bg-elevated [&_pre]:p-2.5 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:my-2 [&_pre]:overflow-x-auto
        [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-text [&_pre_code]:border-0
        [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:text-text-3
        [&_table]:w-full [&_table]:border-collapse [&_table]:my-2.5
        [&_th]:border [&_th]:border-border [&_th]:p-1.5 [&_th]:bg-elevated [&_th]:text-left [&_th]:text-text [&_th]:text-xs
        [&_td]:border [&_td]:border-border [&_td]:p-1.5 [&_td]:text-text-2 [&_td]:text-xs"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
