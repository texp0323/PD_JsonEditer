import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css'; // Add this to include basic styles

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('root');
    const root = createRoot(container);
    root.render(<App />);
});