import { useState } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Plus, Calendar, Tags, ListTodo, Loader2, CheckCircle2, ClipboardList } from 'lucide-react';
import { useTaskStore } from './hooks/useTaskStore';
import { TaskCard } from './components/TaskCard';
import { AddTaskModal } from './components/AddTaskModal';
import { CalendarView } from './components/CalendarView';
import { TaskDetailModal } from './components/TaskDetailModal';
import { CategoryManager } from './components/CategoryManager';
import { Task, Category } from './types';

// ====== Вынесенные компоненты (вне App) ======

function DraggableTaskCard({ task, category, onClick }: { task: Task; category: Category | null; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  return (
    <div ref={setNodeRef} className={isDragging ? 'opacity-30' : ''}>
      <TaskCard
        task={task}
        category={category}
        isDraggable
        onClick={onClick}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function DroppableWorkBoard({ todayTasks, getCategoryById, onTaskClick }: {
  todayTasks: Task[];
  getCategoryById: (id: string | null) => Category | null;
  onTaskClick: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'work-board' });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 rounded-2xl border-2 border-dashed transition-all duration-300 p-5 min-h-[400px] ${
        isOver ? 'border-indigo-400 bg-indigo-50/70 shadow-inner' : 'border-gray-200 bg-white/50'
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
          <Loader2 size={16} className="text-indigo-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-700">Сегодня в работе</h3>
          <p className="text-xs text-gray-400">Перетащите задачу сюда для начала работы</p>
        </div>
      </div>

      {todayTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Loader2 size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">Нет задач в работе</p>
          <p className="text-gray-300 text-xs mt-1">Перетащите задачу из списка слева</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {todayTasks.map(task => (
            <div key={task.id} onClick={() => onTaskClick(task)} className="cursor-pointer">
              <TaskCard task={task} category={getCategoryById(task.categoryId)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompletedTasksContent({ tasks, getCategoryById, onTaskClick }: {
  tasks: Task[];
  getCategoryById: (id: string | null) => Category | null;
  onTaskClick: (task: Task) => void;
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <CheckCircle2 size={28} className="text-gray-300" />
        </div>
        <p className="text-gray-400 text-sm">Нет выполненных задач</p>
        <p className="text-gray-300 text-xs mt-1">Завершённые задачи появятся здесь</p>
      </div>
    );
  }

  // Group by completion date
  const grouped: Record<string, Task[]> = {};
  tasks.forEach(task => {
    if (task.completedAt) {
      const date = format(new Date(task.completedAt), 'yyyy-MM-dd');
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(task);
    }
  });

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {sortedDates.map(date => (
        <div key={date}>
          <h4 className="text-sm font-semibold text-gray-500 mb-3 capitalize flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            {format(new Date(date), 'd MMMM yyyy', { locale: ru })}
            <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
              {grouped[date].length}
            </span>
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {grouped[date].map(task => (
              <div key={task.id} onClick={() => onTaskClick(task)} className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
                <TaskCard task={task} category={getCategoryById(task.categoryId)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ====== Главный компонент ======

export default function App() {
  const store = useTaskStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'board' | 'completed'>('board');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    if (event.over?.id === 'work-board') {
      store.assignTask(event.active.id as string);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleComplete = (taskId: string, comment: string) => {
    store.completeTask(taskId, comment);
  };

  const activeTask = activeId ? store.tasks.find(t => t.id === activeId) : null;
  const activeCategory = activeTask ? store.getCategoryById(activeTask.categoryId) : null;

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = store.getTasksByDate(today).filter(t => t.status === 'in_progress');

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <ClipboardList size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Планер задач</h1>
                <p className="text-xs text-gray-400 capitalize">{format(new Date(), 'EEEE, d MMMM', { locale: ru })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCategories(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Tags size={16} />
                <span className="hidden sm:inline">Категории</span>
              </button>
              <button
                onClick={() => setShowCalendar(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Calendar size={16} />
                <span className="hidden sm:inline">Календарь</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Новая задача</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
            <button
              onClick={() => setActiveTab('board')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'board' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Loader2 size={15} />
              Рабочее поле
              {todayTasks.length > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                  {todayTasks.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'completed' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CheckCircle2 size={15} />
              Выполнено
              {store.completedTasks.length > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                  {store.completedTasks.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'board' && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Panel - Task List */}
              <div className="lg:w-80 flex-shrink-0">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                      <ListTodo size={18} className="text-indigo-500" />
                      Список задач
                    </h3>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                      {store.newTasks.length} новых
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-auto pr-1">
                    {store.newTasks.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                          <ListTodo size={20} className="text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-400">Нет новых задач</p>
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="text-sm text-indigo-500 hover:text-indigo-600 font-medium mt-1"
                        >
                          Создать задачу
                        </button>
                      </div>
                    ) : (
                      store.newTasks.map(task => (
                        <DraggableTaskCard
                          key={task.id}
                          task={task}
                          category={store.getCategoryById(task.categoryId)}
                          onClick={() => handleTaskClick(task)}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel - Work Board */}
              <div className="flex-1">
                <DroppableWorkBoard
                  todayTasks={todayTasks}
                  getCategoryById={store.getCategoryById}
                  onTaskClick={handleTaskClick}
                />
              </div>
            </div>
          )}

          {activeTab === 'completed' && (
            <CompletedTasksContent
              tasks={store.completedTasks}
              getCategoryById={store.getCategoryById}
              onTaskClick={handleTaskClick}
            />
          )}
        </main>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2 scale-105 shadow-xl">
            <TaskCard task={activeTask} category={activeCategory} />
          </div>
        ) : null}
      </DragOverlay>

      {/* Modals */}
      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={store.addTask}
        categories={store.categories}
      />
      <CalendarView
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        getTasksByDate={store.getTasksByDate}
        getCompletedTasksByDate={store.getCompletedTasksByDate}
        getCategoryById={store.getCategoryById}
      />
      <TaskDetailModal
        task={selectedTask}
        category={selectedTask ? store.getCategoryById(selectedTask.categoryId) : null}
        isOpen={showTaskDetail}
        onClose={() => setShowTaskDetail(false)}
        onComplete={handleComplete}
        onDelete={store.deleteTask}
      />
      <CategoryManager
        isOpen={showCategories}
        onClose={() => setShowCategories(false)}
        categories={store.categories}
        onAdd={store.addCategory}
        onDelete={store.deleteCategory}
      />
    </DndContext>
  );
}
