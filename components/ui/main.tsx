import { cn } from "@/lib/utils";

export function MainInset({ className, ...props }: React.ComponentProps<"main">) {
    return (
        <main
            data-slot="main-wrapper"
            className={cn("bg-background relative flex w-full flex-col md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2"
                , className
            )}
            {...props}
        />
    )
}

