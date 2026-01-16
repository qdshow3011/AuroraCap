import { useState, useEffect } from 'react'
import { View, Text, Pressable, ActivityIndicator, RefreshControl, ScrollView } from 'react-native'
import { supabase } from '../lib/supabase'

interface InsiderArticle {
  id: string;
  title: string;
  content: string;
  content_html?: string;
  category: 'research' | 'analysis' | 'strategy' | 'report' | 'other';
  audience: 'all' | 'admin' | 'partner' | 'specific';
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export default function InsiderList({ onOpenDetail, lang = 'zh' }: { onOpenDetail: (article: InsiderArticle) => void; lang?: 'zh' | 'en' }) {
  const [list, setList] = useState<InsiderArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const title = lang === 'zh' ? '内参文章' : 'Insider Articles'

  const fetchArticles = async () => {
    try {
      setLoading(true)
      // 从Supabase直接获取内参文章
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      const { data, error } = await supabase
        .from('internal_references')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      
      // Map content to content_html for consistency
      const processedArticles = (data || []).map((article: any) => ({
        ...article,
        content_html: article.content
      }))
      
      setList(processedArticles)
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    fetchArticles()
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#0f172a' }}>
      <Text style={{ color: '#fff', fontSize: 18, marginBottom: 12, fontWeight: 'bold' }}>{title}</Text>
      
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <ScrollView 
          style={{ flex: 1 }} 
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={['#3b82f6']} 
              tintColor="#3b82f6"
            />
          }
        >
          {list.length === 0 ? (
            <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 50 }}>
              {lang === 'zh' ? '暂无内参文章' : 'No insider articles available'}
            </Text>
          ) : (
            list.map(item => (
              <Pressable 
                key={item.id} 
                onPress={() => onOpenDetail(item)} 
                style={{ 
                  padding: 16, 
                  borderBottomWidth: 1, 
                  borderColor: '#1e293b',
                  backgroundColor: '#1e293b',
                  borderRadius: 8,
                  marginBottom: 8
                }}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '500', marginBottom: 4 }}>
                  {item.title}
                </Text>
                <Text style={{ color: '#3b82f6', fontSize: 12, marginBottom: 2 }}>
                  {lang === 'zh' ? `分类: ${item.category === 'research' ? '研究报告' : 
                   item.category === 'analysis' ? '分析评论' : 
                   item.category === 'strategy' ? '投资策略' : 
                   item.category === 'report' ? '业绩报告' : '其他'}` : 
                   `Category: ${item.category}`}
                </Text>
                <Text style={{ color: '#64748b', fontSize: 11 }}>
                  {new Date(item.published_at || item.created_at).toLocaleDateString()}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </View>
  )
}
