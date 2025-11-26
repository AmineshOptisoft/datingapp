"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function CheckoutCancelPage() {
    const router = useRouter();

    const handleRetry = () => {
        router.back();
    };

    const handleGoHome = () => {
        router.push('/dashboard');
    };

    return (
        <div className="cancel-container">
            <div className="cancel-card">
                <div className="cancel-icon">✕</div>
                <h1>Checkout Cancelled</h1>
                <p>Your payment was not completed. No charges were made.</p>

                <div className="button-group">
                    <button className="retry-button" onClick={handleRetry}>
                        Try Again
                    </button>
                    <button className="home-button" onClick={handleGoHome}>
                        Go to Dashboard
                    </button>
                </div>
            </div>

            <style jsx>{`
                .cancel-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    padding: 2rem;
                }

                .cancel-card {
                    background: white;
                    border-radius: 20px;
                    padding: 3rem 2rem;
                    text-align: center;
                    max-width: 500px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }

                .cancel-icon {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 3rem;
                    margin: 0 auto 1.5rem;
                    animation: scaleIn 0.5s ease;
                }

                @keyframes scaleIn {
                    from {
                        transform: scale(0);
                    }
                    to {
                        transform: scale(1);
                    }
                }

                h1 {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #333;
                    margin-bottom: 1rem;
                }

                p {
                    font-size: 1.125rem;
                    color: #666;
                    margin-bottom: 2rem;
                }

                .button-group {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                }

                .retry-button,
                .home-button {
                    padding: 0.875rem 2rem;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: none;
                }

                .retry-button {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                }

                .retry-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(240, 147, 251, 0.4);
                }

                .home-button {
                    background: white;
                    color: #f5576c;
                    border: 2px solid #f5576c;
                }

                .home-button:hover {
                    background: #f5576c;
                    color: white;
                    transform: translateY(-2px);
                }
            `}</style>
        </div>
    );
}
