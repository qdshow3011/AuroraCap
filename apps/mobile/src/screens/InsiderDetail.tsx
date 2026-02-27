import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HTML from 'react-native-render-html';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface Article {
  id: string;
  title: string;
  content: string;
  cover_image?: string;
  created_at: string;
  updated_at?: string;
  author?: string;
  account_name?: string;
  account_avatar?: string;
  read_count?: number;
  like_count?: number;
  comment_count?: number;
  category?: string;
  summary?: string;
}

interface InsiderDetailProps {
  article: Article;
  onClose: () => void;
  lang?: 'zh' | 'en';
}

export default function InsiderDetail({ article, onClose, lang = 'zh' }: InsiderDetailProps) {
  const insets = useSafeAreaInsets();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.like_count || 0);
  const [isLoading, setIsLoading] = useState(false);

  const t = lang === 'zh' ? {
    back: '返回',
    share: '分享',
    like: '点赞',
    liked: '已赞',
    comment: '评论',
    read: '阅读',
    author: '作者',
    publishTime: '发布时间',
    category: '分类',
    relatedArticles: '相关文章',
    loading: '加载中...',
  } : {
    back: 'Back',
    share: 'Share',
    like: 'Like',
    liked: 'Liked',
    comment: 'Comment',
    read: 'Reads',
    author: 'Author',
    publishTime: 'Published',
    category: 'Category',
    relatedArticles: 'Related Articles',
    loading: 'Loading...',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return lang === 'zh' ? '刚刚' : 'Just now';
    if (diffMins < 60) return `${diffMins}${lang === 'zh' ? '分钟前' : ' mins ago'}`;
    if (diffHours < 24) return `${diffHours}${lang === 'zh' ? '小时前' : ' hours ago'}`;
    if (diffDays < 7) return `${diffDays}${lang === 'zh' ? '天前' : ' days ago'}`;
    return formatDate(dateString);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${article.title} - ${article.summary || ''}`,
        title: article.title,
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const htmlStyles = {
    body: {
      fontSize: 16,
      lineHeight: 28,
      color: '#333',
    },
    p: {
      marginBottom: 16,
      lineHeight: 28,
    },
    h1: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 16,
      color: '#333',
    },
    h2: {
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 12,
      color: '#333',
    },
    h3: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 10,
      color: '#333',
    },
    img: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      marginVertical: 12,
    },
    a: {
      color: '#1A4EA2',
      textDecorationLine: 'underline',
    },
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 渐变头部 */}
      <LinearGradient
        colors={['#1A4EA2', '#0D3A8A']}
        style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 16 }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {lang === 'zh' ? '文章详情' : 'Article Detail'}
        </Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 文章头部信息卡片 */}
        <View style={styles.articleHeaderCard}>
          {article.cover_image && (
            <Image source={{ uri: article.cover_image }} style={styles.coverImage} />
          )}
          
          <View style={styles.titleSection}>
            <Text style={styles.articleTitle}>{article.title}</Text>
            
            {/* 作者信息 */}
            <View style={styles.authorSection}>
              <View style={styles.authorInfo}>
                {article.account_avatar ? (
                  <Image source={{ uri: article.account_avatar }} style={styles.authorAvatar} />
                ) : (
                  <View style={[styles.authorAvatar, styles.authorAvatarPlaceholder]}>
                    <Text style={styles.authorAvatarText}>
                      {article.account_name?.charAt(0) || 'A'}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={styles.authorName}>{article.account_name || article.author || '未知作者'}</Text>
                  <Text style={styles.publishTime}>{getRelativeTime(article.created_at)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 文章内容 */}
        <View style={styles.contentCard}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#1A4EA2" />
          ) : (
            <HTML
              source={{ html: article.content }}
              contentWidth={width - 32}
              tagsStyles={htmlStyles}
            />
          )}
        </View>

        {/* 底部统计 */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={20} color="#999" />
            <Text style={styles.statNumber}>{article.read_count || 0}</Text>
            <Text style={styles.statLabel}>{t.read}</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={handleLike}>
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={20} 
              color={isLiked ? '#F44336' : '#999'} 
            />
            <Text style={[styles.statNumber, isLiked && styles.statNumberActive]}>{likeCount}</Text>
            <Text style={[styles.statLabel, isLiked && styles.statLabelActive]}>
              {isLiked ? t.liked : t.like}
            </Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={20} color="#999" />
            <Text style={styles.statNumber}>{article.comment_count || 0}</Text>
            <Text style={styles.statLabel}>{t.comment}</Text>
          </View>
        </View>

        {/* 底部留白 */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 底部操作栏 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={20} color="#666" />
          <Text style={styles.bottomButtonText}>{t.back}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.bottomButton, styles.likeButton]} onPress={handleLike}>
          <LinearGradient
            colors={isLiked ? ['#F44336', '#D32F2F'] : ['#1A4EA2', '#0D3A8A']}
            style={styles.likeButtonGradient}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={styles.likeButtonText}>
              {isLiked ? t.liked : t.like}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color="#666" />
          <Text style={styles.bottomButtonText}>{t.share}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  shareButton: {
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
  articleHeaderCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  coverImage: {
    width: '100%',
    height: 220,
  },
  titleSection: {
    padding: 16,
  },
  articleTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    lineHeight: 32,
    marginBottom: 16,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorAvatarPlaceholder: {
    backgroundColor: '#1A4EA2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  publishTime: {
    fontSize: 13,
    color: '#999',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#F0F0F0',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
  },
  statNumberActive: {
    color: '#F44336',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statLabelActive: {
    color: '#F44336',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  bottomButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  bottomButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  likeButton: {
    flex: 1.5,
  },
  likeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  likeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
