<!-- @migration-task Error while migrating Svelte code: Mixing old (on:submit) and new syntaxes for event handling is not allowed. Use only the onsubmit syntax
https://svelte.dev/e/mixed_event_handler_syntaxes -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '@mateothegreat/svelte5-router';
    import { authStore } from '$services/auth.store';
    import { profileService, type ProfileUpdateData } from '$services/profile.service';
    import type { UserProfile } from '$services/types';
    import { supabase } from '$lib/supabase';
    import { toast } from '$lib/components/ui/toast';
	import Indicator from '$lib/components/Indicator.svelte';
    // 상태 변수들
    let profile = $state<UserProfile | null>(null);
    let loading = $state(true);
    let saving = $state(false);
    let error = $state('');
    let successMessage = $state('');
  
    // 편집 중인 프로필 데이터
    let editData = $state<ProfileUpdateData>({
      nickname: '',
      bio: '',
      profile_image_url: ''
    });
  
    // 이미지 업로드 관련 변수
    let imageFile = $state<File | null>(null);
    let imagePreview = $state('');
    let uploadProgress = $state(0);
    let imageValidationError = $state('');
    
    // 이미지 업로드 제약사항
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const MAX_IMAGE_DIMENSION = 5032; // 최대 이미지 크기 (픽셀) - 아이폰 13 Pro 후면 카메라 해상도보다 약간 큰 크기
    const MIN_IMAGE_DIMENSION = 200; // 최소 이미지 크기 (픽셀)
    // 컴포넌트 마운트 시 초기화
    onMount(async () => {
      try {
        // 현재 사용자 정보 로드
        if (!$authStore.isAuthenticated) {
          await goto('/auth/login');
          return;
        }
  
        // 프로필 정보 로드
        const userProfile = await profileService.getCurrentUserProfile();
        profile = userProfile;
  
        if (userProfile) {
          // 편집 폼 초기화
          editData = {
            nickname: userProfile.nickname,
            bio: userProfile.bio || '',
            profile_image_url: userProfile.profile_image_url || null
          };
  
          // 이미지 미리보기 설정
          if (userProfile.profile_image_url) {
            imagePreview = userProfile.profile_image_url;
          }
        } else {
          error = '프로필 정보를 찾을 수 없습니다.';
        }
      } catch (err: any) {
        console.error('프로필 로드 오류:', err);
        error = '프로필 정보를 불러오는 중 오류가 발생했습니다.';
      } finally {
        loading = false;
      }
    });
  
    // 이미지 파일 유효성 검사
    async function validateImage(file: File): Promise<boolean> {
      imageValidationError = '';
      
      // 파일 크기 검사
      if (file.size > MAX_FILE_SIZE) {
        imageValidationError = `이미지 크기는 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 허용됩니다.`;
        return false;
      }
      
      // 파일 타입 검사
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        imageValidationError = '지원되는 이미지 형식: JPG, PNG, WebP, GIF';
        return false;
      }
      
      // 이미지 차원 검사 (비동기)
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          
          if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
            imageValidationError = `이미지 크기는 최대 ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION} 픽셀까지 허용됩니다.`;
            resolve(false);
          } else if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
            imageValidationError = `이미지 크기는 최소 ${MIN_IMAGE_DIMENSION}x${MIN_IMAGE_DIMENSION} 픽셀 이상이어야 합니다.`;
            resolve(false);
          } else {
            resolve(true);
          }
        };
        
        img.onerror = () => {
          imageValidationError = '이미지를 불러올 수 없습니다. 올바른 이미지 파일인지 확인하세요.';
          resolve(false);
        };
        
        img.src = URL.createObjectURL(file);
      });
    }
  
    // 이미지 선택 핸들러
    async function handleImageChange(event: Event) {
      const target = event.target as HTMLInputElement;
      if (!target.files || target.files.length === 0) {
        return;
      }
      
      const file = target.files[0];
      
      // 이미지 유효성 검사
      const isValid = await validateImage(file);
      
      if (isValid) {
        imageFile = file;
        
        // 이미지 미리보기 생성
        const reader = new FileReader();
        reader.onload = (e) => {
          imagePreview = e.target?.result as string;
        };
        reader.readAsDataURL(imageFile);
      } else {
        // 유효하지 않은 이미지일 경우 파일 선택 초기화
        target.value = '';
        toast({
          title: "이미지 오류",
          description: imageValidationError,
          variant: "destructive"
        });
      }
    }
  
    // 이미지 크기 조정 함수
    async function resizeImageIfNeeded(file: File): Promise<Blob> {
      // 파일이 이미 적정 크기면 원본 반환
      if (file.size <= MAX_FILE_SIZE) {
        return file;
      }
      
      return new Promise((resolve) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          
          // 이미지가 너무 큰 경우 비율에 맞게 크기 조정
          if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
              width = MAX_IMAGE_DIMENSION;
            } else {
              width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
              height = MAX_IMAGE_DIMENSION;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // 압축 품질 조정 (JPEG 변환)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                resolve(file); // 실패하면 원본 반환
              }
            },
            'image/jpeg',
            0.8
          );
        };
        
        img.onerror = () => resolve(file);
        img.src = URL.createObjectURL(file);
      });
    }
  
    // 이미지 업로드 함수
    async function uploadImage(): Promise<string | null> {
      if (!imageFile) return editData.profile_image_url || null;
      
      try {
        // 필요한 경우 이미지 크기 조정
        const optimizedImage = await resizeImageIfNeeded(imageFile);
        
        const fileName = `${$authStore.id}_${Date.now()}.${imageFile.name.split('.').pop()}`;
        const filePath = `${$authStore.id}/${fileName}`;
        
        uploadProgress = 0;
        
        // Supabase 스토리지에 업로드
        const { data, error } = await supabase.storage
          .from('public-profile-avatars')
          .upload(filePath, optimizedImage, {
            upsert: true,
            contentType: imageFile.type,
            cacheControl: '3600'
          });
  
        if (error) throw error;
  
        // 공개 URL 생성
        const { data: urlData } = await supabase.storage
          .from('public-profile-avatars')
          .getPublicUrl(filePath);
  
        return urlData.publicUrl;
      } catch (err) {
        console.error('이미지 업로드 오류:', err);
        error = '이미지 업로드 중 오류가 발생했습니다.';
        toast({
          title: "업로드 실패",
          description: "이미지 업로드에 실패했습니다. 다시 시도해주세요.",
          variant: "destructive"
        });
        return null;
      }
    }
  
    // 이미지 제거 핸들러
    function removeImage() {
      imageFile = null;
      imagePreview = '';
      editData.profile_image_url = null;
    }
  
    // 프로필 업데이트 제출 핸들러
    async function handleSubmit() {
      saving = true;
      error = '';
      successMessage = '';
  
      try {
        // 폼 유효성 검사
        if (!editData.nickname || editData.nickname.length < 2) {
          error = '닉네임은 최소 2자 이상이어야 합니다.';
          toast({
            title: "저장 실패",
            description: error,
            variant: "destructive"
          });
          return;
        }
  
        if (editData.bio && editData.bio.length > 200) {
          error = '소개는 최대 200자까지 입력 가능합니다.';
          toast({
            title: "저장 실패",
            description: error,
            variant: "destructive"
          });
          return;
        }
  
        // 이미지 업로드 (있는 경우)
        let profileImageUrl = editData.profile_image_url;
        if (imageFile) {
          profileImageUrl = await uploadImage();
          if (!profileImageUrl) {
            saving = false;
            return;
          }
        }
  
        // 프로필 업데이트 API 호출
        const updateResult = await profileService.updateProfile({
          ...editData,
          profile_image_url: profileImageUrl
        });
  
        if (updateResult.success) {
          profile = updateResult.profile as UserProfile;
          successMessage = '프로필이 성공적으로 업데이트되었습니다.';
          toast({
            title: "저장 완료",
            description: successMessage,
          });
          
          // 3초 후 프로필 페이지로 이동
          setTimeout(() => {
            goto('/profile');
          }, 3000);
        } else {
          error = updateResult.message || '프로필 업데이트에 실패했습니다.';
          toast({
            title: "저장 실패",
            description: error,
            variant: "destructive"
          });
        }
      } catch (err: any) {
        console.error('프로필 업데이트 오류:', err);
        error = '프로필 업데이트 중 오류가 발생했습니다.';
        toast({
          title: "오류 발생",
          description: error,
          variant: "destructive"
        });
      } finally {
        saving = false;
      }
    }
  
    // 프로필 페이지로 돌아가기
    function goBack() {
      goto('/profile');
    }
  </script>
  
  <div class="min-h-screen bg-gray-50 flex flex-col dark:bg-neutral-900 dark:text-white">
    <!-- 헤더 -->
    <div class="bg-white shadow dark:bg-neutral-800 dark:border-b dark:border-neutral-700">
      <div class="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
        <button onclick={goBack} class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 class="text-xl font-semibold">프로필 수정</h1>
        <div class="w-6"></div> <!-- 균형을 맞추기 위한 빈 공간 -->
      </div>
    </div>
  
    <!-- 메인 콘텐츠 -->
    <div class="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
      {#if loading}
        <!-- <div class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div> -->
        <Indicator text="프로필 정보를 불러오는 중..." />
      {:else}
        <form 
          onsubmit={e => (e.preventDefault(), handleSubmit())} 
          class="bg-white rounded-lg shadow p-6 dark:bg-neutral-800"
        >
          <!-- 프로필 이미지 업로드 -->
          <div class="mb-6 flex flex-col items-center">
            <div class="relative mb-4">
              {#if imagePreview}
                <img
                  src={imagePreview}
                  alt="프로필 미리보기"
                  class="w-32 h-32 rounded-full object-cover border-2 border-gray-200 dark:border-neutral-700"
                />
                <button 
                  type="button"
                  onclick={removeImage}
                  class="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 cursor-pointer shadow-lg hover:bg-red-600"
                  title="이미지 제거"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              {:else}
                <div class="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-4xl dark:bg-neutral-700">
                  {editData.nickname?.charAt(0)?.toUpperCase() || '?'}
                </div>
              {/if}
              
              <label
                for="profile-image"
                class="absolute bottom-0 right-0 bg-indigo-500 text-white rounded-full p-2 cursor-pointer shadow-lg hover:bg-indigo-600"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
              
              <input
                type="file"
                id="profile-image"
                accept="image/jpeg,image/png,image/webp,image/gif"
                class="hidden"
                onchange={handleImageChange}
              />
            </div>
            
            <!-- 이미지 업로드 진행 표시 -->
            {#if uploadProgress > 0 && uploadProgress < 100}
              <div class="w-full max-w-xs bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-neutral-700">
                <div class="bg-indigo-600 h-2.5 rounded-full" style="width: {uploadProgress}%"></div>
                <p class="text-xs text-center mt-1">{uploadProgress}%</p>
              </div>
            {/if}
            
            <!-- 이미지 업로드 제약 사항 안내 -->
            <div class="text-xs text-gray-500 text-center mt-2 mb-4 max-w-xs dark:text-gray-400">
              <p>지원 형식: JPG, PNG, WebP, GIF</p>
              <p>최대 용량: 5MB</p>
              <p>권장 크기: 200 x 200 픽셀 이상</p>
            </div>
          </div>
          
          <!-- 닉네임 입력 -->
          <div class="mb-4">
            <label for="nickname" class="block text-gray-700 font-medium mb-2 dark:text-gray-300">닉네임 *</label>
            <input
              type="text"
              id="nickname"
              bind:value={editData.nickname}
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
              placeholder="닉네임을 입력하세요 (2~30자)"
              minlength="2"
              maxlength="30"
              required
            />
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">2~30자 사이로 입력해주세요</p>
          </div>
          
          <!-- 소개 입력 -->
          <div class="mb-6">
            <label for="bio" class="block text-gray-700 font-medium mb-2 dark:text-gray-300">소개</label>
            <textarea
              id="bio"
              bind:value={editData.bio}
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
              placeholder="자기소개를 입력하세요 (선택사항, 최대 200자)"
              rows="3"
              maxlength="200"
            ></textarea>
            <p class="mt-1 text-sm text-gray-500 flex justify-between dark:text-gray-400">
              <span>소개는 선택 항목입니다</span>
              <span>{editData.bio?.length || 0}/200</span>
            </p>
          </div>
          
          <!-- 에러 메시지 -->
          {#if error}
            <div class="mb-4 p-3 bg-red-50 text-red-700 rounded-md dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          {/if}
          
          <!-- 성공 메시지 -->
          {#if successMessage}
            <div class="mb-4 p-3 bg-green-50 text-green-700 rounded-md dark:bg-green-900/20 dark:text-green-400">
              {successMessage}
            </div>
          {/if}
          
          <!-- 버튼 -->
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              onclick={goBack}
              class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 dark:text-gray-300 dark:border-neutral-600 dark:hover:bg-neutral-700"
              disabled={saving}
            >
              취소
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>