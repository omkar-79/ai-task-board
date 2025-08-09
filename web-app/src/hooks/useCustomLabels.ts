/**
 * Custom hook for managing custom labels
 */

import { useState, useEffect, useCallback } from 'react';
import { CustomLabelsService, CustomLabel } from '@/lib/customLabels';

export interface UseCustomLabelsReturn {
  customLabels: CustomLabel[];
  isLoading: boolean;
  error: string | null;
  addCustomLabel: (labelName: string) => Promise<void>;
  deleteCustomLabel: (labelId: string) => Promise<void>;
  updateCustomLabel: (labelId: string, newLabelName: string) => Promise<void>;
  refreshCustomLabels: () => Promise<void>;
}

export const useCustomLabels = (userId?: string): UseCustomLabelsReturn => {
  const [customLabels, setCustomLabels] = useState<CustomLabel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch custom labels
  const fetchCustomLabels = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const labels = await CustomLabelsService.getUserCustomLabels(userId);
      setCustomLabels(labels);
    } catch (err) {
      console.error('Error fetching custom labels:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch custom labels');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load custom labels on mount and when userId changes
  useEffect(() => {
    fetchCustomLabels();
  }, [fetchCustomLabels]);

  // Add a new custom label
  const addCustomLabel = useCallback(async (labelName: string) => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setError(null);

    try {
      const newLabel = await CustomLabelsService.addCustomLabel(userId, labelName);
      setCustomLabels(prev => [...prev, newLabel].sort((a, b) => a.label_name.localeCompare(b.label_name)));
    } catch (err) {
      console.error('Error adding custom label:', err);
      setError(err instanceof Error ? err.message : 'Failed to add custom label');
      throw err;
    }
  }, [userId]);

  // Delete a custom label
  const deleteCustomLabel = useCallback(async (labelId: string) => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setError(null);

    try {
      await CustomLabelsService.deleteCustomLabel(userId, labelId);
      setCustomLabels(prev => prev.filter(label => label.id !== labelId));
    } catch (err) {
      console.error('Error deleting custom label:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete custom label');
      throw err;
    }
  }, [userId]);

  // Update a custom label
  const updateCustomLabel = useCallback(async (labelId: string, newLabelName: string) => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setError(null);

    try {
      const updatedLabel = await CustomLabelsService.updateCustomLabel(userId, labelId, newLabelName);
      setCustomLabels(prev => 
        prev.map(label => label.id === labelId ? updatedLabel : label)
          .sort((a, b) => a.label_name.localeCompare(b.label_name))
      );
    } catch (err) {
      console.error('Error updating custom label:', err);
      setError(err instanceof Error ? err.message : 'Failed to update custom label');
      throw err;
    }
  }, [userId]);

  return {
    customLabels,
    isLoading,
    error,
    addCustomLabel,
    deleteCustomLabel,
    updateCustomLabel,
    refreshCustomLabels: fetchCustomLabels
  };
}; 