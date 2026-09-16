import React from 'react';
import { Task, Category } from '../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Clock, MessageSquare, GripVertical } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  category: Category | null;
  isDraggable?: boolean;
  onClick?: () => void;
  dragHandleProps?: Record<string, any>;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, category, isDraggable, onClick, dragHandleProps }) => {
  return (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-indigo-200 ${
        isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      {isDraggable && dragHandleProps && (
        <div {...dragHandleProps} className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity">
          <GripVertical size={16} className="text-gray-400" />
        </div>
      )}
      
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-800 text-sm truncate">{task.title}</h4>
          {task.description && (
            <p className="text-xs text-gray-500 mt-1 truncate">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {category && (
              <span
                className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: category.color + '18', color: category.color }}
              >
                {category.name}
              </span>
            )}
            {task.assignedDate && (
              <span className="inline-flex items-center text-xs text-gray-400 gap-1">
                <Clock size={11} />
                {format(new Date(task.assignedDate), 'd MMM', { locale: ru })}
              </span>
            )}
            {task.comments.length > 0 && (
              <span className="inline-flex items-center text-xs text-gray-400 gap-1">
                <MessageSquare size={11} />
                {task.comments.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
