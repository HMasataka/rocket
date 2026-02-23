import type {
  DiffHunk,
  DiffLine,
  HunkIdentifier,
  WordSegment,
} from "../../../services/git";

export function toHunkIdentifier(hunk: DiffHunk): HunkIdentifier {
  return {
    old_start: hunk.old_start,
    old_lines: hunk.old_lines,
    new_start: hunk.new_start,
    new_lines: hunk.new_lines,
  };
}

export function wordHighlightClass(
  kind: DiffLine["kind"],
  highlighted: boolean,
): string | undefined {
  if (!highlighted) return undefined;
  if (kind === "addition") return "word-add";
  if (kind === "deletion") return "word-del";
  return undefined;
}

export function segmentKey(seg: WordSegment, index: number): string {
  return `${index}-${seg.highlighted ? "h" : "n"}-${seg.text.length}`;
}
