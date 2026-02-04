import { useState, useEffect } from 'react'
import { View, Text, Pressable, ActivityIndicator, RefreshControl, ScrollView, Image, FlatList } from 'react-native'
import { getAccountById, followAccount, unfollowAccount, checkIfFollowed } from '../api/accounts'
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
}

export default function AccountDetailScreen({ accountId, onOpenArticle, onClose, lang = 'zh' }: { 
  accountId: string; 
  onOpenArticle: (article: Article) => void; 
  onClose?: () => void; 
  lang?: 'zh' | 'en';
}) {
  const [account, setAccount] = useState<OfficialAccount | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 获取公众号详情
      const accountData = await getAccountById(accountId);
      setAccount(accountData);
      
      // 检查是否已关注
      const following = await checkIfFollowed(accountId);
      setIsFollowing(following);
      
      // 获取公众号的文章列表
      const { articles: articleList } = await getArticles({ 
        account_id: accountId, 
        limit: 50 
      });
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
  }, [accountId])

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleFollowToggle = async () => {
    try {
      setFollowLoading(true)
      if (isFollowing) {
        await unfollowAccount(accountId);
        setIsFollowing(false);
      } else {
        await followAccount(accountId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow status:', error)
    } finally {
      setFollowLoading(false)
    }
  }

  const renderArticleItem = ({ item }: { item: Article }) => (
    <Pressable 
      onPress={() => onOpenArticle(item)} 
      style={{ 
        padding: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff'
      }}
    >
      {item.cover_image && (
        <View style={{ width: '100%', height: 200, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
          <Image source={{ uri: item.cover_image }} style={{ width: '100%', height: '100%' }} />
        </View>
      )}
      <Text style={{ color: '#333', fontSize: 18, fontWeight: '500', marginBottom: 8, lineHeight: 26 }}>
        {item.title}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: '#999', fontSize: 12, marginRight: 16 }}>
          {new Date(item.published_at || item.created_at).toLocaleDateString()}
        </Text>
        {item.read_count !== undefined && (
          <Text style={{ color: '#999', fontSize: 12, marginRight: 16 }}>
            {item.read_count} 阅读
          </Text>
        )}
        {item.comment_count !== undefined && (
          <Text style={{ color: '#999', fontSize: 12 }}>
            {item.comment_count} 留言
          </Text>
        )}
      </View>
    </Pressable>
  )

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#576b95" />
      </View>
    )
  }

  if (!account) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <Text style={{ color: '#999', fontSize: 14 }}>
          {lang === 'zh' ? '公众号不存在' : 'Account not found'}
        </Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* 顶部导航栏 */}
      <View style={{ 
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff', 
        paddingHorizontal: 16, 
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
      }}>
        <Pressable onPress={onClose} style={{ padding: 4 }}>
          <Text style={{ fontSize: 24, color: '#333' }}>←</Text>
        </Pressable>
        <Text style={{ flex: 1, color: '#333', fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
          {account.name}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* 公众号信息区域 */}
      <View style={{ backgroundColor: '#fff', padding: 16, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ 
            width: 80, 
            height: 80, 
            borderRadius: 40, 
            backgroundColor: '#f0f0f0',
            overflow: 'hidden',
            marginRight: 16
          }}>
            {account.avatar ? (
              <Image source={{ uri: account.avatar }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <View style={{ 
                width: '100%', 
                height: '100%', 
                backgroundColor: '#576b95',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>
                  {account.name.charAt(0)}
                </Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#333', fontSize: 20, fontWeight: '600', marginBottom: 4 }}>
              {account.name}
            </Text>
            {account.description && (
              <Text style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>
                {account.description}
              </Text>
            )}
            <Pressable 
              onPress={handleFollowToggle} 
              disabled={followLoading}
              style={{ 
                backgroundColor: isFollowing ? '#f0f0f0' : '#576b95',
                paddingVertical: 6,
                paddingHorizontal: 16,
                borderRadius: 16,
                alignSelf: 'flex-start'
              }}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={isFollowing ? '#333' : '#fff'} />
              ) : (
                <Text style={{ color: isFollowing ? '#333' : '#fff', fontSize: 14, fontWeight: '500' }}>
                  {isFollowing ? (lang === 'zh' ? '已关注' : 'Following') : (lang === 'zh' ? '关注' : 'Follow')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* 文章列表区域 */}
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView 
          style={{ flex: 1 }} 
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={['#576b95']} 
              tintColor="#576b95"
            />
          }
        >
          {articles.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: '#999', fontSize: 14 }}>
                {lang === 'zh' ? '暂无文章' : 'No articles available'}
              </Text>
            </View>
          ) : (
            articles.map((item) => renderArticleItem({ item }))
          )}
        </ScrollView>
      </View>
    </View>
  )
}
