import mongoose, { Schema, model } from 'mongoose';

const CommentSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  }
}, { timestamps: true });

const ReelSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sceneId: {
    type: Schema.Types.ObjectId,
    ref: 'Scene',
    default: null
  },
  mediaUrl: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  caption: {
    type: String,
    default: '',
    maxlength: 200,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: true,
    index: true
  },
  // Array of userIds who viewed — ensures unique views per user
  views: {
    type: [Schema.Types.ObjectId],
    default: []
  },
  // Array of userIds who liked — ensures individual user like tracking
  likes: {
    type: [Schema.Types.ObjectId],
    default: []
  },
  comments: {
    type: [CommentSchema],
    default: []
  }
}, {
  timestamps: true
});

// Compound index for public feed queries (fast sort by newest public reels)
ReelSchema.index({ isPublic: 1, createdAt: -1 });
ReelSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Reel || model('Reel', ReelSchema);
