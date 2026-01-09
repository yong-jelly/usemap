# DetailHeader 컴포넌트

`DetailHeader`는 `/feature/detail/*` 및 `/folder/*` 상세 페이지에서 사용되는 공통 헤더 컴포넌트입니다. 페이지의 성격에 따라 썸네일, 타이틀, 구독 버튼, 공유 버튼, 설정 버튼 등을 일관성 있게 배치합니다.

## 주요 기능

- **뒤로가기**: 브라우저 히스토리 또는 커스텀 핸들러를 통한 뒤로가기 기능을 제공합니다.
- **프로필/썸네일**: 유튜브 채널 아이콘이나 사용자 아바타를 표시합니다. 썸네일이 없는 경우 타입에 맞는 기본 아이콘을 보여주거나 공간을 최적화합니다.
- **구독 시스템**: 피쳐(유튜브 등)나 타인의 폴더를 구독할 수 있는 버튼을 제공합니다.
- **공유 기능**: 현재 페이지의 URL을 클립보드에 복사하는 기능을 기본으로 제공하며, 커스텀 핸들러를 연결할 수 있습니다.
- **설정(관리)**: 폴더 소유자인 경우 설정 아이콘을 통해 관리 메뉴로 진입할 수 있습니다.

## 사용 예시

### 유튜브 피쳐 상세

```tsx
<DetailHeader
  type="feature"
  subType="youtube"
  title="채널명"
  subtitle="유튜브"
  thumbnailUrl="채널_이미지_URL"
  isSubscribed={false}
  onSubscribe={() => { /* 구독 로직 */ }}
/>
```

### 폴더 상세 (소유자)

```tsx
<DetailHeader
  type="folder"
  title="폴더 타이틀"
  subtitle="닉네임"
  isOwner={true}
  onSettings={() => { /* 설정 로직 */ }}
/>
```

## Props

| Prop | Type | Description |
| :--- | :--- | :--- |
| `type` | `'feature' \| 'folder'` | 헤더의 대분류 타입 |
| `subType` | `'youtube' \| 'community' \| 'folder' \| 'naver'` | 상세 분류 타입 (아이콘 및 보조 텍스트 결정) |
| `title` | `string` | 메인 타이틀 |
| `subtitle` | `string` | 타이틀 하단의 보조 텍스트 |
| `thumbnailUrl` | `string` | 프로필 또는 채널 이미지 URL |
| `isSubscribed` | `boolean` | 현재 구독 상태 |
| `isOwner` | `boolean` | (폴더용) 현재 사용자가 폴더 소유자인지 여부 |
| `onSubscribe` | `() => void` | 구독 버튼 클릭 시 콜백 |
| `onShare` | `() => void` | 공유 버튼 클릭 시 콜백 |
| `onSettings` | `() => void` | 설정 버튼 클릭 시 콜백 |
| `onBack` | `() => void` | 뒤로가기 클릭 시 콜백 (미지정 시 `navigate(-1)`) |
