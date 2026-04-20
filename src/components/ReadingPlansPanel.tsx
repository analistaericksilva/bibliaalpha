import { cn } from '../App';
import * as React from 'react';
import { X, BookOpen, CheckCircle2, Circle } from 'lucide-react';
import { useState } from 'react';
import { PLANS } from '../data/readingPlans';

interface ReadingPlansPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChapter: (bookId: string, chapter: number) => void;
}

export default function ReadingPlansPanel({ isOpen, onClose, onSelectChapter }: ReadingPlansPanelProps) {
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [completedMilestones, setCompletedMilestones] = useState<Record<string, boolean>>({});

  const toggleMilestone = (milestoneId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedMilestones(prev => ({ ...prev, [milestoneId]: !prev[milestoneId] }));
  };

  const getPlanProgress = (planId: string) => {
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return 0;
    const completed = plan.milestones.filter(m => completedMilestones[m.id]).length;
    return Math.round((completed / plan.milestones.length) * 100);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/10 z-40 lg:hidden" onClick={onClose} />
      )}
      <div className={cn(
        "fixed inset-y-0 right-0 w[90vw] sm:w-[450px] bg-white shadow-2xl border-l border-sleek-border z-50 transition-transform duration-300 ease-in-out flex flex-col font-sans",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <header className="h-14 shrink-0 border-b border-sleek-border flex items-center justify-between px-4 bg-sleek-bg">
          <div className="flex items-center gap-2 font-semibold text-[13px] text-sleek-text-main">
            <BookOpen size={16} /> Planos de Leitura
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-sleek-hover rounded-md text-sleek-text-muted transition-colors">
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col bg-[#FDFDFD]">
          {!activePlanId ? (
            <div className="space-y-4">
              <h3 className="text-[14px] font-bold text-sleek-text-main mb-2">Escolha uma Jornada</h3>
              {PLANS.map(plan => {
                const progress = getPlanProgress(plan.id);
                return (
                  <div
                    key={plan.id}
                    onClick={() => setActivePlanId(plan.id)}
                    className="border border-sleek-border rounded-lg p-4 cursor-pointer hover:border-sleek-text-main/30 hover:shadow-sm transition-all group bg-white"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-[14px] text-sleek-text-main group-hover:text-blue-600 transition-colors uppercase tracking-wide">{plan.title}</h4>
                      {progress === 100 && <CheckCircle2 size={16} className="text-green-500" />}
                    </div>
                    <p className="text-[12px] text-sleek-text-muted mb-4">{plan.description}</p>
                    <div className="w-full bg-sleek-hover rounded-full h-1.5 mb-1.5">
                      <div className="bg-sleek-text-main h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="text-[10px] font-bold text-right text-sleek-text-muted">{progress}% Concluído</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <button onClick={() => setActivePlanId(null)} className="text-[12px] text-blue-600 hover:underline mb-4 flex items-center gap-1 font-medium">
                ‶ Voltar para Planos
              </button>
              {PLANS.filter(p => p.id === activePlanId).map(plan => (
                <div key={plan.id}>
                  <h3 className="text-[18px] font-bold text-sleek-text-main mb-1 uppercase tracking-tight">{plan.title}</h3>
                  <p className="text-[13px] text-sleek-text-muted mb-6 pb-4 border-b border-sleek-border">{plan.description}</p>
                  <div className="space-y-2">
                    {plan.milestones.map((milestone) => {
                      const isDone = completedMilestones[milestone.id] || false;
                      return (
                        <div
                          key={milestone.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer group",
                            isDone ? "bg-green-50/50 border-green-200" : "bg-white border-sleek-border hover:bg-sleek-hover"
                          )}
                          onClick={() => {
                            onSelectChapter(milestone.bookId, milestone.chapters[0]);
                            if (window.innerWidth < 1024) onClose();
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => toggleMilestone(milestone.id, e)}
                              className={cn("shrink-0 transition-colors", isDone ? "text-green-500" : "text-sleek-text-muted hover:text-sleek-text-main")}
                            >
                              {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                            </button>
                            <div className={cn("text-[13px] font-medium transition-colors", isDone ? "text-green-700/70 line-through" : "text-sleek-text-main group-hover:text-blue-600")}>
                              {milestone.label}
                            </div>
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-sleek-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                            Ler ‒
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
