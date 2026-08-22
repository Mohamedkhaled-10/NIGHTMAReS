# دليل التصميم والهوية البصرية الكامل لمنصة NIGHTMAReS
> **Nightmares CMS & Reader Experience — Comprehensive Design System & Style Guide**  
> وثيقة مرجعية شاملة ومفصلة للمطورين ومصممي الواجهات، تغطي كافة معايير التصميم، لوحة الألوان، قواعد الخطوط، الهيكل البصري، المكونات، والتأثيرات الحركية لموقع NIGHTMAReS.

---

## 1. فلسفة التصميم والهوية البصرية (Design Philosophy)

* **النمط العام:** سينمائي مظلم فاخر ومحرري (Cinematic Editorial Horror).
* **الأجواء البصرية:** إحساس بالغموض والتشويق مع الحفاظ على وضوح القراءة والأناقة العصرية، بعيداً عن الفوضى البصرية.
* **نظام التباين (Contrast Strategy):** الاعتماد على درجات الأسود العميقة الداكنة (`#050202` و `#0a0505`) كأرضية أساسية، مع إبراز المحتوى بلمسات حمراء دموية وقرمزية (`#dc2626` / `#ef4444` / `#7f1d1d`) وتوهج سينمائي هادئ.
* **الاتجاه:** عربي أصيل من اليمين إلى اليسار (`dir="rtl"`).
* **إمكانية الوصول (Accessibility):** مراعاة معايير WCAG AA في وضوح النصوص والقراءة المريحة للقصص الطويلة مع تمييز دقيق لحالات التركيز (`:focus-visible`).

---

## 2. لوحة الألوان المعتمدة (Color Palette & Tokens)

### 2.1 ألوان الخلفيات والأسطح (Background & Surfaces)
| الرمز اللوني (Hex / RGBA) | اسم اللون | الاستخدام والتطبيق |
| :--- | :--- | :--- |
| `#050202` | **Deep Obsidian Black** | خلفية الصفحة الرئيسية والجسم العام (`body`) |
| `#0a0505` | **Surface Dark** | خلفية البطاقات، شريط التنقل، القوائم المنبثقة والتذييل |
| `#0d0606` | **Card Dark Elevation** | خلفية كروت المحتوى الحديثة واللوحات الفرعية |
| `#110808` | **Input / Well Dark** | خلفية حقول الإدخال (`input`, `textarea`, `select`) |
| `rgba(13, 7, 7, 0.9)` | **Studio Glass Dark** | خلفية اللوحات المضببة في استوديو الكتابة مع `backdrop-filter: blur(16px)` |
| `radial-gradient(circle at top, #0c0202, #050000)` | **Cinematic Radial Glow** | تدرج خلفية الصفحة الأساسية |

### 2.2 ألوان اللهجات والهوية (Primary Brand Accents - Crimson / Blood Red)
| الرمز اللوني | الكود في Tailwind | الاستخدام والتطبيق |
| :--- | :--- | :--- |
| `#dc2626` | `red-600` | اللون الأساسي للشعار، الأزرار الرئيسية، الخطوط التحتية للعناوين |
| `#ef4444` | `red-500` | لون التحويم (Hover)، العناوين الفرعية، الأيقونات النشطة |
| `#f87171` | `red-400` | النصوص المضيئة الخفيفة، شارات التصنيف العائمة |
| `#fca5a5` | `red-300` | نصوص الاقتباسات وروابط التحويم في نصوص المقالات |
| `#b91c1c` | `red-700` | لون الأزرار الأساسية في الحالة العادية |
| `#7f1d1d` | `red-900` | حدود الحاويات (`border-red-900/30`)، إضاءات الزوايا الخافتة |
| `#4a0e0e` / `#3b0a0a` | **Burgundy Ambient** | التوهج السينمائي والضباب الجوي للـ Hero |

### 2.3 ألوان النصوص والمحايدات (Typography & Neutrals)
| الرمز اللوني | الاستخدام |
| :--- | :--- |
| `#ffffff` | عناوين H1 و H2 الرئيسية، النصوص البارزة، الأيقونات الفاتحة |
| `#F5F1E8` | **Warm Cream** (مخصص لترويسة الهيرو السينمائية التحريرية) |
| `#f3f4f6` (`gray-100`) | عناوين البطاقات، النصوص المهمة |
| `#e5e7eb` (`gray-200`) | نصوص المقالات الطويلة لراحة العين أثناء القراءة |
| `#d1d5db` (`gray-300`) | فقرات الوصف العام والنصوص الثانوية |
| `#9ca3af` (`gray-400`) | نصوص المقتطفات التوضيحية وشروحات الأقسام |
| `#6b7280` (`gray-500`) | التواريخ، بيانات الميتا، النصوص التوجيهية غير الفعالة |

### 2.4 ألوان الحالة واللمسات الخاصة (State & Special Accents)
* **الذهبي التحريري (Editorial Gold):** `#D4AF37` (يستخدم لشارات التميز والأطراف الفاخرة `hero-gold-accent`).
* **الأخضر للنجاح:** `#22c55e` (`green-500`) / `#027a4c` (لرسائل التأكيد ونوافذ التحميل الإيجابية).
* **حدود التوهج الخافتة:** `rgba(220, 38, 38, 0.2)` إلى `rgba(220, 38, 38, 0.4)`.

---

## 3. نظام الخطوط والطباعة (Typography Hierarchy)

### 3.1 الخطوط المعتمدة
* **الخط الأساسي والعناوين:** `'Tajawal', sans-serif` (مستورد من Google Fonts بأوزان 300, 400, 500, 700, 800, 900).
* **الخط الإنجليزي البديل للمؤثرات الخاصة:** `'Montserrat', sans-serif`.

```css
@import url("https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap");

html, body {
  font-family: 'Tajawal', sans-serif;
  direction: rtl;
}
```

### 3.2 مقاييس النصوص والتدرج الهرمي (Typography Scale)

| العنصر | الحجم (Desktop) | الحجم (Mobile) | الوزن (Weight) | تباعد الأسطر (Line Height) |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Display (H1)** | `4rem - 4.5rem` (64-72px) | `2.25rem - 2.5rem` (36-40px) | `900` (Black) | `1.1` |
| **Section Title (H2)** | `2rem - 2.25rem` (32-36px) | `1.5rem - 1.75rem` (24-28px) | `900` (Black) | `1.2` |
| **Card / Sub Title (H3)** | `1.25rem - 1.4rem` (20-22px) | `1.15rem` (18px) | `800` (ExtraBold) | `1.35` |
| **Article Body (فقرات المقال)** | `1.15rem` (18.5px) | `1.05rem` (17px) | `400 / 500` | `1.85` |
| **Excerpt / Description** | `0.95rem` (15px) | `0.9rem` (14.5px) | `500` (Medium) | `1.6` |
| **Meta & Captions** | `0.75rem - 0.85rem` (12-13.5px) | `0.75rem` (12px) | `600 / 700` | `1.4` |
| **Eyebrow / Category Tag** | `0.75rem` (12px) | `0.7rem` (11px) | `800` (Bold Uppercase) | `1.0` |

### 3.3 قواعد نصوص المقالات والقصص (`.article-box`)
* **الفقرات:** محاذاة مريحة مع مسافة بادئة للفقرة (`text-indent: 20px` في بعض الصفحات) أو تباعد عمودي `margin-bottom: 1.8em`.
* **الاقتباسات (`blockquote`):**
  ```css
  .article-box blockquote {
    border-right: 4px solid #dc2626; /* RTL */
    border-left: none;
    background: rgba(220, 38, 38, 0.05);
    padding: 1.5em 2em;
    margin: 2em 0;
    font-style: italic;
    font-size: 1.25rem;
    color: #fca5a5;
    border-radius: 8px;
  }
  ```
* **العناوين داخل المقال (`h2`):**
  ```css
  .article-box h2 {
    font-size: 1.8rem;
    border-bottom: 2px solid rgba(220, 38, 38, 0.3);
    padding-bottom: 0.5em;
    display: inline-block;
    color: #fff;
    font-weight: 800;
  }
  ```

---

## 4. نظام المسافات، الحاويات والتجاوب (Layout & Grid System)

### 4.1 الحاويات القياسية (Containers)
* **حاوية الصفحة العريضة (Full Sections):** `w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12`.
* **حاوية المحتوى المقيد (Max Content):** `max-w-7xl mx-auto px-6 lg:px-12`.
* **حاوية استوديو الكتابة والقراءة المركزة:** `max-w-4xl mx-auto px-4 sm:px-6`.
* **حاوية المقال التحريري (Article Reader):** `max-w-[900px] mx-auto`.

### 4.2 نقاط التجاوب (Responsive Breakpoints)
* **Mobile (`< 640px`):** شبكة من عمود واحد (`grid-cols-1`)، تقليص أحجام الخطوط، هوامش جانبية `16px`.
* **Tablet (`640px - 1024px`):** شبكة من عمودين (`grid-cols-2`)، هوامش جانبية `24px - 32px`.
* **Desktop (`> 1024px`):** شبكة من 3 أعمدة (`grid-cols-3`)، تفعيل الفيديو والتأثيرات الحركية الكاملة.

---

## 5. مواصفات المكونات الأساسية (Core Component Specifications)

### 5.1 شريط التنقل (Navigation Bar)
يتكون من شريط سطح المكتب وشريط الهاتف المحمول مع القائمة الجانبية:

* **شريط سطح المكتب (Desktop Navbar):**
  * **الموقع والارتفاع:** `fixed top-0 w-full h-16 z-50`.
  * **الخلفية:** `bg-[#050202]/90 backdrop-blur-md border-b border-red-900/20`.
  * **الشعار:** أيقونة الجمجمة/الشعار البيضاء مع تأثير التكبير + نص `NIGHTMAR` بلون أبيض وحرف `e` بلون أحمر `#dc2626` + `S`.
  * **الروابط:** قائمة أفقية مع أيقونات `Ionicons`، لون النص `#d1d5db`، وعند التحويم يتحول إلى `#ef4444`.
  * **مربع البحث:** منسدل بانسيابية مع حقل شفاف وحدود باللون الأحمر الداكن وقائمة اقتراحات حية.
  * **زر الإشعارات:** أيقونة جرس مع نقطة حمراء عائمة (`#dc2626`) تظهر عند وجود إشعارات جديدة.
  * **زر الحساب / تسجيل الدخول:**
    * غير مسجل: زر بإطار أحمر رفيع مع تأثير Sweep أحمر سينمائي عند التحويم.
    * مسجل: صورة دائرية للمستخدم مع قائمة منسدلة (`Profile`, `Submit Story`, `Admin Dashboard`, `Logout`).

* **شريط الهاتف والقائمة الجانبية (Mobile Navbar & Drawer):**
  * ارتفاع `64px`، زر بحث وزر قائمة همبرغر (3 خطوط متحولة).
  * قائمة جانبية منزلقة من اليمين بعرض `280px` بخلفية `#0a0505` وظل عريض `shadow-2xl` مع غطاء داكن للخلفية (`bg-black/80 backdrop-blur-sm`).

---

### 5.2 قسم الهيرو السينمائي (Cinematic Hero Section)
* **الأبعاد:** الارتفاع `75vh` (حد أدنى `500px`).
* **خلفية الفيديو والضباب:**
  * فيديو متكرر وصامت بوضع المزج `mix-blend-luminosity opacity-40` يعرض دخاناً وضباباً مظلماً.
  * صورة احتياطية بديلة (Fallback Poster) للهواتف ولأصحاب تفضيل تقليل الحركة (`motion-reduce:block`).
  * تدرجات لونية داكنة متعددة الطبقات من الأسفل والجوانب لمنع ظهور حواف الفيديو.
* **عنوان القسم البصري (Section Headers):**
  * خط سفلي أحمر متدرج: `bg-gradient-to-l from-transparent via-red-900/30 to-red-600/80` مع شريط أحمر بارز مشع في أقصى اليمين (`w-32 md:w-48 h-[3px] bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)]`).
  * زر "عرض الجميع" دائري كبسولي بحواف ناعمة وأيقونة سهم ترتد لليسار عند التحويم.

---

### 5.3 نظام البطاقات والكروت (Content Card System - V3)

#### أ. كارت القصة (Editorial Story Card - `.premium-story-card`)
* **هيكل البطاقة:**
  * الخلفية: `#0a0505` مع إطار شفاف رفيع جداً `1px solid rgba(255,255,255,0.03)` وحواف دائرية `12px`.
  * نسبة أبعاد الصورة: `4 / 3` (تتحول إلى `16 / 9` على الهواتف).
  * شارة التصنيف (Category Badge): عائمة أعلى اليمين بخلفية زجاجية داكنة مضببة وإطار أحمر مشرق.
  * تداخل المحتوى: سحب المحتوى للأعلى بمقدار `-30px` ليدخل فوق تدرج الصورة بتأثير متداخل جميل.
  * تفاعل التحويم (Hover): رفع البطاقة بمقدار `-4px`، زيادة سطوع الصورة من `0.65` إلى `0.85` مع تكبير سلس `scale(1.04)`، وتغير لون العنوان إلى الوردي القرمزي `#fca5a5`.
  * الميتا: الكاتب والتاريخ مفصولان بخط دقيق `border-t border-white/5`.

#### ب. كارت الخبر (Newsroom News Card - `.premium-news-card`)
* **هيكل البطاقة:**
  * الخلفية: `#0d0606` مع خط عمودي أحمر مميز على الجانب الأيسر `border-left: 3px solid #dc2626`.
  * نسبة أبعاد الصورة: `16 / 9`.
  * نص الخبر: مقتطف مقيد بـ 3 أسطر (`-webkit-line-clamp: 3`).
  * زر الإجراء: نص "اقرأ المزيد" مع سهم يتسع عند التحويم (`gap-2` إلى `gap-3` ولون `#ef4444`).

#### ج. كارت الفيديو (Media Video Card - `.premium-video-card`)
* **هيكل البطاقة:**
  * الخلفية: `#000000` مع نسبة أبعاد ثابتة `16 / 9`.
  * مؤشر التشغيل (Play Button): دائرة حمراء شبه شفافة في المنتصف مع أيقونة تشغيل بيضاء:
    ```css
    .play-indicator {
      width: 60px;
      height: 60px;
      background: rgba(220, 38, 38, 0.85);
      backdrop-filter: blur(4px);
      border-radius: 50%;
      box-shadow: 0 0 20px rgba(220, 38, 38, 0.4);
    }
    .content-card-link:hover .play-indicator {
      transform: translate(-50%, -50%) scale(1.15);
      background: #ef4444;
    }
    ```

---

### 5.4 عناصر النماذج والإدخال (Forms & Inputs)
* **الحقول النصية ومربعات الاختيار:**
  * خلفية داكنة جداً: `#110808` أو `#0a0505`.
  * إطار هادئ: `border: 1px solid rgba(220, 38, 38, 0.3)`.
  * حواف دائرية: `rounded-lg` (8px) أو `rounded-xl` (12px).
  * حالة التركيز (`:focus-within` / `:focus`):
    ```css
    input:focus, textarea:focus, select:focus {
      outline: none !important;
      border-color: #dc2626 !important;
      box-shadow: 0 0 8px rgba(220, 38, 38, 0.4) !important;
    }
    ```
* **محدد أنواع الرعب (Horror Type Selector Buttons):**
  * أزرار شبكية تحوي أيقونات FontAwesome 6 مميزة (`fa-ghost` أشباح، `fa-fire` جن، `fa-city` أساطير، `fa-brain` رعب نفسي، `fa-newspaper` حقيقة، `fa-masks-theater` أخرى).
  * الحالة النشطة تضيء بإطار أحمر وتوهج خفيف.

---

### 5.5 الأزرار التفاعلية (Button System)

| نوع الزر | الفئات والأنماط الأساسية | حالة التحويم (Hover State) |
| :--- | :--- | :--- |
| **Primary CTA (الأساسي)** | `bg-red-700 text-white font-bold rounded-lg px-8 py-3.5 shadow-[0_4px_20px_rgba(185,28,28,0.3)]` | `bg-red-600 shadow-[0_4px_25px_rgba(220,38,38,0.5)] -translate-y-0.5` |
| **Secondary Ghost (الثانوي)** | `bg-transparent border border-red-900/50 text-gray-300 rounded-lg px-8 py-3.5` | `border-red-600 bg-red-950/20 text-white -translate-y-0.5` |
| **Floating Action Button (الزر العائم)** | `fixed bottom-6 right-4 bg-gradient-to-br from-red-900 to-red-700 text-white p-3.5 sm:px-5 rounded-full shadow-[0_4px_15px_rgba(220,38,38,0.4)]` | `shadow-[0_4px_25px_rgba(220,38,38,0.6)] -translate-y-1` |
| **Pill Filter Tag (كبسولة التصنيف)** | `bg-red-900/20 border border-red-900/50 text-gray-200 rounded-full px-5 py-2 text-xs font-bold` | `bg-red-700 border-red-500 text-white` |

---

### 5.6 النوافذ المنبثقة والتحذيرات (Modals & Overlays)

#### نافذة التحقق من العمر (+16 Age Verification Modal)
* **الخلفية:** غطاء أسود شبه معتم بالكامل مع تأثير ضبابية `bg-black/95 backdrop-blur-md z-[9999]`.
* **صندوق النافذة:** بخلفية `#050202` وحدود رفيعة `#7f1d1d` مع توهج أحمر محيطي `shadow-[0_0_40px_rgba(220,38,38,0.2)]` وحواف دائرية `16px`.
* **زر التأكيد:** معطل افتراضياً (`disabled`) ويُفعل فور وضع علامة على مربع التأكيد.

---

### 5.7 التذييل (Footer)
* **الخلفية:** `#0a0505` مع خط علوي فاصل `border-t border-red-900/30`.
* **الهيكل:** 4 أعمدة رئيسية (عن المنصة والشعار، اكتشف، المجتمع، معلومات وشروط الاستخدام).
* **أيقونات التواصل الاجتماعي:** أزرار دائرية سوداء بإطار أحمر خفيف، تتحول عند التحويم إلى خلفية حمراء مشعة `hover:bg-red-800 hover:border-red-500 shadow-lg`.

---

## 6. مكتبة الحركات والتأثيرات البصرية (Animations & Effects)

### 6.1 حركات الضباب والتوهج
```css
/* حركة الضباب المستمرة */
@keyframes fogMove {
  from { background-position: 0 0; }
  to { background-position: 1000px 0; }
}

/* التوهج النبضي للوغو والعناصر المميزة */
@keyframes pulseGlow {
  0% { 
    filter: drop-shadow(0 0 5px rgba(220, 38, 38, 0.4)); 
    transform: scale(1); 
  }
  100% { 
    filter: drop-shadow(0 0 15px rgba(220, 38, 38, 0.8)); 
    transform: scale(1.02); 
  }
}

/* حركة طفو بطاقات الهيرو */
@keyframes heroCardFloat {
  0% { transform: translateY(0px); }
  100% { transform: translateY(-4px); }
}

/* الظهور الانسيابي للأعلى */
@keyframes heroFadeSlideUp {
  0% {
    opacity: 0;
    transform: translateY(12px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 6.2 شريط التمرير المخصص (Custom Scrollbar)
```css
.custom-scrollbar::-webkit-scrollbar,
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: rgba(5, 2, 2, 0.95);
}
::-webkit-scrollbar-thumb {
  background: rgba(220, 38, 38, 0.4);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(220, 38, 38, 0.8);
}
```

---

## 7. إرشادات وقواعد الكود للمطورين (Implementation Guidelines)

1. **دعم التجاوب أولاً (Mobile-First Precision):**
   * دائماً ابدأ بتنسيق الشاشات الصغيرة ثم اضبط `sm:`, `md:`, `lg:` حسب الحاجة.
   * تأكد ألا تقل مساحة النقر لأي زر عن `44x44px` على الهواتف المحمولة.

2. **التعامل مع الصور والوسائط:**
   * يجب أن تتضمن جميع وسوم `<img>` خاصية `object-fit: cover` وخاصية `alt` بالعربية.
   * استخدم `aspect-ratio: 16/9` للفيديوهات والأخبار، و `aspect-ratio: 4/3` لغلاف القصص.
   * إضافة تدرج غامق فوق الصور لضمان وضوح النصوص فوقها.

3. **إمكانية الوصول وتفضيلات المستخدم:**
   * يجب احترام تفضيل تقليل الحركة:
     ```css
     @media (prefers-reduced-motion: reduce) {
       *, ::before, ::after {
         animation-duration: 0.01ms !important;
         animation-iteration-count: 1 !important;
         transition-duration: 0.01ms !important;
       }
     }
     ```
   * تحديد لون التحديد في الصفحة (`::selection`):
     ```css
     ::selection {
       background-color: #7f1d1d; /* red-900 */
       color: #ffffff;
     }
     ```

4. **الأيقونات المعتمدة:**
   * مكتبة **FontAwesome 6** (عبر `fa-solid`, `fa-brands`).
   * مكتبة **Ionicons 7** (عبر `<ion-icon name="..."></ion-icon>`).

---
**فريق التصميم والتطوير — منصة NIGHTMAReS**
