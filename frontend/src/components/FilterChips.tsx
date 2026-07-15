import { X } from 'lucide-react';
import { Button } from './Button';
import './FilterChips.css';

interface FilterChip {
  id: string;
  label: string;
  value: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onRemove: (chipId: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export function FilterChips({
  chips,
  onRemove,
  onClearAll,
  className = '',
}: FilterChipsProps) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className={`filter-chips ${className}`}>
      <span className="filter-chips__label">Active filters:</span>
      <div className="filter-chips__list">
        {chips.map((chip) => (
          <span
            key={chip.id}
            className="filter-chip"
          >
            <span className="filter-chip__label">{chip.label}</span>
            <span className="filter-chip__value">{chip.value}</span>
            <button
              className="filter-chip__remove"
              onClick={() => onRemove(chip.id)}
              aria-label={`Remove ${chip.label} filter`}
              type="button"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      {chips.length >= 2 && onClearAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
