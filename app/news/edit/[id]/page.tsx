/*
 * path: app/news/edit/[id]/page.tsx
 */
import NewsEditorPage from '@/components/news/NewsEditorPage';

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
    const { id } = await params;
    return <NewsEditorPage mode="edit" articleId={id} />;
}
