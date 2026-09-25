# طبخات | Tabkhat

تطبيق وصفات عربي متكامل يعمل كتطبيق ويب تقدمي (PWA)، ويجمع إدارة الوصفات، البحث، المفضلة، التخطيط الأسبوعي، قائمة المشتريات، والمؤقتات، مع ميزات ذكية مدعومة بـ Gemini.

## المزايا

- واجهة عربية كاملة من اليمين إلى اليسار ومتجاوبة مع الجوال والكمبيوتر.
- وصفات جاهزة مع البحث والتصنيفات والتفاصيل والمقادير والخطوات.
- حفظ الوصفات المفضلة والوصفات الخاصة بالمستخدم.
- مخطط أسبوعي للوجبات وقائمة مشتريات.
- مؤقت طبخ داخل التطبيق.
- إدخال وصفة بالصوت أو النص وتحويلها إلى وصفة منظمة.
- اقتراح وصفة ذكية حسب مكونات الثلاجة.
- تسجيل الدخول بواسطة Google ومزامنة البيانات عبر Firebase.
- قابل للتثبيت على الهاتف كتطبيق PWA.
- يعمل ببدائل محلية للميزات الذكية عند عدم إضافة مفتاح Gemini.

## التقنيات

- React 19 وTypeScript
- Vite 8 وTailwind CSS 4
- Firebase Authentication وCloud Firestore
- Google Gemini API عبر `@google/genai`
- Vercel Serverless Functions

## التشغيل محليًا

المتطلبات: Node.js 22 أو أحدث.

```bash
npm install
copy .env.example .env.local
npm run dev
```

ثم افتح `http://localhost:3000`.

لتمكين Gemini، استبدل القيمة التجريبية داخل `.env.local`:

```env
GEMINI_API_KEY=ضع_مفتاح_Gemini_هنا
```

لا ترفع `.env.local` إلى GitHub. الملف مستثنى أصلًا في `.gitignore`.

## فحص المشروع

```bash
npm run lint
npm run build
npm run preview
```

مجلد الإنتاج الناتج هو `dist`.

## النشر على GitHub

الخطأ الظاهر من Google AI Studio:

> Failed to create GitHub repository, Insufficient permissions...

يعني أن تطبيق **AI Studio GitHub App** لا يملك صلاحية إنشاء مستودع في الحساب. هذا ليس خطأ في كود «طبخات».

يمكن تجاوز المشكلة تمامًا بإنشاء مستودع جديد يدويًا في GitHub، ثم تنفيذ:

```bash
git init
git add .
git commit -m "Initial release of Tabkhat"
git branch -M main
git remote add origin https://github.com/USERNAME/tabkhat.git
git push -u origin main
```

استبدل `USERNAME` باسم حساب GitHub. لا تضف README أو `.gitignore` عند إنشاء المستودع من موقع GitHub لأنهما موجودان في المشروع.

## الحصول على رابط موقع عام عبر Vercel

هذا المشروع يحتوي على API خلفي، لذلك GitHub Pages وحده غير مناسب. الخيار الموصى به هو Vercel:

1. ارفع المشروع إلى GitHub.
2. افتح Vercel واختر **Add New → Project**.
3. استورد مستودع `tabkhat`.
4. سيتعرف Vercel على إعدادات `vercel.json` تلقائيًا.
5. أضف متغير البيئة `GEMINI_API_KEY` في إعدادات المشروع إن أردت ميزات Gemini الحقيقية.
6. اضغط Deploy.

إعدادات البناء الجاهزة:

- Build Command: `npm run build`
- Output Directory: `dist`
- API entry: `api/index.ts`

بعد النشر سيعطيك Vercel رابطًا عامًا مثل `https://tabkhat.vercel.app`.

## إعداد Firebase بعد النشر

بيانات Firebase العامة موجودة في `firebase-applet-config.json`. مفتاح Firebase الظاهر في تطبيق الويب ليس مفتاح خادم سريًا؛ الحماية الفعلية تعتمد على قواعد Firestore والمصادقة.

لكي يعمل تسجيل الدخول بواسطة Google على رابط Vercel:

1. افتح Firebase Console.
2. اختر المشروع المرتبط بالتطبيق.
3. افتح Authentication → Settings → Authorized domains.
4. أضف نطاق Vercel الجديد، مثل `tabkhat.vercel.app`.
5. تأكد من تفعيل Google من Authentication → Sign-in method.

لن تحتاج هذه الخطوات لتصفح التطبيق كزائر، لكنها مطلوبة لتسجيل الدخول والمزامنة السحابية.

## المتغيرات البيئية

| المتغير | مطلوب؟ | الوصف |
|---|---:|---|
| `GEMINI_API_KEY` | اختياري | يفعّل تحليل الوصفات واقتراحات الثلاجة بواسطة Gemini. بدون المفتاح يعمل التطبيق ببديل محلي. |
| `APP_URL` | اختياري حاليًا | عنوان الموقع العام، للاستخدام المستقبلي في الروابط وعمليات OAuth. |

## هيكل المشروع

```text
api/                         دوال Vercel الخلفية
server/                      خدمة Gemini والمنطق الاحتياطي
src/components/              واجهات ومكونات التطبيق
src/context/                 حالة المستخدم والوصفات
src/data/                    الوصفات الابتدائية
src/lib/                     إعداد Firebase
src/types/                   أنواع TypeScript
src/utils/                   أدوات تحليل الوصفات
public/                      الأيقونة وملف PWA وService Worker
firebase-applet-config.json  إعداد Firebase العام
firestore.rules              قواعد حماية قاعدة البيانات
vercel.json                  إعداد النشر وإعادة التوجيه
```

## نقاط API

- `GET /api/health` — فحص حالة الخادم.
- `POST /api/parse-recipe` — تحويل النص المملى إلى وصفة منظمة.
- `POST /api/fridge-suggest` — اقتراح وصفة من قائمة مكونات.

## الأمان

- لا تحفظ مفتاح Gemini في ملفات المشروع أو في كود الواجهة.
- أضف المفتاح من إعدادات Environment Variables في Vercel.
- راجع `firestore.rules` قبل استخدام بيانات حقيقية في الإنتاج.
- ملفات `.env*` مستثناة من Git، باستثناء `.env.example` الآمن.

## الترخيص

المشروع خاص بمالكه. أضف ملف ترخيص إذا رغبت في نشره كمشروع مفتوح المصدر.
