import React from 'react';

export function Skeleton({ height = '120px', count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card" style={{ height }} data-testid="skeleton-loader">
          <div className="skeleton-line" style={{ width: '40%', height: '16px', marginBottom: '16px' }}></div>
          <div className="skeleton-line" style={{ width: '60%', height: '32px', marginBottom: '12px' }}></div>
          <div className="skeleton-line" style={{ width: '85%', height: '12px' }}></div>
        </div>
      ))}
    </>
  );
}
