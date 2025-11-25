import mongoose, { Schema, Model } from "mongoose";

const IUserSubscription = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    aiProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AIProfile",
        required: true,
    },
    subscriptionId: {
        type: String,
        required: true,
    },
    subscriptionData: {
        type: Object,
        required: true,
    },



})