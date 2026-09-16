import React, { useState } from 'react';
import { Task, Category } from '../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { X, Send, MessageSquare, CheckCircle, Trash2 } from 'lucide-react';

interface TaskDetailModalProps {
  task: Task | null;
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (taskId: string, comment: string) => void;
  onDelete: (taskId: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  category,
  isOpen,
  onClose,
  onComplete,
  onDelete,
}) => {
  const [comment, setComment] = useState('');
  const [showCompleteForm, setShowCompleteForm] = useState(false);

  if (!isOpen || !task) return null;

  const handleComplete = () => {
    onComplete(task.id, comment.trim());
    setComment('');
    setShowCompleteForm(false);
    onClose();
  };

  const handleDelete = () => {
    onDelete(task.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[85vh] overflow-auto">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                task.status === 'new' ? 'bg-blue-100 text-blue-700' :
                task.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {task.status === 'new' ? 'Новая' : task.status === 'in_progress' ? 'В работе' : 'Выполнена'}
              </span>
              {category && (
                <span
                  className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: category.color + '18', color: category.color }}
                >
                  {category.name}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-800">{task.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {task.description && (
          <p className="text-sm text-gray-600 mb-4 bg-gray-50 rounded-xl p-3">{task.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
          <span>Создана: {format(new Date(task.createdAt), 'd MMM yyyy, HH:mm', { locale: ru })}</span>
          {task.assignedDate && (
            <span>В работе с: {format(new Date(task.assignedDate), 'd MMM yyyy', { locale: ru })}</span>
          )}
          {task.completedAt && (
            <span>Завершена: {format(new Date(task.completedAt), 'd MMM yyyy, HH:mm', { locale: ru })}</span>
          )}
        </div>

        {/* Comments section */}
        {task.comments.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <MessageSquare size={14} />
              Комментарии
            </h4>
            <div className="space-y-2">
              {task.comments.map(c => (
                <div key={c.id} className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-sm text-gray-700">{c.text}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(c.createdAt), 'd MMM, HH:mm', { locale: ru })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {task.status === 'in_progress' && !showCompleteForm && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowCompleteForm(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle size={16} />
              Завершить задачу
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2.5 rounded-xl border border-red-200 text-red-500 font-medium text-sm hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}

        {task.status === 'in_progress' && showCompleteForm && (
          <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/50">
            <h4 className="text-sm font-semibold text-emerald-700 mb-2">Комментарий к завершению</h4>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Опишите результат выполнения задачи..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm resize-none mb-3"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleComplete}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors"
              >
                <Send size={14} />
                Завершить
              </button>
              <button
                onClick={() => { setShowCompleteForm(false); setComment(''); }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {task.status === 'new' && (
          <div className="flex gap-2">
            <p className="text-sm text-gray-500 flex-1">Перетащите задачу на рабочее поле, чтобы начать работу</p>
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl border border-red-200 text-red-500 font-medium text-sm hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}

        {task.status === 'completed' && (
          <div className="flex gap-2">
            <p className="text-sm text-emerald-600 flex-1 flex items-center gap-1.5">
              <CheckCircle size={14} />
              Задача выполнена
            </p>
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl border border-red-200 text-red-500 font-medium text-sm hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
