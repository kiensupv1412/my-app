'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import { PlaceholderPlugin } from '@platejs/media/react';
import {
  AudioLinesIcon,
  FileUpIcon,
  FilmIcon,
  ImageDown,
  ImageIcon,
  LinkIcon,
} from 'lucide-react';
import { isUrl, KEYS } from 'platejs';
import { useEditorRef } from 'platejs/react';
import { toast } from 'sonner';
import { useFilePicker } from 'use-file-picker';
import { Editor, Element as SlateElement, Node, Range, Transforms } from "slate";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

import {
  ToolbarSplitButton,
  ToolbarSplitButtonPrimary,
  ToolbarSplitButtonSecondary,
} from '@/components/editor/ui/toolbar';
import { MediaItem } from '@/types';
import { usePageLimit, usePagination } from '@/hooks/usePagination';
import { useMediaPage } from '@/hooks/use-media';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Pagination from '@/components/ui/pagination';

const MEDIA_CONFIG: Record<
  string,
  {
    accept: string[];
    icon: React.ReactNode;
    title: string;
    tooltip: string;
  }
> = {
  [KEYS.audio]: {
    accept: ['audio/*'],
    icon: <AudioLinesIcon className="size-4" />,
    title: 'Insert Audio',
    tooltip: 'Audio',
  },
  [KEYS.file]: {
    accept: ['*'],
    icon: <FileUpIcon className="size-4" />,
    title: 'Insert File',
    tooltip: 'File',
  },
  [KEYS.img]: {
    accept: ['image/*'],
    icon: <ImageIcon className="size-4" />,
    title: 'Insert Image',
    tooltip: 'Image',
  },
  [KEYS.video]: {
    accept: ['video/*'],
    icon: <FilmIcon className="size-4" />,
    title: 'Insert Video',
    tooltip: 'Video',
  },
};

export function MediaToolbarButton({
  nodeType,
  ...props
}: DropdownMenuProps & { nodeType: string }) {
  const currentConfig = MEDIA_CONFIG[nodeType];

  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const { openFilePicker } = useFilePicker({
    accept: currentConfig.accept,
    multiple: true,
    onFilesSelected: async ({ plainFiles: updatedFiles }) => {
      const files = Array.from(updatedFiles ?? []);
      if (!files.length) return;

      const sel = editor.selection;
      if (sel && Range.isCollapsed(sel)) {
        const paraEntry = Editor.above(editor, {
          match: n => SlateElement.isElement(n) && (n as any).type === "p",
          mode: "lowest",
        });

        if (paraEntry) {
          const [paraNode, paraPath] = paraEntry as [any, any];
          // dòng <p> rỗng nếu chuỗi text gộp lại là ""
          if (Node.string(paraNode) === "") {
            Transforms.removeNodes(editor, { at: paraPath });
          }
        }
      }
      editor.getTransforms(PlaceholderPlugin).insert.media(updatedFiles);
    },
  });

  const [dialogMediaOpen, setDialogMediaOpen] = React.useState(false);

  return (
    <>
      <ToolbarSplitButton
        onClick={() => {
          openFilePicker();
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        pressed={open}
      >
        <ToolbarSplitButtonPrimary>
          {currentConfig.icon}
        </ToolbarSplitButtonPrimary>

        <DropdownMenu
          open={open}
          onOpenChange={setOpen}
          modal={false}
          {...props}
        >
          <DropdownMenuTrigger asChild>
            <ToolbarSplitButtonSecondary />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            onClick={(e) => e.stopPropagation()}
            align="start"
            alignOffset={-32}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => openFilePicker()}>
                {currentConfig.icon}
                Upload from computer
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
                <LinkIcon />
                Insert via URL
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialogMediaOpen(true)}>
                <ImageDown />
                Chọn từ thư viện
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ToolbarSplitButton>

      <AlertDialog
        open={dialogOpen}
        onOpenChange={(value) => {
          setDialogOpen(value);
        }}
      >
        <AlertDialogContent className="gap-6">
          <MediaUrlDialogContent
            currentConfig={currentConfig}
            nodeType={nodeType}
            setOpen={setDialogOpen}
          />
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={dialogMediaOpen}
        onOpenChange={(value) => {
          setDialogMediaOpen(value);
        }}
      >
        <AlertDialogContent className="w-[90vw] max-w-[90vw] sm:max-w-[90vw] h-[80vh] max-h-[80vh] p-0 overflow-hidden flex flex-col">
          <PickMediaDialogContent
            currentConfig={currentConfig}
            nodeType={nodeType}
            setDialogMediaOpen={setDialogMediaOpen}
          />
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MediaUrlDialogContent({
  currentConfig,
  nodeType,
  setOpen,
}: {
  currentConfig: (typeof MEDIA_CONFIG)[string];
  nodeType: string;
  setOpen: (value: boolean) => void;
}) {
  const editor = useEditorRef();
  const [url, setUrl] = React.useState('');

  const embedMedia = React.useCallback(() => {
    if (!isUrl(url)) return toast.error('Invalid URL');

    setOpen(false);
    editor.tf.insertNodes({
      children: [{ text: '' }],
      name: nodeType === KEYS.file ? url.split('/').pop() : undefined,
      type: nodeType,
      url,
    });
  }, [url, editor, nodeType, setOpen]);

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{currentConfig.title}</AlertDialogTitle>
      </AlertDialogHeader>

      <AlertDialogDescription className="group relative w-full">
        <label
          className="absolute top-1/2 block -translate-y-1/2 cursor-text px-1 text-sm text-muted-foreground/70 transition-all group-focus-within:pointer-events-none group-focus-within:top-0 group-focus-within:cursor-default group-focus-within:text-xs group-focus-within:font-medium group-focus-within:text-foreground has-[+input:not(:placeholder-shown)]:pointer-events-none has-[+input:not(:placeholder-shown)]:top-0 has-[+input:not(:placeholder-shown)]:cursor-default has-[+input:not(:placeholder-shown)]:text-xs has-[+input:not(:placeholder-shown)]:font-medium has-[+input:not(:placeholder-shown)]:text-foreground"
          htmlFor="url"
        >
          <span className="inline-flex bg-background px-2">URL</span>
        </label>
        <Input
          id="url"
          className="w-full"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') embedMedia();
          }}
          placeholder=""
          type="url"
          autoFocus
        />
      </AlertDialogDescription>

      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={(e) => {
            e.preventDefault();
            embedMedia();
          }}
        >
          Accept
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}


function PickMediaDialogContent({
  currentConfig,
  nodeType,
  setDialogMediaOpen }:
  {
    currentConfig: (typeof MEDIA_CONFIG)[string],
    nodeType: string,
    setDialogMediaOpen: (value: boolean) => void
  }) {

  const editor = useEditorRef();
  const [selected, setSelected] = React.useState<MediaItem | undefined>(undefined);

  const { page, setPage, limit, setLimit } = usePageLimit(1, 40);
  const { data: media = [], meta, mediaLoading } = useMediaPage(page, limit);

  const pagination = usePagination({ limit, setLimit, meta, page, setPage });
  const cx = (...cls: (string | false | null | undefined)[]) => cls.filter(Boolean).join(' ');

  const bgItems = media.filter((m) => m.is_background);
  const normalItems = media.filter((m) => !m.is_background);

  const commit = React.useCallback(() => {
    if (!selected) return;
    const url = selected.file_url;
    if (!url) return toast.error('Invalid URL');

    editor.tf.insertNodes({
      type: nodeType,
      url,
      name: nodeType === KEYS.file ? (selected.file_name || selected.name || url.split('/').pop() || undefined) : undefined,
      children: [{ text: '' }],
    });
    setDialogMediaOpen(false);
    toast.success('Đã chèn media.');
  }, [editor, nodeType, selected, setDialogMediaOpen]);

  return (
    <>
      <AlertDialogHeader className="px-4 py-3 shrink-0">
        <AlertDialogTitle>{currentConfig.title}</AlertDialogTitle>
        <AlertDialogDescription>
          Click để chọn, double-click để chọn nhanh.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {bgItems.map((media) => {
            const isSel = selected?.id === media.id;
            const src = media.file_url;
            return (
              <button
                key={media.id}
                type="button"
                title={media.alt ?? ""}
                onClick={() => setSelected(media)}
                onDoubleClick={commit}
                className={cx(
                  "relative h-24 w-full overflow-hidden rounded-md border",
                  "transition hover:ring-2 hover:ring-primary",
                  isSel && "ring-2 ring-primary border-primary"
                )}
              >
                <img
                  src={src}
                  alt={media.alt ?? "thumb"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {isSel && (
                  <span className="absolute right-1 top-1 text-[10px] rounded bg-primary px-1.5 py-0.5 text-primary-foreground">
                    Đã chọn
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {normalItems.map((media) => {
            const isSel = selected?.id === media.id;
            const src = media.file_url;
            return (
              <button
                key={media.id}
                type="button"
                title={media.alt ?? ""}
                onClick={() => setSelected(media)}
                onDoubleClick={commit}
                className={cx(
                  "relative h-24 w-full overflow-hidden rounded-md border",
                  "transition hover:ring-2 hover:ring-primary",
                  isSel && "ring-2 ring-primary border-primary"
                )}
              >
                <img
                  src={src}
                  alt={media.alt ?? "thumb"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {isSel && (
                  <span className="absolute right-1 top-1 text-[10px] rounded bg-primary px-1.5 py-0.5 text-primary-foreground">
                    Đã chọn
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <DialogFooter className="px-4 py-3 border-t bg-background flex items-center justify-between gap-3">
        <Pagination
          {...pagination}
          onChangeLimit={(n) => {
            setLimit(n);
            setPage(1);
          }}
          perPageOptions={[40, 80, 120, 160]}
        />

        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => setDialogMediaOpen(false)}>
            Hủy
          </Button>
          <Button type="button" onClick={commit} disabled={!selected}>
            Chọn
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}