"use client";

import React, { useState } from "react";

interface PricingCardProps {
    aiProfileId: string;
    aiProfileName: string;
    pricing: {
        monthlyPrice: number;
        annualPrice: number;
        lifetimePrice: number;
        monthlyPriceId: string;
        annualPriceId: string;
        lifetimePriceId: string;
    };
    onPurchase?: () => void;
}

export default function PricingCard({ aiProfileId, aiProfileName, pricing, onPurchase }: PricingCardProps) {
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | 'lifetime'>('monthly');
    const [loading, setLoading] = useState(false);

    const handlePurchase = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please login to continue');
                return;
            }

            const response = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    aiProfileId,
                    planType: selectedPlan,
                }),
            });

            const data = await response.json();

            if (data.success && data.url) {
                // Redirect to Stripe checkout
                window.location.href = data.url;
                onPurchase?.();
            } else {
                alert(data.message || 'Failed to create checkout session');
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
            alert('Failed to initiate checkout');
        } finally {
            setLoading(false);
        }
    };

    const calculateSavings = (planType: 'annual' | 'lifetime') => {
        if (planType === 'annual') {
            const monthlyCost = pricing.monthlyPrice * 12;
            const savings = monthlyCost - pricing.annualPrice;
            const percentage = Math.round((savings / monthlyCost) * 100);
            return { amount: savings, percentage };
        } else {
            // Lifetime - compare to 2 years of monthly
            const monthlyCost = pricing.monthlyPrice * 24;
            const savings = monthlyCost - pricing.lifetimePrice;
            const percentage = Math.round((savings / monthlyCost) * 100);
            return { amount: savings, percentage };
        }
    };

    const annualSavings = calculateSavings('annual');
    const lifetimeSavings = calculateSavings('lifetime');

    return (
        <div className="pricing-card">
            <h3 className="pricing-card-title">Choose Your Plan for {aiProfileName}</h3>

            <div className="pricing-options">
                {/* Monthly Plan */}
                <div
                    className={`pricing-option ${selectedPlan === 'monthly' ? 'selected' : ''}`}
                    onClick={() => setSelectedPlan('monthly')}
                >
                    <div className="plan-header">
                        <input
                            type="radio"
                            name="plan"
                            checked={selectedPlan === 'monthly'}
                            onChange={() => setSelectedPlan('monthly')}
                        />
                        <span className="plan-name">Monthly</span>
                    </div>
                    <div className="plan-price">
                        ${pricing.monthlyPrice.toFixed(2)}<span className="period">/month</span>
                    </div>
                    <div className="plan-description">Billed monthly, cancel anytime</div>
                </div>

                {/* Annual Plan */}
                <div
                    className={`pricing-option ${selectedPlan === 'annual' ? 'selected' : ''}`}
                    onClick={() => setSelectedPlan('annual')}
                >
                    <div className="plan-header">
                        <input
                            type="radio"
                            name="plan"
                            checked={selectedPlan === 'annual'}
                            onChange={() => setSelectedPlan('annual')}
                        />
                        <span className="plan-name">Annual</span>
                        <span className="badge">Save {annualSavings.percentage}%</span>
                    </div>
                    <div className="plan-price">
                        ${pricing.annualPrice.toFixed(2)}<span className="period">/year</span>
                    </div>
                    <div className="plan-description">
                        Save ${annualSavings.amount.toFixed(2)} compared to monthly
                    </div>
                </div>

                {/* Lifetime Plan */}
                <div
                    className={`pricing-option ${selectedPlan === 'lifetime' ? 'selected' : ''}`}
                    onClick={() => setSelectedPlan('lifetime')}
                >
                    <div className="plan-header">
                        <input
                            type="radio"
                            name="plan"
                            checked={selectedPlan === 'lifetime'}
                            onChange={() => setSelectedPlan('lifetime')}
                        />
                        <span className="plan-name">Lifetime</span>
                        <span className="badge popular">Best Value</span>
                    </div>
                    <div className="plan-price">
                        ${pricing.lifetimePrice.toFixed(2)}<span className="period"> once</span>
                    </div>
                    <div className="plan-description">
                        Pay once, own forever! No recurring fees
                    </div>
                </div>
            </div>

            <button
                className="purchase-button"
                onClick={handlePurchase}
                disabled={loading}
            >
                {loading ? 'Processing...' : 'Continue to Checkout'}
            </button>

            <style jsx>{`
                .pricing-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 20px;
                    padding: 2rem;
                    color: white;
                    max-width: 500px;
                    margin: 0 auto;
                }

                .pricing-card-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    text-align: center;
                }

                .pricing-options {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .pricing-option {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    padding: 1.25rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .pricing-option:hover {
                    background: rgba(255, 255, 255, 0.15);
                    transform: translateY(-2px);
                }

                .pricing-option.selected {
                    background: rgba(255, 255, 255, 0.25);
                    border-color: rgba(255, 255, 255, 0.8);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
                }

                .plan-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 0.5rem;
                }

                .plan-header input[type="radio"] {
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                }

                .plan-name {
                    font-size: 1.125rem;
                    font-weight: 600;
                }

                .badge {
                    background: rgba(255, 215, 0, 0.9);
                    color: #333;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    margin-left: auto;
                }

                .badge.popular {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                }

                .plan-price {
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 0.25rem;
                }

                .period {
                    font-size: 1rem;
                    font-weight: 400;
                    opacity: 0.8;
                }

                .plan-description {
                    font-size: 0.875rem;
                    opacity: 0.9;
                }

                .purchase-button {
                    width: 100%;
                    background: white;
                    color: #667eea;
                    border: none;
                    border-radius: 12px;
                    padding: 1rem 2rem;
                    font-size: 1.125rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .purchase-button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
                }

                .purchase-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
