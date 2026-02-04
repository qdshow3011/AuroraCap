import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, Image, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Linking } from 'react-native'
import { likeArticle, getArticleById } from '../api/articles'
import { getArticleComments, createComment } from '../api/comments'
import HTML from 'react-native-render-html'

// 条件导入PDF组件，只在非Web平台上加载
let Pdf: any = null
if (Platform.OS !== 'web') {
  Pdf = require('react-native-pdf').default
}

// 用户名掩码函数：将前面的数字替换为"****"，只展示后面4位数字
const maskUsername = (username: string): string => {
  if (!username || username.length < 4) {
    return '****' + username.slice(-4) || 'User'
  }
  return '****' + username.slice(-4)
}

interface Article {
  id: string;
  title: string;
  content: string;
  cover_image?: string;
  pdf_url?: string;
  read_count?: number;
  like_count?: number;
  comment_count?: number;
  created_at: string;
  published_at?: string;
  wechat_official_accounts?: {
    name: string;
    avatar: string;
  };
  account_name?: string;
}

export default function InsiderDetail({ article, onClose, lang = 'zh', userInfo, appVersion = 'standard' }: { 
  article: Article; 
  onClose?: () => void;
  lang?: 'zh' | 'en';
  userInfo?: any;
  appVersion?: 'standard' | 'simple' | 'premium';
}) {
  // 根据版本获取字体大小
  const getFontSizes = () => {
    switch (appVersion) {
      case 'simple': // 老人版
        return {
          title: 28,
          content: 20,
          accountName: 18,
          metaInfo: 16,
          commentsTitle: 20,
          commentContent: 16,
          input: 16
        };
      case 'premium': // 合伙人版
        return {
          title: 24,
          content: 17,
          accountName: 16,
          metaInfo: 14,
          commentsTitle: 18,
          commentContent: 14,
          input: 14
        };
      default: // 标准版
        return {
          title: 24,
          content: 17,
          accountName: 16,
          metaInfo: 14,
          commentsTitle: 18,
          commentContent: 14,
          input: 14
        };
    }
  };

  const fontSizes = getFontSizes();

  const [comments, setComments] = useState<Comment[]>([])
  const [currentArticle, setArticle] = useState<Article>(article)
  const [loading, setLoading] = useState(true)
  const [commentLoading, setCommentLoading] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)

  useEffect(() => {
    fetchComments();
    // 增加阅读计数
    increaseReadCount();
  }, [currentArticle.id]);

  // 增加阅读计数
  const increaseReadCount = async () => {
    try {
      console.log('Increasing read count for article:', currentArticle.id);
      // 调用getArticleById API，它会自动增加阅读计数
      const updatedArticle = await getArticleById(currentArticle.id);
      console.log('Read count updated:', updatedArticle.read_count);
      // 更新当前文章状态，包含最新的阅读计数
      setArticle(updatedArticle);
    } catch (error) {
      console.error('Error increasing read count:', error);
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      // 获取文章留言
      const commentsData = await getArticleComments(currentArticle.id);
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentArticle) return;
    try {
      setLikeLoading(true);
      console.log('Calling likeArticle API for article:', currentArticle.id);
      console.log('User info for like:', userInfo);
      const updatedArticle = await likeArticle(currentArticle.id, userInfo);
      console.log('Like successful, updated article:', updatedArticle);
      setArticle(updatedArticle);
      // 显示点赞成功提示
      setTimeout(() => {
        alert(lang === 'zh' ? '点赞成功！' : 'Liked successfully!');
      }, 100);
    } catch (error) {
      console.error('Error liking article:', error);
      // 显示点赞失败提示
      alert(lang === 'zh' ? '点赞失败，请稍后重试' : 'Failed to like, please try again later');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!currentArticle || !commentText.trim()) return;
    
    // 检查用户登录状态
    console.log('Comment submission attempt - userInfo:', userInfo);
    console.log('Comment submission attempt - userInfo exists:', !!userInfo);
    
    if (!userInfo) {
      alert(lang === 'zh' ? '请先登录后再发表评论' : 'Please log in first to comment');
      return;
    }
    
    try {
      setSubmittingComment(true);
      console.log('Calling createComment API with article_id:', currentArticle.id);
      console.log('Comment content:', commentText.trim());
      
      // 调用真实的createComment API，传递userInfo作为备用
      const newComment = await createComment({
        article_id: currentArticle.id,
        content: commentText.trim(),
        userInfo: userInfo,
      });
      
      // 更新留言列表
      setComments([...comments, {
        ...newComment,
        replies: [],
      }]);
      // 清空输入框
      setCommentText('');
      // 更新文章的评论数
      if (currentArticle.comment_count !== undefined) {
        setArticle({
          ...currentArticle,
          comment_count: currentArticle.comment_count + 1,
        });
      }
      console.log('Comment submitted successfully:', newComment);
      alert(lang === 'zh' ? '评论提交成功！' : 'Comment submitted successfully!');
    } catch (error: any) {
      console.error('Error submitting comment - message:', error.message);
      console.error('Error submitting comment - stack:', error.stack);
      console.error('Error submitting comment - full error:', error);
      alert(lang === 'zh' ? `评论提交失败：${error.message || '请稍后重试'}` : `Failed to submit comment: ${error.message || 'please try again later'}`);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#576b95" />
      </View>
    );
  }

  if (!currentArticle) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text style={styles.errorText}>
          {lang === 'zh' ? '文章不存在' : 'Article not found'}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {lang === 'zh' ? '文章详情' : 'Article Detail'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* 文章主体 */}
        <View style={styles.articleContainer}>
          {/* 公众号信息 */}
          {currentArticle.wechat_official_accounts && (
            <View style={styles.accountInfo}>
              <View style={styles.avatarContainer}>
                {currentArticle.wechat_official_accounts.avatar ? (
                  <Image 
                    source={{ uri: currentArticle.wechat_official_accounts.avatar }} 
                    style={styles.avatar} 
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {currentArticle.wechat_official_accounts.name.charAt(0)}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.accountName, { fontSize: fontSizes.accountName }]}>
                {currentArticle.wechat_official_accounts.name}
              </Text>
            </View>
          )}

          {/* 标题 */}
          <Text style={[styles.title, { fontSize: fontSizes.title }]}>
            {currentArticle.title}
          </Text>

          {/* PDF阅读按钮 */}
          {currentArticle.pdf_url && (
            <Pressable
              onPress={() => {
                if (Platform.OS === 'web') {
                  // 在Web平台上，在新标签页中打开PDF
                  Linking.openURL(currentArticle.pdf_url)
                } else {
                  // 在移动平台上，显示PDF模态窗口
                  setShowPdfModal(true)
                }
              }}
              style={styles.pdfButton}
            >
              <Text style={styles.pdfButtonIcon}>📄</Text>
              <Text style={styles.pdfButtonText}>
                {lang === 'zh' ? '打开报告PDF' : 'Open Report PDF'}
              </Text>
            </Pressable>
          )}

          {/* 封面图片 */}
          {currentArticle.cover_image && (
            <View style={styles.coverImageContainer}>
              <Image source={{ uri: currentArticle.cover_image }} style={styles.coverImage} />
            </View>
          )}

          {/* 作者和日期信息 */}
          <View style={styles.metaInfo}>
            <Text style={[styles.dateText, { fontSize: fontSizes.metaInfo }]}>
              {new Date(currentArticle.published_at || currentArticle.created_at).toLocaleDateString()}
            </Text>
            <View style={styles.statsContainer}>
              {currentArticle.read_count !== undefined && (
                <Text style={[styles.statText, { fontSize: fontSizes.metaInfo }]}>
                  {currentArticle.read_count} 阅读
                </Text>
              )}
            </View>
          </View>

          {/* 分隔线 */}
          <View style={styles.divider} />

          {/* 文章内容 */}
          <View style={styles.contentContainer}>
            <HTML
              source={{ html: currentArticle.content }}
              contentWidth={Platform.OS === 'web' ? 600 : undefined}
              tagsStyles={{
                p: {
                  marginBottom: 12,
                  lineHeight: fontSizes.content * 1.6,
                  fontSize: fontSizes.content,
                },
                strong: {
                  fontWeight: 'bold',
                  fontSize: fontSizes.content,
                },
                em: {
                  fontStyle: 'italic',
                  fontSize: fontSizes.content,
                },
                h1: {
                  fontSize: fontSizes.title + 2,
                  fontWeight: 'bold',
                  marginBottom: 16,
                  marginTop: 24,
                },
                h2: {
                  fontSize: fontSizes.title - 2,
                  fontWeight: 'bold',
                  marginBottom: 12,
                  marginTop: 20,
                },
                h3: {
                  fontSize: fontSizes.title - 4,
                  fontWeight: 'bold',
                  marginBottom: 8,
                  marginTop: 16,
                },
                ul: {
                  marginBottom: 12,
                  paddingLeft: 20,
                },
                ol: {
                  marginBottom: 12,
                  paddingLeft: 20,
                },
                li: {
                  marginBottom: 4,
                  fontSize: fontSizes.content,
                },
                br: {
                  marginBottom: 8,
                },
              }}
              style={[styles.content, { fontSize: fontSizes.content, lineHeight: fontSizes.content * 1.6 }]}
            />
          </View>

          {/* 点赞和评论区域 */}
          <View style={styles.interactionContainer}>
            <Pressable 
              onPress={handleLike} 
              disabled={likeLoading}
              style={({ pressed }) => [
                styles.interactionButton,
                pressed && styles.interactionButtonPressed
              ]}
            >
              {likeLoading ? (
                <ActivityIndicator size="small" color="#576b95" />
              ) : (
                <>
                  <Text style={styles.interactionIcon}>❤</Text>
                  <Text style={styles.interactionText}>
                    {currentArticle.like_count || 0} {lang === 'zh' ? '点赞' : 'Likes'}
                  </Text>
                </>
              )}
            </Pressable>
            <Pressable style={styles.interactionButton}>
              <Text style={styles.interactionIcon}>💬</Text>
              <Text style={styles.interactionText}>
                {currentArticle.comment_count || 0} {lang === 'zh' ? '留言' : 'Comments'}
              </Text>
            </Pressable>
          </View>

          {/* 留言区域 */}
          <View style={styles.commentsContainer}>
            <Text style={[styles.commentsTitle, { fontSize: fontSizes.commentsTitle }]}>
              {lang === 'zh' ? '留言' : 'Comments'}
            </Text>
            {comments.length === 0 ? (
              <Text style={[styles.noCommentsText, { fontSize: fontSizes.commentContent }]}>
                {lang === 'zh' ? '暂无留言，快来抢沙发吧！' : 'No comments yet, be the first to comment!'}
              </Text>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentAvatar}>
                      <Text style={[styles.commentAvatarText, { fontSize: fontSizes.commentContent * 0.8 }]}>
                        {comment.users?.email.charAt(0) || 'U'}
                      </Text>
                    </View>
                    <View style={styles.commentMeta}>
                      <Text style={[styles.commentAuthor, { fontSize: fontSizes.commentContent }]}>
                        {maskUsername(comment.users?.email.split('@')[0] || 'User')}
                      </Text>
                      <Text style={[styles.commentTime, { fontSize: fontSizes.commentContent * 0.8 }]}>
                        {new Date(comment.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.commentContent, { fontSize: fontSizes.commentContent, lineHeight: fontSizes.commentContent * 1.4 }]}>
                    {comment.content}
                  </Text>
                  {comment.replies.length > 0 && (
                    <View style={styles.repliesContainer}>
                      {comment.replies.map((reply) => (
                        <View key={reply.id} style={styles.replyItem}>
                          <View style={styles.commentHeader}>
                            <View style={styles.commentAvatar}>
                              <Text style={[styles.commentAvatarText, { fontSize: fontSizes.commentContent * 0.8 }]}>
                                {reply.users?.email.charAt(0) || 'U'}
                              </Text>
                            </View>
                            <View style={styles.commentMeta}>
                              <Text style={[styles.commentAuthor, { fontSize: fontSizes.commentContent }]}>
                                {maskUsername(reply.users?.email.split('@')[0] || 'User')}
                              </Text>
                              <Text style={[styles.commentTime, { fontSize: fontSizes.commentContent * 0.8 }]}>
                                {new Date(reply.created_at).toLocaleDateString()}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.commentContent, { fontSize: fontSizes.commentContent, lineHeight: fontSizes.commentContent * 1.4 }]}>
                            {reply.content}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* 留言输入区域 */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder={lang === 'zh' ? '写下你的留言...' : 'Write your comment...'}
          placeholderTextColor="#999"
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />
        <Pressable 
          onPress={handleSubmitComment} 
          disabled={submittingComment || !commentText.trim()}
          style={[styles.submitButton, (!commentText.trim() || submittingComment) && styles.submitButtonDisabled]}
        >
          {submittingComment ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {lang === 'zh' ? '发送' : 'Send'}
            </Text>
          )}
        </Pressable>
      </View>

      {/* PDF阅读模态窗口（仅在非Web平台上显示） */}
      {Platform.OS !== 'web' && (
        <Modal
          visible={showPdfModal}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowPdfModal(false)}
        >
          <View style={styles.pdfModalContainer}>
            {/* 模态窗口头部 */}
            <View style={styles.pdfModalHeader}>
              <Pressable
                onPress={() => setShowPdfModal(false)}
                style={styles.pdfModalBackButton}
              >
                <Text style={styles.pdfModalBackText}>←</Text>
              </Pressable>
              <Text style={styles.pdfModalTitle}>
                {lang === 'zh' ? 'PDF阅读' : 'PDF Reader'}
              </Text>
              <View style={styles.pdfModalHeaderRight} />
            </View>

            {/* PDF内容 */}
            <View style={styles.pdfContentContainer}>
              {currentArticle.pdf_url && Pdf ? (
                <Pdf
                  source={{ uri: currentArticle.pdf_url }}
                  style={styles.pdf}
                  onError={(error) => {
                    console.error('PDF error:', error)
                    Alert.alert(
                      lang === 'zh' ? '错误' : 'Error',
                      lang === 'zh' ? 'PDF加载失败，请重试' : 'Failed to load PDF, please try again'
                    )
                  }}
                />
              ) : (
                <View style={styles.pdfErrorContainer}>
                  <Text style={styles.pdfErrorText}>
                    {lang === 'zh' ? 'PDF文件不存在' : 'PDF file not found'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingBottom: 100,
  },
  articleContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#576b95',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  accountName: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    color: '#000000',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 36,
    marginBottom: 16,
  },
  coverImageContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    color: '#888888',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#888888',
    fontSize: 14,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 24,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  content: {
    color: '#333333',
    fontSize: 17,
    lineHeight: 28,
    letterSpacing: 0.5,
  },
  interactionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 24,
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  interactionButtonPressed: {
    opacity: 0.7,
    backgroundColor: 'rgba(87, 107, 149, 0.1)',
    borderRadius: 8,
  },
  interactionIcon: {
    fontSize: 18,
    marginRight: 4,
  },
  interactionText: {
    color: '#576b95',
    fontSize: 14,
  },
  commentsContainer: {
    paddingBottom: 24,
  },
  commentsTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  noCommentsText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 40,
  },
  commentItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#576b95',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  commentAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  commentMeta: {
    flex: 1,
  },
  commentAuthor: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  commentTime: {
    color: '#999',
    fontSize: 12,
  },
  commentContent: {
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  repliesContainer: {
    marginTop: 12,
    marginLeft: 40,
  },
  replyItem: {
    marginBottom: 12,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#576b95',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#999',
    fontSize: 14,
  },
  // PDF按钮样式
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 12,
  },
  pdfButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  pdfButtonText: {
    fontSize: 16,
    color: '#576b95',
    fontWeight: '500',
  },
  // PDF模态窗口样式
  pdfModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pdfModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    height: 56,
  },
  pdfModalBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfModalBackText: {
    fontSize: 24,
    color: '#000',
    fontWeight: '300',
  },
  pdfModalTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000',
  },
  pdfModalHeaderRight: {
    width: 40,
  },
  pdfContentContainer: {
    flex: 1,
  },
  pdf: {
    flex: 1,
  },
  pdfErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfErrorText: {
    fontSize: 16,
    color: '#999',
  },
})
