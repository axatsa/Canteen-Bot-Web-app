import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import TestingDashboard from './app/TestingDashboard';
import { FinancierDesktop } from './app/components/financierDesktop/FinancierDesktop';
import './styles/index.css';
import './styles/theme.css';
import './styles/tailwind.css';

import { LanguageProvider } from './app/context/LanguageContext';

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
