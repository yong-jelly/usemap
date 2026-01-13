import { CookingPot } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { convertToNaverResizeImageUrl, formatWithCommas } from "@/shared/lib";

interface MenuCardProps {
  /** 메뉴 데이터 */
  menu: any;
  /** 표시 스타일 변형 */
  variant?: "compact" | "grid";
}

/**
 * 메뉴 아이템 카드 컴포넌트
 */
export function MenuCard({ menu, variant = "grid" }: MenuCardProps) {
  const menuImage = menu.image || menu.images?.[0];
  const menuName = menu.text || menu.name || "메뉴명 없음";
  const menuPrice = menu.price || "";

  if (variant === "compact") {
    return (
      <div className="flex-shrink-0 w-32 flex flex-col rounded-xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden shadow-sm">
        <div className="relative h-24 w-full bg-surface-50 dark:bg-surface-800">
          {menuImage ? (
            <img
              src={convertToNaverResizeImageUrl(menuImage)}
              alt={menuName}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-surface-200">
              <CookingPot className="size-6 mb-1" />
              <span className="text-[9px]">NO IMAGE</span>
            </div>
          )}
          {menu.recommend && (
            <div className="absolute top-1.5 left-1.5 bg-amber-400 px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-sm">
              대표
            </div>
          )}
        </div>
        <div className="p-2 flex-1 flex flex-col justify-between">
          <h4 className="text-[12px] font-bold text-surface-900 dark:text-surface-100 line-clamp-1">
            {menuName}
          </h4>
          {menuPrice && (
            <p className="text-[11px] text-surface-500 mt-0.5">
              {typeof menuPrice === "number"
                ? formatWithCommas(menuPrice, ",", false) + "원"
                : menuPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "원"}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden">
      <div className="relative aspect-square w-full bg-surface-50 dark:bg-surface-800">
        {menuImage ? (
          <img
            src={convertToNaverResizeImageUrl(menuImage)}
            alt={menuName}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-surface-200">
            <CookingPot className="size-5 mb-1" />
            <span className="text-[8px]">NO IMAGE</span>
          </div>
        )}
        {menu.recommend && (
          <div className="absolute top-1 left-1 bg-amber-400 px-1 py-0.5 rounded text-[9px] font-bold text-white shadow-sm">
            대표
          </div>
        )}
      </div>
      <div className="p-2 flex-1 flex flex-col justify-center">
        <h4 className="text-[11px] font-bold text-surface-900 dark:text-surface-100 line-clamp-2 text-center">
          {menuName}
        </h4>
        {menuPrice && (
          <p className="text-[10px] text-surface-500 mt-0.5 text-center">
            {typeof menuPrice === "number"
              ? formatWithCommas(menuPrice, ",", false) + "원"
              : menuPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "원"}
          </p>
        )}
      </div>
    </div>
  );
}
