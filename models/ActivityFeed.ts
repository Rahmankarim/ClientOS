import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const activityFeedSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    type: { type: String, required: true, enum: ['commit', 'manual', 'ai_update', 'client_feedback'], index: true },
    content: { type: String, required: true },
    isVisibleToClient: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

activityFeedSchema.index({ projectId: 1, createdAt: -1 });

export type ActivityFeedDocument = InferSchemaType<typeof activityFeedSchema>;

const ActivityFeed: Model<ActivityFeedDocument> = mongoose.models.ActivityFeed || mongoose.model<ActivityFeedDocument>('ActivityFeed', activityFeedSchema);

export default ActivityFeed;