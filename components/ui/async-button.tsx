"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type AsyncButtonProps = React.ComponentProps<typeof Button> & {
    onClickAsync: (e: React.MouseEvent<HTMLButtonElement>) => Promise<unknown>;
    loadingText?: string;
};

export function AsyncButton({
    onClickAsync,
    loadingText = "Loading...",
    children,
    disabled,
    className,
    ...props
}: AsyncButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleClick = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
        // nếu cha đã preventDefault thì thôi
        if (props.onClick) {
            props.onClick(e);
            if (e.defaultPrevented) return;
        }
        setLoading(true);
        try {
            await onClickAsync(e);
        } finally {
            setLoading(false);
        }
    }, [onClickAsync, props]);

    return (
        <Button
            {...props}
            className={className}
            onClick={handleClick}
            disabled={loading || disabled}
            aria-busy={loading}
        >
            {/* giữ chiều rộng ổn định */}
            <span className="inline-flex items-center min-w-[6.5rem] justify-center">
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {loadingText}
                    </>
                ) : (
                    children
                )}
            </span>
        </Button>
    );
}
