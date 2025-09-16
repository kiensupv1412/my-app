// components/media/media-thumb.tsx
'use client'
import Image from 'next/image'
import * as React from 'react'

type Props = {
    src?: string | null
    alt?: string
    fallbackSrc?: string
    className?: string
}

export function MediaThumb({
    src,
    alt = 'thumbnail',
    fallbackSrc = '/thumb-default.jpeg',
    className,
}: Props) {
    const [imgSrc, setImgSrc] = React.useState(src || fallbackSrc)

    React.useEffect(() => {
        setImgSrc(src || fallbackSrc)
    }, [src, fallbackSrc])

    return (
        <Image
            src={imgSrc}
            alt={alt}
            fill
            className={className ?? 'object-cover rounded-lg'}
            placeholder="blur"
            blurDataURL={fallbackSrc}
            onError={() => setImgSrc(fallbackSrc)}
            // optional: sizes để tránh layout shift
            sizes="(max-width: 768px) 100vw, 33vw"
        />
    )
}