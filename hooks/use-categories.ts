import useSWR from 'swr';
import { swrFetcher } from "@/lib/http";
import { Categories, Tags } from "@/types";
import { useSession } from "next-auth/react";

/* --------------------------- CATEGORIES  TAGS--------------------------- */
export function useCategories() {
    const { data: session } = useSession();
    const token = session?.accessToken ?? null;

    const { data, error, isLoading, mutate } = useSWR<Categories>(
        token ? ['/article/categories', token] : null,
        ([url, t]) => swrFetcher(url, t),
        { revalidateOnFocus: false, keepPreviousData: true }
    );

    return { categories: data ?? [], error, isLoading, mutate };
}
