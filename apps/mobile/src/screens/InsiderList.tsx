import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, RefreshControl, ScrollView, Image, FlatList, StatusBar, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getFollowedAccounts } from '../api/accounts'
import { getArticles } from '../api/articles'

interface OfficialAccount {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  cover_image?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  cover_image?: string;
  read_count?: number;
  like_count?: number;
  comment_count?: number;
  created_at: string;
  published_at?: string;
  wechat_official_accounts?: {
    name: string;
    avatar: string;
  };
}

export default function InsiderList({ onOpenAccount, onOpenArticle, lang = 'zh' }: { 
  onOpenAccount: (account: OfficialAccount) => void; 
  onOpenArticle: (article: Article) => void; 
  lang?: 'zh' | 'en';
}) {
  const insets = useSafeAreaInsets();
  const [followedAccounts, setFollowedAccounts] = useState<OfficialAccount[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const t = lang === 'zh' ? {
    title: '公众号',
    frequentlyViewed: '常看',
    latestArticles: '最新文章',
    noArticles: '暂无文章',
    loading: '加载中...',
    read: '阅读',
    like: '赞',
    comment: '评论',
  } : {
    title: 'Official Accounts',
    frequentlyViewed: 'Following',
    latestArticles: 'Latest Articles',
    noArticles: 'No articles available',
    loading: 'Loading...',
    read: 'Reads',
    like: 'Likes',
    comment: 'Comments',
  };

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 获取用户关注的公众号列表
      const accounts = await getFollowedAccounts();
      setFollowedAccounts(accounts);
      
      // 获取文章列表（按最新排序）
      const { articles: articleList } = await getArticles({ limit: 50 });
      setArticles(articleList);
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const getRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return lang === 'zh' ? '刚刚' : 'Just now'
    if (diffMins < 60) return `${diffMins}${lang === 'zh' ? '分钟前' : 'm ago'}`
    if (diffHours < 24) return `${diffHours}${lang === 'zh' ? '小时前' : 'h ago'}`
    if (diffDays < 7) return `${diffDays}${lang === 'zh' ? '天前' : 'd ago'}`
    return date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')
  }

  const getRandomColor = (id: string) => {
    const colors = ['#FF4444', '#FF8800', '#FFBB00', '#4CAF50', '#00BCD4', '#2196F3', '#9C27B0'];
    const colorIndex = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
    return colors[colorIndex];
  };

  const renderAccountItem = ({ item }: { item: OfficialAccount }) => {
    const randomColor = getRandomColor(item.id);
    
    return (
      <Pressable 
        onPress={() => onOpenAccount(item)} 
        style={styles.accountCard}
      >
        <View style={[styles.accountAvatar, !item.avatar && { backgroundColor: randomColor }]}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.accountAvatarImage} />
          ) : (
            <Text style={styles.accountAvatarText}>{item.name.charAt(0)}</Text>
          )}
        </View>
        <Text style={styles.accountName} numberOfLines={1}>{item.name}</Text>
      </Pressable>
    )
  }

  const renderArticleItem = ({ item }: { item: Article }) => {
    const randomColor = getRandomColor(item.id);
    
    return (
      <Pressable 
        onPress={() => onOpenArticle(item)} 
        style={styles.articleCard}
      >
        <View style={styles.articleHeader}>
          <View style={styles.articleAuthor}>
            <View style={[styles.smallAvatar, { backgroundColor: randomColor }]}>
              <Text style={styles.smallAvatarText}>
                {item.wechat_official_accounts?.name?.charAt(0) || 'A'}
              </Text>
            </View>
            <Text style={styles.authorName} numberOfLines={1}>
              {item.wechat_official_accounts?.name || 'Unknown'}
            </Text>
          </View>
          <Text style={styles.articleTime}>{getRelativeTime(item.published_at || item.created_at)}</Text>
        </View>
        
        <View style={styles.articleContent}>
          <View style={styles.articleTextContent}>
            <Text style={styles.articleTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.articleStats}>
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={12} color="#999" />
                <Text style={styles.statText}>{item.read_count || 0}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="heart-outline" size={12} color="#999" />
                <Text style={styles.statText}>{item.like_count || 0}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="chatbubble-outline" size={12} color="#999" />
                <Text style={styles.statText}>{item.comment_count || 0}</Text>
              </View>
            </View>
          </View>
          {item.cover_image && (
            <Image source={{ uri: item.cover_image }} style={styles.articleImage} />
          )}
        </View>
      </Pressable>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="newspaper-outline" size={64} color="#CCC" />
        <Text style={styles.loadingText}>{t.loading}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A4EA2" />
      
      {/* 渐变头部 */}
      <LinearGradient
        colors={['#1A4EA2', '#0D3A8A']}
        style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 16 }]}
      >
        <Text style={styles.headerTitle}>{t.title}</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#1A4EA2']} 
            tintColor="#1A4EA2"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 常看公众号区域 */}
        {followedAccounts.length > 0 && (
          <View style={styles.accountsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.frequentlyViewed}</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>{lang === 'zh' ? '查看全部' : 'See All'}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={followedAccounts.slice(0, 10)}
              renderItem={renderAccountItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.accountsList}
            />
          </View>
        )}

        {/* 文章列表区域 */}
        <View style={styles.articlesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.latestArticles}</Text>
          </View>
          {articles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>{t.noArticles}</Text>
            </View>
          ) : (
            articles.map((item) => (
              <View key={item.id}>{renderArticleItem({ item })}</View>
            ))
          )}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
    marginTop: 16,
  },
  accountsSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  seeAllText: {
    fontSize: 13,
    color: '#1A4EA2',
    fontWeight: '500',
  },
  accountsList: {
    paddingHorizontal: 12,
  },
  accountCard: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 72,
  },
  accountAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accountAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  accountAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  accountName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    maxWidth: 72,
  },
  articlesSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
  },
  articleCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  articleAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  smallAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  authorName: {
    fontSize: 13,
    color: '#666',
    maxWidth: 150,
  },
  articleTime: {
    fontSize: 12,
    color: '#999',
  },
  articleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  articleTextContent: {
    flex: 1,
    marginRight: 12,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 22,
    marginBottom: 10,
  },
  articleStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statText: {
    fontSize: 11,
    color: '#999',
    marginLeft: 3,
  },
  articleImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    marginTop: 16,
  },
});
