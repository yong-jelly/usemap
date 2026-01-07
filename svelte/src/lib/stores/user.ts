import { writable } from 'svelte/store';

// 사용자 데이터 인터페이스
interface UserData {
    username: string;
    fullName: string;
    bio: string;
    profileImage: string;
    posts: number;
    followers: number;
    following: number;
    isVerified: boolean;
    email: string;
    phone: string;
}

// 포스트 인터페이스
interface Post {
    id: number;
    image: string;
    likes: number;
    comments: number;
}

// 저장된 장소 인터페이스
interface SavedPlace {
    id: number;
    name: string;
    category: string;
    rating: number;
    image: string;
}

// 좋아요한 포스트 인터페이스
interface LikedPost {
    id: number;
    image: string;
    author: string;
    likes: number;
    comments: number;
}

// 댓글 인터페이스
interface Comment {
    id: number;
    post: {
        image: string;
    };
    author: string;
    content: string;
    likes: number;
    date: string;
}

export function createUserStore() {
    // 사용자 데이터
    const userData: UserData = {
        username: '맛집러버',
        fullName: '김맛집',
        bio: '맛집 탐방러 🍽️ | 서울 거주 | 맛있는 음식 사진 찍는 거 좋아해요',
        profileImage: 'https://randomuser.me/api/portraits/women/44.jpg',
        posts: 78,
        followers: 245,
        following: 315,
        isVerified: true,
        email: 'tastylover@gmail.com',
        phone: '010-1234-5678'
    };

    // 스토어 생성
    const { subscribe, set, update } = writable({
        userData,
        posts: [] as Post[],
        savedPlaces: [] as SavedPlace[],
        likedPosts: [] as LikedPost[],
        comments: [] as Comment[]
    });

    // 사용자 포스트 가져오기 (더미 데이터)
    function fetchUserPosts() {
        const posts: Post[] = [
            { id: 1, image: 'https://source.unsplash.com/random/300x300/?food', likes: 124, comments: 14 },
            { id: 2, image: 'https://source.unsplash.com/random/300x300/?restaurant', likes: 98, comments: 7 },
            { id: 3, image: 'https://source.unsplash.com/random/300x300/?cafe', likes: 156, comments: 21 },
            { id: 4, image: 'https://source.unsplash.com/random/300x300/?dessert', likes: 87, comments: 5 },
            { id: 5, image: 'https://source.unsplash.com/random/300x300/?coffee', likes: 113, comments: 11 },
            { id: 6, image: 'https://source.unsplash.com/random/300x300/?dinner', likes: 201, comments: 32 },
        ];

        update(store => {
            store.posts = posts;
            return store;
        });
    }

    // 저장한 장소 가져오기 (더미 데이터)
    function fetchSavedPlaces() {
        const savedPlaces: SavedPlace[] = [
            { id: 1, name: '스시코우지', category: '일식', rating: 4.8, image: 'https://source.unsplash.com/random/300x300/?sushi' },
            { id: 2, name: '브런치카페', category: '카페', rating: 4.6, image: 'https://source.unsplash.com/random/300x300/?brunch' },
            { id: 3, name: '화덕피자', category: '이탈리안', rating: 4.7, image: 'https://source.unsplash.com/random/300x300/?pizza' },
            { id: 4, name: '소문난감자탕', category: '한식', rating: 4.5, image: 'https://source.unsplash.com/random/300x300/?korean' },
            { id: 5, name: '버거킹', category: '패스트푸드', rating: 4.2, image: 'https://source.unsplash.com/random/300x300/?burger' },
        ];

        update(store => {
            store.savedPlaces = savedPlaces;
            return store;
        });
    }

    // 좋아요한 포스트 가져오기 (더미 데이터)
    function fetchLikedPosts() {
        const likedPosts: LikedPost[] = [
            { id: 1, image: 'https://source.unsplash.com/random/300x300/?steak', author: '맛있는여행', likes: 354, comments: 42 },
            { id: 2, image: 'https://source.unsplash.com/random/300x300/?pasta', author: '푸드스타그램', likes: 287, comments: 31 },
            { id: 3, image: 'https://source.unsplash.com/random/300x300/?bbq', author: '맛집탐험', likes: 412, comments: 56 },
            { id: 4, image: 'https://source.unsplash.com/random/300x300/?seafood', author: '바다의맛', likes: 198, comments: 19 },
        ];

        update(store => {
            store.likedPosts = likedPosts;
            return store;
        });
    }

    // 사용자 댓글 가져오기 (더미 데이터)
    function fetchUserComments() {
        const comments: Comment[] = [
            { id: 1, post: { image: 'https://source.unsplash.com/random/300x300/?noodle' }, author: '쌀국수킹', content: '여기 짜장면 정말 맛있어 보이네요! 저도 꼭 가봐야겠어요.', likes: 24, date: '3일 전' },
            { id: 2, post: { image: 'https://source.unsplash.com/random/300x300/?icecream' }, author: '디저트퀸', content: '이 아이스크림 가게 저도 좋아해요! 특히 피스타치오 맛이 최고예요.', likes: 16, date: '1주일 전' },
            { id: 3, post: { image: 'https://source.unsplash.com/random/300x300/?cocktail' }, author: '칵테일바', content: '여기 분위기가 정말 좋아요! 칵테일도 맛있고 서비스도 친절해요.', likes: 31, date: '2주일 전' },
        ];

        update(store => {
            store.comments = comments;
            return store;
        });
    }

    // 사용자 프로필 업데이트
    function updateUserProfile(newUserData: Partial<UserData>) {
        update(store => {
            store.userData = { ...store.userData, ...newUserData };
            return store;
        });
    }

    return {
        subscribe,
        fetchUserPosts,
        fetchSavedPlaces,
        fetchLikedPosts,
        fetchUserComments,
        updateUserProfile,
        userData,
        posts: [] as Post[],
        savedPlaces: [] as SavedPlace[],
        likedPosts: [] as LikedPost[],
        comments: [] as Comment[]
    };
} 