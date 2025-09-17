export interface Media {
    id: number;
    site: number | null;
    folder_id: number | null;
    user_id: number | null;
    media_type: string | null;
    uuid: string;
    name: string;
    alt: string | null;
    caption: string | null;
    link: string | null;
    thumbnail: string | null;
    file_name: string;
    file_url: string;
    file_size: number | null;
    extension: string | null;
    mime: string;
    height: number | null;
    width: number | null;
    duration: number | null;
    orientation: string | null;
    version: string | null;
    created_at: string | null;
    updated_at: string | null;
}