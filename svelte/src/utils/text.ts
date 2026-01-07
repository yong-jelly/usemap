export const truncateText = (text: string, maxLength: number) => {
    if (text && text.length > maxLength) {
        return `${text.slice(0, maxLength)}...`;
    }
    return text || '';
};

export const formatDate = (dateString: string): string => {
  if (dateString.length !== 8) {
    return dateString; // 유효하지 않은 입력이면 원래 문자열 반환
  }
  
  const year = dateString.slice(0, 4);
  const month = dateString.slice(4, 6);
  const day = dateString.slice(6, 8);
  
  return `${year}년${month}월${day}일`;
};

export const formatDateWithYear = (dateString: string): string => {
  if (dateString.length !== 8) {
    return dateString; // 유효하지 않은 입력이면 원래 문자열 반환
  }
  
  const year = Number.parseInt(dateString.slice(0, 4));
  const month = Number.parseInt(dateString.slice(4, 6));
  const day = Number.parseInt(dateString.slice(6, 8));
  
  const currentYear = new Date().getFullYear();
  
  if (year === currentYear) {
    return `${month}월 ${day}일`;
  }
  return `${year}년 ${month}월 ${day}일`;
};
