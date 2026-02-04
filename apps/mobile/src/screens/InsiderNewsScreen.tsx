import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Image, TouchableOpacity, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import HTML from 'react-native-render-html'

// 公众号类型定义
interface OfficialAccount {
  id: string
  name: string
  description?: string
  avatar?: string
  cover_image?: string
}

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
  cover_image?: string
  account_id?: string
  account_name?: string
  read_count?: number
  like_count?: number
  comment_count?: number
  author?: string
  summary?: string
}

// 获取HTML纯文本并截取长度的辅助函数
const getHtmlSummary = (html: string, maxLength: number = 120): string => {
  // 移除HTML标签
  const plainText = html
    .replace(/<[^>]*>/g, '') // 移除所有HTML标签
    .replace(/&nbsp;/g, ' ') // 替换空格实体
    .replace(/&lt;/g, '<') // 替换小于号实体
    .replace(/&gt;/g, '>') // 替换大于号实体
    .replace(/&amp;/g, '&') // 替换与号实体
    .replace(/&quot;/g, '"') // 替换引号实体
    .replace(/&apos;/g, "'") // 替换单引号实体
    .trim(); // 去除首尾空格
  
  // 截取长度并添加省略号
  return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText;
};

export default function InsiderNewsScreen({ lang = 'zh', demo, appVersion = 'standard', onNavigateTo, onArticlePress }: { lang?: 'zh' | 'en'; demo?: boolean; appVersion?: 'standard' | 'simple' | 'premium'; onNavigateTo?: (screen: string) => void; onArticlePress?: (article: any) => void }) {
  const [articles, setArticles] = useState<InsiderArticle[]>([])
  const [accounts, setAccounts] = useState<OfficialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // 根据版本调整样式
  const getVersionStyles = () => {
    switch (appVersion) {
      case 'simple':
        return {
          fontSize: { base: 18, large: 22, small: 16 },
          fontWeight: { regular: '400', medium: '500', bold: '700' },
          padding: { base: 20, small: 16 },
          borderRadius: 12,
          showSimplified: true
        }
      case 'premium':
        return {
          fontSize: { base: 16, large: 20, small: 14 },
          fontWeight: { regular: '400', medium: '600', bold: '800' },
          padding: { base: 20, small: 16 },
          borderRadius: 16,
          showPremium: true
        }
      default: // standard
        return {
          fontSize: { base: 15, large: 18, small: 13 },
          fontWeight: { regular: '400', medium: '500', bold: '700' },
          padding: { base: 16, small: 12 },
          borderRadius: 8,
          showAll: true
        }
    }
  }

  const versionStyles = getVersionStyles()

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

  // 获取公众号列表
  const fetchAccounts = async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      const { data, error } = await supabase
        .from('wechat_official_accounts')
        .select('id, name, description, avatar, cover_image')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setAccounts(data || [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
      setAccounts([])
    }
  }

  // 获取内参文章数据
  const fetchArticles = async (isRefresh: boolean = false) => {
    try {
      // 从Supabase获取数据
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      let query = supabase
        .from('internal_references')
        .select(`
          *,
          wechat_official_accounts(name)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(0, 9) // 增加返回的数据量
      
      // 根据选中的公众号进行筛选
      if (selectedAccount !== 'all') {
        query = query.eq('account_id', selectedAccount)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      // 处理数据，添加account_name字段
      const processedArticles = (data || []).map(article => ({
        ...article,
        account_name: article.wechat_official_accounts?.name,
        cover_image: article.cover_image || article.featured_image_url,
        read_count: article.read_count || 0,
        like_count: article.like_count || 0,
        comment_count: article.comment_count || 0
      }))
      
      setArticles(processedArticles)
      
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
    fetchAccounts()
    fetchArticles(true)
  }, [lang])

  // 公众号切换时重新加载
  useEffect(() => {
    fetchArticles(true)
  }, [selectedAccount])

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

  // 计算相对时间（微信公众号风格）
  const getRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) {
      return '刚刚'
    } else if (diffMins < 60) {
      return `${diffMins}分钟前`
    } else if (diffHours < 24) {
      return `${diffHours}小时前`
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)}周前`
    } else if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)}个月前`
    } else {
      return `${Math.floor(diffDays / 365)}年前`
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
        <Text style={[styles.title, { fontSize: versionStyles.fontSize.large, fontWeight: versionStyles.fontWeight.bold }]}>{t.insiderNews}</Text>
        
        {/* 搜索框 */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={versionStyles.fontSize.base} color="#999" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { fontSize: versionStyles.fontSize.small }]}
            placeholder={lang === 'zh' ? '搜索内参' : 'Search Insider'}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.headerIcons}>
          {/* 撰写内参图标 */}
          <TouchableOpacity style={styles.iconButton} onPress={() => {

            onNavigateTo && onNavigateTo('create-insider');
          }}>
            <Ionicons name="create-outline" size={versionStyles.fontSize.base} color="#333" />
          </TouchableOpacity>
          {/* 配置公众号图标 */}
          <TouchableOpacity style={styles.iconButton} onPress={() => {

            onNavigateTo && onNavigateTo('configure-accounts');
          }}>
            <Ionicons name="settings-outline" size={versionStyles.fontSize.base} color="#333" />
          </TouchableOpacity>
          {/* 草稿箱图标 */}
          <TouchableOpacity style={styles.iconButton} onPress={() => {

            onNavigateTo && onNavigateTo('draft-box');
          }}>
            <Ionicons name="document-text-outline" size={versionStyles.fontSize.base} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 微信公众号风格的顶部常看公众号区块 */}
      {accounts.length > 0 && (
        <View style={styles.wechatAccountsSection}>
          <Text style={styles.sectionTitle}>{lang === 'zh' ? '常看' : 'Following'}</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.accountsScrollContent}
            bounces={true}
          >
            <Pressable
              key="all"
              style={styles.accountCard}
              onPress={() => setSelectedAccount('all')}
            >
              <View style={[
                styles.accountAvatar,
                selectedAccount === 'all' && styles.accountAvatarSelected,
                { backgroundColor: '#4CAF50' } // 使用绿色作为"全部"选项的底色
              ]}>
                <Text style={[
                  styles.avatarText,
                  { color: '#FFFFFF' }
                ]}>全</Text>
              </View>
              <Text style={[styles.accountNameText, selectedAccount === 'all' && styles.accountNameTextSelected]}>
                {lang === 'zh' ? '全部' : 'All'}
              </Text>
            </Pressable>
            {accounts.map((account) => {
              // 随机颜色数组：红橙黄绿青蓝紫
              const colors = ['#FF4444', '#FF8800', '#FFBB00', '#4CAF50', '#00BCD4', '#2196F3', '#9C27B0'];
              // 根据account.id生成固定的随机索引，确保同一公众号颜色一致
              const colorIndex = account.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
              const randomColor = colors[colorIndex];
              
              return (
                <Pressable
                  key={account.id}
                  style={styles.accountCard}
                  onPress={() => setSelectedAccount(account.id)}
                >
                  <View style={[
                    styles.accountAvatar,
                    selectedAccount === account.id && styles.accountAvatarSelected,
                    !account.avatar && { backgroundColor: randomColor }
                  ]}>
                    {account.avatar ? (
                      <Image 
                        source={{ uri: account.avatar }} 
                        style={styles.accountAvatarImage} 
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={[
                        styles.avatarText,
                        { color: '#FFFFFF' }
                      ]}>{account.name.charAt(0)}</Text>
                    )}
                  </View>
                  <Text style={[styles.accountNameText, selectedAccount === account.id && styles.accountNameTextSelected]}>
                    {account.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

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
          articles.map((article) => {
            // 随机颜色数组：红橙黄绿青蓝紫
            const colors = ['#FF4444', '#FF8800', '#FFBB00', '#4CAF50', '#00BCD4', '#2196F3', '#9C27B0'];
            // 根据article.account_id或article.id生成固定的随机索引
            const colorIndex = (article.account_id || article.id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
            const randomColor = colors[colorIndex];
            
            return (
              <Pressable key={article.id} style={styles.newsItem} onPress={() => {
                // 打开文章详情
                console.log('打开文章详情:', article.id);
                if (onArticlePress) {
                  onArticlePress(article);
                }
              }}>
                {/* 公众号信息和时间 */}
                <View style={styles.wechatHeader}>
                  <View style={styles.accountInfo}>
                    <View style={[
                      styles.accountAvatar,
                      { backgroundColor: randomColor }
                    ]}>
                      <Text style={[
                        styles.avatarText,
                        { color: '#FFFFFF' }
                      ]}>
                        {article.account_name?.charAt(0) || '公'}
                      </Text>
                    </View>
                    <Text style={styles.accountName}>{article.account_name || '未知公众号'}</Text>
                  </View>
                  <Text style={styles.relativeTime}>
                    {getRelativeTime(article.published_at || article.created_at)}
                  </Text>
                </View>
              
                {/* 文章标题 */}
                <Text style={styles.newsTitle} numberOfLines={2}>
                  {article.title}
                </Text>
              
                {/* 文章摘要 */}
                <Text style={styles.newsBody} numberOfLines={3}>
                  {getHtmlSummary(article.summary || article.content)}
                </Text>
              
                {/* 大图片 */}
                {article.cover_image && (
                  <View style={styles.articleWithImage}>
                    <Image 
                      source={{ uri: article.cover_image }} 
                      style={styles.featuredImage} 
                      resizeMode="cover"
                    />
                  </View>
                )}
              
                {/* 统计数据 */}
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statText}>{article.read_count || 0} 阅读</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statText}>{article.like_count || 0} 赞</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statText}>{article.comment_count || 0} 评论</Text>
                  </View>
                </View>
              </Pressable>
            );
          })
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
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: '#f0f2f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#333', // 黑色标题
    fontSize: 24,
    fontWeight: '700',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#333',
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
    paddingHorizontal: 0.2, // 与手机边界0.2px
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  newsItem: {
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },
  // 微信公众号风格的头部
  wechatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1AAD19',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  accountName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  relativeTime: {
    fontSize: 12,
    color: '#999',
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
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  // 带图片的文章布局
  articleWithImage: {
    width: '100%',
    marginBottom: 12,
  },
  featuredImage: {
    width: '100%',
    height: 200,
    borderRadius: 4,
  },
  // 统计数据样式
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: '#999',
  },
  // 微信公众号风格的顶部区块样式
  wechatAccountsSection: {
    paddingTop: 8,
    paddingBottom: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '400',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  accountsScrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  accountCard: {
    alignItems: 'center',
    marginHorizontal: 4,
    paddingHorizontal: 8,
    width: 80,
  },
  accountAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accountAvatarSelected: {
    borderColor: '#1AAD19',
  },
  accountAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  accountNameText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
    maxWidth: '100%',
  },
  accountNameTextSelected: {
    color: '#1AAD19',
    fontWeight: '500',
  },
})