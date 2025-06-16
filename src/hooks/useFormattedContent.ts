import { useMemo } from 'react';

type ActionResult = {
  message?: string;
  evaluation?: string;
  email_subject?: string;
  email_body?: string;
  recommendations?: Array<{ area: string; suggestion: string; }>;
  error?: string;
} | null;

export const useFormattedContent = (actionResult: ActionResult) => {
  return useMemo(() => {
    if (!actionResult || 'error' in actionResult) return '';
    
    if ('message' in actionResult && actionResult.message) {
      return actionResult.message;
    } else if ('evaluation' in actionResult && actionResult.evaluation) {
      return actionResult.evaluation;
    } else if ('email_subject' in actionResult && actionResult.email_subject && actionResult.email_body) {
      return `Asunto: ${actionResult.email_subject}\n\n${actionResult.email_body}`;
    } else if ('recommendations' in actionResult && actionResult.recommendations) {
      return actionResult.recommendations
        .map(rec => `${rec.area}: ${rec.suggestion}`)
        .join('\n\n');
    }
    return '';
  }, [actionResult]);
};