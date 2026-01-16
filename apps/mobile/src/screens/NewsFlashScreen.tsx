import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { supabase } from '../lib/supabase';

interface NewsFlash {
  id: string;
  title: string;
  content: string;
  source?: string;
  published_at?: string;
  status: 'draft' | 'published' | 'archived';
  category?: 'market' | 'company' | 'industry' | 'other';
}

export default function NewsFlashScreen({ lang = 'zh', demo = false }: { lang?: 'zh' | 'en'; demo?: boolean }) {
  const [newsFlashes, setNewsFlashes] = useState<NewsFlash[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const t = lang === 'zh' ? {
    title: '快讯',
    loading: '加载中...',
    noData: '暂无快讯数据',
    source: '来源：',
    time: '发布时间：'
  } : {
    title: 'News Flash',
    loading: 'Loading...',
    noData: 'No news flash data',
    source: 'Source: ',
    time: 'Published: '
  };

  const fetchNewsFlashes = async () => {
    setLoading(true);
    try {
      // 从Supabase获取数据
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) {
        console.error('Error fetching news flashes:', error);
        setNewsFlashes([]);
      } else {
        setNewsFlashes(data || []);
      }
    } catch (error) {
      console.error('Error fetching news flashes:', error);
      setNewsFlashes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNewsFlashes();
  }, [lang]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNewsFlashes();
  };

  const getCategoryText = (category?: string): string => {
    const categoryMap: Record<string, string> = {
      market: '市场动态',
      company: '公司新闻',
      industry: '行业资讯',
      other: '其他资讯'
    };
    return categoryMap[category || 'other'] || '行业快讯';
  };

  // 截取摘要内容（约100字）
  const getSummary = (content: string): string => {
    // 移除HTML标签（如果有的话）
    const plainText = content.replace(/<[^>]*>/g, '');
    // 截取约100字
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
  };

  const renderNewsFlash = ({ item }: { item: NewsFlash }) => (
    <View style={styles.newsItem}>
      {/* 左边竖线和时间节点 */}
      <View style={styles.timelineContainer}>
        <View style={styles.timelineLine} />
        <View style={styles.timelineDot} />
        <Text style={styles.timelineTime}>
          {item.published_at ? new Date(item.published_at).toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
        </Text>
      </View>
      
      {/* 右边内容区域 */}
      <View style={styles.contentContainer}>
        {/* 分类 */}
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>
            {getCategoryText(item.category)}
          </Text>
        </View>
        
        {/* 标题 */}
        <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
        
        {/* 内容摘要 */}
        <Text style={styles.newsContent} numberOfLines={4}>{getSummary(item.content)}</Text>
        
        {/* 展开按钮 */}
        <Pressable style={styles.expandButton}>
          <Text style={styles.expandButtonText}>展开</Text>
        </Pressable>
        
        {/* 底部操作按钮 */}
        <View style={styles.actionButtons}>
          <Pressable style={styles.actionButton}>
            <Text style={styles.actionButtonIcon}>⭐</Text>
            <Text style={styles.actionButtonText}>收藏</Text>
          </Pressable>
          <Pressable style={styles.actionButton}>
            <Text style={styles.actionButtonIcon}>👍</Text>
            <Text style={styles.actionButtonText}>点赞</Text>
          </Pressable>
          <Pressable style={styles.actionButton}>
            <Text style={styles.actionButtonIcon}>🔗</Text>
            <Text style={styles.actionButtonText}>分享</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t.loading}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.title}</Text>
      </View>
      <FlatList
        data={newsFlashes}
        renderItem={renderNewsFlash}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t.noData}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  listContainer: {
    padding: 16,
  },
  newsItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    position: 'relative',
  },
  // 时间线相关样式
  timelineContainer: {
    alignItems: 'center',
    marginRight: 16,
    paddingTop: 4,
  },
  timelineLine: {
    position: 'absolute',
    top: 20,
    bottom: 0,
    width: 2,
    backgroundColor: '#e0e0e0',
    left: 9,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1976d2',
    zIndex: 1,
  },
  timelineTime: {
    marginTop: 4,
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    width: 40,
  },
  // 内容容器
  contentContainer: {
    flex: 1,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#e3f2fd',
    marginBottom: 8,
  },
  categoryText: {
    color: '#1976d2',
    fontSize: 11,
    fontWeight: '600',
  },
  newsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    lineHeight: 24,
  },
  newsContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  // 展开按钮
  expandButton: {
    marginBottom: 12,
  },
  expandButtonText: {
    fontSize: 13,
    color: '#1976d2',
    fontWeight: '500',
  },
  // 底部操作按钮
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionButtonIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    color: '#333',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});