import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { Task, Category } from '../types';

interface CalendarViewProps {
  isOpen: boolean;
  onClose: () => void;
  getTasksByDate: (date: string) => Task[];
  getCompletedTasksByDate: (date: string) => Task[];
  getCategoryById: (id: string | null) => Category | null;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  isOpen,
  onClose,
  getTasksByDate,
  getCompletedTasksByDate,
  getCategoryById,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  if (!isOpen) return null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get day of week for first day (0 = Sunday, 1 = Monday, ...)
  const firstDayOfWeek = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const today = startOfDay(new Date());

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const tasksForSelected = selectedDateStr ? getTasksByDate(selectedDateStr) : [];
  const completedForSelected = selectedDateStr ? getCompletedTasksByDate(selectedDateStr) : [];

  const getDayTasks = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const inProgress = getTasksByDate(dateStr).filter((t: Task) => t.status === 'in_progress');
    const completed = getCompletedTasksByDate(dateStr);
    return { inProgress, completed };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 p-6 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">Календарь задач</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 text-xl font-bold">
            ×
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="font-semibold text-gray-800 capitalize">
                {format(currentMonth, 'LLLL yyyy', { locale: ru })}
              </h3>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {emptyDays.map((_: null, i: number) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {days.map(day => {
                const { inProgress, completed } = getDayTasks(day);
                const hasTasks = inProgress.length > 0 || completed.length > 0;
                const isToday = isSameDay(day, today);
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all text-sm
                      ${isSelected ? 'bg-indigo-600 text-white shadow-md' : ''}
                      ${isToday && !isSelected ? 'bg-indigo-50 text-indigo-700 font-bold ring-2 ring-indigo-200' : ''}
                      ${!isSelected && !isToday ? 'hover:bg-gray-50' : ''}
                      ${!hasTasks && !isSelected && !isToday ? 'text-gray-400' : ''}
                    `}
                  >
                    <span className={isSelected ? 'text-white' : ''}>{format(day, 'd')}</span>
                    {hasTasks && (
                      <div className="flex gap-0.5 mt-0.5">
                        {inProgress.length > 0 && (
                          <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-yellow-300' : 'bg-amber-400'}`} />
                        )}
                        {completed.length > 0 && (
                          <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-green-300' : 'bg-emerald-400'}`} />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                В работе
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                Выполнено
              </div>
            </div>
          </div>

          {/* Task details for selected date */}
          <div className="lg:w-72 bg-gray-50 rounded-xl p-4">
            {selectedDate ? (
              <>
                <h4 className="font-semibold text-gray-700 mb-3 capitalize">
                  {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
                </h4>

                {tasksForSelected.length === 0 && completedForSelected.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Нет задач</p>
                ) : (
                  <>
                    {tasksForSelected.filter((t: Task) => t.status === 'in_progress').length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Loader2 size={14} className="text-amber-500" />
                          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">В работе</span>
                        </div>
                        <div className="space-y-1.5">
                          {tasksForSelected.filter((t: Task) => t.status === 'in_progress').map((task: Task) => {
                            const cat = getCategoryById(task.categoryId);
                            return (
                              <div key={task.id} className="bg-white rounded-lg p-2.5 border border-amber-100">
                                <p className="text-sm font-medium text-gray-700">{task.title}</p>
                                {cat && (
                                  <span className="text-xs mt-1 inline-block" style={{ color: cat.color }}>{cat.name}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {completedForSelected.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Выполнено</span>
                        </div>
                        <div className="space-y-1.5">
                          {completedForSelected.map((task: Task) => {
                            const cat = getCategoryById(task.categoryId);
                            return (
                              <div key={task.id} className="bg-white rounded-lg p-2.5 border border-emerald-100">
                                <p className="text-sm font-medium text-gray-700 line-through opacity-70">{task.title}</p>
                                {cat && (
                                  <span className="text-xs mt-1 inline-block" style={{ color: cat.color }}>{cat.name}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">Выберите дату в календаре</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
