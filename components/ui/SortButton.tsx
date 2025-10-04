// import icon
import {
    ArrowUpDown,
    ArrowUpWideNarrow,
    ArrowDownWideNarrow,
} from "lucide-react";
import { Button } from "./button";

// Nút header có 3 trạng thái: none -> asc -> desc -> none
export default function SortButton({
    column,
    children,
}: {
    column: import("@tanstack/react-table").Column<any, unknown>;
    children: React.ReactNode;
}) {
    const sorted = column.getIsSorted(); // false | 'asc' | 'desc'
    const Icon =
        sorted === "asc"
            ? ArrowUpWideNarrow
            : sorted === "desc"
                ? ArrowDownWideNarrow
                : ArrowUpDown;

    const handleClick = () => {
        const s = column.getIsSorted();
        if (!s) column.toggleSorting(false);      // -> asc
        else if (s === "asc") column.toggleSorting(true); // -> desc
        else column.clearSorting();               // -> none
    };

    return (
        <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={handleClick}>
            {children}
            <Icon className="ml-2 size-4" />
        </Button>
    );
}
