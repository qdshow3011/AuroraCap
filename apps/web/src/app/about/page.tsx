'use client';

export default function AboutPage() {
  return (
    <section className="py-20 bg-[var(--surface)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[var(--text-primary)]">
            智启未来，乘势而行
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto">
            Aurora Intelligent Fund SPC Ltd. 公司概览
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-24 max-w-4xl mx-auto">
          {/* Section 1: 品牌起源 */}
          <section className="bg-[var(--background)] p-12 rounded-2xl shadow-lg">
            <h2 className="text-3xl font-semibold mb-6 text-[var(--text-primary)]">
              品牌起源：捕捉AI时代的黎明之光
            </h2>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              Aurora Intelligent Fund SPC Ltd. (AIF)，其名取自“Aurora”（极光/黎明），象征着在通用人工智能（AGI）奇点临近的时刻，为全球投资者捕捉科技变革的第一缕曙光。作为一家专注赋能 AI 产业生态的顶尖投资机构，AIF 采用独立投资组合公司（SPC）架构，致力于在高度波动的市场中，通过深度行业洞察与量化决策模型，构建穿越周期的智慧投资组合。
            </p>
          </section>

          {/* Section 2: 核心愿景 */}
          <section className="bg-[var(--background)] p-12 rounded-2xl shadow-lg">
            <h2 className="text-3xl font-semibold mb-6 text-[var(--text-primary)]">
              核心愿景：以人工智能重新定义价值投资
            </h2>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8">
              在 AIF，我们深信 AI 不仅仅是一个赛道，而是重塑全球生产力底座的“元技术”。我们的使命是：“链接前沿科技与长期资本，共享智能时代的复利增长。”
            </p>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              公司核心团队由资深硅谷技术专家、华尔街量化策略师以及亚洲顶尖金融分析师组成。这种跨领域的基因，使我们既能读懂底层的算力逻辑，也能精准预判资本市场的波动脉络。
            </p>
          </section>

          {/* Section 3: 核心产品矩阵 */}
          <section className="bg-[var(--background)] p-12 rounded-2xl shadow-lg">
            <h2 className="text-3xl font-semibold mb-6 text-[var(--text-primary)]">
              核心产品矩阵：全频谱的配置策略
            </h2>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8">
              为了满足不同风险偏好的投资者需求，AIF 打造了三支独具特色的旗舰子基金，精准覆盖 AI 产业链的各阶段红利：
            </p>
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-medium mb-3 text-[var(--text-primary)]">
                  AI变革先锋基金（AI Transformation Pioneer Fund）
                </h3>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                  这是 AIF 的“尖刀”产品。该基金聚焦于颠覆性创新的早期机会，重点布局大模型研发、具身智能及 AI 应用侧的独角兽企业。它代表了 AIF 对未来十年科技主旋律最坚定的看多立场。
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-3 text-[var(--text-primary)]">
                  AI发展平衡基金（AI Development Balanced Fund）
                </h3>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                  该基金秉承稳健进取的哲学，通过均衡配置 AI 硬件基础设施（如半导体、数据中心）与传统行业的 AI 数字化转型龙头，旨在波动的市场环境下提供具有韧性的资产增长，实现收益与风险的最佳平衡。
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-3 text-[var(--text-primary)]">
                  AI基础增利基金（AI Foundation Enhanced Income Fund）
                </h3>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                  侧重于产业链中现金流充裕、盈利模式成熟的“卖水人”企业。通过低波动策略与量化对冲手段，为投资者在获取科技成长红利的同时，锁定更具确定性的基础增利目标。
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: 投研优势 */}
          <section className="bg-[var(--background)] p-12 rounded-2xl shadow-lg">
            <h2 className="text-3xl font-semibold mb-6 text-[var(--text-primary)]">
              投研优势：数据驱动与深度研究
            </h2>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8">
              AIF 的竞争优势源于对“AI+投资”的深度集成。我们不仅投资 AI，更在投研过程中广泛应用自研的 AI 决策系统：
            </p>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-medium mb-3 text-[var(--text-primary)]">
                  全维度图谱调研
                </h3>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                  实时追踪全球 50,000+ AI 专利与学术论文动向，领先于财报发现行业趋势。
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-3 text-[var(--text-primary)]">
                  动态风险防控
                </h3>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                  采用智能算法监控全球市场情绪，实时调整仓位以应对非系统性风险。
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-3 text-[var(--text-primary)]">
                  产业协同生态
                </h3>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                  AIF 与多家顶级实验室及算力中心建立了深度伙伴关系，确保我们投出的每一笔资金都能触达技术的内核。
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: 结语 */}
          <section className="bg-[var(--background)] p-12 rounded-2xl shadow-lg">
            <h2 className="text-3xl font-semibold mb-6 text-[var(--text-primary)]">
              结语：共赴智能之约
            </h2>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed text-center">
              Aurora Intelligent Fund SPC Ltd. 不仅仅是一家基金管理公司，更是投资者在 AGI 时代最可靠的同行者。当科技的洪流滚滚而来，我们邀请您与 AIF 一道，跨越认知的鸿沟，在智能时代的黎明时刻，精准布局，致胜未来。
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
