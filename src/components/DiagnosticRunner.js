class DiagnosticRunner {
  constructor() {
    this.data = {
      metadata: {},
      userAgent: {},
      network: {},
      storage: {},
      battery: {},
      performance: {},
      graphics: {},
      sensors: {},
      errors: []
    };
  }

  // Main execution method
  async executeFullDiagnostic() {
    console.log("iODO: Starting comprehensive diagnostic sequence.");

    // Run all checks, capturing any errors in the data object
    try { this._captureMetadata(); } catch (e) { this._logError('Metadata', e); }
    try { this._captureUserAgentData(); } catch (e) { this._logError('UserAgent', e); }
    try { await this._captureNetworkInfo(); } catch (e) { this._logError('Network', e); }
    try { this._captureStorageInfo(); } catch (e) { this._logError('Storage', e); }
    try { await this._captureBatteryInfo(); } catch (e) { this._logError('Battery', e); }
    try { this._runPerformanceTests(); } catch (e) { this._logError('Performance', e); }
    try { this._testGraphics(); } catch (e) { this._logError('Graphics', e); }
    try { this._checkSensors(); } catch (e) { this._logError('Sensors', e); }

    // Send data to Cloudflare Function for deep analysis
    try {
      const analysisResults = await this._sendForAnalysis(this.data);
      this.data.analysis = analysisResults;
    } catch (e) {
      console.error("Cloud analysis failed, using fallback heuristics:", e);
      this.data.analysis = this._performFallbackAnalysis(this.data);
    }

    console.log("iODO: Diagnostic sequence complete.", this.data);
    return this.data;
  }

  _captureMetadata() {
    this.data.metadata = {
      timestamp: new Date().toISOString(),
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      // @ts-ignore - Experimental API
      deviceMemory: navigator.deviceMemory || 'unknown',
      // @ts-ignore - Experimental API
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
    };
  }

  _captureUserAgentData() {
    const ua = navigator.userAgent;
    this.data.userAgent.raw = ua;
    this.data.userAgent.isIOS = /iPhone|iPad|iPod/.test(ua);
    this.data.userAgent.isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    this.data.userAgent.isChrome = /CriOS|Chrome/.test(ua);
    this.data.userAgent.iosVersion = this._parseIOSVersion(ua);
  }

  _parseIOSVersion(ua) {
    const match = ua.match(/OS (\d+)_(\d+)_?(\d+)?/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3] || '0'}`;
    }
    return 'unknown';
  }

  async _captureNetworkInfo() {
    // @ts-ignore - Experimental API
    if ('connection' in navigator) {
      // @ts-ignore
      const conn = navigator.connection;
      this.data.network = {
        downlink: conn.downlink,
        effectiveType: conn.effectiveType,
        rtt: conn.rtt,
        saveData: conn.saveData,
        // @ts-ignore - type not always present
        type: conn.type || 'unknown'
      };
    } else {
      this.data.network.error = 'NetworkInformation API not supported';
    }
  }

  _captureStorageInfo() {
    // Check various storage APIs for availability and health
    this.data.storage = {
      localStorage: !!window.localStorage,
      sessionStorage: !!window.sessionStorage,
      // @ts-ignore - Experimental API
      storageEstimate: 'undefined'
    };

    // @ts-ignore - Experimental API
    if (navigator.storage && navigator.storage.estimate) {
      // @ts-ignore
      navigator.storage.estimate().then(estimate => {
        this.data.storage.storageEstimate = estimate;
      }).catch(e => { this._logError('StorageEstimate', e); });
    }
  }

  async _captureBatteryInfo() {
    // @ts-ignore - Experimental API
    if ('getBattery' in navigator) {
      try {
        // @ts-ignore
        const battery = await navigator.getBattery();
        this.data.battery = {
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
      } catch (e) {
        this.data.battery.error = 'Battery API permission denied';
      }
    } else {
      this.data.battery.error = 'Battery API not supported';
    }
  }

  _runPerformanceTests() {
    // Use the Performance Timing API to gauge device health
    if (performance) {
      const perf = performance;
      const timing = perf.timing;

      this.data.performance = {
        navigationStart: timing.navigationStart,
        loadEventEnd: timing.loadEventEnd,
        domComplete: timing.domComplete,
        // Calculate key metrics
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domReadyTime: timing.domComplete - timing.domLoading,
        // Memory (non-standard, Chrome only)
        // @ts-ignore
        memory: perf.memory ? {
          // @ts-ignore
          usedJSHeapSize: perf.memory.usedJSHeapSize,
          // @ts-ignore
          totalJSHeapSize: perf.memory.totalJSHeapSize
        } : 'Memory API unavailable'
      };
    }
  }

  _testGraphics() {
    // Test WebGL support and performance as a proxy for GPU health
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      this.data.graphics = {
        webgl: true,
        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
        vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown',
        // Basic shader compilation test
        shaderCompileSuccess: this._testShaderCompilation(gl)
      };
    } else {
      this.data.graphics = { webgl: false, error: 'WebGL not supported' };
    }
  }

  _testShaderCompilation(gl) {
    // Simple test for GPU functionality
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, 'attribute vec4 pos; void main() { gl_Position = pos; }');
    gl.compileShader(vs);
    return gl.getShaderParameter(vs, gl.COMPILE_STATUS);
  }

  _checkSensors() {
    // Check for various sensor APIs, common causes of device issues
    this.data.sensors = {
      // @ts-ignore - Experimental APIs
      accelerometer: 'LinearAccelerationSensor' in window,
      // @ts-ignore
      gyroscope: 'Gyroscope' in window,
      // @ts-ignore
      orientation: 'AbsoluteOrientationSensor' in window,
      // Touch support
      touch: 'ontouchstart' in window,
      maxTouchPoints: navigator.maxTouchPoints || 0
    };
  }

  _logError(module, error) {
    this.data.errors.push({
      module,
      message: error.message,
      stack: error.stack
    });
  }

  // In DiagnosticRunner.js - Update the _sendForAnalysis method:

async _sendForAnalysis(payload) {
  // Get the current origin to build the API URL dynamically
  const baseUrl = window.location.origin;
  
  const response = await fetch(`${baseUrl}/api/analyze`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Analysis server returned ${response.status}`);
  }

  return await response.json();
}

  _performFallbackAnalysis(data) {
    // A simple heuristic-based analysis if the cloud function is unreachable
    const faults = [];

    // Example Heuristic Checks:
    if (data.battery.level < 0.2 && !data.battery.charging) {
      faults.push({ code: 'BATT_LOW', severity: 'medium', message: 'Battery level critically low. This can cause unexpected shutdowns.' });
    }

    if (data.performance.loadTime > 5000) { // 5 seconds load time
      faults.push({ code: 'PERF_SLOW', severity: 'low', message: 'Device performance seems sluggish. Could be due to many open apps or memory pressure.' });
    }

    if (!data.graphics.webgl) {
      faults.push({ code: 'GFX_WEBGL_FAIL', severity: 'high', message: 'WebGL is not supported. This may indicate a severe graphics subsystem issue or outdated iOS version.' });
    }

    if (data.network.effectiveType === 'slow-2g') {
      faults.push({ code: 'NET_SLOW', severity: 'low', message: 'Network connection is very slow.' });
    }

    // Check for known iOS version issues based on parsed version
    const iosVer = data.userAgent.iosVersion;
    if (iosVer !== 'unknown') {
      const [major] = iosVer.split('.').map(Number);
      if (major < 15) {
        faults.push({ code: 'IOS_OUTDATED', severity: 'high', message: `iOS version ${iosVer} is significantly outdated. This poses security risks and may cause app compatibility issues.` });
      }
    }

    return { faults, summary: `Fallback analysis found ${faults.length} potential issue(s).` };
  }
}

export default DiagnosticRunner;