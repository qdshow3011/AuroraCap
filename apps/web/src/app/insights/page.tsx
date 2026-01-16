'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function InsightsList() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortByLatest, setSortByLatest] = useState(true);
  const router = useRouter();
  const { t } = useTranslation('common');

  // Fetch insights data with filters
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        console.log('Fetching insights from API...');
        
        // Build the API URL with search, category, and sort parameters
        const url = new URL('/api/insights', window.location.origin);
        if (searchTerm) {
          url.searchParams.append('search', searchTerm);
        }
        if (selectedCategory) {
          url.searchParams.append('category', selectedCategory);
        }
        
        const response = await fetch(url.toString());
        
        if (!response.ok) {
          throw new Error('Failed to fetch insights');
        }
        
        const result = await response.json();
        const { data, meta } = result;
        
        console.log('Successfully fetched insights:', data?.length || 0, 'insights found');
        setInsights(data || []);
        
        // Set categories from meta if available, otherwise extract from insights
        if (meta?.categories) {
          setCategories(meta.categories);
        } else {
          // Extract unique categories from insights
          const uniqueCategories = Array.from(new Set(data?.map((insight: any) => insight.category).filter(Boolean) || []));
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Unexpected error fetching insights:', error);
        setInsights([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [searchTerm, selectedCategory, sortByLatest]);

  // Handle insight click - directly navigate to detail page
  const handleInsightClick = (insightId: string) => {
    router.push('/insights/' + insightId);
  };

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
  };

  // Handle latest articles button click
  const handleLatestArticles = () => {
    setSortByLatest(true);
    // Clear category filter to show all articles
    setSelectedCategory('');
  };

  // Handle search button click
  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  // Handle input change (only updates local state, doesn't trigger search)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">{t('loading')}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 bg-gradient-to-br from-[var(--background)] to-[var(--surface)] min-h-screen relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-20 right-20 w-64 h-64 bg-[var(--primary-light)]/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-40 left-20 w-80 h-80 bg-[var(--secondary)]/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Header */}
      <div className="text-center mb-16 relative z-10">
        <div className="inline-block mb-6">
          <span className="px-4 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-semibold rounded-full">
            专业内参
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[var(--text-primary)] tracking-tight">
          {t('insights')}
        </h1>
        <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
          {t('professionalInsights')}
        </p>
      </div>

      {/* Categories Navigation */}
      <div className="max-w-4xl mx-auto mb-8 relative z-10">
        <div className="flex flex-wrap items-center gap-3 justify-center bg-[var(--surface)]/80 backdrop-blur-sm p-3 rounded-xl shadow-md">
          {/* Latest Articles Button */}
          <button
            onClick={handleLatestArticles}
            className={`px-5 py-2.5 rounded-full font-medium transition-all duration-300 transform ${sortByLatest && !selectedCategory 
              ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-lg scale-105' 
              : 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--border)]'}`}
          >
            最新文章
          </button>
          
          {/* Category Filters */}
          {categories.map((category, index) => (
            <button
              key={index}
              onClick={() => handleCategorySelect(category)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${selectedCategory === category 
                ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-lg' 
                : 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--border)]'}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-3xl mx-auto mb-12 relative z-10">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex gap-3 bg-[var(--surface)]/80 backdrop-blur-sm p-2 rounded-xl shadow-md"
        >
          <input
            type="text"
            placeholder={t('searchInsights')}
            value={searchInput}
            onChange={handleInputChange}
            className="flex-1 px-6 py-4 bg-transparent border-none text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] rounded-lg transition-all"
          />
          <button
            type="submit"
            className="px-8 py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium transform hover:scale-105 active:scale-95"
          >
            搜索
          </button>
        </form>
      </div>

      {/* Insights List */}
      {insights.length === 0 ? (
        <div className="text-center py-20 relative z-10">
          <div className="inline-block mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
          <p className="text-lg text-[var(--text-secondary)]">{t('noInsightsFound')}</p>
          <button 
            onClick={() => {
              setSelectedCategory('');
              setSearchTerm('');
            }}
            className="mt-6 px-6 py-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/20 transition-all duration-300"
          >
            查看全部内参
          </button>
        </div>
      ) : (
        <div className="space-y-8 relative z-10">
          {insights.map((insight, index) => (
            <div
              key={insight.id}
              className="bg-[var(--surface)]/90 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2 overflow-hidden border border-[var(--border)]"
              onClick={() => handleInsightClick(insight.id)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="p-8 md:p-10">
                {/* Category and Date */}
                <div className="flex flex-wrap items-center gap-4 mb-5">
                  {insight.category && (
                    <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--primary-light)]/10 text-[var(--primary)] text-xs font-semibold rounded-full">
                      {insight.category}
                    </span>
                  )}
                  <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    {new Date(insight.created_at).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                
                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-[var(--text-primary)] line-clamp-2 leading-tight">
                  {insight.title}
                </h2>
                
                {/* Summary/Description */}
                <p className="text-[var(--text-secondary)] mb-7 line-clamp-3 leading-relaxed">
                  {insight.summary || insight.description || '暂无摘要'}
                </p>
                
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-[var(--border)]/50">
                  {/* Author (if available) */}
                  {insight.author && (
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      {insight.author}
                    </div>
                  )}
                  
                  {/* Read Count (if available) */}
                  {insight.read_count !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      {insight.read_count} 阅读
                    </div>
                  )}
                  
                  {/* Read More Link */}
                  <div className="ml-auto text-[var(--primary)] flex items-center gap-2 font-medium transition-all hover:gap-3">
                    {t('readMore')}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6" />
                      <path d="M15 12H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
