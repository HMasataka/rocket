import type { LogFilter } from "../../../services/history";
import { activeFilterCount } from "../../../utils/filter";

interface FilterPanelProps {
  filter: LogFilter;
  onFilterChange: (filter: LogFilter) => void;
  onClearAll: () => void;
  resultCount: number;
  totalCount: number;
}

function formatDateInput(timestamp: number | null): string {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  return date.toISOString().split("T")[0];
}

function parseDateInput(value: string): number | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor(date.getTime() / 1000);
}

export function FilterPanel({
  filter,
  onFilterChange,
  onClearAll,
  resultCount,
  totalCount,
}: FilterPanelProps) {
  const count = activeFilterCount(filter);

  return (
    <div className="filter-panel">
      <div className="filter-grid">
        <div className="filter-group">
          <span className="filter-label">
            <svg viewBox="0 0 16 16" fill="currentColor" role="presentation">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z" />
            </svg>
            Author
          </span>
          <input
            type="text"
            className="filter-input"
            placeholder="e.g. yamada"
            value={filter.author ?? ""}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                author: e.target.value || null,
              })
            }
          />
        </div>

        <div className="filter-group">
          <span className="filter-label">
            <svg viewBox="0 0 16 16" fill="currentColor" role="presentation">
              <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
            </svg>
            Date
          </span>
          <div className="filter-date-range">
            <input
              type="text"
              className="filter-input"
              placeholder="From (YYYY-MM-DD)"
              value={formatDateInput(filter.since)}
              onChange={(e) =>
                onFilterChange({
                  ...filter,
                  since: parseDateInput(e.target.value),
                })
              }
            />
            <span className="filter-date-sep">~</span>
            <input
              type="text"
              className="filter-input"
              placeholder="To (YYYY-MM-DD)"
              value={formatDateInput(filter.until)}
              onChange={(e) =>
                onFilterChange({
                  ...filter,
                  until: parseDateInput(e.target.value),
                })
              }
            />
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">
            <svg viewBox="0 0 16 16" fill="currentColor" role="presentation">
              <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 9.62 4H13.5A1.5 1.5 0 0 1 15 5.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5v-10Z" />
            </svg>
            Path
          </span>
          <input
            type="text"
            className="filter-input"
            placeholder="e.g. internal/auth/**"
            value={filter.path ?? ""}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                path: e.target.value || null,
              })
            }
          />
        </div>

        <div className="filter-group">
          <span className="filter-label">
            <svg viewBox="0 0 16 16" fill="currentColor" role="presentation">
              <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.437 10.437 0 0 1-.524 1.294 6.596 6.596 0 0 1-.426.688z" />
            </svg>
            Message
          </span>
          <input
            type="text"
            className="filter-input"
            placeholder="e.g. feat:, fix bug"
            value={filter.message ?? ""}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                message: e.target.value || null,
              })
            }
          />
        </div>
      </div>

      {count > 0 && (
        <div className="filter-active-bar">
          <div className="filter-chips">
            {filter.author && (
              <span className="filter-chip">
                <svg
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  role="presentation"
                >
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z" />
                </svg>
                {filter.author}
                <button
                  type="button"
                  className="chip-remove"
                  title="Remove"
                  onClick={() => onFilterChange({ ...filter, author: null })}
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    role="presentation"
                  >
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.647-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                  </svg>
                </button>
              </span>
            )}
            {filter.since && (
              <span className="filter-chip">
                <svg
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  role="presentation"
                >
                  <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
                </svg>
                from {formatDateInput(filter.since)}
                <button
                  type="button"
                  className="chip-remove"
                  title="Remove"
                  onClick={() => onFilterChange({ ...filter, since: null })}
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    role="presentation"
                  >
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.647-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                  </svg>
                </button>
              </span>
            )}
            {filter.until && (
              <span className="filter-chip">
                <svg
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  role="presentation"
                >
                  <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
                </svg>
                until {formatDateInput(filter.until)}
                <button
                  type="button"
                  className="chip-remove"
                  title="Remove"
                  onClick={() => onFilterChange({ ...filter, until: null })}
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    role="presentation"
                  >
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.647-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                  </svg>
                </button>
              </span>
            )}
            {filter.path && (
              <span className="filter-chip">
                <svg
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  role="presentation"
                >
                  <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 9.62 4H13.5A1.5 1.5 0 0 1 15 5.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5v-10Z" />
                </svg>
                {filter.path}
                <button
                  type="button"
                  className="chip-remove"
                  title="Remove"
                  onClick={() => onFilterChange({ ...filter, path: null })}
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    role="presentation"
                  >
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.647-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                  </svg>
                </button>
              </span>
            )}
            {filter.message && (
              <span className="filter-chip">
                <svg
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  role="presentation"
                >
                  <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.437 10.437 0 0 1-.524 1.294 6.596 6.596 0 0 1-.426.688z" />
                </svg>
                {filter.message}
                <button
                  type="button"
                  className="chip-remove"
                  title="Remove"
                  onClick={() => onFilterChange({ ...filter, message: null })}
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    role="presentation"
                  >
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.647-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                  </svg>
                </button>
              </span>
            )}
          </div>
          <div className="filter-actions">
            <span className="filter-result-count">
              Showing {resultCount} of {totalCount} commits
            </span>
            <button
              type="button"
              className="filter-clear-all"
              onClick={onClearAll}
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
