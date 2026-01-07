import { goto } from '@mateothegreat/svelte5-router';
// import { placeService } from '$services/place.service';

// 상태를 관리할 클래스 생성
class DetailPopupService {
  showDetailPopup = $state(false);
  selectedPlaceId = $state('');

  // 디테일 페이지 데이터 로드하고 팝업 표시
  async showDetail(placeId: string) {
    try {
      // 장소 ID 저장
      this.selectedPlaceId = placeId;
      // 팝업 표시
      this.showDetailPopup = true;
      // History API로 가상 상태 추가 (뒤로가기 버튼 대응)
      window.history.pushState({ popup: 'detail' }, '');
    } catch (error) {
      console.error('장소 상세 정보 조회 실패:', error);
      // 오류 발생 시 기본 페이지 이동
      goto(`/place/${placeId}`);
    }
  }

  // 팝업 닫기
  closeDetailPopup() {
    this.showDetailPopup = false;
    this.selectedPlaceId = '';
    // 배경 스크롤 복원
    document.body.style.overflow = '';
  }
}

export const detailPopupService = new DetailPopupService(); 