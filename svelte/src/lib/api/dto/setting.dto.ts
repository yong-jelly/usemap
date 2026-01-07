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

export interface SettingCreateRequestDto {
    exchange_template_id: number | null;
    exchange_nm: string;
    symbol: string;
    slack_webhook_url: string;
    config_tag: string;
    real_trading_enabled: boolean;
    order_buy_amount_usdt: number;
    order_sell_amount_usdt: number;
    order_random_percent: number;
    price_range_percent: number;
    minimum_order_usdt: number;
    order_slot_count: number;
    max_lock_before_reboot: number;
    exist_order_amount_link_enabled: boolean;
    balance_pmg_change_percent: number;
    balance_usdt_change_percent: number;
    minimum_process_interval_mins: number;
    maximum_process_interval_mins: number;
}

export interface SettingUpdateRequestDto extends SettingCreateRequestDto {}


export interface SettingFindResultDto {
    id: number;
    exchange_nm: string;
    symbol: string;
    exec_count: number;
    last_exec_at: string | null;
    first_exec_at: string | null;
    slack_webhook_url: string;
    config_tag: string;
    is_active: boolean;
    real_trading_enabled: boolean;
    order_buy_amount_usdt: number;
    order_sell_amount_usdt: number;
    order_random_percent: string;
    price_range_percent: string;
    minimum_order_usdt: number;
    order_slot_count: number;
    exist_order_amount_link_enabled: boolean;
    balance_pmg_change_percent: string;
    balance_usdt_change_percent: string;
    max_lock_before_reboot: number;
    minimum_process_interval_mins: number;
    maximum_process_interval_mins: number;
    created_at: string;
    updated_at: string;
}
