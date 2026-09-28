import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

export function AlertBanner({ alerts = [] }) {
  const [expandedAlertId, setExpandedAlertId] = useState(null);

  if (!alerts || alerts.length === 0) return null;

  // Highest severity priority: Red > Orange > Yellow > Green
  const activeAlert = alerts[0];
  const isExpanded = expandedAlertId === activeAlert.id;

  const toggleExpand = () => {
    setExpandedAlertId(isExpanded ? null : activeAlert.id);
  };

  return (
    <div className={`alert-banner ${activeAlert.severity}`} data-testid="alert-banner">
      <div className="alert-header">
        <div className="alert-title-row">
          <ShieldAlert size={20} />
          <span>{activeAlert.title}</span>
        </div>
        <button
          type="button"
          onClick={toggleExpand}
          className="tap-target"
          style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px' }}
          aria-label="Toggle details"
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      <div className="alert-description">
        <p>{activeAlert.description}</p>
        {isExpanded && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
            <div><strong>Issued:</strong> {new Date(activeAlert.issuedAt).toLocaleString()}</div>
            <div><strong>Valid Until:</strong> {new Date(activeAlert.validUntil).toLocaleString()}</div>
          </div>
        )}
      </div>
    </div>
  );
}
