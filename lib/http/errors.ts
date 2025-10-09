export type AppErrorKind =
    | "unauthorized"
    | "forbidden"
    | "not_found"
    | "validation"
    | "rate_limit"
    | "network"
    | "server"
    | "unknown";

export class AppError extends Error {
    status?: number;
    code?: string;
    kind: AppErrorKind;
    retryable: boolean;
    details?: any;

    constructor(message: string, kind: AppErrorKind = "unknown", opts?: Partial<AppError>) {
        super(message);
        this.name = "AppError";
        this.kind = kind;
        this.retryable = false;
        Object.assign(this, opts);
    }
}