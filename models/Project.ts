import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const projectSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    clientName: { type: String, required: true, trim: true },
    clientEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
    clientUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    status: { type: String, required: true, enum: ['planning', 'active', 'review', 'completed'], default: 'planning', index: true },
    githubRepo: { type: String, default: '' },
    startDate: { type: Date, default: null },
    deadline: { type: Date, default: null },
  },
  { timestamps: true }
);

projectSchema.index({ workspaceId: 1, status: 1 });

export type ProjectDocument = InferSchemaType<typeof projectSchema>;

const Project: Model<ProjectDocument> = mongoose.models.Project || mongoose.model<ProjectDocument>('Project', projectSchema);

export default Project;