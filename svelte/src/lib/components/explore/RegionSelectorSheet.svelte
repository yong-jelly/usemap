<script lang="ts">
import BottomSheet from '$lib/BottomSheet';
import { fade } from 'svelte/transition';

// 지역 데이터 (FilterOptionsPopup.svelte 참고)
const regionData = [
  { group1: '강원', group2_json: ['전체','강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군', '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군', '화천군', '횡성군'] },
  { group1: '경기', group2_json: ['전체','가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시', '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시', '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'] },
  { group1: '경남', group2_json: ['전체','거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시', '산청군', '양산시', '의령군', '진주시', '창녕군', '창원시', '통영시', '하동군', '함안군', '함양군', '합천군'] },
  { group1: '경북', group2_json: ['전체','경산시', '경주시', '고령군', '구미시', '군위군', '김천시', '문경시', '봉화군', '상주시', '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울진군', '의성군', '청도군', '청송군', '칠곡군', '포항시'] },
  { group1: '광주', group2_json: ['전체','광산구', '남구', '동구', '북구', '서구'] },
  { group1: '대구', group2_json: ['전체','군위군', '남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'] },
  { group1: '대전', group2_json: ['전체','대덕구', '동구', '서구', '유성구', '중구'] },
  { group1: '부산', group2_json: ['전체','강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'] },
  { group1: '서울', group2_json: ['전체','강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'] },
  { group1: '세종', group2_json: ['전체','가람동', '고운동', '금남면', '나성동', '다정동', '대평동', '도담동', '반곡동', '보람동', '부강면', '산울동', '새롬동', '세종동', '소담동', '소정면', '아름동', '어진동', '연기면', '연동면', '연서면', '원리', '장군면', '전동면', '전의면', '조치원읍', '종촌동', '집현동', '한솔동', '해밀동'] },
  { group1: '울산', group2_json: ['전체','남구', '동구', '북구', '울주군', '중구'] },
  { group1: '인천', group2_json: ['전체','강화군', '계양구', '남동구', '동구', '미추홀구', '부평구', '서구', '연수구', '옹진군', '중구'] },
  { group1: '전남', group2_json: ['전체','강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군', '목포시', '무안군', '보성군', '순천시', '신안군', '여수시', '영광군', '영암군', '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'] },
  { group1: '전북', group2_json: ['전체','고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '완주군', '읍시', '익산시', '임실군', '장수군', '전주시', '정읍시', '진안군'] },
  { group1: '제주', group2_json: ['전체','서귀포시', '제주시'] },
  { group1: '충남', group2_json: ['전체','계룡시', '공주시', '금산군', '논산시', '당진시', '보령시', '부여군', '서산시', '서천군', '아산시', '예산군', '천안시', '청양군', '태안군', '홍성군'] },
  { group1: '충북', group2_json: ['전체','괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시', '증평군', '진천군', '청주시', '충주시'] }
];

// props
const {
  isOpen = false,
  initialGroup1 = null,
  initialGroup2 = null,
  onRegionSelect = (region: { group1: string | null, group2: string | null }) => {},
  onOpen = () => {},
  onClose = () => {},
  onSheetDragStart = () => {},
  onSheetDragEnd = () => {}
} = $props<{
  isOpen?: boolean;
  initialGroup1?: string | null;
  initialGroup2?: string | null;
  onRegionSelect?: (region: { group1: string | null, group2: string | null }) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onSheetDragStart?: () => void;
  onSheetDragEnd?: () => void;
}>();

let isSheetOpen = $state(isOpen);
let selectedGroup1 = $state<string | null>(initialGroup1);
let selectedGroup2 = $state<string | null>(initialGroup2);

$effect(() => { isSheetOpen = isOpen; });
$effect(() => { selectedGroup1 = initialGroup1; });
$effect(() => { selectedGroup2 = initialGroup2; });

// group1 선택 시 group2를 '전체'로 자동 선택
function handleGroup1Select(group1: string) {
  selectedGroup1 = group1;
  selectedGroup2 = '전체';
}

function handleGroup2Select(group2: string) {
  selectedGroup2 = group2;
}

function handleApply() {
  onRegionSelect({ group1: selectedGroup1, group2: selectedGroup2 });
  isSheetOpen = false;
}

function handleReset() {
  selectedGroup1 = null;
  selectedGroup2 = null;
}
</script>

<div class="region-selector-sheet">
  <BottomSheet
    bind:isSheetOpen
    settings={{ maxHeight: 0.9, snapPoints: [0.5, 0.9], startingSnapPoint: 0.9 }}
    onopen={onOpen}
    onclose={onClose}
    onsheetdragstart={onSheetDragStart}
    onsheetdragend={onSheetDragEnd}
  >
    <BottomSheet.Overlay>
      <BottomSheet.Sheet style="max-width: 600px; margin: 0 auto; height: 100%; display: flex; flex-direction: column; min-height: 0;">
        <BottomSheet.Handle>
          <BottomSheet.Grip />
          <div class="px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
            <h3 class="text-lg font-medium text-center">지역 선택</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">시/도와 시/군/구를 차례로 선택하세요</p>
          </div>
        </BottomSheet.Handle>
        <BottomSheet.Content style="flex: 1 1 0; display: flex; flex-direction: column; min-height: 0;">
          <div class="flex flex-col md:flex-row gap-2 flex-1 min-h-0">
            <!-- group1(시/도) 목록 -->
            <div class="flex-1 min-w-0 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-100 dark:border-neutral-800 p-2">
              <div class="mb-2 px-1">
                <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-widest uppercase">지역</h4>
              </div>
              <div class="grid grid-cols-3 gap-2">
                {#each regionData as region}
                  <button
                    class="w-full py-3 rounded-lg border transition-all font-semibold text-base
                      {selectedGroup1 === region.group1 ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-gray-700 dark:text-gray-200 border-gray-200 dark:bg-neutral-800 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-700'}"
                    onclick={() => handleGroup1Select(region.group1)}
                  >
                    {region.group1}
                  </button>
                {/each}
              </div>
            </div>
            <!-- group2(시/군/구) 목록 -->
            {#if selectedGroup1}
              <div class="flex-1 min-w-0 overflow-y-auto p-2" transition:fade>
                <div class="mb-2 px-1">
                  <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-widest uppercase">시/군/구</h4>
                </div>
                <div class="flex flex-wrap gap-2">
                  {#each regionData.find(r => r.group1 === selectedGroup1)?.group2_json ?? [] as group2}
                    <button
                      class="rounded px-2 py-1 text-sm flex items-center border font-medium
                        {selectedGroup2 === group2 ? 'bg-indigo-100 text-indigo-700 border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700' : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700'}"
                      onclick={() => handleGroup2Select(group2)}
                    >
                      {group2}
                    </button>
                    <!-- <button
                      class="rounded-full px-3 py-1.5 text-sm transition-colors flex items-center border font-medium
                        {selectedGroup2 === group2 ? 'bg-indigo-100 text-indigo-700 border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700' : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700'}"
                      onclick={() => handleGroup2Select(group2)}
                    >
                      {group2}
                    </button> -->
                  {/each}
                </div>
              </div>
            {/if}
          </div>
          <div class="pt-2 pb-0 flex flex-col gap-2">
						<div class="flex gap-2">
							<button
								class="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-200 font-medium text-sm transition-colors active:bg-gray-100 dark:active:bg-neutral-800"
								onclick={handleReset}
							>
								초기화
							</button>
							<button
								class="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm transition-colors hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
								onclick={handleApply}
                disabled={!selectedGroup1 || !selectedGroup2}
							>
								적용
							</button>
						</div>
					</div>
        </BottomSheet.Content>
      </BottomSheet.Sheet>
    </BottomSheet.Overlay>
  </BottomSheet>
</div>

<style>
  .min-h-0 { min-height: 0 !important; }
</style>
