import { useEffect, useRef } from "react";
import type { CommitGraphRow } from "../../../services/history";

interface CommitGraphProps {
  graph: CommitGraphRow[];
  syncScrollRef: React.RefObject<HTMLDivElement | null>;
}

const BRANCH_COLORS = ["#58a6ff", "#f78166", "#a371f7", "#7ee787", "#ffa657"];
const ROW_HEIGHT = 52;
const COL_WIDTH = 20;
const NODE_RADIUS = 5;
const GRAPH_PADDING = 16;

export function CommitGraph({ graph, syncScrollRef }: CommitGraphProps) {
  const graphRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollSource = syncScrollRef.current;
    const graphEl = graphRef.current;
    if (!scrollSource || !graphEl) return;

    const handleScroll = () => {
      graphEl.scrollTop = scrollSource.scrollTop;
    };

    scrollSource.addEventListener("scroll", handleScroll);
    return () => {
      scrollSource.removeEventListener("scroll", handleScroll);
    };
  }, [syncScrollRef]);

  if (graph.length === 0) return null;

  const maxCol = Math.max(...graph.map((r) => r.column), 0);
  const edgeMaxCol = Math.max(
    ...graph.flatMap((r) =>
      r.edges.flatMap((e) => [e.from_column, e.to_column]),
    ),
    maxCol,
  );
  const totalCols = Math.max(maxCol, edgeMaxCol) + 1;
  const width = totalCols * COL_WIDTH + GRAPH_PADDING * 2;
  const height = graph.length * ROW_HEIGHT;

  const paths: string[] = [];
  const nodes: string[] = [];

  for (let i = 0; i < graph.length; i++) {
    const row = graph[i];
    const y = i * ROW_HEIGHT + ROW_HEIGHT / 2;
    const x = GRAPH_PADDING + row.column * COL_WIDTH;
    const color = BRANCH_COLORS[row.column % BRANCH_COLORS.length];

    for (const edge of row.edges) {
      const fromX = GRAPH_PADDING + edge.from_column * COL_WIDTH;
      const toX = GRAPH_PADDING + edge.to_column * COL_WIDTH;
      const edgeColor = BRANCH_COLORS[edge.color_index % BRANCH_COLORS.length];

      if (fromX === toX) {
        paths.push(
          `<line x1="${fromX}" y1="${y}" x2="${toX}" y2="${y + ROW_HEIGHT}" stroke="${edgeColor}" stroke-width="2" class="graph-lane"/>`,
        );
      } else {
        paths.push(
          `<path d="M ${fromX} ${y} C ${fromX} ${y + ROW_HEIGHT / 2}, ${toX} ${y + ROW_HEIGHT / 2}, ${toX} ${y + ROW_HEIGHT}" stroke="${edgeColor}" stroke-width="2" fill="none" class="graph-lane"/>`,
        );
      }
    }

    if (row.node_type === "merge") {
      nodes.push(
        `<circle cx="${x}" cy="${y}" r="${NODE_RADIUS + 2}" fill="var(--bg-primary)" stroke="${color}" stroke-width="2"/>`,
      );
      nodes.push(
        `<circle cx="${x}" cy="${y}" r="${NODE_RADIUS - 1}" fill="${color}"/>`,
      );
    } else {
      nodes.push(
        `<circle cx="${x}" cy="${y}" r="${NODE_RADIUS}" fill="${color}"/>`,
      );
    }
  }

  const svgContent = `<svg class="commit-graph-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${paths.join("")}${nodes.join("")}</svg>`;

  return (
    <div className="graph-column" ref={graphRef}>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: SVG content is generated internally, not from user input */}
      <div dangerouslySetInnerHTML={{ __html: svgContent }} />
    </div>
  );
}
