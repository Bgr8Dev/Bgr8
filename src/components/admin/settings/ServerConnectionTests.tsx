import { useMemo, useState } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaPlug, FaSync, FaTimesCircle } from 'react-icons/fa';
import { emailConfig } from '../../../config/emailConfig';
import { EmailApiService } from '../../../services/emailApiService';
import { loggers } from '../../../utils/logger';

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

interface TestResult {
  status: TestStatus;
  message: string;
  checkedAt?: Date;
}

const CALCOM_SERVER_BASE = import.meta.env.VITE_CALCOM_SERVER_BASE_URL || 'https://bgr8-cal-server.onrender.com';

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
  });
  const [calcomTest, setCalcomTest] = useState<TestResult>({
    status: 'idle',
    message: 'No test run yet',
  });
  const [isRunningAll, setIsRunningAll] = useState(false);

  const appOrigin = useMemo(() => getAppOrigin(), []);
  const appEnvironment = useMemo(() => getEnvironmentLabel(appOrigin), [appOrigin]);
  const emailEnvironment = useMemo(() => getEnvironmentLabel(emailConfig.apiBaseUrl), []);
  const calcomEnvironment = useMemo(() => getEnvironmentLabel(CALCOM_SERVER_BASE), []);

  const runEmailTest = async () => {
    try {
      setEmailTest({ status: 'testing', message: 'Checking email server...' });
      const response = await EmailApiService.fetchWithAuth('/api/health', { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Email server responded ${response.status}`);
      }
      setEmailTest({
        status: 'success',
        message: 'Email server reachable and authenticated.',
        checkedAt: new Date(),
      });
    } catch (error) {
      loggers.api.error('Email server test failed:', error);
      setEmailTest({
        status: 'error',
        message: error instanceof Error ? error.message : 'Email server test failed',
        checkedAt: new Date(),
      });
    }
  };

  const runCalcomTest = async () => {
    try {
      setCalcomTest({ status: 'testing', message: 'Checking Cal.com server...' });
      const response = await fetch(`${CALCOM_SERVER_BASE}/`, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Cal.com server responded ${response.status}`);
      }
      setCalcomTest({
        status: 'success',
        message: 'Cal.com proxy reachable.',
        checkedAt: new Date(),
      });
    } catch (error) {
      loggers.api.error('Cal.com server test failed:', error);
      setCalcomTest({
        status: 'error',
        message: error instanceof Error ? error.message : 'Cal.com server test failed',
        checkedAt: new Date(),
      });
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    await runEmailTest();
    await runCalcomTest();
    setIsRunningAll(false);
  };

  const emailStatusMeta = buildStatusMeta(emailTest);
  const calcomStatusMeta = buildStatusMeta(calcomTest);

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
          </div>
          <button className="connection-action" onClick={runCalcomTest}>
            Test Cal.com Server
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
