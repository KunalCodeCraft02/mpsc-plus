"use client";

import { Plus, Trash2, ChevronUp, ChevronDown, Video, FileText } from "lucide-react";
import { Button, Input, Card } from "@/components/ui";
import { extractYoutubeId, youtubeThumb } from "@/lib/utils";

function randKey() {
  return Math.random().toString(36).slice(2);
}

/** Read/write a field-array-shaped value living in react-hook-form state without useFieldArray. */
function useArrayField(form, name) {
  const list = form.watch(name) || [];
  const set = (next) => form.setValue(name, next, { shouldDirty: true });
  const update = (index, patch) =>
    set(list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const remove = (index) => set(list.filter((_, i) => i !== index));
  const add = (item) => set([...list, item]);
  const move = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    set(next);
  };
  return { list, update, remove, add, move };
}

export function LectureBuilderSection({ form }) {
  const { list, update, remove, add, move } = useArrayField(form, "lectures");

  return (
    <div className="space-y-3">
      {list.map((lecture, idx) => {
        const videoId = extractYoutubeId(lecture.youtubeUrl || "");
        const urlError = lecture.youtubeUrl && !videoId ? "Please enter a valid YouTube video URL." : "";
        return (
          <Card key={lecture.id ?? lecture.key ?? idx} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-[12px] font-bold text-white">
                {idx + 1}
              </span>
              <p className="text-[13px] font-bold text-ink">Lecture {idx + 1}</p>
              <div className="ml-auto flex items-center gap-1">
                <Button variant="ghost" size="icon" type="button" onClick={() => move(idx, -1)} title="Move up">
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" type="button" onClick={() => move(idx, 1)} title="Move down">
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="text-accent-600 hover:bg-accent-50"
                  onClick={() => remove(idx)}
                  title="Remove Lecture"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              {videoId ? (
                <span className="hidden h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-200 sm:block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={youtubeThumb(videoId)} alt="" className="h-full w-full object-cover" />
                </span>
              ) : null}
              <div className="min-w-0 flex-1 space-y-3">
                <Input
                  label="Lecture Title"
                  placeholder="Introduction to Rajyaseva"
                  value={lecture.title || ""}
                  onChange={(e) => update(idx, { title: e.target.value })}
                />
                <Input
                  label="YouTube Video URL"
                  placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX"
                  value={lecture.youtubeUrl || ""}
                  error={urlError}
                  onChange={(e) => update(idx, { youtubeUrl: e.target.value })}
                />
              </div>
            </div>
          </Card>
        );
      })}

      {!list.length ? (
        <Card className="flex flex-col items-center gap-2 py-6 text-center">
          <Video className="h-5 w-5 text-slate-300" />
          <p className="text-[13px] text-muted">No lectures yet — add the first one below.</p>
        </Card>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        fullWidth
        leftIcon={Plus}
        onClick={() => add({ key: randKey(), title: "", youtubeUrl: "" })}
      >
        Add Lecture
      </Button>
    </div>
  );
}

export function PdfBuilderSection({ form }) {
  const { list, update, remove, add, move } = useArrayField(form, "pdfs");

  return (
    <div className="space-y-3">
      {list.map((pdf, idx) => (
        <Card key={pdf.id ?? pdf.key ?? idx} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-[12px] font-bold text-white">
              {idx + 1}
            </span>
            <p className="text-[13px] font-bold text-ink">PDF {idx + 1}</p>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="icon" type="button" onClick={() => move(idx, -1)} title="Move up">
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" type="button" onClick={() => move(idx, 1)} title="Move down">
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="text-accent-600 hover:bg-accent-50"
                onClick={() => remove(idx)}
                title="Remove PDF"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Input
            label="Title"
            placeholder="Rajyaseva Syllabus"
            value={pdf.title || ""}
            onChange={(e) => update(idx, { title: e.target.value })}
          />
          <Input
            label="PDF Link"
            placeholder="https://storage…/notes.pdf"
            value={pdf.url || ""}
            onChange={(e) => update(idx, { url: e.target.value })}
          />
        </Card>
      ))}

      {!list.length ? (
        <Card className="flex flex-col items-center gap-2 py-6 text-center">
          <FileText className="h-5 w-5 text-slate-300" />
          <p className="text-[13px] text-muted">No study materials yet — add the first one below.</p>
        </Card>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        fullWidth
        leftIcon={Plus}
        onClick={() => add({ key: randKey(), title: "", url: "" })}
      >
        Add PDF
      </Button>
    </div>
  );
}
