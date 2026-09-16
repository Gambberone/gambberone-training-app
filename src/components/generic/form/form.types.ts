export interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  options?: any[];
  valueKey?: string;
  error?: string;
  required?: boolean;
  compact?: boolean;
}
