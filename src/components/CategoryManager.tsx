import React, { useState } from 'react';
import { Category } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAdd: (name: string, color: string) => void;
  onDelete: (id: string) => void;
}

const presetColors = [
  '#3b82f6', '#10b981', '#ef4444', '#8b5cf6',
  '#f59e0b', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1',
];

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  isOpen,
  onClose,
  categories,
  onAdd,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(presetColors[0]);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), color);
    setName('');
    setColor(presetColors[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">Категории задач</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Add new category */}
        <form onSubmit={handleAdd} className="mb-5 p-4 bg-gray-50 rounded-xl">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Название категории..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {presetColors.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2' : 'hover:scale-110'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </form>

        {/* Existing categories */}
        <div className="space-y-2 max-h-60 overflow-auto">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="flex-1 text-sm font-medium text-gray-700">{cat.name}</span>
              <button
                onClick={() => onDelete(cat.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Нет категорий</p>
          )}
        </div>
      </div>
    </div>
  );
};
