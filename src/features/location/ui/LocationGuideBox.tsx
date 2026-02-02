import React from "react";
import { Info, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

interface LocationGuideBoxProps {
  /** 가이드 박스 제목 */
  title?: string;
  /** 가이드 박스 설명 (여러 줄 가능) */
  description?: string | string[];
  /** 버튼 텍스트 */
  buttonText?: string;
  /** 버튼 클릭 핸들러 */
  onButtonClick?: () => void;
  /** 버튼 표시 여부 */
  showButton?: boolean;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 커스텀 클래스명 */
  className?: string;
}

/**
 * 위치 설정 안내 가이드 박스 컴포넌트
 * 파란색 배경의 정보성 박스로, 위치 설정이 필요한 경우 사용자에게 안내를 제공합니다.
 */
export function LocationGuideBox({
  title = "위치 정보 수집 안내",
  description = [
    "브라우저의 위치 권한 요청이 뜨면 '허용'을 눌러주세요.",
    "거리순 정렬은 저장된 위치 정보를 기반으로 계산됩니다."
  ],
  buttonText = "위치 설정하기",
  onButtonClick,
  showButton = false,
  isLoading = false,
  className
}: LocationGuideBoxProps) {
  const descLines = Array.isArray(description) ? description : [description];

  return (
    <div className={cn(
      "bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 flex flex-col gap-3",
      className
    )}>
      <div className="flex gap-3">
        <Info className="size-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-[13px] text-blue-700 dark:text-blue-300 leading-relaxed flex-1">
          {title && <p className="mb-1 font-medium">{title}</p>}
          <div className="space-y-0.5">
            {descLines.map((line, index) => (
              <p key={index} dangerouslySetInnerHTML={{ 
                __html: line.replace(/'허용'/g, "<span class='underline text-blue-600 dark:text-blue-400'>'허용'</span>") 
              }} />
            ))}
          </div>
        </div>
      </div>
      
      {showButton && (
        <Button 
          onClick={onButtonClick}
          disabled={isLoading}
          className="w-full h-10 rounded-lg text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-800/40 dark:text-blue-200 dark:hover:bg-blue-800/60 shadow-none border-none mt-1"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : null}
          {buttonText}
        </Button>
      )}
    </div>
  );
}
