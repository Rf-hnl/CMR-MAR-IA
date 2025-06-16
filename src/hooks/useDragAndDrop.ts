"use client";

import { useState, useCallback, DragEvent } from 'react';

export interface DragItem {
  id: string;
  type: string;
  data: any;
}

export const useDragAndDrop = () => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const handleDragStart = useCallback((e: DragEvent, item: DragItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, []);

  const handleDragEnd = useCallback((e: DragEvent) => {
    setDraggedItem(null);
    setDropTarget(null);
    
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e: DragEvent, targetId: string) => {
    e.preventDefault();
    setDropTarget(targetId);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    // Only remove drop target if we're actually leaving the element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropTarget(null);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent, targetId: string, onDrop: (item: DragItem, targetId: string) => void) => {
    e.preventDefault();
    
    try {
      const data = e.dataTransfer.getData('text/plain');
      const item = JSON.parse(data) as DragItem;
      onDrop(item, targetId);
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
    
    setDraggedItem(null);
    setDropTarget(null);
  }, []);

  return {
    draggedItem,
    dropTarget,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  };
};