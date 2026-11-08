import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { Task } from '../../types';

interface CalendarViewProps {
  onSelectTask: (task: Task) => void;
  onOpenCreateTask: () => void;
}

export function CalendarView({ onSelectTask, onOpenCreateTask }: CalendarViewProps) {
  const { tasks, workflow } = useProject();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  // Month days computation
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Adjusted for Monday start (0=Monday, 6=Sunday)
  const adjustedFirstDay = (firstDayIndex + 6) % 7;

  const days: Array<{ dayNumber: number; monthOffset: number; dateStr: string }> = [];

  // Previous month padding
  for (let i = adjustedFirstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ dayNumber: d, monthOffset: -1, dateStr });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ dayNumber: i, monthOffset: 0, dateStr });
  }

  // Next month padding to fill 35 or 42 grid cells
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ dayNumber: i, monthOffset: 1, dateStr });
  }

  const monthName = currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="h-full flex flex-col space-y-3">
      
      {/* Month Navigation Toolbar */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-500" />
            {monthName}
          </h2>
          <button
            type="button"
            onClick={goToday}
            className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Aujourd'hui
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 text-slate-500 text-[11px] font-semibold text-center py-2">
          {weekDays.map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800">
          {days.map((item, index) => {
            const isCurrentMonth = item.monthOffset === 0;
            const isToday = item.dateStr === todayStr;
            const dayTasks = tasks.filter(t => t.dueDate === item.dateStr);

            return (
              <div
                key={index}
                className={`p-1.5 min-h-[90px] flex flex-col transition-colors ${
                  !isCurrentMonth ? 'bg-slate-50/40 dark:bg-slate-950/40 text-slate-400' : 'bg-transparent'
                } ${isToday ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''}`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                      isToday
                        ? 'bg-indigo-600 text-white'
                        : isCurrentMonth
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.dayNumber}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Day Tasks List */}
                <div className="flex-1 space-y-1 overflow-y-auto max-h-24">
                  {dayTasks.map(task => {
                    const status = workflow?.statuses.find(s => s.id === task.statusId);
                    return (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        className="px-2 py-1 rounded-md text-[11px] font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer truncate shadow-2xs flex items-center gap-1.5"
                        title={task.title}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: status?.color || '#6366f1' }}
                        />
                        <span className="truncate text-slate-800 dark:text-slate-200">
                          {task.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
