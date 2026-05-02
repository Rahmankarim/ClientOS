import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const deliverableSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: 'uploadedAt', updatedAt: false } }
);

deliverableSchema.index({ projectId: 1, uploadedAt: -1 });

export type DeliverableDocument = InferSchemaType<typeof deliverableSchema>;

const Deliverable: Model<DeliverableDocument> = mongoose.models.Deliverable || mongoose.model<DeliverableDocument>('Deliverable', deliverableSchema);

export default Deliverable;