# תוכנית — Milestone 4: עמידות, Rate Limiting ו־PWA

**מקורות:** `MILESTONES.md` (Milestone 4), `PRD.md` (FR-05, FR-06, FR-09, Flow 6, Edge Cases), `ARCHITECTURE.md` (1 "סיכונים", 2.4 טבלת השגיאות ו־Headers אבטחה, 2.5 "ניסיון חוזר", 2.7 PWA, 2.8 WAF ותצורת Function, 2.10, 2.11), `DESIGN.md` (מצבי המסך, טבלת הנוסחים, "PWA — שם, צבע ואייקון").

**מצב נוכחי (מ־Milestones 2–3):**
- `lib/server/jokeService.ts` — קריאה **אחת** ל־OpenAI; `mapError` ממפה Timeout → `AI_TIMEOUT`, הרשאות → `SERVICE_UNAVAILABLE`, כל השאר → `AI_UNAVAILABLE`. תשובה ריקה / `incomplete` → `AI_UNAVAILABLE` בלי ניסיון נוסף.
- `lib/server/openaiAdapter.ts` — כבר `maxRetries: 0` ו־Timeout של 15 שניות לניסיון. **לא משתנה.**
- `app/api/jokes/route.ts` — כבר `maxDuration = 60`, `Cache-Control: no-store` וכל קודי השגיאה מטבלת ARCHITECTURE 2.4. **לא משתנה.**
- `app/jokeClient.ts` — מבחין רק בין `refused` ל־`general`; אין תקרת זמן בדפדפן.
- `app/JokeGenerator.tsx` — תיבת שגיאה אדומה אחת, עם הודעת סירוב או הודעה כללית.
- `next.config.ts` — רק `poweredByHeader: false`. אין Manifest ואין אייקונים.

## 0. פעולות מקדימות של המשתמש (Claude מדריך צעד אחר צעד)

1. **בדיקת זמינות WAF Rate Limiting:** ב־Vercel → הפרויקט → **Firewall** → בדיקה אם אפשר להוסיף כלל **Rate Limit** בתוכנית הנוכחית, ומה העלות. (זו הבדיקה שתוכננה ב־Milestone 2; אם התוצאה כבר ידועה — רק לאשר אותה.)
   - **זמין** → ממשיכים לפי התוכנית. את הכלל עצמו המשתמש יגדיר בשלב 4 (אחרי הבנייה).
   - **לא זמין או יקר מדי** → **עוצרים ושואלים** לפני הבנייה: המסלול החלופי (Upstash Redis, ARCHITECTURE 2.11) מוסיף שירות וחשבון חדשים, ודורש אישור מפורש ותיעוד ADR. התוכנית הזו לא מממשת אותו מראש.
2. אין צורך במפתחות או משתני סביבה חדשים. ה־`.env.example` לא משתנה.

## 1. קבצים ליצור / לשנות

| קובץ | פעולה | תוכן |
| --- | --- | --- |
| `lib/server/jokeService.ts` | שינוי | ניסיון חוזר אחד על כשל זמני; סיווג שגיאות לברות־חזרה / לא |
| `app/jokeClient.ts` | שינוי | `AbortController` (35 שניות); מיפוי סטטוסים לסוגי שגיאה מובחנים |
| `app/JokeGenerator.tsx` | שינוי | הצגת ההודעה המתאימה לכל סוג שגיאה; תיבה כתומה ל־429 |
| `app/messages.ts` | שינוי | ארבעת הנוסחים החסרים מטבלת DESIGN |
| `app/page.module.css` | שינוי | סגנון לתיבת המגבלה הכתומה (`.limit`) |
| `next.config.ts` | שינוי | `headers()` עם Headers האבטחה של ARCHITECTURE 2.4 |
| `app/manifest.ts` | חדש | Web App Manifest לפי DESIGN |
| `app/iconArt.tsx` | חדש | ציור האייקון המשותף (ריבוע צהוב + פרצוף צוחק), ל־`ImageResponse` |
| `app/icon.tsx` | חדש | אייקונים 192 ו־512 (`generateImageMetadata`) |
| `app/apple-icon.tsx` | חדש | אייקון אייפון 180 |
| `app/layout.tsx` | שינוי | `themeColor` ב־`viewport`; `appleWebApp` (כותרת "בדיחות") ב־`metadata` |
| `tests/jokes-route.test.ts` | שינוי | עדכון בדיקות כשל שמצפות לקריאה אחת + בדיקות ניסיון חוזר |
| `tests/joke-client.test.ts` | חדש | מיפוי סטטוסים/רשת/Timeout לסוגי שגיאה, עם `fetch` מדומה |
| `tests/pwa-and-headers.test.ts` | חדש | שדות ה־Manifest ו־Headers האבטחה |
| `spec/MILESTONES.md` | בסיום | סימון 🟡 ליד Milestone 4 |

אין תלויות חדשות (`ImageResponse` מגיע מ־`next/og`). אין Service Worker.

## 2. ניסיון חוזר ב־Backend (`jokeService.ts`)

### 2.1 מבנה
- `generateJoke` מריץ **עד שני ניסיונות** בלולאה (`MAX_ATTEMPTS = 2`), כל אחד דרך `createJokeResponse` הקיים (Timeout של 15 שניות לניסיון → תקרה כוללת של כ־30 שניות, מתחת ל־`maxDuration = 60`).
- כל ניסיון מחזיר אחת משלוש תוצאות: הצלחה, **כשל סופי** (מוחזר מיד) או **כשל זמני** (מנסים שוב אם נשאר ניסיון).
- אין המתנה בין הניסיונות (כדי לא להאריך את זמן ההמתנה של המשתמש).
- בדיקת `OPENAI_API_KEY` חסר נשארת לפני הלולאה → `503` בלי אף קריאה.

### 2.2 סיווג

| מקרה | סוג | קוד סופי אם נכשל |
| --- | --- | --- |
| `APIConnectionTimeoutError` | זמני | `AI_TIMEOUT` (504) |
| `APIConnectionError` (רשת) | זמני | `AI_UNAVAILABLE` (502) |
| `InternalServerError` (5xx של OpenAI) | זמני | `AI_UNAVAILABLE` |
| `RateLimitError` (429 של OpenAI) | זמני | `AI_UNAVAILABLE` |
| `RateLimitError` עם `code: "insufficient_quota"` (תקציב נגמר) | **סופי** | `SERVICE_UNAVAILABLE` (503) |
| תשובה ריקה או `status: "incomplete"` | זמני (ARCHITECTURE 2.5 שלב 7) | `AI_UNAVAILABLE` |
| `AuthenticationError`, `PermissionDeniedError` | **סופי** | `SERVICE_UNAVAILABLE` |
| `BadRequestError`, `NotFoundError` ושאר שגיאות 4xx | **סופי** | `AI_UNAVAILABLE` |
| סירוב (`[[REFUSED]]` או refusal מה־API) | **סופי** | `TOPIC_REFUSED` (422) |
| שגיאה לא מוכרת | זמני | `AI_UNAVAILABLE` |

- הקוד הסופי נקבע לפי **הכשל האחרון**: אם הניסיון השני נכשל ב־Timeout → `504`, אחרת לפי הטבלה.
- הלוג נשאר מינימלי: מספר הניסיון, סוג השגיאה והקוד — בלי prompt, בלי בדיחה ובלי מפתח.
- 429 של Vercel WAF לא מגיע בכלל לקוד הזה, ולכן אין בו Retry (בהגדרה).

## 3. Client — תקרת זמן והודעות מובחנות

### 3.1 `jokeClient.ts`
- `JokeResponse` הופך ל־`{ ok: true; joke } | { ok: false; kind: ErrorKind }` כאשר
  `ErrorKind = "refused" | "rateLimited" | "timeout" | "offline" | "invalid" | "general"`.
- `AbortController` עם `setTimeout` של **35 שניות** (`CLIENT_TIMEOUT_MS`); ה־Timer מנוקה תמיד ב־`finally`. אין Retry בדפדפן.
- מיפוי:

| מצב | `kind` |
| --- | --- |
| `navigator.onLine === false` לפני השליחה (בלי לשלוח בקשה) | `offline` |
| הבקשה בוטלה בגלל תקרת 35 השניות (`AbortError`) | `timeout` |
| `fetch` זרק שגיאת רשת (`TypeError`) | `offline` |
| `429` (גם בלי JSON — תגובת WAF) | `rateLimited` |
| `422` | `refused` |
| `504` | `timeout` |
| `400`, `413` | `invalid` |
| `502`, `503`, כל סטטוס אחר, JSON פגום או `joke` ריק | `general` |

### 3.2 `messages.ts` — נוסחים חדשים (מילה במילה מ־DESIGN)
- `timeoutError`: "זה לקח יותר מדי זמן. נסו שוב."
- `offlineError`: "אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב."
- `rateLimited`: "הגעתם למגבלה של 5 בדיחות בדקה. נסו שוב בעוד דקה."
- `invalidInput`: "הנושא לא תקין. נסו לנסח אותו אחרת."

### 3.3 `JokeGenerator.tsx`
- `errorKind` מקבל את כל סוגי `ErrorKind`; מפה פשוטה `kind → הודעה`.
- `rateLimited` מוצג **בתיבה כתומה** (`styles.limit`, כמו ב־Style Guide); כל השאר בתיבה האדומה הקיימת. שתיהן באזור ההודעות (`aria-live`, `role="alert"`), מתחת ל"צור בדיחה" ומעל הכרטיס.
- שאר ההתנהגות לא משתנה: חיווי הטעינה נשאר לאורך שני הניסיונות (השרת מבצע אותם בתוך אותה בקשה), הבדיחה הקודמת נשארת בכל כישלון, וההודעה נעלמת בבקשה הבאה.

### 3.4 `page.module.css`
- `.limit` — כמו `.error`, אבל מסגרת ואייקון בכתום `#FF9A1F` (`var(--orange)` אם קיים ב־`globals.css`, אחרת להוסיף אותו שם), טקסט שחור לניגודיות.

## 4. Headers אבטחה (`next.config.ts`)

`async headers()` עם `source: "/:path*"`:
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

בלי `Content-Security-Policy` (ARCHITECTURE 2.4). `Cache-Control: no-store` של ה־API נשאר ב־Route.

## 5. Rate Limiting — Vercel WAF (הגדרה בידי המשתמש, לא בקוד)

- **אין שינוי קוד** ל־Rate Limiting: הכלל מוגדר ב־Vercel Dashboard ואינו נשמר ב־Git (ARCHITECTURE 2.8). אין מונה בזיכרון ה־Function.
- בסיום הבנייה, Claude מדריך את המשתמש צעד אחר צעד ליצור כלל ב־**Firewall → Configure → New Rule**:
  - תנאי: Request Path **equals** `/api/jokes` (ו־Method = `POST`).
  - פעולה: **Rate Limit**, אלגוריתם Fixed Window, חלון **60 שניות**, **5 בקשות**, מפתח **IP**, תגובה **429** (Deny).
  - שמירה ו־**Publish**. הכלל חל על כל ה־Deployments של הפרויקט, כולל Preview.
- ה־Client כבר מטפל ב־429 גם אם הגוף אינו JSON (סעיף 3.1).
- הבדיקה עצמה דורשת דחיפה ל־`dev` — ראו סעיף 9.

## 6. PWA

### 6.1 `app/manifest.ts` (Next.js `MetadataRoute.Manifest`)
`name: "מחולל בדיחות"`, `short_name: "בדיחות"`, `description: "בדיחה על כל נושא שתרצו"`, `start_url: "/"`, `display: "standalone"`, `lang: "he"`, `dir: "rtl"`, `theme_color: "#FFD400"`, `background_color: "#FFFFFF"`, ו־`icons`:
- `/icon/192` — `192x192`, `image/png`
- `/icon/512` — `512x512`, `image/png` (גם `purpose: "any"`)

### 6.2 אייקונים שנוצרים בקוד (`ImageResponse` מ־`next/og`)
- `app/iconArt.tsx` — פונקציה שמחזירה JSX: ריבוע צהוב `#FFD400` מלא, ובמרכזו פרצוף צוחק פשוט בקו שחור (עיגול, שתי עיניים, חיוך), מותאם לגודל. SVG/Divs פשוטים, בלי גופנים חיצוניים.
- `app/icon.tsx` — `generateImageMetadata` מחזיר שני ids (`192`, `512`); Next.js מגיש אותם ב־`/icon/192` ו־`/icon/512` ומוסיף `<link rel="icon">` אוטומטית.
- `app/apple-icon.tsx` — `size = { width: 180, height: 180 }`; Next.js מוסיף `<link rel="apple-touch-icon">` אוטומטית.

### 6.3 `layout.tsx`
- `viewport.themeColor = "#FFD400"`.
- `metadata.appleWebApp = { capable: true, title: "בדיחות", statusBarStyle: "default" }` — כדי שבאייפון השם במסך הבית יהיה הקצר.

### 6.4 בלי Service Worker
- לא מוסיפים Service Worker, cache או התנהגות Offline (ARCHITECTURE 1 "סיכונים" 4, 2.7). Chrome ו־Safari העדכניים מאפשרים התקנה בלי Service Worker. רק אם בבדיקת Preview יתברר שפלטפורמת יעד **מחייבת** Service Worker — עוצרים ושואלים לפני שמוסיפים handler מינימלי.
- ללא רשת אין הבטחה שהאפליקציה תיפתח; ניסיון יצירה ללא רשת מציג "אין חיבור לאינטרנט...".

## 7. בדיקות אוטומטיות (`npm test`)

### 7.1 `tests/jokes-route.test.ts` (Adapter מדומה, כמו היום)
- **לעדכן** את הבדיקות הקיימות של שגיאת רשת, Timeout, תשובה ריקה ו־`incomplete`: עכשיו מצופות **בדיוק 2** קריאות.
- **חדשות:**
  - כשל זמני ואז הצלחה → `200` עם הבדיחה, **2** קריאות.
  - שני כשלים זמניים → `502`; Timeout ואז Timeout → `504`; כשל רשת ואז Timeout → `504`. תמיד **2** קריאות, **לעולם לא 3**.
  - `InternalServerError` ו־`RateLimitError` רגיל → נוסה פעם שנייה.
  - **ללא ניסיון נוסף (קריאה 1):** `AuthenticationError` → `503`; `RateLimitError` עם `insufficient_quota` → `503`; `BadRequestError` → `502`; סירוב (marker ו־refusal) → `422` (קיימות — נשארות).
  - מפתח חסר → `503` עם **0** קריאות (קיימת).
  - גוף התשובה בשגיאה הוא רק `{ error: { code } }` — בלי פרטים פנימיים (קיימת לשגיאה כללית; להוסיף ל־Timeout).

### 7.2 `tests/joke-client.test.ts` (חדש, `fetch` מדומה ב־`vi.stubGlobal`)
- `429` עם גוף טקסט (לא JSON) → `rateLimited`; `422` → `refused`; `504` → `timeout`; `400`/`413` → `invalid`; `502`/`503` → `general`; `200` עם JSON פגום → `general`.
- `fetch` שזורק `TypeError` → `offline`; `navigator.onLine = false` → `offline` **בלי** קריאה ל־`fetch`.
- תקרת זמן: עם `vi.useFakeTimers()`, `fetch` שלא מסתיים עד שה־signal מבוטל → אחרי 35 שניות `timeout`; וידוא ש־`fetch` נקרא פעם אחת בלבד (אין Retry בדפדפן).

### 7.3 `tests/pwa-and-headers.test.ts` (חדש)
- `manifest()` מחזיר את השדות מסעיף 6.1 ושני אייקונים בגדלים 192 ו־512.
- `nextConfig.headers()` מחזיר את ארבעת ה־Headers מסעיף 4 לכל הנתיבים.

## 8. בדיקה עצמית בזמן הבנייה (מקומית)

1. `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` — הכול עובר.
2. `npm run dev` ובדפדפן המובנה:
   - `/manifest.webmanifest` מחזיר את השדות הנכונים; `/icon/192`, `/icon/512`, `/apple-icon` מחזירים PNG בגדלים הנכונים ונראים כמו בתיאור (צילום מסך).
   - תגובות העמוד וה־API כוללות את ארבעת Headers האבטחה (`read_network_requests`).
   - בדיחה אמיתית אחת לפחות עדיין נוצרת (מפתח הפיתוח ב־`.env` המקומי) — עלות נמוכה.
   - מצבי שגיאה בממשק בלי לשנות קוד הפקה: חסימת `/api/jokes` ב־DevTools / יירוט `fetch` בכלי הדיבוג בלבד כדי לראות את התיבה הכתומה (429), את הודעת Timeout (504) ואת הודעת "אין חיבור" — ולוודא שהבדיחה הקודמת נשארת. אין להשאיר בקוד מתגים או נתיבים לדימוי תקלות (ARCHITECTURE 2.10).
   - מובייל (375px): התיבה הכתומה והאדומה בלי גלילה אופקית.
3. סגירת שרת הפיתוח בסיום.

## 9. מה נבדק רק אחרי דחיפה ל־`dev` (Preview)

לפי Development Execution Rules 6, סעיפים אלה תלויים ב־Vercel. בסיום הבנייה Claude יציין שהם ממתינים, ויציע "דחוף ל־Preview" (commit + push ל־`dev`, בלי ✅) — **רק לאחר בקשת המשתמש**:
- **WAF:** שש בקשות `POST` ל־`/api/jokes` של ה־Preview בתוך 60 שניות מאותו IP → החמש הראשונות עוברות, השישית `429`. בדיקה שהשישית לא הגיעה ל־Function (ב־Vercel → Logs / Firewall אין הפעלה של ה־Route עבורה) ושבממשק מוצגת ההודעה הכתומה. אם Deployment Protection פעיל, הבדיקה נעשית מהדפדפן של המשתמש המחובר ל־Vercel (לחיצות ברצף על "צור בדיחה" / "בדיחה נוספת").
- **PWA:** התקנה בטלפון (Android Chrome: "התקן אפליקציה"; iPhone Safari: "הוסף למסך הבית"), פתיחה במצב `standalone` עם השם והאייקון הנכונים.

## 10. מיפוי ל־Definition of Done

| תנאי DoD | איך מוכח |
| --- | --- |
| לכל היותר 2 קריאות OpenAI לבקשה; כשל שאינו בר־חזרה בלי ניסיון נוסף | `npm test` — סעיף 7.1 |
| Timeout/כשל → הודעה בעברית, בלי מידע פנימי, הבדיחה הישנה נשמרת | `npm test` (7.1, 7.2) + בדיקה ידנית בממשק (8.2) |
| הבקשה השישית ב־60 שניות נחסמת ב־429 לפני OpenAI, עם הודעה בעברית | בדיקה ב־Preview אחרי הגדרת WAF (סעיף 9) |
| Manifest ואייקונים נבדקים; התקנה והפעלה כ־PWA | `npm test` (7.3) + בדיקה מקומית (8.2) + התקנה בטלפון ב־Preview (סעיף 9) |
| לא נוספו Database, Auth, Local Storage או היסטוריה | סקירת הקוד: אין תלויות חדשות, אין `localStorage`/`sessionStorage`, אין Service Worker |

## 11. מחוץ לטווח של Milestone 4

- מסלול Upstash החלופי — רק אם WAF לא זמין, ובאישור (סעיף 0).
- Service Worker, cache או Offline.
- Retry בדפדפן, הודעה נפרדת "מנסה שוב..." או מונה בקשות בממשק.
- `Content-Security-Policy` מלא.
- מפתח Production, מיזוג ל־`main` והגדרת WAF ייעודית ל־Production — Milestone 5.
- אין שינוי בהוראות למודל, ב־Adapter או במגבלות הקלט.
