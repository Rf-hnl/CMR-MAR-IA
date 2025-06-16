export type ActionResult = {
  message?: string;
  evaluation?: string;
  email_subject?: string;
  email_body?: string;
  recommendations?: Array<{ area: string; suggestion: string; }>;
  error?: string;
} | null;

export interface ModalState {
  copied: boolean;
  isEditing: boolean;
  editedContent: string;
  isSending: boolean;
  justSent: boolean;
}

export type ModalAction = 
  | { type: 'COPY_SUCCESS' }
  | { type: 'COPY_RESET' }
  | { type: 'START_EDIT'; content: string }
  | { type: 'SAVE_EDIT' }
  | { type: 'CANCEL_EDIT' }
  | { type: 'UPDATE_CONTENT'; content: string }
  | { type: 'START_SENDING' }
  | { type: 'SEND_SUCCESS' }
  | { type: 'SEND_RESET' }
  | { type: 'RESET_ALL' };