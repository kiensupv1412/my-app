// api 
export type ListMediaResp = {
    page: number;
    pageSize: number;
    total: number;
    rows: any[];
};

export type AppErrorKind = 'auth' | 'validation' | 'rate_limit' | 'network' | 'server' | 'unknown';
