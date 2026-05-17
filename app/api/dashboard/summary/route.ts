import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Milestone from '@/models/Milestone';
import Project from '@/models/Project';
import Task from '@/models/Task';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';

function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId || session.user.role !== 'agency') {
      return unauthorized();
    }

    await connectToDatabase();

    const workspaceObjectId = new mongoose.Types.ObjectId(session.user.workspaceId);
    const projects = await Project.find({ workspaceId: workspaceObjectId }).sort({ createdAt: -1 }).lean();
    const projectIds = projects.map((project) => new mongoose.Types.ObjectId(project._id));

    const [taskStats, milestoneStats, recentTasks] = await Promise.all([
      projectIds.length
        ? Task.aggregate([
            { $match: { projectId: { $in: projectIds } } },
            {
              $group: {
                _id: { projectId: '$projectId', status: '$status' },
                count: { $sum: 1 },
              },
            },
          ])
        : Promise.resolve([]),
      projectIds.length
        ? Milestone.aggregate([
            { $match: { projectId: { $in: projectIds } } },
            {
              $group: {
                _id: { projectId: '$projectId', status: '$status' },
                count: { $sum: 1 },
              },
            },
          ])
        : Promise.resolve([]),
      projectIds.length
        ? Task.find({ projectId: { $in: projectIds } }).sort({ updatedAt: -1 }).limit(8).lean()
        : Promise.resolve([]),
    ]);

    const taskMap = new Map<string, { pending: number; inProgress: number; completed: number }>();
    for (const stat of taskStats as Array<{ _id: { projectId: mongoose.Types.ObjectId; status: string }; count: number }>) {
      const projectId = stat._id.projectId.toString();
      const current = taskMap.get(projectId) || { pending: 0, inProgress: 0, completed: 0 };

      if (stat._id.status === 'pending') current.pending += stat.count;
      if (stat._id.status === 'in progress') current.inProgress += stat.count;
      if (stat._id.status === 'completed') current.completed += stat.count;

      taskMap.set(projectId, current);
    }

    const milestoneMap = new Map<string, { pending: number; inProgress: number; completed: number }>();
    for (const stat of milestoneStats as Array<{ _id: { projectId: mongoose.Types.ObjectId; status: string }; count: number }>) {
      const projectId = stat._id.projectId.toString();
      const current = milestoneMap.get(projectId) || { pending: 0, inProgress: 0, completed: 0 };

      if (stat._id.status === 'pending') current.pending += stat.count;
      if (stat._id.status === 'in progress') current.inProgress += stat.count;
      if (stat._id.status === 'completed') current.completed += stat.count;

      milestoneMap.set(projectId, current);
    }

    const enrichedProjects = projects.map((project) => {
      const id = project._id.toString();
      const tasks = taskMap.get(id) || { pending: 0, inProgress: 0, completed: 0 };
      const milestones = milestoneMap.get(id) || { pending: 0, inProgress: 0, completed: 0 };
      const totalTasks = tasks.pending + tasks.inProgress + tasks.completed;

      return {
        ...project,
        _id: id,
        workspaceId: project.workspaceId.toString(),
        deadline: project.deadline ? project.deadline.toISOString() : null,
        startDate: project.startDate ? project.startDate.toISOString() : null,
        createdAt: project.createdAt ? project.createdAt.toISOString() : null,
        updatedAt: project.updatedAt ? project.updatedAt.toISOString() : null,
        taskStats: {
          total: totalTasks,
          pending: tasks.pending,
          inProgress: tasks.inProgress,
          completed: tasks.completed,
          completionRate: totalTasks > 0 ? Math.round((tasks.completed / totalTasks) * 100) : 0,
        },
        milestoneStats: {
          total: milestones.pending + milestones.inProgress + milestones.completed,
          pending: milestones.pending,
          inProgress: milestones.inProgress,
          completed: milestones.completed,
        },
      };
    });

    const totalTasks = enrichedProjects.reduce((sum, project) => sum + project.taskStats.total, 0);
    const completedTasks = enrichedProjects.reduce((sum, project) => sum + project.taskStats.completed, 0);
    const activeProjects = enrichedProjects.filter((project) => project.status === 'active').length;
    const reviewProjects = enrichedProjects.filter((project) => project.status === 'review').length;
    const completedProjects = enrichedProjects.filter((project) => project.status === 'completed').length;
    const milestoneCount = enrichedProjects.reduce((sum, project) => sum + project.milestoneStats.total, 0);

    const response = {
      projects: enrichedProjects,
      metrics: {
        totalProjects: enrichedProjects.length,
        activeProjects,
        reviewProjects,
        completedProjects,
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        milestoneCount,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      recentTasks: recentTasks.map((task) => ({
        ...task,
        _id: task._id.toString(),
        projectId: task.projectId.toString(),
        milestoneId: task.milestoneId.toString(),
        createdAt: task.createdAt ? task.createdAt.toISOString() : null,
        updatedAt: task.updatedAt ? task.updatedAt.toISOString() : null,
      })),
    };

    return Response.json(response);
  } catch (error) {
    console.error('Dashboard summary GET error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}