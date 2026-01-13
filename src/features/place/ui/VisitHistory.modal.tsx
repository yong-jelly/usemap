import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  ChevronLeft, 
  Calendar, 
  Users, 
  Pencil, 
  Trash2, 
  History,
  Lock,
  Loader2
} from "lucide-react";
import { useVisitHistory, useUpsertVisited, useDeleteVisited } from "@/entities/place/queries";
import { Button, Input, ConfirmDialog } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

interface VisitRecord {
  id: string;
  date: string;
  companion: string;
  note: string;
}

interface VisitHistoryModalProps {
  placeId: string;
  placeName: string;
  onClose: () => void;
}

// 목업 데이터
const MOCK_VISITS: VisitRecord[] = [
  { id: '1', date: '2026-01-07', companion: '동료들', note: '점심 회식' },
  { id: '2', date: '2025-12-24', companion: '친구', note: '이브 파티' },
  { id: '3', date: '2025-08-15', companion: '가족', note: '여름 휴가' },
];

type ViewMode = 'list' | 'add' | 'edit';

export function VisitHistoryModal({ placeId, placeName, onClose }: VisitHistoryModalProps) {
  const { data: visits = [], isLoading: isListLoading } = useVisitHistory(placeId);
  const upsertMutation = useUpsertVisited();
  const deleteMutation = useDeleteVisited(placeId);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // 폼 상태
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [companion, setCompanion] = useState('');
  const [note, setNote] = useState('');

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setCompanion('');
    setNote('');
    setEditingId(null);
  };

  const goToList = () => {
    resetForm();
    setViewMode('list');
  };

  const goToAdd = () => {
    resetForm();
    setViewMode('add');
  };

  const goToEdit = (visit: VisitRecord) => {
    setEditingId(visit.id);
    // date가 ISO string으로 올 수 있으므로 YYYY-MM-DD 형식으로 변환
    setDate(new Date(visit.date).toISOString().split('T')[0]);
    setCompanion(visit.companion);
    setNote(visit.note);
    setViewMode('edit');
  };

  const handleSave = async () => {
    try {
      await upsertMutation.mutateAsync({
        placeId,
        visitedAt: new Date(date).toISOString(),
        companion,
        note,
      });
      goToList();
    } catch (error: any) {
      alert(error.message || "저장에 실패했습니다.");
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await upsertMutation.mutateAsync({
        placeId,
        visitId: editingId,
        visitedAt: new Date(date).toISOString(),
        companion,
        note,
      });
      goToList();
    } catch (error: any) {
      alert(error.message || "수정에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteMutation.mutateAsync(deleteTargetId);
      setDeleteTargetId(null);
    } catch (error: any) {
      alert(error.message || "삭제에 실패했습니다.");
    }
  };

  const handleBackClick = () => {
    if (viewMode === 'list') {
      onClose();
    } else {
      goToList();
    }
  };

  const isSaving = upsertMutation.isPending;

  // 헤더 타이틀
  const getHeaderTitle = () => {
    switch (viewMode) {
      case 'add': return '방문 기록 추가';
      case 'edit': return '방문 기록 수정';
      default: return '방문 기록';
    }
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[120] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70" onClick={onClose} />
        
        <div className={cn(
          "relative w-full h-full bg-white dark:bg-surface-950 flex flex-col",
          "md:max-w-md md:h-[90vh] md:rounded-[24px] md:overflow-hidden"
        )}>
          {/* 헤더 */}
          <header className="flex h-14 items-center px-4 border-b border-surface-100 dark:border-surface-800 shrink-0 bg-white dark:bg-surface-900">
            <button 
              onClick={handleBackClick} 
              className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800"
            >
              <ChevronLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
            </button>
            <div className="ml-3 flex-1 min-w-0">
              <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50 truncate">
                {getHeaderTitle()}
              </h1>
              <p className="text-[11px] text-surface-400 truncate">{placeName}</p>
            </div>
            
            {/* 우측 상단 버튼 */}
            {viewMode === 'list' && (
              <button 
                onClick={goToAdd}
                className="px-3 py-1.5 text-sm font-bold text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg"
              >
                추가
              </button>
            )}
            {(viewMode === 'add' || viewMode === 'edit') && (
              <Button
                onClick={viewMode === 'add' ? handleSave : handleUpdate}
                disabled={isSaving}
                className="h-8 px-4 rounded-full font-bold text-sm"
                size="sm"
              >
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : viewMode === 'add' ? "저장" : "수정완료"}
              </Button>
            )}
          </header>

          {/* 비공개 안내 노티 */}
          <div className="px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800">
            <div className="flex items-center gap-2 text-[12px] text-surface-500 dark:text-surface-400">
              <Lock className="size-3.5 shrink-0" />
              <span>방문 기록은 나만 볼 수 있으며, 다른 곳에 공유되지 않습니다.</span>
            </div>
          </div>

          {/* 메인 영역 */}
          <div 
            className="flex-1 overflow-y-auto pb-safe scrollbar-hide"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {isListLoading ? (
              <div className="flex flex-col items-center justify-center h-full py-20">
                <Loader2 className="size-8 animate-spin text-primary-500" />
              </div>
            ) : (
              <>
                {/* 추가/수정 폼 */}
                {(viewMode === 'add' || viewMode === 'edit') && (
                  <div className="p-4 space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-surface-600 dark:text-surface-400 flex items-center gap-1.5">
                        <Calendar className="size-3.5" /> 언제 갔나요?
                      </label>
                      <Input 
                        type="date" 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)}
                        className="h-12 rounded-xl border-surface-200 dark:border-surface-800 text-base"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-surface-600 dark:text-surface-400 flex items-center gap-1.5">
                        <Users className="size-3.5" /> 누구랑 갔나요?
                      </label>
                      <Input 
                        placeholder="예: 친구, 가족, 연인, 동료" 
                        value={companion}
                        onChange={(e) => setCompanion(e.target.value)}
                        className="h-12 rounded-xl border-surface-200 dark:border-surface-800 text-base"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-surface-600 dark:text-surface-400 flex items-center gap-1.5">
                        <History className="size-3.5" /> 간단한 메모
                      </label>
                      <textarea 
                        placeholder="어떤 추억이 있었나요?"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className={cn(
                          "w-full min-h-[120px] p-4 rounded-xl",
                          "bg-white dark:bg-surface-900",
                          "border border-surface-200 dark:border-surface-800",
                          "text-surface-900 dark:text-surface-50 text-base",
                          "placeholder:text-surface-400",
                          "resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* 목록 */}
                {viewMode === 'list' && (
                  <div className="p-4">
                    {visits.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-bold text-surface-400">
                            전체 {visits.length}건
                          </span>
                        </div>
                        
                        {visits.map((visit: any) => (
                          <div 
                            key={visit.id}
                            className="relative p-4 bg-surface-50 dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                {/* 날짜 + 상대 시간 */}
                                <div className="flex items-center gap-2 mb-2 text-left">
                                  <span className="text-[14px] font-bold text-surface-900 dark:text-surface-50">
                                    {new Date(visit.date).toLocaleDateString('ko-KR', { 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                </div>
                                
                                {/* 동행인 태그 */}
                                {visit.companion && (
                                  <div className="inline-flex items-center gap-1 px-2 py-1 mb-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-[11px] font-bold text-surface-600 dark:text-surface-400">
                                    <Users className="size-3" />
                                    {visit.companion}
                                  </div>
                                )}

                                {/* 메모 */}
                                {visit.note && (
                                  <p className="text-[13px] text-surface-600 dark:text-surface-400 leading-relaxed text-left">
                                    {visit.note}
                                  </p>
                                )}
                              </div>
                              
                              {/* 수정/삭제 버튼 - 항상 표시 */}
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button 
                                  onClick={() => goToEdit(visit)}
                                  className="p-2 text-surface-400 hover:text-primary-500 rounded-full"
                                >
                                  <Pencil className="size-4" />
                                </button>
                                <button 
                                  onClick={() => setDeleteTargetId(visit.id)}
                                  className="p-2 text-surface-400 hover:text-rose-500 rounded-full"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="size-16 bg-surface-100 dark:bg-surface-900 rounded-full flex items-center justify-center mb-4">
                          <History className="size-8 text-surface-300" />
                        </div>
                        <p className="text-[15px] font-bold text-surface-900 dark:text-surface-50 mb-1">
                          아직 방문 기록이 없어요
                        </p>
                        <p className="text-[13px] text-surface-400 mb-6">
                          이 장소에서의 추억을 기록해보세요!
                        </p>
                        <Button 
                          onClick={goToAdd}
                          className="px-6 h-11 rounded-xl bg-primary-600 text-white font-bold"
                        >
                          첫 방문 기록하기
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title="방문 기록 삭제"
        description="이 방문 기록을 삭제하시겠습니까? 삭제된 기록은 복구할 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        onConfirm={handleDelete}
        variant="danger"
      />
    </>,
    document.body
  );
}
