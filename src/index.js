import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // ★ 스타일(Tailwind) 적용을 위해 필수
import App from './App';

// ★ PWA 기능(앱 설치, 오프라인) 활성화를 위해 필수
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// ★ 검색 최적화(SEO)를 위해 필수
import { HelmetProvider } from 'react-helmet-async';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* HelmetProvider로 감싸야 SEO 기능이 작동합니다 */}
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);

// ★ PWA 서비스 워커 등록 (이게 없으면 '앱 설치' 버튼이 안 뜹니다)
serviceWorkerRegistration.register();
