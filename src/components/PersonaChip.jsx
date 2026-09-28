import React from 'react';
import * as Icons from 'lucide-react';

export function PersonaChip({ id, label, iconName, active = false, onClick }) {
  const IconComponent = Icons[iconName] || Icons.User;

  return (
    <button
      type="button"
      className={`persona-chip ${active ? 'active' : ''}`}
      onClick={() => onClick && onClick(id)}
      aria-pressed={active}
      aria-label={`Filter by ${label} persona`}
      data-testid={`persona-chip-${id}`}
    >
      <IconComponent size={14} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
