import { useState } from 'react';

const ResultsView = ({ data, onReset }) => {
  const [expandedSection, setExpandedSection] = useState('analysis');

  const renderFaults = (faults) => {
    if (!faults || faults.length === 0) {
      return <p className="no-issues">No significant issues detected. Device appears healthy.</p>;
    }

    return (
      <div className="faults-list">
        {faults.map((fault, index) => (
          <div key={index} className={`fault-item severity-${fault.severity}`}>
            <h4>{fault.code}</h4>
            <p>{fault.message}</p>
            <span className="severity-badge">{fault.severity}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="results-view">
      <h2>Diagnostic Report</h2>
      <p className="timestamp">Generated: {new Date(data.metadata.timestamp).toLocaleString()}</p>

      <div className="results-nav">
        <button onClick={() => setExpandedSection('analysis')} className={expandedSection === 'analysis' ? 'active' : ''}>Analysis</button>
        <button onClick={() => setExpandedSection('raw')} className={expandedSection === 'raw' ? 'active' : ''}>Raw Data</button>
      </div>

      {expandedSection === 'analysis' && (
        <div className="analysis-results">
          <h3>Detected Issues</h3>
          {renderFaults(data.analysis?.faults)}
        </div>
      )}

      {expandedSection === 'raw' && (
        <div className="raw-data">
          <h3>Collected Telemetry Data</h3>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}

      <button onClick={onReset} className="reset-button">Run Another Diagnosis</button>
    </div>
  );
};

export default ResultsView;