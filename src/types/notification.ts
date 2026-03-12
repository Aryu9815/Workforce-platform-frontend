export interface NotificationResponse {
    id: string;
    created_at: string;
    updated_at: string;
    tenant_id: string;
    user_id: string;
    title: string;
    message: string;
    entity_type?: string;
    entity_id?: string;
    is_read: boolean;
}
