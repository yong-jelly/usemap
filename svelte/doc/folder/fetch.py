#!/usr/bin/env python3
import requests
import json

BASE_URL = "https://pages.map.naver.com/save-pages/api/maps-bookmark/v3/shares/exposure/GyoWc2IdvsMBKqHt:xR7FZkC75KbE8NFe0CUauL9hfOmHZw"

# 첫 호출로 총 개수 확인
print("첫 페이지 호출 중...")
response = requests.get(f"{BASE_URL}?start=0&limit=20")
data = response.json()
total = data.get('totalFolderCount', 0)

print(f"총 폴더 수: {total}")

# 모든 shareId 수집
all_share_ids = []
start = 0

while start < total:
    url = f"{BASE_URL}?start={start}&limit=20"
    print(f"호출: {url}")

    response = requests.get(url)
    data = response.json()

    folders = data.get('folders', [])
    for folder in folders:
        share_id = folder.get('shareId')
        if share_id:
            all_share_ids.append(share_id)

    start += 20

# JSON 배열로 출력
print(json.dumps(all_share_ids, indent=2))
print(f"총 {len(all_share_ids)}개 추출됨")
