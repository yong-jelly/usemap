import React from "react";
import { cn } from "@/shared/lib/utils";

export const REGION_DATA = [
  { group1: '서울', group2_json: ['전체','강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'] },
  { group1: '경기', group2_json: ['전체','가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시', '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시', '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'] },
  { group1: '인천', group2_json: ['전체','강화군', '계양구', '남동구', '동구', '미추홀구', '부평구', '서구', '연수구', '옹진군', '중구'] },
  { group1: '강원', group2_json: ['전체','강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군', '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군', '화천군', '횡성군'] },
  { group1: '충북', group2_json: ['전체','괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시', '증평군', '진천군', '청주시', '충주시'] },
  { group1: '충남', group2_json: ['전체','계룡시', '공주시', '금산군', '논산시', '당진시', '보령시', '부여군', '서산시', '서천군', '아산시', '예산군', '천안시', '청양군', '태안군', '홍성군'] },
  { group1: '대전', group2_json: ['전체','대덕구', '동구', '서구', '유성구', '중구'] },
  { group1: '세종', group2_json: ['전체','가람동', '고운동', '금남면', '나성동', '다정동', '대평동', '도담동', '반곡동', '보람동', '부강면', '산울동', '새롬동', '세종동', '소담동', '소정면', '아름동', '어진동', '연기면', '연동면', '연서면', '원리', '장군면', '전동면', '전의면', '조치원읍', '종촌동', '집현동', '한솔동', '해밀동'] },
  { group1: '전북', group2_json: ['전체','고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '완주군', '읍시', '익산시', '임실군', '장수군', '전주시', '정읍시', '진안군'] },
  { group1: '전남', group2_json: ['전체','강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군', '목포시', '무안군', '보성군', '순천시', '신안군', '여수시', '영광군', '영암군', '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'] },
  { group1: '광주', group2_json: ['전체','광산구', '남구', '동구', '북구', '서구'] },
  { group1: '경북', group2_json: ['전체','경산시', '경주시', '고령군', '구미시', '군위군', '김천시', '문경시', '봉화군', '상주시', '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울진군', '의성군', '청도군', '청송군', '칠곡군', '포항시'] },
  { group1: '경남', group2_json: ['전체','거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시', '산청군', '양산시', '의령군', '진주시', '창녕군', '창원시', '통영시', '하동군', '함안군', '함양군', '합천군'] },
  { group1: '부산', group2_json: ['전체','강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'] },
  { group1: '대구', group2_json: ['전체','군위군', '남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'] },
  { group1: '울산', group2_json: ['전체','남구', '동구', '북구', '울주군', '중구'] },
  { group1: '제주', group2_json: ['전체','서귀포시', '제주시'] }
];

interface RegionTabProps {
  selectedGroup1: string | null;
  selectedGroup2: string | null;
  onGroup1Select: (group1: string) => void;
  onGroup2Select: (group2: string) => void;
}

export function RegionTab({ 
  selectedGroup1, 
  selectedGroup2, 
  onGroup1Select, 
  onGroup2Select 
}: RegionTabProps) {
  const currentGroup2List = REGION_DATA.find(r => r.group1 === selectedGroup1)?.group2_json || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="text-[19px] font-black text-surface-900 dark:text-white">지역 선택</h3>
        <span className="text-[11px] font-bold text-surface-400 bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-full">시/도 및 시/군/구</span>
      </div>

      <div className="flex h-[50vh] -mx-6 overflow-hidden border-t-2 border-surface-100 dark:border-surface-800">
        {/* Sidebar: 시/도 (group1) */}
        <div className="w-[100px] overflow-y-auto bg-white dark:bg-surface-900 border-r-2 border-surface-100 dark:border-surface-800 scrollbar-hide">
          {REGION_DATA.map((region) => {
            const isSelected = selectedGroup1 === region.group1;
            return (
              <button
                key={region.group1}
                onClick={() => onGroup1Select(region.group1)}
                className={cn(
                  "w-full px-4 py-5 flex items-center justify-center transition-all",
                  isSelected
                    ? "text-surface-900 dark:text-white font-black"
                    : "text-surface-300 dark:text-surface-600 hover:text-surface-500"
                )}
              >
                <span className="text-[15px] tracking-tight">
                  {region.group1}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content: 시/군/구 (group2) */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-surface-900 p-5 scrollbar-hide">
          {!selectedGroup1 ? (
            <div className="flex flex-col items-center justify-center h-full text-surface-200 gap-4 opacity-40">
              <div className="size-16 bg-white dark:bg-surface-900 rounded-full flex items-center justify-center border-2 border-surface-100 dark:border-surface-800">
                <span className="text-3xl">📍</span>
              </div>
              <p className="font-black text-[15px]">시/도를 먼저 선택해주세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-4">
              {currentGroup2List.map((group2) => {
                const isSelected = selectedGroup2 === group2 || (group2 === "전체" && !selectedGroup2);
                return (
                  <button
                    key={group2}
                    onClick={() => onGroup2Select(group2)}
                    className={cn(
                      "px-3 py-4 rounded-2xl text-[15px] font-bold border-2 transition-all text-center relative shadow-none",
                      isSelected
                        ? "border-[#6366F1] bg-indigo-50/10 text-[#6366F1]"
                        : "border-surface-100 dark:border-surface-800 text-surface-500 dark:text-surface-400 hover:border-surface-200"
                    )}
                  >
                    {group2}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-[#6366F1] rounded-full border border-white dark:border-surface-900" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
