/**
 * Custom Labels Service - Manages user's custom labels
 */

import { supabase } from './supabase';

export interface CustomLabel {
  id: string;
  user_id: string;
  label_name: string;
  created_at: string;
}

export class CustomLabelsService {
  /**
   * Get all custom labels for a user
   */
  static async getUserCustomLabels(userId: string): Promise<CustomLabel[]> {
    const { data, error } = await supabase
      .from('custom_labels')
      .select('*')
      .eq('user_id', userId)
      .order('label_name', { ascending: true });

    if (error) {
      console.error('Error fetching custom labels:', error);
      throw new Error(`Failed to fetch custom labels: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Add a new custom label for a user
   */
  static async addCustomLabel(userId: string, labelName: string): Promise<CustomLabel> {
    // Trim and validate the label name
    const trimmedLabel = labelName.trim();
    if (!trimmedLabel) {
      throw new Error('Label name cannot be empty');
    }

    // Check if label already exists (case-insensitive)
    const existingLabels = await this.getUserCustomLabels(userId);
    const labelExists = existingLabels.some(
      label => label.label_name.toLowerCase() === trimmedLabel.toLowerCase()
    );

    if (labelExists) {
      throw new Error('This label already exists');
    }

    const { data, error } = await supabase
      .from('custom_labels')
      .insert({
        user_id: userId,
        label_name: trimmedLabel
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding custom label:', error);
      throw new Error(`Failed to add custom label: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a custom label
   */
  static async deleteCustomLabel(userId: string, labelId: string): Promise<void> {
    const { error } = await supabase
      .from('custom_labels')
      .delete()
      .eq('id', labelId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting custom label:', error);
      throw new Error(`Failed to delete custom label: ${error.message}`);
    }
  }

  /**
   * Update a custom label name
   */
  static async updateCustomLabel(userId: string, labelId: string, newLabelName: string): Promise<CustomLabel> {
    const trimmedLabel = newLabelName.trim();
    if (!trimmedLabel) {
      throw new Error('Label name cannot be empty');
    }

    // Check if the new name already exists (case-insensitive)
    const existingLabels = await this.getUserCustomLabels(userId);
    const labelExists = existingLabels.some(
      label => label.label_name.toLowerCase() === trimmedLabel.toLowerCase() && label.id !== labelId
    );

    if (labelExists) {
      throw new Error('This label already exists');
    }

    const { data, error } = await supabase
      .from('custom_labels')
      .update({ label_name: trimmedLabel })
      .eq('id', labelId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating custom label:', error);
      throw new Error(`Failed to update custom label: ${error.message}`);
    }

    return data;
  }
} 