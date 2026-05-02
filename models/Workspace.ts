import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const workspaceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: String, required: true, enum: ['free', 'pro'], default: 'free' },
  },
  { timestamps: true }
);

workspaceSchema.index({ ownerId: 1, name: 1 });

export type WorkspaceDocument = InferSchemaType<typeof workspaceSchema>;

const Workspace: Model<WorkspaceDocument> = mongoose.models.Workspace || mongoose.model<WorkspaceDocument>('Workspace', workspaceSchema);

export default Workspace;