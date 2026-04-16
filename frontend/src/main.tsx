import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './styles/index.css';
import './styles/theme.css';
import './styles/tailwind.css';

import { LanguageProvider } from './app/context/LanguageContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <LanguageProvider>
            <App />
        </LanguageProvider>
    </React.StrictMode>
);
