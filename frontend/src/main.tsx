import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import TestingDashboard from './features/testing/TestingDashboard';
import { FinancierDesktop } from './features/financier/FinancierDesktop';
import './styles/index.css';

import { LanguageProvider } from './store/LanguageContext';

const Router = () => {
    const path = window.location.pathname;

    if (path === '/test') {
        return <TestingDashboard />;
    }

    if (path === '/financier' || path.startsWith('/financier/')) {
        return <FinancierDesktop />;
    }

    return (
        <LanguageProvider>
            <App />
        </LanguageProvider>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Router />
    </React.StrictMode>
);
