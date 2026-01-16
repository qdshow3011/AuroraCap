'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function FundsList() {
  const [funds, setFunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation('common');

  useEffect(() => {
    const fetchFunds = async () => {
      try {
        setLoading(true);
        console.log('Fetching funds from Supabase...');
        
        let query = supabase.from('products').select('*');
        
        if (searchTerm) {
          const searchPattern = `%${searchTerm}%`;
          query = query.ilike('name_cn', searchPattern).or(`ilike(description, "${searchPattern}")`);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
          console.error('Supabase error fetching funds:', error);
          setFunds([]);
          return;
        }
        
        console.log('Successfully fetched funds:', data?.length || 0, 'funds found');
        setFunds(data || []);
      } catch (error) {
        console.error('Unexpected error fetching funds:', error);
        setFunds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFunds();
  }, [searchTerm]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">{t('loading')}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 bg-[var(--background)] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--text-primary)]">{t('fundList')}</h1>
        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder={t('searchFunds')}
            className="input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {funds.map((fund) => (
          <Link
            key={fund.id}
            href={`/funds/${fund.id}`}
            className="card block bg-[var(--surface)] overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">{fund.name_cn}</h2>
                <span className={`risk-tag ${fund.status === 'active' ? 'risk-low' : 'risk-high'}`}>
                  {fund.status === 'active' ? t('active') : t('closed')}
                </span>
              </div>
              <p className="text-[var(--text-secondary)] mb-4 line-clamp-2">{fund.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[var(--text-tertiary)]">{t('latestNav')}</p>
                  <p className="text-lg font-medium text-[var(--text-primary)]">¥{fund.nav?.toFixed(4) || '0.0000'}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-tertiary)]">{t('establishDate')}</p>
                  <p className="text-lg font-medium text-[var(--text-primary)]">{new Date(fund.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {funds.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500">{t('noFundsFound')}</p>
        </div>
      )}
    </div>
  );
}
