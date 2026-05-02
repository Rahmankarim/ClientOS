/**
 * MongoDB Schema Setup for ClientOS
 * This script creates the necessary collections and indexes for ClientOS
 */

const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  email: { type: String, required: true, unique: true },
  name: String,
  githubId: String,
  githubUsername: String,
  avatar: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Project Schema
const projectSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: { type: String, required: true },
  description: String,
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner', 'admin', 'member', 'viewer'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  }],
  status: { type: String, enum: ['planning', 'in-progress', 'completed', 'on-hold'], default: 'planning' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  dueDate: Date,
  githubRepository: {
    owner: String,
    name: String,
    url: String,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Scope Schema
const scopeSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['draft', 'active', 'completed', 'archived'], default: 'active' },
  requirements: [String],
  deliverables: [String],
  timeline: {
    startDate: Date,
    endDate: Date,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Task Schema
const taskSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  scopeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scope' },
  title: { type: String, required: true },
  description: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['todo', 'in-progress', 'review', 'completed'], default: 'todo' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate: Date,
  estimatedHours: Number,
  actualHours: Number,
  tags: [String],
  linkedIssues: [String], // GitHub issue numbers
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update History Schema
const updateSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  type: { type: String, enum: ['scope-change', 'status-change', 'member-added', 'member-removed', 'task-completed'] },
  title: String,
  description: String,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changes: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

// Session Schema (for NextAuth)
const sessionSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  sessionToken: { type: String, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expires: Date,
});

module.exports = {
  userSchema,
  projectSchema,
  scopeSchema,
  taskSchema,
  updateSchema,
  sessionSchema,
};
