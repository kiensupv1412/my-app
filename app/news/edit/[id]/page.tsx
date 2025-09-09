import NewsEditorPage from '@/components/news/NewsEditorPage';

type Props = { params: { id: string } };

export default function Page({ params }: Props) {
    const { id } = params;
    return <NewsEditorPage id={id} />;
}
