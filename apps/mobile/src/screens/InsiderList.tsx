import { useState, useEffect } from 'react'
import { View, Text, Pressable, ActivityIndicator, RefreshControl, ScrollView, Image, FlatList } from 'react-native'
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
  const [followedAccounts, setFollowedAccounts] = useState<OfficialAccount[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

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

  const renderAccountItem = ({ item }: { item: OfficialAccount }) => (
    <Pressable 
      onPress={() => onOpenAccount(item)} 
      style={{ 
        alignItems: 'center', 
        marginHorizontal: 12,
        marginVertical: 8
      }}
    >
      <View style={{ 
        width: 64, 
        height: 64, 
        borderRadius: 32, 
        backgroundColor: '#f0f0f0',
        overflow: 'hidden',
        marginBottom: 8
      }}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <View style={{ 
            width: '100%', 
            height: '100%', 
            backgroundColor: '#576b95',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
              {item.name.charAt(0)}
            </Text>
          </View>
        )}
      </View>
      <Text style={{ color: '#333', fontSize: 12, textAlign: 'center', maxWidth: 80 }}>
        {item.name}
      </Text>
    </Pressable>
  )

  const renderArticleItem = ({ item }: { item: Article }) => (
    <Pressable 
      onPress={() => onOpenArticle(item)} 
      style={{ 
        flexDirection: 'row',
        padding: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff'
      }}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
          {item.wechat_official_accounts?.name || '未知公众号'}
        </Text>
        <Text style={{ color: '#333', fontSize: 16, fontWeight: '500', marginBottom: 4, lineHeight: 22 }}>
          {item.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: '#999', fontSize: 11, marginRight: 12 }}>
            {new Date(item.published_at || item.created_at).toLocaleDateString()}
          </Text>
          {item.read_count !== undefined && (
            <Text style={{ color: '#999', fontSize: 11 }}>
              {item.read_count} 阅读
            </Text>
          )}
        </View>
      </View>
      {item.cover_image && (
        <View style={{ width: 80, height: 80, borderRadius: 4, overflow: 'hidden' }}>
          <Image source={{ uri: item.cover_image }} style={{ width: '100%', height: '100%' }} />
        </View>
      )}
    </Pressable>
  )

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#576b95" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* 顶部导航栏 */}
      <View style={{ 
        backgroundColor: '#fff', 
        paddingHorizontal: 16, 
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
      }}>
        <Text style={{ color: '#333', fontSize: 18, fontWeight: '600' }}>
          {lang === 'zh' ? '公众号' : 'Official Accounts'}
        </Text>
      </View>

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
        {/* 常看公众号区域 */}
        <View style={{ backgroundColor: '#fff', paddingVertical: 12, marginBottom: 8 }}>
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <Text style={{ color: '#333', fontSize: 16, fontWeight: '600' }}>
              {lang === 'zh' ? '常看' : 'Frequently Viewed'}
            </Text>
          </View>
          <FlatList
            data={followedAccounts.slice(0, 5)} // 只显示前5个作为常看
            renderItem={renderAccountItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 8 }}
          />
        </View>

        {/* 文章列表区域 */}
        <View style={{ backgroundColor: '#fff' }}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
            <Text style={{ color: '#333', fontSize: 16, fontWeight: '600' }}>
              {lang === 'zh' ? '最新文章' : 'Latest Articles'}
            </Text>
          </View>
          {articles.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: '#999', fontSize: 14 }}>
                {lang === 'zh' ? '暂无文章' : 'No articles available'}
              </Text>
            </View>
          ) : (
            articles.map((item) => renderArticleItem({ item }))
          )}
        </View>
      </ScrollView>
    </View>
  )
}
