import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'

interface InsiderArticle {
  id: string;
  title?: string;
  title_cn?: string;
  title_en?: string;
  content?: string;
  content_html?: string;
  content_cn?: string;
  content_en?: string;
  author?: string;
  published_at?: string;
  created_at?: string;
  is_published?: boolean;
  article_categories?: {
    name_cn: string;
    name_en: string;
  };
  summary?: string;
  status?: string;
}

export default function InsiderDetail({ article, lang = 'zh', onClose }: { 
  article: InsiderArticle; 
  lang?: 'zh' | 'en';
  onClose?: () => void;
}) {
  
  // 获取文章标题
  const getTitle = () => {
    if (article.title) return article.title;
    if (lang === 'zh' && article.title_cn) return article.title_cn;
    if (lang === 'en' && article.title_en) return article.title_en;
    return article.title_cn || article.title_en || '无标题';
  };

  // 获取文章内容
  const getContent = () => {
    if (article.content) return article.content;
    if (article.content_html) return article.content_html;
    if (lang === 'zh' && article.content_cn) return article.content_cn;
    if (lang === 'en' && article.content_en) return article.content_en;
    return article.content_cn || article.content_en || article.summary || '暂无内容';
  };

  // 获取作者信息
  const getAuthor = () => {
    return article.author || 'Aurora Capital';
  };

  // 获取发布日期
  const getPublishedDate = () => {
    const date = article.published_at || article.created_at;
    if (!date) return '';
    return new Date(date).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {lang === 'zh' ? '内参详情' : 'Article Detail'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* 文章内容 */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* 文章主体 */}
        <View style={styles.articleContainer}>
          {/* 分类标签 */}
          {article.article_categories && (
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>
                {lang === 'zh' ? article.article_categories.name_cn : article.article_categories.name_en}
              </Text>
            </View>
          )}

          {/* 标题 */}
          <Text style={styles.title}>
            {getTitle()}
          </Text>

          {/* 作者和日期信息 */}
          <View style={styles.metaInfo}>
            <View style={styles.authorInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getAuthor().charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.authorName}>
                {getAuthor()}
              </Text>
            </View>
            <Text style={styles.dateText}>
              {getPublishedDate()}
            </Text>
          </View>

          {/* 分隔线 */}
          <View style={styles.divider} />

          {/* 文章内容 */}
          <View style={styles.contentContainer}>
            <Text style={styles.content}>
              {getContent()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: '#000000',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  articleContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  categoryContainer: {
    marginBottom: 12,
  },
  categoryText: {
    color: '#576b95',
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    color: '#000000',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 32,
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#576b95',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  authorName: {
    color: '#576b95',
    fontSize: 14,
  },
  dateText: {
    color: '#888888',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 24,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  content: {
    color: '#333333',
    fontSize: 17,
    lineHeight: 28,
    letterSpacing: 0.5,
  },
})
