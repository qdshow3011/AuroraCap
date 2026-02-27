import React, { useState, useEffect } from 'react';
import {
  Layout,
  Breadcrumb,
  Card,
  Upload,
  Button,
  List,
  Image,
  message,
  Modal,
  Space,
  Popconfirm,
  Tag,
  Input,
  Select,
  DatePicker,
  Badge,
  Tooltip,
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  SearchOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase 客户端
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mptprqlndfbhguqklnnx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_x3J89NuOrsaIei0SsGMN_g_poYCwQnw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const BUCKET_NAME = 'qdshow101';

const { Content } = Layout;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadTime: string;
  category: string;
}

const MediaLibrary: React.FC = () => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [searchText, setSearchText] = useState('');
  const [category, setCategory] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [groupBy, setGroupBy] = useState(''); // 分组方式：''(不分组), 'type'(按类型), 'date'(按日期), 'size'(按大小)
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState(''); // 当前路径，默认为根目录

  // 从 Supabase Storage 加载文件列表
  useEffect(() => {
    loadFiles();
  }, [currentPath]); // 当路径变化时重新加载文件
  
  // 处理返回上一级目录
  const handleGoBack = () => {
    if (currentPath) {
      // 移除最后一级路径
      const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
      setCurrentPath(parentPath);
    }
  };
  
  // 处理返回根目录
  const handleGoToRoot = () => {
    setCurrentPath('');
  };

  const loadFiles = async () => {
    console.log('loadFiles被调用，当前路径:', currentPath);
    setLoading(true);
    try {
      // 从 Supabase Storage 获取文件列表，使用detailed选项获取详细信息
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(
          // 第一个参数是prefix，使用currentPath
          currentPath,
          {
            limit: 100,
            offset: 0,
            sortBy: {
              column: 'name',
              order: 'asc'
            },
            // 添加detailed选项以获取文件的详细信息，包括大小和修改时间
            detailed: true
          }
        );
      
      console.log('获取文件列表成功，数据:', data);
      console.log('获取文件列表错误:', error);

      if (error) {
        console.error('获取文件列表失败:', error);
        console.error('错误详情:', error.details);
        console.error('错误提示:', error.hint);
        console.error('错误代码:', error.code);
        message.error(`获取文件列表失败: ${error.message}`);
        setFiles([]);
        return;
      }

      if (!data || data.length === 0) {
        setFiles([]);
        return;
      }

      // 处理文件列表，获取每个文件的详细信息
      const processedFiles = data.map((file) => {
        console.log('处理文件:', file);
        
        // 检查是否是文件夹（文件夹通常以/结尾）
        const isFolder = file.name.endsWith('/');
        
        console.log('是否是文件夹:', isFolder);
        
        if (isFolder) {
          // 文件夹处理
          return {
            id: file.name,
            name: file.name.replace(/\/$/, ''), // 移除末尾的/ 
            type: 'folder',
            size: 0,
            url: '',
            uploadTime: new Date().toISOString(),
            category: '文件夹',
          };
        } else {
          // 文件处理
          // 获取文件的公共URL
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(file.name);

          // 不区分大小写检查文件扩展名
          const fileNameLower = file.name.toLowerCase();
          const isImage = fileNameLower.endsWith('.jpg') || 
                         fileNameLower.endsWith('.jpeg') || 
                         fileNameLower.endsWith('.png') || 
                         fileNameLower.endsWith('.gif');
          
          // 从detailed响应中获取文件的详细信息
          let fileSize = 0;
          let fileUploadTime = new Date().toISOString();
          
          try {
            // 检查file对象是否已经包含size属性（detailed模式下应该包含）
            if ('size' in file) {
              fileSize = Number((file as any).size) || 0;
            } else if ('Size' in file) {
              // 检查是否有大写的Size属性
              fileSize = Number((file as any).Size) || 0;
            }
            
            // 检查file对象是否已经包含修改时间或创建时间（detailed模式下应该包含）
            if ('modified_at' in file) {
              fileUploadTime = (file as any).modified_at || new Date().toISOString();
            } else if ('created_at' in file) {
              fileUploadTime = (file as any).created_at || new Date().toISOString();
            }
          } catch (error) {
            console.error('获取文件详细信息失败:', error);
          }
          
          return {
            id: file.name, // 使用文件名作为唯一标识
            name: file.name.replace(currentPath, ''), // 移除当前路径前缀，只显示文件名
            type: isImage ? 'image/' + file.name.split('.').pop()?.toLowerCase() : 'application/' + file.name.split('.').pop()?.toLowerCase(),
            size: fileSize,
            url: urlData.publicUrl,
            uploadTime: fileUploadTime,
            category: isImage ? '图片' : '文档',
          };
        }
      });
      
      console.log('处理后的文件列表:', processedFiles);

      setFiles(processedFiles);
    } catch (error) {
      console.error('加载文件失败:', error);
      message.error('加载文件失败');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload: UploadProps['onChange'] = async (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
    } else if (info.file.status === 'done') {
      message.success(`${info.file.name} 文件上传成功`);
      // 重新加载文件列表
      await loadFiles();
      setLoading(false);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 文件上传失败`);
      setLoading(false);
    }
  };

  const handlePreview = (file: MediaFile) => {
    // 不区分大小写检查文件是否为图片文件
    const typeLower = (file.type || '').toLowerCase();
    const nameLower = (file.name || '').toLowerCase();
    
    const isImage = typeLower.startsWith('image/') || 
                   nameLower.endsWith('.jpg') || 
                   nameLower.endsWith('.jpeg') || 
                   nameLower.endsWith('.png') || 
                   nameLower.endsWith('.gif');
    
    if (isImage) {
      setPreviewImage(file.url);
      setPreviewTitle(file.name);
      setPreviewVisible(true);
    } else {
      message.info('只能预览图片文件');
    }
  };

  const handleDownload = (file: MediaFile) => {
    // 直接使用文件的公共URL进行下载
    message.info(`开始下载 ${file.name}`);
    window.open(file.url, '_blank');
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      // 从 Supabase Storage 删除文件
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([id]);

      if (error) {
        console.error('删除文件失败:', error);
        message.error('删除文件失败');
        return;
      }

      // 更新本地文件列表
      setFiles(files.filter(file => file.id !== id));
      message.success('文件删除成功');
    } catch (error) {
      console.error('删除文件失败:', error);
      message.error('删除文件失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (file: MediaFile) => {
    try {
      // 复制文件的公共URL到剪贴板
      await navigator.clipboard.writeText(file.url);
      message.success('链接复制成功');
    } catch (error) {
      console.error('复制链接失败:', error);
      // 降级方案：使用传统的复制方法
      const textArea = document.createElement('textarea');
      textArea.value = file.url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      message.success('链接复制成功');
    }
  };

  const getFileIcon = (type: string, name: string, url: string) => {
    // 检查是否是文件夹
    if (type === 'folder') {
      return <FolderOpenOutlined style={{ fontSize: '32px', color: '#faad14' }} />;
    }
    
    // 不区分大小写检查文件是否为图片文件
    const typeLower = (type || '').toLowerCase();
    const nameLower = (name || '').toLowerCase();
    
    const isImage = typeLower.startsWith('image/') || 
                   nameLower.endsWith('.jpg') || 
                   nameLower.endsWith('.jpeg') || 
                   nameLower.endsWith('.png') || 
                   nameLower.endsWith('.gif');
    
    if (isImage) {
      return <Image preview={false} width={48} height={48} src={url} style={{ objectFit: 'cover', borderRadius: 4 }} />;
    } else if (typeLower.includes('pdf') || nameLower.endsWith('.pdf')) {
      return <FileTextOutlined style={{ fontSize: '32px', color: '#ff4d4f' }} />;
    } else {
      return <FileTextOutlined style={{ fontSize: '32px', color: '#1890ff' }} />;
    }
  };

  const getFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = category ? file.category === category : true;
    const matchesDateRange = dateRange
      ? dayjs(file.uploadTime).isAfter(dateRange[0]) && dayjs(file.uploadTime).isBefore(dateRange[1])
      : true;
    return matchesSearch && matchesCategory && matchesDateRange;
  });

  // 分组处理函数
  const getGroupedFiles = () => {
    if (!groupBy || filteredFiles.length === 0) {
      return [{ key: 'all', title: '全部文件', children: filteredFiles }];
    }

    const grouped: Record<string, MediaFile[]> = {};

    filteredFiles.forEach(file => {
      let groupKey = '';

      switch (groupBy) {
        case 'type':
          // 按文件类型分组
          groupKey = file.category || '其他';
          break;
        case 'date':
          // 按上传日期分组
          groupKey = dayjs(file.uploadTime).format('YYYY-MM-DD');
          break;
        case 'size':
          // 按文件大小分组
          if (file.size < 1024 * 1024) {
            groupKey = '小于1MB';
          } else if (file.size < 10 * 1024 * 1024) {
            groupKey = '1MB-10MB';
          } else if (file.size < 50 * 1024 * 1024) {
            groupKey = '10MB-50MB';
          } else {
            groupKey = '大于50MB';
          }
          break;
        default:
          groupKey = '全部文件';
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(file);
    });

    // 转换为分组数组
    return Object.entries(grouped).map(([key, children]) => ({
      key,
      title: key,
      children
    }));
  };

  // 获取分组后的文件
  const groupedFiles = getGroupedFiles();

  const uploadProps: UploadProps = {
    name: 'file',
    // 使用自定义上传逻辑
    customRequest: async (options) => {
      const { file, onSuccess, onError } = options;
      setLoading(true);
      try {
        // 确保file是File类型
        const uploadFile = typeof file === 'string' ? new File([file], 'upload.txt') : file as File;
        
        // 使用 Supabase Storage 上传文件
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(uploadFile.name, uploadFile);

        if (error) {
          console.error('上传文件失败:', error);
          if (onError) {
            onError(new Error('上传文件失败'));
          }
          return;
        }

        if (onSuccess) {
          onSuccess(data);
        }
      } catch (error) {
        console.error('上传文件失败:', error);
        if (onError) {
          onError(new Error('上传文件失败'));
        }
      } finally {
        setLoading(false);
      }
    },
    onChange: handleUpload,
    multiple: true,
    maxCount: 10,
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ margin: '0 16px' }}>
        <Breadcrumb
          style={{ margin: '16px 0' }}
          items={[
            {
              title: '资讯中心',
            },
            {
              title: '媒体库',
            },
          ]}
        />
        <Card
          title={
            <Space>
              <FolderOpenOutlined />
              媒体库管理
              <Badge count={files.length} style={{ marginLeft: 8 }} />
              
              {/* 路径导航 */}
              {currentPath && (
                <Space size="small" style={{ marginLeft: 16 }}>
                  <Button 
                    size="small" 
                    onClick={handleGoBack}
                    disabled={!currentPath}
                  >
                    返回上一级
                  </Button>
                  <Button 
                    size="small" 
                    onClick={handleGoToRoot}
                  >
                    返回根目录
                  </Button>
                  <span style={{ color: '#666', fontSize: 12 }}>
                    当前路径: {currentPath}
                  </span>
                </Space>
              )}
            </Space>
          }
          extra={
            <Space>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                loading={loading}
                onClick={() => {
                  // 触发上传组件
                  const uploadInput = document.getElementById('upload-input') as HTMLInputElement;
                  uploadInput?.click();
                }}
              >
                上传文件
              </Button>
              <input
                id="upload-input"
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;
                  
                  setLoading(true);
                  try {
                    // 逐个上传文件
                    for (let i = 0; i < files.length; i++) {
                      const file = files[i];
                      // 为文件名添加时间戳，避免重名冲突
                      const fileName = currentPath ? `${currentPath}${Date.now()}_${file.name}` : `${Date.now()}_${file.name}`;
                      const { error } = await supabase.storage
                        .from(BUCKET_NAME)
                        .upload(fileName, file, {
                          upsert: true,
                          cacheControl: '3600'
                        });

                      if (error) {
                        console.error('上传文件失败:', error);
                        console.error('错误详情:', error.details);
                        console.error('错误提示:', error.hint);
                        console.error('错误代码:', error.code);
                        message.error(`${file.name} 上传失败: ${error.message}`);
                      } else {
                        message.success(`${file.name} 上传成功`);
                      }
                    }
                    // 重新加载文件列表
                    await loadFiles();
                  } catch (error) {
                    console.error('上传文件失败:', error);
                    message.error('上传文件失败');
                  } finally {
                    setLoading(false);
                    // 清空input值，允许重复上传同一文件
                    e.target.value = '';
                  }
                }}
              />
            </Space>
          }
        >
          {/* 搜索和筛选 */}
          <Card
            size="small"
            style={{ marginBottom: 16 }}
            title={<SearchOutlined style={{ marginRight: 8 }} />}
          >
            <Space wrap>
              <Input
                placeholder="搜索文件名"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
                prefix={<SearchOutlined />}
              />
              <Select
                placeholder="按分类筛选"
                style={{ width: 120 }}
                value={category}
                onChange={setCategory}
                allowClear
              >
                <Option value="图片">图片</Option>
                <Option value="文档">文档</Option>
                <Option value="视频">视频</Option>
                <Option value="音频">音频</Option>
              </Select>
              <Select
                placeholder="按...分组"
                style={{ width: 120 }}
                value={groupBy}
                onChange={setGroupBy}
                allowClear
              >
                <Option value="type">按类型分组</Option>
                <Option value="date">按日期分组</Option>
                <Option value="size">按大小分组</Option>
              </Select>
              <RangePicker
                style={{ width: 240 }}
                value={dateRange}
                onChange={(dates) => {
                  setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null);
                }}
                placeholder={['开始日期', '结束日期']}
              />
              <Button
                onClick={() => {
                  setSearchText('');
                  setCategory('');
                  setDateRange(null);
                  setGroupBy('');
                }}
              >
                重置
              </Button>
            </Space>
          </Card>

          {/* 文件列表 */}
          {groupBy ? (
            // 分组显示
            <div>
              {groupedFiles.map(group => (
                <div key={group.key} style={{ marginBottom: 24 }}>
                  <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600, color: '#333' }}>
                    {group.title} ({group.children.length}个文件)
                  </h3>
                  <List
                    grid={{
                      gutter: 16,
                      xs: 1,
                      sm: 2,
                      md: 3,
                      lg: 4,
                      xl: 5,
                      xxl: 6,
                    }}
                    dataSource={group.children}
                    renderItem={(file) => (
                      <List.Item>
                        <Card
                          hoverable
                          cover={
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: 120,
                                backgroundColor: '#f5f5f5',
                                cursor: file.type === 'folder' ? 'pointer' : 'default',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (file.type === 'folder') {
                                  // 打开文件夹
                                  console.log('点击文件夹图标:', file.name, '文件ID:', file.id);
                                  setCurrentPath(file.id);
                                  console.log('设置当前路径为:', file.id);
                                }
                              }}
                            >
                              {getFileIcon(file.type, file.name, file.url)}
                            </div>
                          }
                          actions={file.type === 'folder' ? [] : [
                            <Tooltip title="预览">
                              <Button
                                icon={<EyeOutlined />}
                                size="small"
                                onClick={() => handlePreview(file)}
                              />
                            </Tooltip>,
                            <Tooltip title="下载">
                              <Button
                                icon={<DownloadOutlined />}
                                size="small"
                                onClick={() => handleDownload(file)}
                              />
                            </Tooltip>,
                            <Tooltip title="复制链接">
                              <Button
                                icon={<CopyOutlined />}
                                size="small"
                                onClick={() => handleCopyLink(file)}
                              />
                            </Tooltip>,
                            <Tooltip title="删除">
                              <Popconfirm
                                title="确定要删除这个文件吗？"
                                onConfirm={() => handleDelete(file.id)}
                                okText="确定"
                                cancelText="取消"
                              >
                                <Button
                                  icon={<DeleteOutlined />}
                                  size="small"
                                  danger
                                />
                              </Popconfirm>
                            </Tooltip>,
                          ]}
                        >
                          <Card.Meta
                            title={
                              <Tooltip title={file.name}>
                                <div 
                                  style={{ 
                                    wordBreak: 'break-all', 
                                    lineHeight: 1.4,
                                    cursor: file.type === 'folder' ? 'pointer' : 'default',
                                    color: file.type === 'folder' ? '#faad14' : 'inherit'
                                  }}
                                  onClick={() => {
                                    if (file.type === 'folder') {
                                      // 打开文件夹
                                      console.log('点击文件夹:', file.name, '文件ID:', file.id);
                                      setCurrentPath(file.id);
                                      console.log('设置当前路径为:', file.id);
                                    }
                                  }}
                                >
                                  {file.name}
                                </div>
                              </Tooltip>
                            }
                            description={
                              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                <Tag color={file.type === 'folder' ? 'orange' : (file.type.startsWith('image/') ? 'green' : 'blue')}>
                                  {file.category}
                                </Tag>
                              </Space>
                            }
                          />
                        </Card>
                      </List.Item>
                    )}
                  />
                </div>
              ))}
            </div>
          ) : (
            // 不分组显示
            <List
              grid={{
                gutter: 16,
                xs: 1,
                sm: 2,
                md: 3,
                lg: 4,
                xl: 5,
                xxl: 6,
              }}
              dataSource={filteredFiles}
              renderItem={(file) => (
                <List.Item>
                  <Card
                    hoverable
                    cover={
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          height: 120,
                          backgroundColor: '#f5f5f5',
                          cursor: file.type === 'folder' ? 'pointer' : 'default',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (file.type === 'folder') {
                            // 打开文件夹
                            console.log('点击文件夹图标:', file.name, '文件ID:', file.id);
                            setCurrentPath(file.id);
                            console.log('设置当前路径为:', file.id);
                          }
                        }}
                      >
                        {getFileIcon(file.type, file.name, file.url)}
                      </div>
                    }
                    actions={file.type === 'folder' ? [] : [
                      <Tooltip title="预览">
                        <Button
                          icon={<EyeOutlined />}
                          size="small"
                          onClick={() => handlePreview(file)}
                        />
                      </Tooltip>,
                      <Tooltip title="下载">
                        <Button
                          icon={<DownloadOutlined />}
                          size="small"
                          onClick={() => handleDownload(file)}
                        />
                      </Tooltip>,
                      <Tooltip title="复制链接">
                        <Button
                          icon={<CopyOutlined />}
                          size="small"
                          onClick={() => handleCopyLink(file)}
                        />
                      </Tooltip>,
                      <Tooltip title="删除">
                        <Popconfirm
                          title="确定要删除这个文件吗？"
                          onConfirm={() => handleDelete(file.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button
                            icon={<DeleteOutlined />}
                            size="small"
                            danger
                          />
                        </Popconfirm>
                      </Tooltip>,
                    ]}
                  >
                    <Card.Meta
                      title={
                        <Tooltip title={file.name}>
                          <div 
                            style={{ 
                              wordBreak: 'break-all', 
                              lineHeight: 1.4,
                              cursor: file.type === 'folder' ? 'pointer' : 'default',
                              color: file.type === 'folder' ? '#faad14' : 'inherit'
                            }}
                            onClick={() => {
                              if (file.type === 'folder') {
                                // 打开文件夹
                                setCurrentPath(file.id);
                              }
                            }}
                          >
                            {file.name}
                          </div>
                        </Tooltip>
                      }
                      description={
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Tag color={file.type === 'folder' ? 'orange' : (file.type.startsWith('image/') ? 'green' : 'blue')}>
                            {file.category}
                          </Tag>
                        </Space>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          )}

          {/* 上传组件 */}
          <Upload {...uploadProps} style={{ display: 'none' }} />

          {/* 预览模态框 */}
          <Modal
            open={previewVisible}
            title={previewTitle}
            footer={null}
            onCancel={() => setPreviewVisible(false)}
          >
            <Image src={previewImage} />
          </Modal>

          {/* 空状态 */}
          {filteredFiles.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: 64,
                backgroundColor: '#fafafa',
                borderRadius: 8,
              }}
            >
              <FolderOpenOutlined style={{ fontSize: 48, color: '#ccc' }} />
              <h3 style={{ marginTop: 16, color: '#999' }}>暂无文件</h3>
              <p style={{ color: '#ccc' }}>点击上传按钮添加文件</p>
            </div>
          )}
        </Card>
      </Content>
    </Layout>
  );
};

export default MediaLibrary;