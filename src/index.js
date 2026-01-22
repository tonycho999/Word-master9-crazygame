import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration'; // 추가

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// unregister()에서 register()로 반드시 변경해야 설치가 활성화됩니다.
serviceWorkerRegistration.register();
