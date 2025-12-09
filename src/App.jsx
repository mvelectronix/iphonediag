import { useState, useEffect } from 'react';
import DiagnosticRunner from './components/DiagnosticRunner';
import ResultsView from './components/ResultsView';
import './App.css';

function App() {
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);

  // Handler to start the diagnostic process
  const runDiagnostics = async () => {
    setIsRunning(true);
    setError(null);
    try {
      // Instantiate the runner and execute diagnostics
      const runner = new DiagnosticRunner();
      const data = await runner.executeFullDiagnostic();
      setDiagnosticData(data);
    } catch (err) {
      console.error("Diagnostic execution failed:", err);
      setError(err.message || 'An unknown error occurred during diagnostics.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>iODO - iOS Diagnostic Overlord</h1>
        <p>Advanced Device Fault Analysis</p>
      </header>

      <main className="app-main">
        {!diagnosticData && !isRunning && (
          <div className="start-screen">
            <button onClick={runDiagnostics} className="start-button">
              BEGIN DEVICE DIAGNOSIS
            </button>
            <p className="disclaimer">
              This tool performs non-invasive checks using your browser's APIs. It cannot access private data or make changes to your system. All analysis happens on your device or in a secure Cloudflare Function.
            </p>
          </div>
        )}

        {isRunning && (
          <div className="diagnostic-progress">
            <div className="progress-bar"></div>
            <p>Running advanced diagnostics... This may take a moment.</p>
          </div>
        )}

        {error && (
          <div className="error-panel">
            <h2>Execution Error</h2>
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {diagnosticData && (
          <ResultsView data={diagnosticData} onReset={() => setDiagnosticData(null)} />
        )}
      </main>
    </div>
  );
}

export default App;