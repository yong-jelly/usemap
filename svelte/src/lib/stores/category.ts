import { writable } from 'svelte/store';
import categoryData from '../../resource/category.json';

// 카테고리 데이터를 전역 변수로 저장
export const categories = categoryData;

// 카테고리 데이터를 가져오는 함수
export function get_category() {
    return categories;
}

// 카테고리 이름으로 데이터를 찾는 함수
export function find_category_by_name(name: string) {
    return categories.find(cat => cat.text === name);
}

// 카테고리 이름으로 카운트를 가져오는 함수
export function get_category_count(name: string): string {
    const category = find_category_by_name(name);
    return category ? category.count : '0';
}

// 필터 옵션용 카테고리 목록 생성 함수
export function get_filter_categories() {
    // 카운트 기준으로 정렬하고 상위 15개만 추출
    return categories
        .sort((a, b) => parseInt(b.count) - parseInt(a.count))
        .slice(0, 20)
        .map(cat => cat.text);
}

// 카테고리 스토어 생성
export const categoryStore = writable(categories); 