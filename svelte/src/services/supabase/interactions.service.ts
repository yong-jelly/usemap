import { supabase } from '$lib/supabase';

export async function setToggleLike(likedId: string, likedType: string, refId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('v1_toggle_like', {
        p_liked_id: likedId,
        p_liked_type: likedType,
        p_ref_liked_id: refId
    });

    if (error) {
        console.error('Supabase RPC 오류 (v1_toggle_like):', error);
        throw new Error(`좋아요 처리 실패: ${error.details || error.message || '알 수 없는 오류'}`);
    }
    
    // if (data && typeof data.liked === 'boolean') {
    return data.liked;
    // }
    // throw new Error('좋아요 상태를 확인할 수 없습니다.');
}

export async function setToggleSave(savedId: string, savedType: string, refId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('v1_toggle_save', {
        p_saved_id: savedId,
        p_saved_type: savedType,
        p_ref_saved_id: refId
    });

    if (error) {
        console.error('Supabase RPC 오류 (v1_toggle_save):', error);
        throw new Error(`저장 처리 실패: ${error.details || error.message || '알 수 없는 오류'}`);
    }
    
    return data.saved;
}
