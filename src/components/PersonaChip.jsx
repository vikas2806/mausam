import React from 'react';
import * as Icons from 'lucide-react';

export function PersonaChip({ id, label, iconName, active = false, onClick }) {
  const IconComponent = Icons[iconName] || Icons.User;

  return (
    <button
      type="button"
      className={`persona-chip ${active ? 'active' : ''}`}
      onClick={() => onClick && onClick(id)}
      data-testid={`persona-chip-${id}`}
    >
      <IconComponent size={14} />
      <span>{label}</span>
    </button>
  );
}
