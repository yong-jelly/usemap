export interface SettingFindRequestDto {
    exchange_nm: string;
    symbol?: string;
    active?: boolean;
}

export interface SettingFindResponseDto {
    meta: {
        timestamp: string;
    };
    result: SettingFindResultDto[];
}
export interface ExchangeSettingListRequestDto {
    page: number;
    size?: number; 
    exchange_nm?: string;
    type?: string;
    status?: string;
}


export interface ExchangeSettingCreateRequestDto {
    alias: string;
    about: string;
    api_key: string;
    secret: string;
    password?: string;
    restrict_ip?: string;
}

export interface ExchangeSettingUpdateRequestDto {
    alias: string;
    about: string;
    api_key: string;
    secret: string;
    password?: string;
    restrict_ip?: string;
}

export interface SettingUpdateRequestDto extends ExchangeSettingCreateRequestDto {}

export interface ExchangeSettingListResultDto {
    id: number;
    exchange_nm: string;
    api_key: string;
    secret: string;
    password?: string;
    restrict_ip?: string;
    alias: string;
    status: string;
    about: string;
    updated_by: string | null;
    updated: string;
    created: string;
}
