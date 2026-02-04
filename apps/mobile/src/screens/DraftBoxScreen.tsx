import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'

interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  cover_image?: string;
  pdf_url?: string;
  status: string;
  created_at: string;
  account_id: string;
  author: string;
}

interface DraftBoxScreenProps {
  onClose?: () => void;
  lang?: 'zh' | 'en';
  userInfo?: any;
  onNavigate?: (screen: string) => void;
  onEditDraft?: (draft: Article) => void;
}

export default function DraftBoxScreen({ onClose, lang = 'zh', userInfo, onEditDraft }: DraftBoxScreenProps) {
  const [drafts, setDrafts] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '草稿箱',
    noDrafts: '暂无草稿',
    publish: '发表',
    edit: '编辑',
    loading: '加载中...',
    publishSuccess: '发表成功',
    publishError: '发表失败',
    cancel: '取消',
    ok: '确定',
    error: '错误',
    loadingError: '加载失败',
    success: '成功',
  } : {
    title: 'Draft Box',
    noDrafts: 'No drafts yet',
    publish: 'Publish',
    edit: 'Edit',
    loading: 'Loading...',
    publishSuccess: 'Published successfully',
    publishError: 'Failed to publish',
    cancel: 'Cancel',
    ok: 'OK',
    error: 'Error',
    loadingError: 'Failed to load',
    success: 'Success',
  };

  // 获取草稿列表
  const fetchDrafts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('internal_references')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setDrafts(data || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
      Alert.alert(t.error, t.loadingError);
    } finally {
      setLoading(false);
    }
  };

  // 发表草稿
  const publishDraft = async (draftId: string) => {
    try {
      setPublishing(true);
      
      const { data, error } = await supabase
        .from('internal_references')
        .update({ status: 'published' })
        .eq('id', draftId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      Alert.alert(t.success, t.publishSuccess);
      fetchDrafts();
    } catch (error) {
      console.error('Error publishing draft:', error);
      Alert.alert(t.error, t.publishError);
    } finally {
      setPublishing(false);
    }
  };



  // 初始加载草稿列表
  useEffect(() => {
    fetchDrafts();
  }, []);

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#576b95" />
            <Text style={styles.loadingText}>{t.loading}</Text>
          </View>
        ) : drafts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>{t.noDrafts}</Text>
          </View>
        ) : (
          drafts.map((draft) => (
            <View key={draft.id} style={styles.draftCard}>
              <View style={styles.draftContent}>
                <Text style={styles.draftTitle}>{draft.title}</Text>
                <Text style={styles.draftSummary} numberOfLines={2}>
                  {draft.summary}
                </Text>
                <Text style={styles.draftDate}>
                  {new Date(draft.created_at).toLocaleString()}
                </Text>
              </View>
              <View style={styles.draftActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => onEditDraft?.(draft)}
                >
                  <Ionicons name="create-outline" size={16} color="#4CAF50" />
                  <Text style={styles.editButtonText}>{t.edit}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.publishButton]}
                  onPress={() => publishDraft(draft.id)}
                  disabled={publishing}
                >
                  <Ionicons name="send-outline" size={16} color="#fff" />
                  <Text style={styles.publishButtonText}>{t.publish}</Text>
                </TouchableOpacity>

              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  draftCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  draftContent: {
    marginBottom: 12,
  },
  draftTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  draftSummary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  draftDate: {
    fontSize: 12,
    color: '#999',
  },
  draftActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  publishButton: {
    backgroundColor: '#4CAF50',
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 4,
  },
  editButton: {
    backgroundColor: '#e8f5e8',
  },
  editButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    marginLeft: 4,
  },

});
