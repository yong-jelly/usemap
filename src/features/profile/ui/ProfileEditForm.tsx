import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Camera, X, Loader2, RefreshCw } from "lucide-react";
import { useUserProfile, useUpsertProfile } from "@/entities/user/queries";
import { Button, Input } from "@/shared/ui";
import { uploadProfileImage, getProfileImageUrl } from "@/shared/lib/storage";
import { useUserStore } from "@/entities/user";

export function ProfileEditForm() {
  const navigate = useNavigate();
  const { data: profile } = useUserProfile();
  const { mutate: upsertProfile, isPending: isSaving } = useUpsertProfile();
  const { user: authUser } = useUserStore();
  
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imagePath, setImagePath] = useState(""); // Storage 경로 또는 URL
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname);
      setBio(profile.bio || "");
      setImagePath(profile.profile_image_url || "");
      setImagePreview(getProfileImageUrl(profile.profile_image_url, "lg") || "");
    }
  }, [profile]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;

    setIsUploading(true);
    setError("");

    try {
      const { path, error: uploadError } = await uploadProfileImage(file, authUser.id);
      if (uploadError) throw uploadError;

      setImagePath(path);
      setImagePreview(getProfileImageUrl(path, "lg") || "");
    } catch (err: any) {
      console.error("Image upload error:", err);
      setError(`이미지 업로드 실패: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
    setImagePath(newAvatar);
    setImagePreview(newAvatar);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (nickname.length < 2) {
      setError("닉네임은 최소 2자 이상이어야 합니다.");
      return;
    }

    upsertProfile(
      {
        nickname,
        bio: bio || null,
        profile_image_url: imagePath || null,
      },
      {
        onSuccess: () => {
          navigate("/profile");
        },
        onError: (err: any) => {
          setError(err.message || "프로필 업데이트에 실패했습니다.");
        },
      }
    );
  };

  const removeImage = () => {
    setImagePath("");
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 프로필 이미지 섹션 */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative group">
          <div className="w-28 h-24 rounded-2xl bg-surface-50 dark:bg-surface-800 border-2 border-surface-100 dark:border-surface-700 overflow-hidden flex items-center justify-center transition-all group-hover:border-primary-200">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            ) : imagePreview ? (
              <img src={imagePreview} alt={nickname} className="w-full h-full object-cover" />
            ) : (
              <div className="text-4xl font-medium text-surface-200 dark:text-surface-600">
                {nickname.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-surface-800 border-2 border-surface-100 dark:border-surface-700 rounded-xl flex items-center justify-center text-surface-500 hover:text-primary-500 shadow-lg active:scale-90 transition-all"
          >
            <Camera className="w-5 h-5" />
          </button>
          
          {imagePreview && (
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 active:scale-90 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            id="profile-image"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        <button 
          type="button"
          onClick={handleRandomAvatar}
          className="flex items-center gap-1.5 text-[11px] font-medium text-primary-600 uppercase tracking-wider hover:underline bg-primary-50 px-3 py-1.5 rounded-full transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          랜덤 아바타
        </button>
        
        <div className="text-center">
          <p className="text-[11px] font-medium text-surface-400 uppercase tracking-widest leading-none">
            {authUser?.email || "이메일 정보 없음"}
          </p>
        </div>
      </div>

      {/* 닉네임 입력 */}
      <div className="space-y-3">
        <label className="block text-[14px] font-medium text-surface-900 dark:text-white ml-1">
          표시 이름
        </label>
        <Input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임을 입력하세요 (2~30자)"
          required
          maxLength={30}
          className="h-14 px-5 rounded-2xl bg-surface-50 dark:bg-surface-900 border-none ring-1 ring-surface-200 dark:ring-surface-700 focus:ring-2 focus:ring-primary-500 transition-all text-[17px] font-medium"
        />
        <p className="text-xs text-surface-400 ml-1">2~30자 사이로 입력해주세요</p>
      </div>

      {/* 소개 입력 */}
      <div className="space-y-3">
        <label className="block text-[14px] font-medium text-surface-900 dark:text-white ml-1">
          소개
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full min-h-[120px] p-5 rounded-2xl bg-surface-50 dark:bg-surface-900 border-none ring-1 ring-surface-200 dark:ring-surface-700 focus:ring-2 focus:ring-primary-500 transition-all text-[17px] font-medium resize-none leading-relaxed"
          placeholder="자신을 소개해주세요 (최대 200자)"
          maxLength={200}
        />
        <div className="flex justify-between text-xs text-surface-400 px-1">
          <span>소개는 선택 항목입니다</span>
          <span>{bio.length}/200</span>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400 animate-in fade-in zoom-in duration-200">
          {error}
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate("/profile")}
          className="flex-1 h-14 rounded-2xl font-medium text-[16px] bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700"
          disabled={isSaving || isUploading}
        >
          취소
        </Button>
        <Button
          type="submit"
          className="flex-1 h-14 rounded-2xl font-medium text-[16px] shadow-soft-lg active:scale-[0.98]"
          disabled={isSaving || isUploading || !nickname.trim()}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              저장 중...
            </>
          ) : (
            "변경사항 저장"
          )}
        </Button>
      </div>
    </form>
  );
}
