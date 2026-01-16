import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Image } from 'react-native'
import { supabase } from '../lib/supabase'

// 内参文章类型定义
interface InsiderArticle {
  id: string
  title: string
  content: string
  category: 'research' | 'analysis' | 'strategy' | 'report' | 'other'
  audience: 'all' | 'admin' | 'partner' | 'specific'
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
  published_at?: string
  featured_image_url?: string
}

export default function InsiderNewsScreen({ lang = 'zh', demo }: { lang?: 'zh' | 'en'; demo?: boolean }) {
  const [articles, setArticles] = useState<InsiderArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // 内参类别数据
  const categories = [
    { id: 'all', name: lang === 'zh' ? '全部' : 'All' },
    { id: 'research', name: lang === 'zh' ? '研究报告' : 'Research' },
    { id: 'analysis', name: lang === 'zh' ? '分析评论' : 'Analysis' },
    { id: 'strategy', name: lang === 'zh' ? '投资策略' : 'Strategy' },
    { id: 'report', name: lang === 'zh' ? '业绩报告' : 'Report' },
    { id: 'other', name: lang === 'zh' ? '其他' : 'Other' }
  ]

  // 语言翻译
  const t = lang === 'zh' ? {
    insiderNews: '内参',
    loading: '加载中...',
    noNews: '暂无内参',
    refresh: '刷新',
    author: '作者',
    category: '分类',
    time: '时间'
  } : {
    insiderNews: 'Insider',
    loading: 'Loading...',
    noNews: 'No articles available',
    refresh: 'Refresh',
    author: 'Author',
    category: 'Category',
    time: 'Time'
  }

  // 获取内参文章数据
  const fetchArticles = async (isRefresh: boolean = false) => {
    try {
      // 从Supabase获取数据，只获取3条最新的数据
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      let query = supabase
        .from('internal_references')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(0, 4) // 增加返回的数据量
      
      // 根据选中的分类进行筛选
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      setArticles(data || [])
      
    } catch (error) {
      console.error('Error fetching articles:', error)
      setArticles([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // 初始加载数据和分类切换时重新加载
  useEffect(() => {
    fetchArticles(true)
  }, [lang, selectedCategory])

  // 下拉刷新
  const handleRefresh = () => {
    setRefreshing(true)
    fetchArticles(true)
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (lang === 'zh') {
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    } else {
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  // 格式化标签显示
  const formatTags = (tags: string[]) => {
    return tags.join(', ')
  }

  return (
    <View style={styles.container}>
      {/* 顶部标题 */}
      <View style={styles.header}>
        <Text style={styles.title}>{t.insiderNews}</Text>
        <View style={styles.headerIcons}>
          <Pressable style={styles.iconButton} onPress={() => console.log('搜索')}>
            <Text style={styles.icon}>🔍</Text>
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => console.log('客服')}>
            <Text style={styles.icon}>🎧</Text>
          </Pressable>
        </View>
      </View>

      {/* 分类筛选栏 */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoryFilter}
        contentContainerStyle={styles.categoryFilterContent}
        bounces={false} // 禁用弹性效果
        automaticallyAdjustContentInsets={false} // 禁用自动调整内边距
      >
        {categories.map((category) => (
          <Pressable
            key={category.id}
            style={styles.categoryItem}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text 
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextSelected
              ]}
            >
              {category.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* 快讯列表 */}
      <ScrollView 
        style={styles.newsList} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
            colors={['#3b82f6']} 
            tintColor='#3b82f6'
          />
        }
      >
        {articles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{loading ? t.loading : t.noNews}</Text>
          </View>
        ) : (
          articles.map((article) => (
            <Pressable key={article.id} style={styles.newsItem}>
              {/* 图标+分类 */}
              <View style={styles.categorySection}>
                <Text style={styles.categoryIcon}>📰</Text>
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryText}>
                    {article.category === 'research' ? '研究报告' : 
                     article.category === 'analysis' ? '分析评论' : 
                     article.category === 'strategy' ? '投资策略' : 
                     article.category === 'report' ? '业绩报告' : '其他'}
                  </Text>
                </View>
              </View>
              
              {/* 大图片 */}
              <View style={styles.articleWithImage}>
                <Image 
                  source={{ uri: article.featured_image_url || 'https://picsum.photos/300/200' }} 
                  style={styles.featuredImage} 
                  resizeMode="cover"
                />
              </View>
              
              {/* 文章内容 */}
              <View style={styles.articleContent}>
                {/* 标题 */}
                <Text style={styles.newsTitle} numberOfLines={2}>
                  {article.title}
                </Text>
                
                {/* 摘要 */}
                <Text style={styles.newsBody} numberOfLines={4}>
                  {article.content.substring(0, 150) + '...'}
                </Text>
                
                {/* 时间 */}
                <View style={styles.newsFooter}>
                  <Text style={styles.newsTime}>
                    {formatDate(article.published_at || article.created_at)}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))
        )}

        {/* 底部留白 */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5', // 淡浅灰色
  },
  header: {
    paddingHorizontal: 12, // 缩小左右缝隙
    paddingVertical: 16,
    // 取消底色，使用app背景色
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#333', // 黑色标题
    fontSize: 24,
    fontWeight: '700',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 12,
  },
  icon: {
    fontSize: 20,
    color: '#333',
  },
  newsList: {
    flex: 1,
    paddingHorizontal: 12, // 只设置左右内边距
    paddingBottom: 12, // 设置底部内边距
    // 移除顶部内边距，减少与分类筛选栏的间距
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  newsItem: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e3f2fd',
  },
  categoryText: {
    color: '#1976d2',
    fontSize: 12,
    fontWeight: '600',
  },
  // 带图片的文章布局
  articleWithImage: {
    width: '100%',
  },
  articleContent: {
    width: '100%',
  },
  articleWithoutImage: {
    width: '100%',
  },
  featuredImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  newsTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 26,
  },
  newsBody: {
    color: '#666',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  newsTime: {
    color: '#666',
    fontSize: 12,
  },
  newsAuthor: {
    color: '#666',
    fontSize: 12,
  },
  loadMoreButton: {
    alignItems: 'center',
    padding: 20,
  },
  loadMoreText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
  // 分类筛选样式
  categoryFilter: {
    backgroundColor: '#f0f2f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    height: 21, // 明确设置高度为1行文字+边框
    maxHeight: 21, // 限制最大高度
    marginBottom: 12, // 在底部留出12px的空间
  },
  categoryFilterContent: {
    paddingHorizontal: 12,
    paddingVertical: 0, // 移除上下内边距
    height: 20, // 内容高度（文字高度）
    justifyContent: 'center', // 垂直居中内容
  },
  categoryItem: {
    marginRight: 20,
    alignItems: 'center',
    justifyContent: 'center', // 垂直居中内容
    paddingVertical: 0, // 移除上下内边距
    minHeight: 20, // 确保最小点击区域
    height: 20, // 与文字高度一致
  },
  categoryText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
    lineHeight: 20, // 确保文字垂直居中
  },
  categoryTextSelected: {
    color: '#333',
    fontWeight: '700',
  },
})