"use client";

import React from "react";
import { getProfileRoute } from "@/lib/url-helpers";

// Force dynamic rendering to prevent prerender errors
export const dynamic = 'force-dynamic';

export default function CheckoutSuccessPage() {
    const [redirecting, setRedirecting] = React.useState(true);
    const [profileRoute, setProfileRoute] = React.useState<string | null>(null);

    React.useEffect(() => {
        const handleRedirect = async () => {
            // Get session_id and profileId from URL params
            const params = new URLSearchParams(window.location.search);
            const sessionId = params.get('session_id');
            const profileId = params.get('profileId');

            if (sessionId) {
                console.log('Checkout successful! Session ID:', sessionId);
            }

            // If we have a profileId, fetch the profile to get the correct route
            if (profileId) {
                try {
                    const response = await fetch(`/api/ai-profiles/public`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ profileId }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const profile = data.profile || data.data;

                        if (profile) {
                            // Generate SEO-friendly URL
                            const seoUrl = getProfileRoute(
                                profile.routePrefix,
                                profile.name,
                                profile.cardTitle,
                                profile.legacyId
                            );
                            setProfileRoute(seoUrl);
                        } else {
                            // Fallback to dashboard if no profile data
                            setProfileRoute('/dashboard');
                        }
                    } else {
                        // Fallback to dashboard if API fails
                        setProfileRoute('/dashboard');
                    }
                } catch (error) {
                    console.error('Error fetching profile:', error);
                    // Fallback to dashboard
                    setProfileRoute('/dashboard');
                }
            } else {
                // No profileId, redirect to dashboard
                setProfileRoute('/dashboard');
            }
        };

        handleRedirect();
    }, []);

    // Redirect after route is determined
    React.useEffect(() => {
        if (profileRoute) {
            const timer = setTimeout(() => {
                window.location.href = profileRoute;
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [profileRoute]);

    return (
        <div className="success-container">
            <div className="success-card">
                <div className="success-icon">✓</div>
                <h1>Payment Successful!</h1>
                <p>Thank you for your purchase. Your AI profile is now active.</p>
                <p className="redirect-text">Redirecting to dashboard...</p>
            </div>

            <style jsx>{`
                .success-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 2rem;
                }

                .success-card {
                    background: white;
                    border-radius: 20px;
                    padding: 3rem 2rem;
                    text-align: center;
                    max-width: 500px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }

                .success-icon {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
                    margin-bottom: 0.5rem;
                }

                .redirect-text {
                    font-size: 0.875rem;
                    color: #999;
                    margin-top: 1.5rem;
                }
            `}</style>
        </div>
    );
}
