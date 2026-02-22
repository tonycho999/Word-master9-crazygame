import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { HelmetProvider } from 'react-helmet-async';

const helmetContext = {};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', wordBreak: 'break-all' }}>
          <h1>💥 앱 실행 중 오류 발생</h1>
          <p>{this.state.error.toString()}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <ErrorBoundary>
      <HelmetProvider context={helmetContext}>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
);

// ▼▼▼ [수정된 부분] 업데이트 감지 로직 추가 ▼▼▼
serviceWorkerRegistration.register({
  onUpdate: registration => {
    // 새 서비스 워커가 대기 중(waiting)이면
    const waitingServiceWorker = registration.waiting;
    if (waitingServiceWorker) {
      // 1. 새 워커에게 즉시 활성화하라는 메시지 전송
      waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });

      // 2. 상태가 'activated'로 변하면 화면 새로고침
      waitingServiceWorker.addEventListener("statechange", event => {
        if (event.target.state === "activated") {
          window.location.reload();
        }
      });
    }
  },
});
// ▲▲▲ [수정 끝] ▲▲▲
