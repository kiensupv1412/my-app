// [MOVE] tách AppError ra file riêng để tránh vòng phụ thuộc

import { AppErrorKind } from "@/types/errors";

export class AppError extends Error {
    status?: number;
    code?: string;
    kind: AppErrorKind;
    retryable: boolean;
    details?: any;
    constructor(message: string, kind: AppErrorKind = 'unknown', opts?: Partial<AppError>) {
        super(message);
        this.name = 'AppError';
        this.kind = kind;
        this.retryable = false;
        Object.assign(this, opts);
    }
}
