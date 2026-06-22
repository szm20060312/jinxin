# AI 图像生成提示词文档 ——《晋·信》

> 适用工具：Midjourney (v6+) / Stable Diffusion (SDXL) / DALL·E 3  
> 文档用途：为「晋·信」清代晋商票号模拟经营游戏生成背景图与 UI 配图  
> 项目配色参考：宣纸暖黄 `#F5F0E8` · 墨色 `#2C2416` · 朱砂印红 `#8B2500` · 鎏金 `#B8860B` · 翠绿 `#1A6B3C`

---

## 一、应用背景图

### 1.1 登录页 / 首页全景背景

**用途**：登录注册页全屏背景，营造"推开票号大门"的沉浸感。

| 参数 | 值 |
|------|-----|
| **提示词** | `A dimly lit interior of an ancient Chinese banking hall (piaohao) in Qing Dynasty, wooden counter with abacus and ledgers, warm candlelight casting soft shadows, scroll paintings on the wall, red lacquer columns, scattered silver ingots on the table, depth of field blurring the background, rich atmospheric lighting, cinematic composition, 8K, photorealistic render, style of classical Chinese architecture photography` |
| **艺术风格** | 写实 / 电影级光影 |
| **主色调** | `#1a0f07`（深棕黑）、`#8b4513`（檀木棕） |
| **辅色** | `#f5deb3`（暖麦色烛光）、`#8b2500`（朱砂红点缀） |
| **光影** | 烛光聚光 + 琥珀色柔光散射，高对比度暗调 |
| **负面提示词** | `modern technology, neon lights, Western architecture, people, bright daylight, flat lighting, cartoon, anime, low resolution` |
| **画幅比例** | `--ar 16:9`（Midjourney）/ `1024×576`（SD） |

---

### 1.2 游戏主界面轻纹理背景

**用途**：AppShell 主内容区底部纹理，营造"在宣纸上批阅账目"的感受。

| 参数 | 值 |
|------|-----|
| **提示词** | `Extreme close-up of traditional Chinese xuan rice paper texture, subtle horizontal fiber lines, faint tea-stained edges, minimal ink bleed spots, warm off-white tone, soft diffused lighting from top-left, no text or writing, seamless tiling texture, elegant and understated, 8K macro photography` |
| **艺术风格** | 极简 / 微距写实 |
| **主色调** | `#F5F0E8`（宣纸白）、`#E8E0D0`（旧纸暗面） |
| **辅色** | `#D4C8B0`（纤维纹）、`#C4B8A0`（茶渍边缘） |
| **光影** | 左上角漫反射柔光，极浅阴影，几乎无高光 |
| **负面提示词** | `text, letters, writing, ink marks, folds, creases, dark stains, high contrast, glossy, modern paper` |
| **画幅比例** | `--ar 1:1 --tile`（Midjourney 无缝平铺）/ `1024×1024`（SD） |

---

### 1.3 半透明遮罩柔光背景

**用途**：Toast/Confirm 弹窗背后的半透明遮罩纹理层，叠加 blur 使用。

| 参数 | 值 |
|------|-----|
| **提示词** | `Soft abstract gradient background, warm sand and sepia tones blending into deep ink black at edges, subtle vignette effect, ink wash painting style, slight radial glow from center, no sharp lines, dreamy and atmospheric, wet-on-wet watercolor technique on rice paper texture, minimal and elegant` |
| **艺术风格** | 水墨渐变 / 抽象柔和 |
| **主色调** | `#F5F0E8`（中心）、`#3C3220`（边缘） |
| **辅色** | `#8B2500`（极淡红晕）、`#6B5B40`（过渡棕） |
| **光影** | 径向渐变：中心亮 → 四角暗，暗角效果 |
| **负面提示词** | `hard edges, geometric shapes, bright colors, text, patterns, grid, noise, digital glitch, high saturation` |
| **画幅比例** | `--ar 16:9` / `1920×1080` |

---

### 1.4 深色模式背景（日志/夜间主题）

**用途**：日志面板暗色皮肤或深色阅读模式下的背景。

| 参数 | 值 |
|------|-----|
| **提示词** | `Dark ink wash painting background, deep charcoal and blue-black tones, subtle brushstroke texture in the corners, faint traditional cloud pattern (xiangyun) barely visible, gold speckles scattered like distant stars, parchment edge wear on borders, elegant and scholarly atmosphere, reminiscent of ancient Chinese night study room, 8K` |
| **艺术风格** | 水墨画 / 文人书斋 |
| **主色调** | `#1A1814`（墨黑）、`#2C2416`（深棕墨） |
| **辅色** | `#B8860B`（鎏金微点）、`#3A5088`（靛蓝暗纹） |
| **光影** | 整体暗调，四角更深，金色微光点缀 |
| **负面提示词** | `bright colors, white background, cartoon, neon, modern elements, text, people, daylight` |
| **画幅比例** | `--ar 16:9` / `1920×1080` |

---

### 1.5 节日/特殊事件背景

**用途**：年终合账、春节、重大事件阶段的特殊背景。

| 参数 | 值 |
|------|-----|
| **提示词** | `Elegant traditional Chinese New Year atmosphere, vermillion red paper texture with subtle gold foil stamping pattern, scattered plum blossom petals, soft lantern glow in corners, auspicious cloud motifs barely visible, warm festive ambiance without being cluttered, premium gold foil on deep red background, flat vector style with subtle texture overlay, 8K` |
| **艺术风格** | 扁平插画 + 金箔纹理叠加 |
| **主色调** | `#8B2500`（朱砂红）、`#B22222`（灯笼红） |
| **辅色** | `#DAA520`（金）、`#FFF8DC`（米白点缀） |
| **光影** | 柔和灯笼光从角落渗入，金色反光 |
| **负面提示词** | `Western holidays, Christmas, modern decorations, neon, glitter, kitsch, 3D render, photorealistic, busy pattern` |
| **画幅比例** | `--ar 16:9` / `1920×1080` |

---

## 二、UI 元素配图

### 2.1 空状态插画

#### 2.1.1 无日志记录空状态

| 参数 | 值 |
|------|-----|
| **提示词** | `A clean and minimal flat vector illustration of an empty traditional Chinese ledger book lying open on a wooden desk, a single brush resting beside it, gentle ink-wash style, warm paper tones, soft shadow beneath the book, empty pages with subtle ruled lines, peaceful and quiet atmosphere, elegant negative space, 2D flat design with slight texture` |
| **艺术风格** | 扁平矢量 / 极简中国风 |
| **主色调** | `#F5F0E8`（书页）、`#8A7E6B`（墨线） |
| **辅色** | `#D4C8B0`（桌面）、`#5C5240`（毛笔） |
| **光影** | 柔和的底投影，无强光 |
| **负面提示词** | `3D render, photorealistic, writing on pages, cluttered, dark colors, busy composition, people, bright highlights` |
| **画幅比例** | `--ar 1:1` / `512×512`（适合 200×200 展示） |

---

#### 2.1.2 无伙友空状态

| 参数 | 值 |
|------|-----|
| **提示词** | `Minimalist flat illustration of a single traditional Chinese abacus resting on an empty desk, soft ink wash background, solitary and contemplative mood, warm beige and brown palette, simple composition with ample negative space, elegant line art style, thin ink brush contour lines, gentle gradient background` |
| **艺术风格** | 极简线条 / 水墨淡彩 |
| **主色调** | `#E8E0D0`（背景）、`#2C2416`（线条） |
| **辅色** | `#8B2500`（算盘珠）、`#8A7E6B`（淡影） |
| **光影** | 无明确光源，均匀柔和 |
| **负面提示词** | `3D, realistic, complex, people, text, heavy shadows, dark background, digital art` |
| **画幅比例** | `--ar 1:1` / `512×512` |

---

#### 2.1.3 游戏结束空状态

| 参数 | 值 |
|------|-----|
| **提示词** | `A dramatic flat vector illustration of a traditional Chinese red seal stamp marked "closed" fading into ink wash, scattered broken abacus beads, a single dying candle with smoke curling upward, traditional Chinese painting style mixed with modern minimalist composition, melancholic yet beautiful atmosphere, vermillion red accents on warm grey background` |
| **艺术风格** | 水墨混合 / 戏剧化极简 |
| **主色调** | `#8B2500`（朱砂印章）、`#3C3220`（暗底） |
| **辅色** | `#B8860B`（残烛光）、`#8A7E6B`（灰墨） |
| **光影** | 残烛微光 → 四周暗角，烟缕向上渐变透明 |
| **负面提示词** | `happy, colorful, modern office, computer, text labels, cartoon style, bright sunshine, victory` |
| **画幅比例** | `--ar 1:1` / `512×512` |

---

### 2.2 Banner 横幅图

#### 2.2.1 晨间简报 Banner

| 参数 | 值 |
|------|-----|
| **提示词** | `Wide horizontal banner illustration of a Qing Dynasty courier pigeon arriving at dawn over traditional Chinese rooftops, soft golden morning light, misty mountains in the distance, silhouette of a messenger receiving a scroll, warm sunrise colors, flat vector style with subtle ink wash texture, elegant minimalist composition, horizontal layout with generous negative space on the right side for text overlay` |
| **艺术风格** | 扁平矢量 + 水墨薄雾 |
| **主色调** | `#F5DEB3`（晨光金）、`#D4C8B0`（雾色） |
| **辅色** | `#8B2500`（屋檐红）、`#5C5240`（远山墨） |
| **光影** | 逆光晨光：左侧日出金色渐变 → 右侧留白 |
| **负面提示词** | `night, dark, modern buildings, people faces, busy composition, photorealistic, Western architecture` |
| **画幅比例** | `--ar 3:1` / `1200×400` |

---

#### 2.2.2 季度决策 Banner

| 参数 | 值 |
|------|-----|
| **提示词** | `Horizontal banner of a traditional Chinese merchant counting silver ingots on an abacus, four season trees in small ink-wash vignettes along the bottom, warm study room atmosphere, red seal stamps as decorative corner elements, flat vector illustration style, elegant business atmosphere, right side left empty for text, ancient Chinese commercial aesthetic` |
| **艺术风格** | 扁平插图 + 版画元素 |
| **主色调** | `#F5F0E8`（纸底）、`#B8860B`（银锭） |
| **辅色** | `#8B2500`（印章）、`#2C5F7C`（青蓝点缀） |
| **光影** | 柔和室内光，无强烈投影 |
| **负面提示词** | `modern office, computers, Western businessmen, busy, cluttered, 3D render, neon, dark mood` |
| **画幅比例** | `--ar 3:1` / `1200×400` |

---

#### 2.2.3 年终合账 Banner

| 参数 | 值 |
|------|-----|
| **提示词** | `Horizontal banner of a grand traditional Chinese year-end ledger closing ceremony, red silk cloth covering a wooden table with stacked account books, gold ingots and a large red seal, lanterns casting warm glow, plum blossoms in a vase, festive yet solemn atmosphere, flat vector illustration with subtle paper texture, elegant composition, left and right edges fade into background for text placement` |
| **艺术风格** | 扁平矢量 / 民俗年画简约版 |
| **主色调** | `#8B2500`（朱红）、`#DAA520`（金） |
| **辅色** | `#F5F0E8`（纸白）、`#1A6B3C`（梅花枝） |
| **光影** | 灯笼暖光从上方散射，左右边缘渐暗 |
| **负面提示词** | `Western New Year, fireworks, party, modern items, 3D, photorealistic, chaotic, neon` |
| **画幅比例** | `--ar 3:1` / `1200×400` |

---

### 2.3 卡片装饰图

#### 2.3.1 分号卡片角标装饰

| 参数 | 值 |
|------|-----|
| **提示词** | `Small square decorative corner emblem for UI card, traditional Chinese "ruyi" cloud motif combined with coin shape, monochrome gold line art on transparent background, simple elegant design, flat vector, clean thin lines, ancient Chinese talisman aesthetic, minimal details, suitable for 64x64 pixel display, icon style` |
| **艺术风格** | 极简线稿 / 传统纹样 |
| **主色调** | `#B8860B`（金线）、透明底 |
| **辅色** | `#8B2500`（可选红点缀） |
| **光影** | 无（纯线条图标） |
| **负面提示词** | `3D, gradient, shadow, complex, colorful, background, text, photorealistic, heavy fill` |
| **画幅比例** | `--ar 1:1` / `256×256`（作为图标素材） |

---

#### 2.3.2 事件卡片警戒边框装饰

| 参数 | 值 |
|------|-----|
| **提示词** | `Decorative horizontal border strip for UI card, traditional Chinese thunder pattern (leiwen) in vermillion red and gold, meander Greek key style adapted from ancient bronze vessels, thin elegant lines, flat vector, seamless repeating left-to-right, transparent background, suitable for card top border decoration, elegant and authoritative` |
| **艺术风格** | 传统纹样 / 极简线条 |
| **主色调** | `#B22222`（警戒红）、`#DAA520`（金） |
| **辅色** | 透明底色 |
| **光影** | 无 |
| **负面提示词** | `3D, thick lines, cartoon, colorful, background fill, gradient, blur, complex patterns, Western motifs` |
| **画幅比例** | `--ar 8:1` / `800×100` |

---

#### 2.3.3 信誉星级 / 评级徽章

| 参数 | 值 |
|------|-----|
| **提示词** | `Set of traditional Chinese copper coin shaped badge icons with star ratings, five variations from one star to five stars, vintage patina bronze texture, subtle red seal stamp overlay on higher tiers, flat vector design with slight paper texture, game UI element style, ancient Chinese medal aesthetic, clean and readable at small sizes, transparent background` |
| **艺术风格** | 古铜币风格 / 游戏 UI 图标 |
| **主色调** | `#B8860B`（铜）、`#8B2500`（高评级红） |
| **辅色** | `#6B5B40`（暗铜）、`#DAA520`（金星） |
| **光影** | 微弱的金属反光（扁平化处理） |
| **负面提示词** | `3D realistic, modern medals, ribbons, colorful gradients, Western stars, photorealistic, text labels` |
| **画幅比例** | `--ar 1:1` / `256×256`（单枚） |

---

#### 2.3.4 印章装饰元素（"晋信" / "已阅" / "机密"）

| 参数 | 值 |
|------|-----|
| **提示词** | `Traditional Chinese red seal stamp (chop) with square shape, vermillion red ink on slightly textured off-white paper, slightly tilted angle, worn edges giving antique feel, seal script calligraphy style, isolated on transparent background, flat design with subtle ink bleed texture at edges, clean and ready for UI overlay use` |
| **艺术风格** | 篆刻印章 / 传统书法 |
| **主色调** | `#8B2500`（朱砂印泥）、透明底 |
| **辅色** | `#A0522D`（印泥边缘渗透色） |
| **光影** | 无（纯扁平 + 边缘微渗墨纹理） |
| **负面提示词** | `modern fonts, English text, 3D, glossy, perfectly clean edges, bright red, cartoon, digital stamp` |
| **画幅比例** | `--ar 1:1` / `256×256` |

---

#### 2.3.5 进度条 / 滑块轨道纹理

| 参数 | 值 |
|------|-----|
| **提示词** | `Seamless horizontal texture strip resembling a traditional Chinese ink stick surface, dark charcoal grey with subtle gold fleck inclusions, fine parallel grain lines, matte finish, elegant and understated, suitable for UI progress bar fill, seamless tiling horizontally, flat style with micro-detail texture, 8K macro` |
| **艺术风格** | 微距材质 / 极简纹理 |
| **主色调** | `#2C2416`（墨条黑）、`#B8860B`（金点） |
| **辅色** | `#3C3220`（纹理暗面） |
| **光影** | 极微弱的表面散射光 |
| **负面提示词** | `3D, glossy, colorful, bright, modern plastic, gradient bars, digital UI elements, text` |
| **画幅比例** | `--ar 16:1 --tile` / `1024×64` |

---

## 三、工具参数速查表

### 3.1 Midjourney 常用参数追加

在提示词末尾追加以下参数：

```
--ar 16:9 --style raw --v 6.1 --no text,watermark,signature
```

| 参数 | 说明 |
|------|------|
| `--ar W:H` | 画幅比例 |
| `--style raw` | 减少 Midjourney 默认的"美化"，更贴近原始描述 |
| `--v 6.1` | 使用 v6.1 模型（更精准的提示词理解） |
| `--no ...` | 排除指定元素 |
| `--tile` | 生成无缝平铺纹理（仅纹理类使用） |
| `--s 250` | 风格化强度（0-1000，数值越高越艺术化，越低越写真） |

### 3.2 Stable Diffusion 建议参数

| 参数 | 推荐值 |
|------|--------|
| **模型** | SDXL 1.0 / Realistic Vision V6 / DreamShaper XL |
| **采样器** | DPM++ 2M Karras |
| **步数** | 25-35 |
| **CFG Scale** | 7-9 |
| **分辨率** | 见各提示词说明 |
| **负面提示词** | 见各提示词的「负面提示词」行，追加通用词：`lowres, bad anatomy, bad hands, cropped, worst quality, jpeg artifacts, signature, watermark` |

### 3.3 批量生成建议

- 同一提示词建议生成 **3-4 个变体**（Midjourney 默认一次 4 张），从中挑选最优
- 纹理类建议开启 `--tile` 模式做无缝平铺
- 图标类建议先生成大尺寸（512px+），再缩放到实际尺寸（64-128px），边缘更清晰
- 所有背景图建议以 **2x 分辨率** 生成（如 3840×2160），在高分屏上更清晰

---

## 四、与本项目 CSS 色彩的对应关系

| 项目 CSS 变量 | 用途 | 建议图像色值 |
|-------------|------|-------------|
| `--color-paper: #F5F0E8` | 宣纸底色 | 背景主色 |
| `--color-paper-dark: #E8E0D0` | 暗面纸色 | 纹理/阴影色 |
| `--color-ink: #2C2416` | 墨色文字 | 前景/线条 |
| `--color-red-seal: #8B2500` | 朱砂印章红 | 重要点缀 |
| `--color-gold: #B8860B` | 鎏金 | 装饰/高亮 |
| `--color-profit: #1A6B3C` | 盈利绿 | 正面指标 |
| `--color-loss: #B22222` | 亏损红 | 警戒/负面 |

---

> **最后更新**：2026-06-17  
> **适用范围**：《晋·信》v1.0 UI 素材生产  
> **提示词语言**：英文（兼容所有主流 AI 图像工具）  
> **参数说明**：中文
