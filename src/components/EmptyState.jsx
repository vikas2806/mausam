import React from 'react';
import { AlertCircle } from 'lucide-react';

export function EmptyState({ title = 'No Data Available', message = 'Weather data for this metric is not available.', icon: IconComponent = AlertCircle }) {
  return (
    <div className="empty-state" data-testid="empty-state">
      <IconComponent size={28} style={{ opacity: 0.7 }} />
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-message">{message}</div>
    </div>
  );
}
