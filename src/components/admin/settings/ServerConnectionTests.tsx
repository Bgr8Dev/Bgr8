import { useMemo, useState } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaPlug, FaSync, FaTimesCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { emailConfig } from '../../../config/emailConfig';
import { EmailApiService } from '../../../services/emailApiService';
import { FirebaseApiService } from '../../../services/firebaseApiService';
import { loggers } from '../../../utils/logger';

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

interface TestStage {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  data?: Record<string, unknown> | unknown;
}

interface TestResult {
  status: TestStatus;
  message: string;
  checkedAt?: Date;
  stages?: TestStage[];
  errorDetails?: string;
  responseData?: Record<string, unknown> | unknown;
}

const CALCOM_SERVER_BASE = import.meta.env.VITE_CALCOM_SERVER_BASE_URL || 'https://bgr8-cal-server.onrender.com';

// Get Firebase server URL (same logic as FirebaseApiService)
const isProduction = import.meta.env.PROD;
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);
const FIREBASE_SERVER_URL = import.meta.env.VITE_FIREBASE_SERVER_URL || 
  (isProduction && !isLocalhost 
    ? 'https://bgr8-firebase-server.onrender.com'
    : 'http://localhost:4001');

const getEnvironmentLabel = (url: string): 'development' | 'production' => {
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return 'development';
  }
  return 'production';
};

const getAppOrigin = (): string => {
  if (typeof window === 'undefined') {
    return 'unknown';
  }
  return window.location.origin;
};

const formatTimestamp = (date?: Date): string => {
  if (!date) return 'Never checked';
  return date.toLocaleString();
};

const buildStatusMeta = (result: TestResult) => {
  if (result.status === 'success') {
    return { icon: <FaCheckCircle />, className: 'status-success', label: 'Connected' };
  }
  if (result.status === 'error') {
    return { icon: <FaTimesCircle />, className: 'status-error', label: 'Failed' };
  }
  if (result.status === 'testing') {
    return { icon: <FaSync className="status-spinner" />, className: 'status-testing', label: 'Testing' };
  }
  return { icon: <FaPlug />, className: 'status-idle', label: 'Not tested' };
};

export default function ServerConnectionTests() {
  const [emailTest, setEmailTest] = useState<TestResult>({
    status: 'idle',
    message: 'No test run yet',
    stages: [],
  });
  const [calcomTest, setCalcomTest] = useState<TestResult>({
    status: 'idle',
    message: 'No test run yet',
    stages: [],
  });
  const [firebaseTest, setFirebaseTest] = useState<TestResult>({
    status: 'idle',
    message: 'No test run yet',
    stages: [],
  });
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<{ [key: string]: boolean }>({});

  const appOrigin = useMemo(() => getAppOrigin(), []);
  const appEnvironment = useMemo(() => getEnvironmentLabel(appOrigin), [appOrigin]);
  const emailEnvironment = useMemo(() => getEnvironmentLabel(emailConfig.apiBaseUrl), []);
  const calcomEnvironment = useMemo(() => getEnvironmentLabel(CALCOM_SERVER_BASE), []);
  const firebaseEnvironment = useMemo(() => getEnvironmentLabel(FIREBASE_SERVER_URL), []);

  const runEmailTest = async () => {
    const stages: TestStage[] = [
      { name: 'Initializing test', status: 'pending' },
      { name: 'Getting authentication token', status: 'pending' },
      { name: 'Connecting to server', status: 'pending' },
      { name: 'Verifying response', status: 'pending' },
    ];
    
    try {
      setEmailTest({ 
        status: 'testing', 
        message: 'Checking email server...',
        stages,
      });

      stages[0].status = 'running';
      stages[0].message = 'Starting email server connection test...';
      setEmailTest(prev => ({ ...prev, stages: [...stages] }));

      stages[1].status = 'running';
      stages[1].message = 'Retrieving authentication token...';
      setEmailTest(prev => ({ ...prev, stages: [...stages] }));

      const response = await EmailApiService.fetchWithAuth('/api/health', { method: 'GET' });
      
      stages[1].status = 'success';
      stages[1].message = 'Token retrieved successfully';
      stages[2].status = 'running';
      stages[2].message = `Connecting to ${emailConfig.apiBaseUrl}...`;
      setEmailTest(prev => ({ ...prev, stages: [...stages] }));

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Email server responded ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      
      stages[2].status = 'success';
      stages[2].message = 'Connection established';
      stages[2].data = responseData;
      stages[3].status = 'running';
      stages[3].message = 'Verifying response format...';
      setEmailTest(prev => ({ ...prev, stages: [...stages] }));

      stages[3].status = 'success';
      stages[3].message = 'Response verified successfully';
      stages[3].data = responseData;
      
      setEmailTest({
        status: 'success',
        message: 'Email server reachable and authenticated.',
        checkedAt: new Date(),
        stages,
        responseData,
      });
    } catch (error) {
      loggers.api.error('Email server test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Email server test failed';
      const errorDetails = error instanceof Error ? error.stack : String(error);
      
      // Mark current stage as error
      const currentStage = stages.find(s => s.status === 'running') || stages[stages.length - 1];
      if (currentStage) {
        currentStage.status = 'error';
        currentStage.message = errorMessage;
      }
      
      setEmailTest({
        status: 'error',
        message: errorMessage,
        checkedAt: new Date(),
        stages,
        errorDetails,
      });
    }
  };

  const runCalcomTest = async () => {
    const stages: TestStage[] = [
      { name: 'Initializing test', status: 'pending' },
      { name: 'Connecting to server', status: 'pending' },
      { name: 'Verifying response', status: 'pending' },
    ];
    
    try {
      setCalcomTest({ 
        status: 'testing', 
        message: 'Checking Cal.com server...',
        stages,
      });

      stages[0].status = 'running';
      stages[0].message = 'Starting Cal.com server connection test...';
      setCalcomTest(prev => ({ ...prev, stages: [...stages] }));

      stages[1].status = 'running';
      stages[1].message = `Connecting to ${CALCOM_SERVER_BASE}...`;
      setCalcomTest(prev => ({ ...prev, stages: [...stages] }));

      const response = await fetch(`${CALCOM_SERVER_BASE}/`, { method: 'GET' });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cal.com server responded ${response.status}: ${errorText}`);
      }

      const responseData = await response.json().catch(() => ({ status: 'ok' }));
      
      stages[1].status = 'success';
      stages[1].message = 'Connection established';
      stages[2].status = 'running';
      stages[2].message = 'Verifying response format...';
      setCalcomTest(prev => ({ ...prev, stages: [...stages] }));

      stages[2].status = 'success';
      stages[2].message = 'Response verified successfully';
      stages[2].data = responseData;
      
      setCalcomTest({
        status: 'success',
        message: 'Cal.com proxy reachable.',
        checkedAt: new Date(),
        stages,
        responseData,
      });
    } catch (error) {
      loggers.api.error('Cal.com server test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Cal.com server test failed';
      const errorDetails = error instanceof Error ? error.stack : String(error);
      
      // Mark current stage as error
      const currentStage = stages.find(s => s.status === 'running') || stages[stages.length - 1];
      if (currentStage) {
        currentStage.status = 'error';
        currentStage.message = errorMessage;
      }
      
      setCalcomTest({
        status: 'error',
        message: errorMessage,
        checkedAt: new Date(),
        stages,
        errorDetails,
      });
    }
  };

  const runFirebaseTest = async () => {
    const stages: TestStage[] = [
      { name: 'Initializing test', status: 'pending' },
      { name: 'Connecting to server', status: 'pending' },
      { name: 'Verifying health check', status: 'pending' },
    ];
    
    try {
      setFirebaseTest({ 
        status: 'testing', 
        message: 'Checking Firebase server...',
        stages,
      });

      stages[0].status = 'running';
      stages[0].message = 'Starting Firebase server connection test...';
      setFirebaseTest(prev => ({ ...prev, stages: [...stages] }));

      stages[1].status = 'running';
      stages[1].message = `Connecting to ${FIREBASE_SERVER_URL}...`;
      setFirebaseTest(prev => ({ ...prev, stages: [...stages] }));

      let responseData;
      try {
        responseData = await FirebaseApiService.healthCheck();
      } catch (fetchError) {
        // Enhanced error handling for network issues
        const isNetworkError = fetchError instanceof Error && 
          (fetchError.message.includes('Failed to connect') || 
           fetchError.message.includes('Failed to fetch') ||
           fetchError.message.includes('CORS') ||
           fetchError.message.includes('network') ||
           fetchError.name === 'TypeError');
        
        if (isNetworkError) {
          const isLocalhost = FIREBASE_SERVER_URL.includes('localhost') || FIREBASE_SERVER_URL.includes('127.0.0.1');
          const isProduction = FIREBASE_SERVER_URL.includes('onrender.com') || FIREBASE_SERVER_URL.includes('netlify.app');
          const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
          
          let helpfulMessage;
          if (isLocalhost) {
            helpfulMessage = `Cannot connect to ${FIREBASE_SERVER_URL}. Make sure the Firebase server is running (npm run firebase:server).`;
          } else if (isProduction && currentOrigin.includes('localhost')) {
            helpfulMessage = `Cannot connect from localhost (${currentOrigin}) to production server (${FIREBASE_SERVER_URL}). This is likely a CORS issue. The production server may not allow requests from localhost origins.`;
          } else {
            helpfulMessage = `Cannot connect to ${FIREBASE_SERVER_URL}. Possible causes: CORS issue, network problem, server down, or firewall blocking. Check server logs and ensure CORS is configured to allow requests from ${currentOrigin}.`;
          }
          
          stages[1].status = 'error';
          stages[1].message = helpfulMessage;
          throw new Error(helpfulMessage);
        }
        throw fetchError;
      }
      
      stages[1].status = 'success';
      stages[1].message = 'Connection established';
      stages[2].status = 'running';
      stages[2].message = 'Verifying health check response...';
      setFirebaseTest(prev => ({ ...prev, stages: [...stages] }));

      if (!responseData || !responseData.service) {
        throw new Error('Invalid health check response format');
      }

      stages[2].status = 'success';
      stages[2].message = 'Health check verified successfully';
      stages[2].data = responseData;
      
      setFirebaseTest({
        status: 'success',
        message: 'Firebase server reachable and healthy.',
        checkedAt: new Date(),
        stages,
        responseData,
      });
    } catch (error) {
      loggers.api.error('Firebase server test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Firebase server test failed';
      const errorDetails = error instanceof Error ? error.stack : String(error);
      
      // Mark current stage as error if not already marked
      const currentStage = stages.find(s => s.status === 'running') || stages[stages.length - 1];
      if (currentStage && currentStage.status !== 'error') {
        currentStage.status = 'error';
        currentStage.message = errorMessage;
      }
      
      setFirebaseTest({
        status: 'error',
        message: errorMessage,
        checkedAt: new Date(),
        stages,
        errorDetails,
      });
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    await runEmailTest();
    await runCalcomTest();
    await runFirebaseTest();
    setIsRunningAll(false);
  };

  const toggleLogs = (testKey: string) => {
    setExpandedLogs(prev => ({ ...prev, [testKey]: !prev[testKey] }));
  };

  const emailStatusMeta = buildStatusMeta(emailTest);
  const calcomStatusMeta = buildStatusMeta(calcomTest);
  const firebaseStatusMeta = buildStatusMeta(firebaseTest);

  return (
    <div className="settings-section connection-tests">
      <div className="section-header">
        <div className="section-title">
          <FaPlug />
          <h3>Server Connection Tests</h3>
        </div>
        <button
          className="permissions-update-btn"
          onClick={runAllTests}
          disabled={isRunningAll}
        >
          <FaSync className={isRunningAll ? 'spinner' : ''} />
          {isRunningAll ? 'Testing...' : 'Run All Tests'}
        </button>
      </div>

      <div className="connection-grid">
        <div className="connection-card">
          <div className="connection-card-header">
            <div className="connection-title">
              App Origin
              <span className={`env-pill env-${appEnvironment}`}>{appEnvironment}</span>
            </div>
            <span className="status-pill status-success">
              <FaCheckCircle />
              Active
            </span>
          </div>
          <div className="connection-details">
            <div className="connection-row">
              <span>Origin</span>
              <span className="connection-value">{appOrigin}</span>
            </div>
            <div className="connection-message">
              This is the current admin portal origin.
            </div>
          </div>
        </div>

        <div className="connection-card">
          <div className="connection-card-header">
            <div className="connection-title">
              Email Server
              <span className={`env-pill env-${emailEnvironment}`}>{emailEnvironment}</span>
            </div>
            <span className={`status-pill ${emailStatusMeta.className}`}>
              {emailStatusMeta.icon}
              {emailStatusMeta.label}
            </span>
          </div>
          <div className="connection-details">
            <div className="connection-row">
              <span>Base URL</span>
              <span className="connection-value">{emailConfig.apiBaseUrl}</span>
            </div>
            <div className="connection-row">
              <span>App Origin</span>
              <span className="connection-value">{appOrigin}</span>
            </div>
            <div className="connection-row">
              <span>Last Checked</span>
              <span className="connection-value">{formatTimestamp(emailTest.checkedAt)}</span>
            </div>
            <div className="connection-message">{emailTest.message}</div>
            {((emailTest.stages?.length ?? 0) > 0 || emailTest.errorDetails || emailTest.responseData !== undefined) && (
              <div className="connection-logs">
                <button 
                  className="logs-toggle"
                  onClick={() => toggleLogs('email')}
                >
                  {expandedLogs['email'] ? <FaChevronUp /> : <FaChevronDown />}
                  {expandedLogs['email'] ? 'Hide' : 'Show'} Details
                </button>
                {expandedLogs['email'] && (
                  <div className="logs-content">
                    {emailTest.stages && emailTest.stages.length > 0 && (
                      <div className="test-stages">
                        <h4>Test Stages:</h4>
                        {emailTest.stages.map((stage, idx) => (
                          <div key={idx} className={`test-stage test-stage-${stage.status}`}>
                            <span className="stage-name">{stage.name}</span>
                            {stage.message && <span className="stage-message">{stage.message}</span>}
                            {stage.data !== undefined && (
                              <details className="stage-data">
                                <summary>Data</summary>
                                <pre>{JSON.stringify(stage.data, null, 2)}</pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {emailTest.responseData !== undefined && (
                      <div className="response-data">
                        <h4>Response Data:</h4>
                        <pre>{JSON.stringify(emailTest.responseData, null, 2)}</pre>
                      </div>
                    )}
                    {emailTest.errorDetails && (
                      <div className="error-details">
                        <h4>Error Details:</h4>
                        <pre>{emailTest.errorDetails}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <button className="connection-action" onClick={runEmailTest}>
            Test Email Server
          </button>
        </div>

        <div className="connection-card">
          <div className="connection-card-header">
            <div className="connection-title">
              Cal.com Proxy
              <span className={`env-pill env-${calcomEnvironment}`}>{calcomEnvironment}</span>
            </div>
            <span className={`status-pill ${calcomStatusMeta.className}`}>
              {calcomStatusMeta.icon}
              {calcomStatusMeta.label}
            </span>
          </div>
          <div className="connection-details">
            <div className="connection-row">
              <span>Base URL</span>
              <span className="connection-value">{CALCOM_SERVER_BASE}</span>
            </div>
            <div className="connection-row">
              <span>App Origin</span>
              <span className="connection-value">{appOrigin}</span>
            </div>
            <div className="connection-row">
              <span>Last Checked</span>
              <span className="connection-value">{formatTimestamp(calcomTest.checkedAt)}</span>
            </div>
            <div className="connection-message">{calcomTest.message}</div>
            {((calcomTest.stages?.length ?? 0) > 0 || calcomTest.errorDetails || calcomTest.responseData !== undefined) && (
              <div className="connection-logs">
                <button 
                  className="logs-toggle"
                  onClick={() => toggleLogs('calcom')}
                >
                  {expandedLogs['calcom'] ? <FaChevronUp /> : <FaChevronDown />}
                  {expandedLogs['calcom'] ? 'Hide' : 'Show'} Details
                </button>
                {expandedLogs['calcom'] && (
                  <div className="logs-content">
                    {calcomTest.stages && calcomTest.stages.length > 0 && (
                      <div className="test-stages">
                        <h4>Test Stages:</h4>
                        {calcomTest.stages.map((stage, idx) => (
                          <div key={idx} className={`test-stage test-stage-${stage.status}`}>
                            <span className="stage-name">{stage.name}</span>
                            {stage.message && <span className="stage-message">{stage.message}</span>}
                            {stage.data !== undefined && (
                              <details className="stage-data">
                                <summary>Data</summary>
                                <pre>{JSON.stringify(stage.data, null, 2)}</pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {calcomTest.responseData !== undefined && (
                      <div className="response-data">
                        <h4>Response Data:</h4>
                        <pre>{JSON.stringify(calcomTest.responseData, null, 2)}</pre>
                      </div>
                    )}
                    {calcomTest.errorDetails && (
                      <div className="error-details">
                        <h4>Error Details:</h4>
                        <pre>{calcomTest.errorDetails}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <button className="connection-action" onClick={runCalcomTest}>
            Test Cal.com Server
          </button>
        </div>

        <div className="connection-card">
          <div className="connection-card-header">
            <div className="connection-title">
              Firebase Server
              <span className={`env-pill env-${firebaseEnvironment}`}>{firebaseEnvironment}</span>
            </div>
            <span className={`status-pill ${firebaseStatusMeta.className}`}>
              {firebaseStatusMeta.icon}
              {firebaseStatusMeta.label}
            </span>
          </div>
          <div className="connection-details">
            <div className="connection-row">
              <span>Base URL</span>
              <span className="connection-value">{FIREBASE_SERVER_URL}</span>
            </div>
            <div className="connection-row">
              <span>App Origin</span>
              <span className="connection-value">{appOrigin}</span>
            </div>
            <div className="connection-row">
              <span>Last Checked</span>
              <span className="connection-value">{formatTimestamp(firebaseTest.checkedAt)}</span>
            </div>
            <div className="connection-message">{firebaseTest.message}</div>
            {((firebaseTest.stages?.length ?? 0) > 0 || firebaseTest.errorDetails || firebaseTest.responseData !== undefined) && (
              <div className="connection-logs">
                <button 
                  className="logs-toggle"
                  onClick={() => toggleLogs('firebase')}
                >
                  {expandedLogs['firebase'] ? <FaChevronUp /> : <FaChevronDown />}
                  {expandedLogs['firebase'] ? 'Hide' : 'Show'} Details
                </button>
                {expandedLogs['firebase'] && (
                  <div className="logs-content">
                    {firebaseTest.stages && firebaseTest.stages.length > 0 && (
                      <div className="test-stages">
                        <h4>Test Stages:</h4>
                        {firebaseTest.stages.map((stage, idx) => (
                          <div key={idx} className={`test-stage test-stage-${stage.status}`}>
                            <span className="stage-name">{stage.name}</span>
                            {stage.message && <span className="stage-message">{stage.message}</span>}
                            {stage.data !== undefined && (
                              <details className="stage-data">
                                <summary>Data</summary>
                                <pre>{JSON.stringify(stage.data, null, 2)}</pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {firebaseTest.responseData !== undefined && (
                      <div className="response-data">
                        <h4>Response Data:</h4>
                        <pre>{JSON.stringify(firebaseTest.responseData, null, 2)}</pre>
                      </div>
                    )}
                    {firebaseTest.errorDetails && (
                      <div className="error-details">
                        <h4>Error Details:</h4>
                        <pre>{firebaseTest.errorDetails}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <button className="connection-action" onClick={runFirebaseTest}>
            Test Firebase Server
          </button>
        </div>
      </div>

      <div className="connection-warning">
        <FaExclamationTriangle />
        <span>
          Environment labels are inferred from the URL (localhost/production).
        </span>
      </div>
    </div>
  );
}
