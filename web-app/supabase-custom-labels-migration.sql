-- Migration to add custom_labels table for storing user's custom labels

-- Create custom_labels table
CREATE TABLE IF NOT EXISTS custom_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique label names per user
  UNIQUE(user_id, label_name)
);

-- Enable RLS
ALTER TABLE custom_labels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only see their own custom labels" ON custom_labels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own custom labels" ON custom_labels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own custom labels" ON custom_labels
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own custom labels" ON custom_labels
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_custom_labels_user_id ON custom_labels(user_id);
CREATE INDEX idx_custom_labels_label_name ON custom_labels(user_id, label_name); 