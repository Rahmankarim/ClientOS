import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const gitHubRepositorySchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    owner: { type: String, required: true, trim: true, index: true },
    repo: { type: String, required: true, trim: true, index: true },
    url: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

gitHubRepositorySchema.index({ projectId: 1, owner: 1, repo: 1 }, { unique: true });

export type GitHubRepositoryDocument = InferSchemaType<typeof gitHubRepositorySchema>;

const GitHubRepository: Model<GitHubRepositoryDocument> =
  mongoose.models.GitHubRepository ||
  mongoose.model<GitHubRepositoryDocument>('GitHubRepository', gitHubRepositorySchema);

export default GitHubRepository;