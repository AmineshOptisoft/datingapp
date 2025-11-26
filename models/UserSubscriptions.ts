import mongoose, { Schema, Model } from "mongoose";

export interface IUserSubscription {
    _id: string;
    userId: mongoose.Types.ObjectId;
    aiProfileId: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    planType: 'monthly' | 'annual' | 'lifetime';
    status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd: boolean;
    priceId: string;
    amount: number;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSubscriptionSchema = new Schema<IUserSubscription>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    aiProfileId: {
        type: String,
        required: true,
        index: true,
    },
    stripeSubscriptionId: {
        type: String,
        required: true,
        unique: true,
    },
    stripeCustomerId: {
        type: String,
        required: true,
        index: true,
    },
    planType: {
        type: String,
        enum: ['monthly', 'annual', 'lifetime'],
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'canceled', 'past_due', 'incomplete', 'trialing'],
        default: 'active',
        index: true,
    },
    currentPeriodStart: {
        type: Date,
        default: null,
    },
    currentPeriodEnd: {
        type: Date,
        default: null,
    },
    cancelAtPeriodEnd: {
        type: Boolean,
        default: false,
    },
    priceId: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: 'usd',
    },
}, {
    timestamps: true,
});

// Compound index for efficient queries
UserSubscriptionSchema.index({ userId: 1, aiProfileId: 1 });
UserSubscriptionSchema.index({ userId: 1, status: 1 });

const UserSubscription: Model<IUserSubscription> =
    mongoose.models.UserSubscription || mongoose.model<IUserSubscription>("UserSubscription", UserSubscriptionSchema);

export default UserSubscription;