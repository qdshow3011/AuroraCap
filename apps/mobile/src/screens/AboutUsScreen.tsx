import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native'

export default function AboutUsScreen({ onBack, lang = 'zh' }: { onBack: () => void; lang?: 'zh' | 'en' }) {
  const aboutContent = {
    company: {
      title: lang === 'zh' ? '关于极光基金' : 'About Aurora Fund',
      logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20financial%20company%20logo%20with%20aurora%20theme%20blue%20and%20purple%20gradient&image_size=square_hd',
      description: lang === 'zh' ? '极光基金管理有限公司成立于2015年，是一家专注于为客户提供专业资产管理服务的综合性基金管理公司。公司拥有丰富的投资经验和专业的投研团队，致力于为客户创造长期稳健的投资回报。' : 'Aurora Fund Management Co., Ltd. was established in 2015, is a comprehensive fund management company focused on providing professional asset management services to clients. The company has rich investment experience and a professional research team, dedicated to creating long-term stable investment returns for clients.',
      mission: lang === 'zh' ? '我们的使命' : 'Our Mission',
      missionText: lang === 'zh' ? '通过专业的资产管理服务，帮助客户实现财富增值，为社会创造价值。' : 'Through professional asset management services, help clients achieve wealth appreciation and create value for society.',
      vision: lang === 'zh' ? '我们的愿景' : 'Our Vision',
      visionText: lang === 'zh' ? '成为国内领先的资产管理机构，为客户提供全方位的财富管理解决方案。' : 'To become a leading asset management institution in China, providing comprehensive wealth management solutions for clients.',
      values: lang === 'zh' ? '核心价值观' : 'Core Values',
      valuesList: [
        lang === 'zh' ? '专业诚信：以专业的态度和诚信的精神服务客户' : 'Professional Integrity: Serve clients with professional attitude and honest spirit',
        lang === 'zh' ? '创新进取：不断创新，追求卓越' : 'Innovation and Enterprise: Continuous innovation, pursuit of excellence',
        lang === 'zh' ? '客户至上：以客户需求为中心，为客户创造价值' : 'Customer First: Centered on customer needs, create value for customers',
        lang === 'zh' ? '责任担当：勇于担当，履行社会责任' : 'Responsibility: Have the courage to take responsibility and fulfill social responsibilities'
      ]
    },
    itCompany: {
      title: lang === 'zh' ? '信息技术服务公司' : 'Information Technology Service Company',
      logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20technology%20company%20logo%20with%20digital%20elements&image_size=square_hd',
      description: lang === 'zh' ? '极光信息技术有限公司是极光基金的全资子公司，专注于为金融行业提供专业的信息技术服务。公司拥有一支高素质的技术团队，致力于为金融机构提供安全、高效、稳定的信息技术解决方案。' : 'Aurora Information Technology Co., Ltd. is a wholly-owned subsidiary of Aurora Fund, focused on providing professional information technology services for the financial industry. The company has a high-quality technical team, dedicated to providing safe, efficient and stable information technology solutions for financial institutions.',
      services: lang === 'zh' ? '主要服务' : 'Main Services',
      servicesList: [
        lang === 'zh' ? '金融软件开发与维护' : 'Financial software development and maintenance',
        lang === 'zh' ? '信息系统集成与实施' : 'Information system integration and implementation',
        lang === 'zh' ? '网络安全与数据保护' : 'Network security and data protection',
        lang === 'zh' ? '云计算与大数据服务' : 'Cloud computing and big data services',
        lang === 'zh' ? '金融科技解决方案' : 'Financial technology solutions'
      ]
    },
    team: {
      title: lang === 'zh' ? '专业团队' : 'Professional Team',
      description: lang === 'zh' ? '我们拥有一支由行业精英组成的专业团队，包括投资专家、研究分析师、风险管理师和技术专家等。团队成员均具有丰富的行业经验和专业知识，致力于为客户提供最优质的服务。' : 'We have a professional team composed of industry elites, including investment experts, research analysts, risk managers and technical experts. Team members all have rich industry experience and professional knowledge, dedicated to providing the highest quality services for clients.',
      members: [
        {
          name: lang === 'zh' ? '张明' : 'Zhang Ming',
          position: lang === 'zh' ? '首席执行官' : 'Chief Executive Officer',
          bio: lang === 'zh' ? '拥有20年金融行业经验，曾任职于多家国际知名金融机构，具有丰富的资产管理和投资银行经验。' : 'With 20 years of financial industry experience, he has worked in many internationally renowned financial institutions, with rich experience in asset management and investment banking.'
        },
        {
          name: lang === 'zh' ? '李华' : 'Li Hua',
          position: lang === 'zh' ? '首席投资官' : 'Chief Investment Officer',
          bio: lang === 'zh' ? '金融学博士，15年投资管理经验，专注于股票市场和固定收益产品的研究与投资。' : 'PhD in Finance, 15 years of investment management experience, focused on research and investment in stock markets and fixed income products.'
        },
        {
          name: lang === 'zh' ? '王强' : 'Wang Qiang',
          position: lang === 'zh' ? '首席技术官' : 'Chief Technology Officer',
          bio: lang === 'zh' ? '计算机科学硕士，12年金融科技经验，曾主导多个大型金融系统的开发与实施。' : 'Master of Computer Science, 12 years of financial technology experience, has led the development and implementation of multiple large financial systems.'
        }
      ]
    },
    history: {
      title: lang === 'zh' ? '发展历程' : 'Development History',
      timeline: [
        {
          year: '2015',
          event: lang === 'zh' ? '极光基金管理有限公司成立' : 'Aurora Fund Management Co., Ltd. was established'
        },
        {
          year: '2016',
          event: lang === 'zh' ? '获得基金管理业务资格' : 'Obtained fund management business qualification'
        },
        {
          year: '2018',
          event: lang === 'zh' ? '成立极光信息技术有限公司' : 'Established Aurora Information Technology Co., Ltd.'
        },
        {
          year: '2020',
          event: lang === 'zh' ? '推出首只公募基金产品' : 'Launched the first public fund product'
        },
        {
          year: '2022',
          event: lang === 'zh' ? '资产管理规模突破100亿元' : 'Asset management scale exceeded 10 billion yuan'
        },
        {
          year: '2024',
          event: lang === 'zh' ? '推出移动APP，实现线上服务' : 'Launched mobile APP, realized online services'
        }
      ]
    },
    contact: {
      title: lang === 'zh' ? '联系我们' : 'Contact Us',
      address: lang === 'zh' ? '北京市朝阳区建国门外大街1号国贸大厦A座25层' : '25th Floor, Tower A, China World Tower, No. 1 Jianguomenwai Avenue, Chaoyang District, Beijing',
      phone: '+86 10 8888 8888',
      email: 'info@aurorafund.com',
      website: 'www.aurorafund.com'
    },
    legal: {
      title: lang === 'zh' ? '法律信息' : 'Legal Information',
      items: [
        {
          name: lang === 'zh' ? '营业执照' : 'Business License',
          value: '91110000XXXXXXXXXX'
        },
        {
          name: lang === 'zh' ? '基金管理资格' : 'Fund Management Qualification',
          value: 'AXXXXXXXX'
        },
        {
          name: lang === 'zh' ? '监管机构' : 'Regulatory Authority',
          value: lang === 'zh' ? '中国证券监督管理委员会' : 'China Securities Regulatory Commission'
        }
      ]
    },
    app: {
      title: lang === 'zh' ? '关于APP' : 'About the APP',
      version: '1.0.0',
      copyright: lang === 'zh' ? '© 2024 极光基金管理有限公司 版权所有' : '© 2024 Aurora Fund Management Co., Ltd. All Rights Reserved'
    }
  }

  return (
    <View style={styles.container}>
      {/* 头部导航 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{lang === 'zh' ? '关于我们' : 'About Us'}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 内容区域 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 公司介绍 */}
        <View style={styles.section}>
          <View style={styles.companyHeader}>
            <Image source={{ uri: aboutContent.company.logo }} style={styles.companyLogo} />
            <Text style={styles.companyName}>极光基金</Text>
            <Text style={styles.companyNameEn}>Aurora Fund</Text>
          </View>
          <Text style={styles.sectionTitle}>{aboutContent.company.title}</Text>
          <Text style={styles.sectionDescription}>{aboutContent.company.description}</Text>
          
          {/* 公司使命愿景价值观 */}
          <View style={styles.valueSection}>
            <Text style={styles.valueTitle}>{aboutContent.company.mission}</Text>
            <Text style={styles.valueText}>{aboutContent.company.missionText}</Text>
            
            <Text style={styles.valueTitle}>{aboutContent.company.vision}</Text>
            <Text style={styles.valueText}>{aboutContent.company.visionText}</Text>
            
            <Text style={styles.valueTitle}>{aboutContent.company.values}</Text>
            {aboutContent.company.valuesList.map((value, index) => (
              <Text key={index} style={styles.valueItem}>• {value}</Text>
            ))}
          </View>
        </View>

        {/* 信息技术服务公司 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{aboutContent.itCompany.title}</Text>
          <View style={styles.itCompanyContainer}>
            <Image source={{ uri: aboutContent.itCompany.logo }} style={styles.itCompanyLogo} />
            <Text style={styles.sectionDescription}>{aboutContent.itCompany.description}</Text>
          </View>
          
          <Text style={styles.valueTitle}>{aboutContent.itCompany.services}</Text>
          {aboutContent.itCompany.servicesList.map((service, index) => (
            <Text key={index} style={styles.valueItem}>• {service}</Text>
          ))}
        </View>

        {/* 专业团队 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{aboutContent.team.title}</Text>
          <Text style={styles.sectionDescription}>{aboutContent.team.description}</Text>
          
          <View style={styles.teamContainer}>
            {aboutContent.team.members.map((member, index) => (
              <View key={index} style={styles.teamMember}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberPosition}>{member.position}</Text>
                <Text style={styles.memberBio}>{member.bio}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 发展历程 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{aboutContent.history.title}</Text>
          <View style={styles.timeline}>
            {aboutContent.history.timeline.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineYear}>
                  <Text style={styles.timelineYearText}>{item.year}</Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineEvent}>{item.event}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 联系我们 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{aboutContent.contact.title}</Text>
          <View style={styles.contactContainer}>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>{lang === 'zh' ? '地址' : 'Address'}</Text>
              <Text style={styles.contactValue}>{aboutContent.contact.address}</Text>
            </View>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>{lang === 'zh' ? '电话' : 'Phone'}</Text>
              <Text style={styles.contactValue}>{aboutContent.contact.phone}</Text>
            </View>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>{lang === 'zh' ? '邮箱' : 'Email'}</Text>
              <Text style={styles.contactValue}>{aboutContent.contact.email}</Text>
            </View>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>{lang === 'zh' ? '网站' : 'Website'}</Text>
              <Text style={styles.contactValue}>{aboutContent.contact.website}</Text>
            </View>
          </View>
        </View>

        {/* 法律信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{aboutContent.legal.title}</Text>
          {aboutContent.legal.items.map((item, index) => (
            <View key={index} style={styles.legalItem}>
              <Text style={styles.legalLabel}>{item.name}</Text>
              <Text style={styles.legalValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* 关于APP */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{aboutContent.app.title}</Text>
          <View style={styles.appInfo}>
            <Text style={styles.appVersion}>{lang === 'zh' ? '版本' : 'Version'}: {aboutContent.app.version}</Text>
            <Text style={styles.appCopyright}>{aboutContent.app.copyright}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  companyHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  companyLogo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 12,
  },
  companyName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  companyNameEn: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  valueSection: {
    marginTop: 16,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  valueText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  valueItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 4,
  },
  itCompanyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  itCompanyLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  teamContainer: {
    marginTop: 16,
  },
  teamMember: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  memberPosition: {
    fontSize: 14,
    color: '#4a90e2',
    marginBottom: 8,
  },
  memberBio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  timeline: {
    marginTop: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineYear: {
    width: 60,
    fontWeight: '600',
    color: '#4a90e2',
  },
  timelineYearText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a90e2',
  },
  timelineContent: {
    flex: 1,
  },
  timelineEvent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactContainer: {
    marginTop: 16,
  },
  contactItem: {
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 14,
    color: '#666',
  },
  legalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  legalLabel: {
    fontSize: 14,
    color: '#333',
  },
  legalValue: {
    fontSize: 14,
    color: '#666',
  },
  appInfo: {
    marginTop: 16,
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  appCopyright: {
    fontSize: 12,
    color: '#999',
  },
})
