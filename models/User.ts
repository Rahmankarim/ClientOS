import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, default: '', trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true, unique: true },
    passwordHash: { type: String, default: '' },
    role: { type: String, required: true, enum: ['agency', 'client'], default: 'client' },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', default: null, index: true },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema>;

const User: Model<UserDocument> = mongoose.models.User || mongoose.model<UserDocument>('User', userSchema);

export default User;