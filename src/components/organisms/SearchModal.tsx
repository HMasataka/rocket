import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CodeSearchResult,
  CommitSearchResult,
  FilenameSearchResult,
} from "../../services/search";
import {
  searchCode,
  searchCommits,
  searchFilenames,
} from "../../services/search";
import { Modal } from "./Modal";

type SearchTab = "code" | "commits" | "filenames";

interface SearchModalProps {
  onClose: () => void;
}

function highlightMatch(text: string, query: string): React.ReactNode[] {
  if (!query) return [text];

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) => {
    const key = `${i}-${part}`;
    regex.lastIndex = 0;
    if (regex.test(part)) {
      return <mark key={key}>{part}</mark>;
    }
    return <span key={key}>{part}</span>;
  });
}

function formatCommitDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString();
}

export function SearchModal({ onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("code");
  const [codeResults, setCodeResults] = useState<CodeSearchResult[]>([]);
  const [commitResults, setCommitResults] = useState<CommitSearchResult[]>([]);
  const [filenameResults, setFilenameResults] = useState<
    FilenameSearchResult[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [isRegex, setIsRegex] = useState(false);
  const [searchDiff, setSearchDiff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const performSearch = useCallback(
    (q: string, tab: SearchTab, regex: boolean, diff: boolean) => {
      if (!q.trim()) {
        setCodeResults([]);
        setCommitResults([]);
        setFilenameResults([]);
        setError(null);
        return;
      }

      requestIdRef.current += 1;
      const thisRequestId = requestIdRef.current;

      setLoading(true);
      setError(null);

      const searchPromise = (() => {
        switch (tab) {
          case "code":
            return searchCode(q, regex).then((results) => {
              if (requestIdRef.current === thisRequestId) {
                setCodeResults(results);
              }
            });
          case "commits":
            return searchCommits(q, diff).then((results) => {
              if (requestIdRef.current === thisRequestId) {
                setCommitResults(results);
              }
            });
          case "filenames":
            return searchFilenames(q).then((results) => {
              if (requestIdRef.current === thisRequestId) {
                setFilenameResults(results);
              }
            });
        }
      })();

      searchPromise
        .catch((e: unknown) => {
          if (requestIdRef.current === thisRequestId) {
            setError(String(e));
          }
        })
        .finally(() => {
          if (requestIdRef.current === thisRequestId) {
            setLoading(false);
          }
        });
    },
    [],
  );

  const scheduleSearch = useCallback(
    (q: string, tab: SearchTab, regex: boolean, diff: boolean) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        performSearch(q, tab, regex, diff);
      }, 300);
    },
    [performSearch],
  );

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newQuery = e.target.value;
      setQuery(newQuery);
      scheduleSearch(newQuery, activeTab, isRegex, searchDiff);
    },
    [activeTab, isRegex, searchDiff, scheduleSearch],
  );

  const handleTabChange = useCallback(
    (tab: SearchTab) => {
      setActiveTab(tab);
      setError(null);
      if (query.trim()) {
        performSearch(query, tab, isRegex, searchDiff);
      }
    },
    [query, isRegex, searchDiff, performSearch],
  );

  const handleRegexToggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newRegex = e.target.checked;
      setIsRegex(newRegex);
      if (query.trim()) {
        performSearch(query, activeTab, newRegex, searchDiff);
      }
    },
    [query, activeTab, searchDiff, performSearch],
  );

  const handleSearchDiffToggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newSearchDiff = e.target.checked;
      setSearchDiff(newSearchDiff);
      if (query.trim()) {
        performSearch(query, activeTab, isRegex, newSearchDiff);
      }
    },
    [query, activeTab, isRegex, performSearch],
  );

  const renderResults = () => {
    if (loading) {
      return <div className="search-loading">Searching...</div>;
    }

    if (error) {
      return <div className="search-empty">{error}</div>;
    }

    if (!query.trim()) {
      return <div className="search-empty">Type to search the repository</div>;
    }

    switch (activeTab) {
      case "code":
        return renderCodeResults();
      case "commits":
        return renderCommitResults();
      case "filenames":
        return renderFilenameResults();
    }
  };

  const renderCodeResults = () => {
    if (codeResults.length === 0) {
      return <div className="search-empty">No code matches found</div>;
    }

    return (
      <div className="search-results">
        {codeResults.map((result, i) => (
          <div
            key={`${result.file}:${result.line_number}:${i}`}
            className="search-result"
          >
            <div className="result-file">
              {result.file}
              <span className="result-line-number">:{result.line_number}</span>
            </div>
            <div className="result-line">
              {highlightMatch(result.content, query)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCommitResults = () => {
    if (commitResults.length === 0) {
      return <div className="search-empty">No commit matches found</div>;
    }

    return (
      <div className="search-results">
        {commitResults.map((result) => (
          <div key={result.oid} className="search-result">
            <div className="result-file">{result.short_oid}</div>
            <div className="result-line">
              {highlightMatch(result.message, query)}
            </div>
            <div className="result-commit-meta">
              {result.author_name} &middot;{" "}
              {formatCommitDate(result.author_date)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFilenameResults = () => {
    if (filenameResults.length === 0) {
      return <div className="search-empty">No filename matches found</div>;
    }

    return (
      <div className="search-results">
        {filenameResults.map((result) => (
          <div key={result.path} className="search-result">
            <div className="result-file">
              {highlightMatch(result.path, query)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Modal title="Repository Search" width={600} onClose={onClose}>
      <div className="search-input-group">
        <input
          ref={inputRef}
          type="text"
          className="search-main"
          placeholder="Search in repository..."
          value={query}
          onChange={handleQueryChange}
        />
      </div>
      <div className="search-filters">
        <button
          type="button"
          className={`filter-btn${activeTab === "code" ? " active" : ""}`}
          onClick={() => handleTabChange("code")}
        >
          Code
        </button>
        <button
          type="button"
          className={`filter-btn${activeTab === "commits" ? " active" : ""}`}
          onClick={() => handleTabChange("commits")}
        >
          Commits
        </button>
        <button
          type="button"
          className={`filter-btn${activeTab === "filenames" ? " active" : ""}`}
          onClick={() => handleTabChange("filenames")}
        >
          Filenames
        </button>
      </div>
      <div className="search-options">
        {activeTab === "code" && (
          <label className="search-option-label">
            <input
              type="checkbox"
              checked={isRegex}
              onChange={handleRegexToggle}
            />
            Regex
          </label>
        )}
        {activeTab === "commits" && (
          <label className="search-option-label">
            <input
              type="checkbox"
              checked={searchDiff}
              onChange={handleSearchDiffToggle}
            />
            Search in diffs (pickaxe)
          </label>
        )}
      </div>
      {renderResults()}
    </Modal>
  );
}
