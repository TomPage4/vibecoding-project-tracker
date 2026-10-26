import { Project, Role } from '../types';

export const permissions = {
  getRole(project: Project, userId: string): Role | null {
    const member = project.members.find(m => m.userId === userId);
    return member ? member.role : null;
  },

  isViewer(project: Project, userId: string): boolean {
    return this.getRole(project, userId) === 'viewer';
  },

  canView(project: Project, userId: string): boolean {
    return !!this.getRole(project, userId);
  },

  canEditTask(project: Project, userId: string): boolean {
    const role = this.getRole(project, userId);
    return role === 'owner' || role === 'admin' || role === 'member';
  },

  canComment(project: Project, userId: string): boolean {
    const role = this.getRole(project, userId);
    return role === 'owner' || role === 'admin' || role === 'member';
  },

  canManageMilestones(project: Project, userId: string): boolean {
    const role = this.getRole(project, userId);
    return role === 'owner' || role === 'admin';
  },

  canManageContext(project: Project, userId: string): boolean {
    const role = this.getRole(project, userId);
    return role === 'owner' || role === 'admin';
  },

  canManageProject(project: Project, userId: string): boolean {
    const role = this.getRole(project, userId);
    return role === 'owner' || role === 'admin';
  },

  isOwner(project: Project, userId: string): boolean {
    return project.ownerId === userId;
  },

  canExport(project: Project, userId: string): boolean {
    return !!this.getRole(project, userId);
  }
};
