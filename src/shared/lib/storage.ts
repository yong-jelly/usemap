import { supabase } from "./supabase";

/**
 * Storage 버킷 이름
 */
export const STORAGE_BUCKETS = {
  USER_IMAGES: "public-profile-avatars",
  REVIEW_IMAGES: "public-review-images",
} as const;

/**
 * 이미지 리사이즈 옵션
 */
export interface ImageTransformOptions {
  width?: number;
  height?: number;
  resize?: "cover" | "contain" | "fill";
  quality?: number; // 1-100
}

/**
 * 프로필 이미지 업로드
 * 
 * @param file - 업로드할 파일
 * @param userId - 사용자 ID (auth.uid())
 * @returns 업로드된 파일 경로
 */
export async function uploadProfileImage(
  file: File,
  userId: string
): Promise<{ path: string; error: Error | null }> {
  try {
    // 파일 유효성 검사
    if (!file.type.startsWith("image/")) {
      return { path: "", error: new Error("이미지 파일만 업로드 가능합니다") };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { path: "", error: new Error("파일 크기는 5MB 이하여야 합니다") };
    }

    // 파일명 생성: profile-{timestamp}.{extension}
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `profile-${timestamp}.${extension}`;
    const filePath = `${userId}/${fileName}`;

    // Storage에 업로드
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.USER_IMAGES)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      console.error("Storage 업로드 에러:", error);
      return { path: "", error: new Error(error.message) };
    }

    return { path: filePath, error: null };
  } catch (err) {
    console.error("이미지 업로드 에러:", err);
    return {
      path: "",
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 이미지 URL 가져오기
 */
export function getImageUrl(
  filePath: string,
  transform?: ImageTransformOptions,
  bucket: string = STORAGE_BUCKETS.USER_IMAGES
): string {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath, {
      transform: transform ? {
        width: transform.width,
        height: transform.height,
        resize: transform.resize || "cover",
        quality: transform.quality || 80,
      } : undefined,
    });

  return data.publicUrl;
}

/**
 * 프로필 이미지 URL 가져오기 (프리셋)
 */
export function getProfileImageUrl(
  filePath: string | null | undefined,
  size: "sm" | "md" | "lg" | "xl" = "md"
): string | undefined {
  if (!filePath) return undefined;

  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  const sizeMap = {
    sm: { width: 40, height: 40 },
    md: { width: 100, height: 100 },
    lg: { width: 200, height: 200 },
    xl: { width: 400, height: 400 },
  };

  return getImageUrl(filePath, {
    ...sizeMap[size],
    resize: "cover",
    quality: 85,
  }, STORAGE_BUCKETS.USER_IMAGES);
}

/**
 * 리뷰 이미지 업로드
 * 
 * @param file - 업로드할 파일
 * @param userId - 사용자 ID
 * @param reviewId - 리뷰 ID
 * @returns 업로드된 파일 경로
 */
export async function uploadReviewImage(
  file: File,
  userId: string,
  reviewId: string
): Promise<{ path: string; error: Error | null }> {
  try {
    if (!file.type.startsWith("image/")) {
      return { path: "", error: new Error("이미지 파일만 업로드 가능합니다") };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { path: "", error: new Error("파일 크기는 10MB 이하여야 합니다") };
    }

    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `${timestamp}.${extension}`;
    const filePath = `${userId}/${reviewId}/${fileName}`;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.REVIEW_IMAGES)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      console.error("Review Storage 업로드 에러:", error);
      return { path: "", error: new Error(error.message) };
    }

    return { path: filePath, error: null };
  } catch (err) {
    console.error("리뷰 이미지 업로드 에러:", err);
    return {
      path: "",
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 리뷰 이미지 URL 가져오기 (썸네일 지원)
 * 
 * @param filePath - 이미지 경로
 * @param size - 사이즈 프리셋
 */
export function getReviewImageUrl(
  filePath: string | null | undefined,
  size: "thumbnail" | "medium" | "full" = "medium"
): string | undefined {
  if (!filePath) return undefined;

  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  const sizeMap = {
    thumbnail: { width: 150, height: 150 }, // 목록용 썸네일
    medium: { width: 600, height: 600 },    // 상세/미리보기용
    full: undefined,                        // 원본
  };

  const transform = sizeMap[size];

  return getImageUrl(
    filePath,
    transform ? {
      ...transform,
      resize: "cover",
      quality: 85,
    } : undefined,
    STORAGE_BUCKETS.REVIEW_IMAGES
  );
}
