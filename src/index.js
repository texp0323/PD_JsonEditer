import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// 앱을 루트 엘리먼트에 렌더링
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('root');
    const root = createRoot(container);
    root.render(<App />);
});