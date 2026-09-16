import { useState, useEffect, useCallback } from 'react';
import { Task, Category, TaskStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { format, startOfDay } from 'date-fns';

const STORAGE_KEY = 'task-planner-data';

interface StoreData {
  tasks: Task[];
  categories: Category[];
}

const defaultCategories: Category[] = [
  { id: 'cat-1', name: 'Работа', color: '#3b82f6' },
  { id: 'cat-2', name: 'Личное', color: '#10b981' },
  { id: 'cat-3', name: 'Срочное', color: '#ef4444' },
  { id: 'cat-4', name: 'Учёба', color: '#8b5cf6' },
];

function loadFromStorage(): StoreData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load from storage', e);
  }
  return { tasks: [], categories: defaultCategories };
}

function saveToStorage(data: StoreData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to storage', e);
  }
}

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const data = loadFromStorage();
    setTasks(data.tasks);
    setCategories(data.categories.length > 0 ? data.categories : defaultCategories);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      saveToStorage({ tasks, categories });
    }
  }, [tasks, categories, loaded]);

  // Auto-transfer in-progress tasks to today if they were assigned to a past date
  useEffect(() => {
    if (!loaded) return;
    const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
    
    setTasks(prev => prev.map(task => {
      if (task.status === 'in_progress' && task.assignedDate && task.assignedDate < today) {
        return { ...task, assignedDate: today };
      }
      return task;
    }));
  }, [loaded]);

  const addTask = useCallback((title: string, description: string, categoryId: string | null) => {
    const newTask: Task = {
      id: uuidv4(),
      title,
      description,
      categoryId,
      status: 'new',
      createdAt: new Date().toISOString(),
      assignedDate: null,
      completedAt: null,
      comments: [],
    };
    setTasks(prev => [...prev, newTask]);
  }, []);

  const assignTask = useCallback((taskId: string) => {
    const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return { ...task, status: 'in_progress' as TaskStatus, assignedDate: today };
      }
      return task;
    }));
  }, []);

  const completeTask = useCallback((taskId: string, comment?: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const comments = comment ? [...task.comments, {
          id: uuidv4(),
          text: comment,
          createdAt: new Date().toISOString(),
        }] : task.comments;
        return { ...task, status: 'completed' as TaskStatus, completedAt: new Date().toISOString(), comments };
      }
      return task;
    }));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const addCategory = useCallback((name: string, color: string) => {
    const newCat: Category = { id: uuidv4(), name, color };
    setCategories(prev => [...prev, newCat]);
  }, []);

  const deleteCategory = useCallback((catId: string) => {
    setCategories(prev => prev.filter(c => c.id !== catId));
    setTasks(prev => prev.map(t => t.categoryId === catId ? { ...t, categoryId: null } : t));
  }, []);

  const getCategoryById = useCallback((id: string | null): Category | null => {
    return categories.find(c => c.id === id) || null;
  }, [categories]);

  const getTasksByDate = useCallback((date: string) => {
    return tasks.filter(t => t.assignedDate === date);
  }, [tasks]);

  const getCompletedTasksByDate = useCallback((date: string) => {
    return tasks.filter(t => {
      if (t.status === 'completed' && t.completedAt) {
        const completedDate = format(new Date(t.completedAt), 'yyyy-MM-dd');
        return completedDate === date;
      }
      return false;
    });
  }, [tasks]);

  const newTasks = tasks.filter(t => t.status === 'new');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return {
    tasks,
    categories,
    newTasks,
    inProgressTasks,
    completedTasks,
    addTask,
    assignTask,
    completeTask,
    deleteTask,
    addCategory,
    deleteCategory,
    getCategoryById,
    getTasksByDate,
    getCompletedTasksByDate,
  };
}
