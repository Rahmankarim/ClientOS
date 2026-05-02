import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const milestoneSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    title: { type: String, required: true, trim: true },
    dueDate: { type: Date, default: null },
    status: { type: String, required: true, enum: ['pending', 'in progress', 'completed'], default: 'pending', index: true },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

milestoneSchema.index({ projectId: 1, order: 1 });

export type MilestoneDocument = InferSchemaType<typeof milestoneSchema>;

const Milestone: Model<MilestoneDocument> = mongoose.models.Milestone || mongoose.model<MilestoneDocument>('Milestone', milestoneSchema);

export default Milestone;