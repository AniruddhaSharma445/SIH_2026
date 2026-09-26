import React from 'react';
import {
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  X,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';

export interface DocumentFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  availableTags: string[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  sortOption: 'newest' | 'oldest' | 'size';
  onSortOptionChange: (sort: 'newest' | 'oldest' | 'size') => void;
  totalReviewedCount?: number;
  filteredCount?: number;
}

export const DocumentFilterBar: React.FC<DocumentFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  activeTags,
  onToggleTag,
  onClearTags,
  availableTags,
  viewMode,
  onViewModeChange,
  sortOption,
  onSortOptionChange,
  totalReviewedCount = 105,
  filteredCount,
}) => {
  const isAllSelected = activeTags.length === 0;

  return (
    <div className="space-y-4">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Case Evidence Documents ({totalReviewedCount} total reviewed)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Verified primary evidence items linked into current case docket
            {filteredCount !== undefined && (
              <span className="ml-2 font-medium text-slate-700">
                • Showing {filteredCount} matched records
              </span>
            )}
          </p>
        </div>

        {/* Right-aligned controls: View toggle & Sort dropdown */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Sort Dropdown */}
          <div className="relative flex items-center">
            <label htmlFor="document-sort-select" className="sr-only">
              Sort Documents
            </label>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fffefb] border border-[#ddd6c6] rounded-lg text-xs font-semibold text-slate-700 shadow-2xs hover:bg-[#f4f2ea] transition-colors">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#a94e2c]" />
              <select
                id="document-sort-select"
                value={sortOption}
                onChange={(e) => onSortOptionChange(e.target.value as 'newest' | 'oldest' | 'size')}
                className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-hidden cursor-pointer pr-1"
                aria-label="Sort documents"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="size">File size</option>
              </select>
            </div>
          </div>

          {/* View Toggle Buttons */}
          <div
            className="flex items-center bg-[#f4f2ea] border border-[#ddd6c6] rounded-lg p-0.5 shadow-2xs"
            role="group"
            aria-label="Document view layout"
          >
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#a94e2c] shadow-xs border border-[#ddd6c6]/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
              title="Grid view"
              aria-label="Switch to grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-[#a94e2c] shadow-xs border border-[#ddd6c6]/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
              title="List view"
              aria-label="Switch to list view"
              aria-pressed={viewMode === 'list'}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Sticky Filter & Search Row */}
      <div className="sticky top-0 z-20 bg-[#fffefb]/95 backdrop-blur-md py-3 border-y border-[#e5e0d8] -mx-1 px-1 sm:px-2 space-y-3">
        {/* Search Input matching Topbar search style */}
        <div className="relative w-full">
          <div className="flex items-center w-full px-3.5 py-2 bg-[#f4f2ea] hover:bg-[#ede9df] focus-within:bg-[#fffefb] border border-[#ddd6c6] focus-within:border-[#a94e2c] focus-within:ring-2 focus-within:ring-[#a94e2c]/20 rounded-lg text-xs transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search documents by title, tag, or linked entity (e.g., 'FIR', 'Rahul Sharma', 'Circular')..."
              className="w-full bg-transparent text-slate-800 text-xs placeholder:text-slate-400 focus:outline-hidden"
              aria-label="Search documents by title, tag, or entity name"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer ml-1"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips Row (Severity/tag pill style) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" />
            Filter:
          </span>

          {/* "All documents" chip */}
          <button
            type="button"
            onClick={onClearTags}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              isAllSelected
                ? 'bg-[#a94e2c] text-white border-[#a94e2c] shadow-2xs'
                : 'bg-[#fffefb] text-slate-700 border-[#ddd6c6] hover:bg-[#f4f2ea]'
            }`}
            aria-pressed={isAllSelected}
          >
            All documents
          </button>

          {/* Generated Tag Chips */}
          {availableTags.map((tag) => {
            const isActive = activeTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onToggleTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#a94e2c] text-white border-[#a94e2c] shadow-2xs font-bold'
                    : 'bg-[#fffefb] text-slate-700 border-[#ddd6c6] hover:bg-[#f4f2ea]'
                }`}
                aria-pressed={isActive}
              >
                <span>{tag}</span>
                {isActive && <X className="w-3 h-3 text-white/80" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
