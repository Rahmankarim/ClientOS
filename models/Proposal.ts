import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const proposalMilestoneSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    dueDate: { type: String, default: '' },
    deliverables: { type: [String], default: [] },
  },
  { _id: false }
);

const proposalSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    clientName: { type: String, required: true, trim: true },
    clientEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
    title: { type: String, required: true, trim: true },
    deliverables: { type: [String], default: [] },
    milestones: { type: [proposalMilestoneSchema], default: [] },
    status: { type: String, required: true, enum: ['draft', 'sent', 'approved'], default: 'draft', index: true },
  },
  { timestamps: true }
);

proposalSchema.index({ workspaceId: 1, status: 1 });

export type ProposalDocument = InferSchemaType<typeof proposalSchema>;

const Proposal: Model<ProposalDocument> = mongoose.models.Proposal || mongoose.model<ProposalDocument>('Proposal', proposalSchema);

export default Proposal;