// hooks/use-progress.ts
import * as React from 'react';

export function useProgress() {
    const [loaded, setLoaded] = React.useState(0);
    const [total, setTotal] = React.useState(0);

    const fromEvent = React.useCallback((e: ProgressEvent) => {
        if (e.lengthComputable && e.total > 0) {
            setLoaded(e.loaded);
            setTotal(e.total);
        }
    }, []);

    const reset = React.useCallback(() => { setLoaded(0); setTotal(0); }, []);

    return { loaded, total, fromEvent, reset } as const;
}
