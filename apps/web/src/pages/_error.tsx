// pages/_error.tsx
import React from 'react';

interface ErrorPageProps {
    statusCode: number;
}

console.log('Custom error page loaded');

const ErrorPage: React.FC<ErrorPageProps> = ({ statusCode }) => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>Error {statusCode}</h1>
        <p>Sorry, an error has occurred. Please try again later.</p>
    </div>
);

ErrorPage.getInitialProps = ({ res, err }: any) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode || 500 : 404;
    return { statusCode };
};

export default ErrorPage;
