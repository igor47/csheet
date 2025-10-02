export interface LabeledValueProps {
  label: string;
  value: string | number;
  className?: string;
}

export const LabeledValue = ({ label, value, className = '' }: LabeledValueProps) => {
  return (
    <div class={`position-relative border rounded p-2 pt-4 ${className}`}>
      <label class="position-absolute top-0 start-0 ms-2 mt-1 small text-muted">{label}</label>
      <div class="text-end">{value}</div>
    </div>
  );
}
