export interface ListRequestDto {
    exchange: string;
    size?: number;
    page?: number;
}

export interface BalanceResponseDto {
    id: Date;
    exchange_nm: string;
    symbol: string;
    free: string;
    used: string;
    total: string;
    created: Date;
}