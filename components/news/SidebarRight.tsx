'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import * as React from 'react';

type SidebarRightProps = React.ComponentProps<'aside'> & {
    className?: string;
    article: {
        title?: string;
        slug?: string;
        thumb?: string;
    };
};
export default function SidebarRight({
    className,
    article,
    ...props
}: SidebarRightProps) {
    return (
        <aside
            data-slot="sidebar-right"
            className={cn(
                'basis-96 shrink-0',
                'sticky self-start',
                'top[calc(var(--header-height)+12px)]',
                'h-[calc(100vh-var(--header-height)-24px)] overflow-auto',
                'border-l border-r bg-card p-4',
                className
            )}
            {...props}
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input defaultValue={article.title ?? ''} />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">URL</label>
                    <Input defaultValue={article.slug ?? ''} />
                </div>

                <div className="w-full">
                    <div className="aspect-video w-full overflow-hidden rounded bg-muted">
                        <img
                            src={article.thumb ?? '/default.webp'}
                            alt="Pink clouds"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground text-center">
                        pic4.jpg • 511KB • 2592×1728
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">URL</label>
                    <Input defaultValue="https://example.com/wp-content/uploads/pic4.jpg" />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Alt Text</label>
                    <Input placeholder="Văn bản thay thế cho SEO" />
                </div>

                <div className="pt-2 flex items-center justify-between">
                    <Button variant="outline" size="sm">Delete</Button>
                    <Button size="sm">Insert into post</Button>
                </div>
            </div>
        </aside>
    );
}
