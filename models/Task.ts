import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const taskSchema = new Schema(
  {
    milestoneId: { type: Schema.Types.ObjectId, ref: 'Milestone', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    title: { type: String, required: true, trim: true },
    assignee: { type: String, default: '' },
    status: { type: String, required: true, enum: ['pending', 'in progress', 'completed'], default: 'pending', index: true },
  },
  { timestamps: true }
);

taskSchema.index({ projectId: 1, milestoneId: 1, status: 1 });

export type TaskDocument = InferSchemaType<typeof taskSchema>;

const Task: Model<TaskDocument> = mongoose.models.Task || mongoose.model<TaskDocument>('Task', taskSchema);

export default Task;