import { useReducer, useCallback } from 'react';
import { ModalState, ModalAction } from '@/types/actionResult';

const initialState: ModalState = {
  copied: false,
  isEditing: false,
  editedContent: '',
  isSending: false,
  justSent: false,
};

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case 'COPY_SUCCESS':
      return { ...state, copied: true };
    case 'COPY_RESET':
      return { ...state, copied: false };
    case 'START_EDIT':
      return { ...state, isEditing: true, editedContent: action.content };
    case 'SAVE_EDIT':
      return { ...state, isEditing: false };
    case 'CANCEL_EDIT':
      return { ...state, isEditing: false, editedContent: '' };
    case 'UPDATE_CONTENT':
      return { ...state, editedContent: action.content };
    case 'START_SENDING':
      return { ...state, isSending: true };
    case 'SEND_SUCCESS':
      return { ...state, isSending: false, justSent: true };
    case 'SEND_RESET':
      return { ...state, justSent: false };
    case 'RESET_ALL':
      return initialState;
    default:
      return state;
  }
};

export const useModalState = () => {
  const [state, dispatch] = useReducer(modalReducer, initialState);

  const actions = {
    copySuccess: useCallback(() => dispatch({ type: 'COPY_SUCCESS' }), []),
    copyReset: useCallback(() => dispatch({ type: 'COPY_RESET' }), []),
    startEdit: useCallback((content: string) => dispatch({ type: 'START_EDIT', content }), []),
    saveEdit: useCallback(() => dispatch({ type: 'SAVE_EDIT' }), []),
    cancelEdit: useCallback(() => dispatch({ type: 'CANCEL_EDIT' }), []),
    updateContent: useCallback((content: string) => dispatch({ type: 'UPDATE_CONTENT', content }), []),
    startSending: useCallback(() => dispatch({ type: 'START_SENDING' }), []),
    sendSuccess: useCallback(() => dispatch({ type: 'SEND_SUCCESS' }), []),
    sendReset: useCallback(() => dispatch({ type: 'SEND_RESET' }), []),
    resetAll: useCallback(() => dispatch({ type: 'RESET_ALL' }), []),
  };

  return { state, actions };
};