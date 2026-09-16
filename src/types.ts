export type TaskStatus = 'new' | 'in_progress' | 'completed';

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  status: TaskStatus;
  createdAt: string;
  assignedDate: string | null;
  completedAt: string | null;
  comments: Comment[];
}
