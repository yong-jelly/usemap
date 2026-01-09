# FolderList & FolderListItem 컴포넌트

`FolderList`와 `FolderListItem`은 사용자의 폴더(맛탐정) 목록을 표시하고 선택하는 데 사용되는 재사용 가능한 컴포넌트입니다.

## 1. FolderListItem

개별 폴더 항목을 표시하는 미니멀한 카드 스타일의 컴포넌트입니다.

### Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `folder` | `Folder` | - | 표시할 폴더 객체 |
| `isSelected` | `boolean` | `false` | 선택된 상태 여부 (배경색 및 테두리 변경) |
| `showCheckbox` | `boolean` | `false` | 우측에 체크박스 표시 여부 |
| `onClick` | `(id: string) => void` | - | 클릭 시 호출되는 핸들러 |

### 사용 예시

```tsx
import { FolderListItem } from "@/features/folder/ui/FolderListItem";

<FolderListItem 
  folder={folderData}
  isSelected={true}
  showCheckbox={true}
  onClick={(id) => console.log(id)}
/>
```

---

## 2. FolderList

여러 개의 `FolderListItem`을 목록으로 렌더링하는 컨테이너 컴포넌트입니다.

### Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `folders` | `Folder[]` | - | 표시할 폴더 배열 |
| `selectedFolderIds` | `string[]` | `[]` | 선택된 폴더 ID 배열 |
| `onFolderClick` | `(id: string) => void` | - | 폴더 클릭 시 호출되는 핸들러 |
| `showCheckbox` | `boolean` | `false` | 각 항목에 체크박스 표시 여부 |

### 사용 예시

```tsx
import { FolderList } from "@/features/folder/ui/FolderList";

<FolderList 
  folders={myFolders}
  selectedFolderIds={['id1', 'id2']}
  onFolderClick={handleToggle}
  showCheckbox={true}
/>
```

## 적용 사례

1.  **장소 상세 -> 내 폴더 저장 (`FolderSelectionModal`)**:
    *   `showCheckbox={true}`로 설정하여 여러 폴더를 선택/해제할 수 있는 UI로 사용됩니다.
2.  **프로필 -> 맛탐정 탭 (`MyFolderList`)**:
    *   `showCheckbox={false}`로 설정하여 내 폴더 목록을 확인하고 상세 페이지로 이동하는 UI로 사용됩니다.
