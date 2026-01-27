import { useInView, IntersectionOptions } from 'react-intersection-observer';

/**
 * Intersection Observer를 쉽게 사용하기 위한 공통 훅
 * @param options Intersection Observer 옵션
 * @returns { ref, inView, entry }
 */
export const useIntersection = (options: IntersectionOptions = {}) => {
  return useInView({
    threshold: 0.1,
    ...options,
  });
};
