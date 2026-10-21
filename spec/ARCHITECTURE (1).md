# ARCHITECTURE — מחולל בדיחות מבוסס AI

> **בסיס:** `PRD.md` — מחולל בדיחות מבוסס AI  
> **מועד בדיקת המקורות:** 21 באוקטובר 2026  
> **מטרה:** תכנון טכני ישים למימוש דרישות המוצר, ללא הוספת יכולות מוצר שאינן ב־PRD.

## 1. Technology Stack שנבחר

| רכיב | בחירה | תפקיד |
| --- | --- | --- |
| Frontend | **React + Next.js App Router** | מסך יחיד מותאם למובייל, ניהול מצב התצוגה ופניות ל־Backend |
| שפת פיתוח | **TypeScript** | טיפוסים משותפים ל־Frontend ול־Backend, תחזוקה ואימות מבנה נתונים |
| Backend | **Next.js Route Handlers, Node.js runtime** | `POST /api/jokes`, אימות קלט, הפעלת GPT-5, טיפול בתקלות |
| שירות AI | **OpenAI GPT-5** דרך **Responses API** וה־SDK הרשמי `openai` | יצירת בדיחה בנושא שנבחר |
| Hosting ו־Deployment | **Vercel** | אירוח Frontend ו־Serverless Backend באותו פרויקט ופריסה מתוך GitHub |
| Rate Limiting | **Vercel WAF Rate Limiting** | אכיפת חמש פניות בדקה לפי כתובת IP ללא Database |
| PWA | **Web App Manifest**, אייקונים ו־HTTPS | תמיכה בהוספה למסך הבית והפעלה במצב `standalone` במכשירים תומכים |
| Version Control | **Git + GitHub** | Repository מרכזי, עבודה ב־branches ו־Pull Requests |
| Database / Object Storage | **אין** | אין היסטוריה, חשבונות או קבצים דינמיים לשמירה |
| Authentication / Authorization | **אין** | שימוש אנונימי וחופשי; הגנת Endpoint באמצעות אימות קלט ו־WAF |
| CSS | **CSS Modules / CSS רגיל** | סגנון ממשק ללא ספריית עיצוב נוספת; עיצוב חזותי סופי טרם הוגדר |

### נימוקי הבחירה והחלופות שנבחנו

- **Frontend ו־Backend:** Next.js נבחר על פני שילוב Vite/React עם Backend עצמאי ועל פני SvelteKit. הוא פתרון Mainstream בעל תיעוד נרחב, מאפשר Route Handlers מובנים, ומצמצם את מספר פרויקטי הפריסה והתשתיות. עבור מסך יחיד הוא אינו הפתרון הקל ביותר מבחינת משקל Framework, אך איחוד ה־Frontend וה־Backend מפשט את הפרויקט הכולל. אין צורך ב־Express או NestJS נפרדים.
- **Hosting:** Vercel נבחר על פני Render ו־Cloudflare Workers בזכות אינטגרציית Next.js, התמיכה ב־Node.js, חיבור ישיר ל־GitHub ו־WAF Rate Limiting מובנה. GitHub Pages אינו מתאים לבדו, משום שהוא אינו מספק את ה־Backend המאובטח הנדרש ל־OpenAI API.
- **Rate Limiting:** Vercel WAF נבחר על פני Upstash Redis ורישום מונים בזיכרון של Function. הוא מאפשר אכיפה בנקודת הכניסה, ללא שירות State נוסף. מונה בזיכרון של Serverless Function אינו עקבי בין מופעים. פתרון Upstash היה מאפשר מפתחות זיהוי מותאמים יותר, אך מוסיף תשתית שאינה דרושה לדרישות הנוכחיות.
- **AI:** נבחנו שירותי AI חלופיים מבחינת התאמה כללית, אך **GPT-5 הוא דרישה מחייבת ב־PRD**, ולכן נבחר API הרשמי של OpenAI. יש להשתמש במזהה המודל `gpt-5` ולא להחליפו אוטומטית במודל חדש או זול יותר.
- **PWA:** היכולות המובנות של Next.js ל־Web App Manifest נבחרו על פני חבילות PWA עם caching מתקדם, משום שלא נדרשת עבודה ב־Offline. אין להוסיף cache לבקשות בדיחות או תשתית push notifications.
- **Database ו־Authentication:** לא יותקנו Supabase, Prisma, NextAuth/Auth.js, Redis או שירות אחסון. התוספת לא תורמת לדרישות ומנוגדת לעקרון הפשטות; בפרט, אין צורך בהפרדת פרויקטי Supabase או ב־Database Migrations.

### סיכונים ופשרות ידועים

1. **משתמש אנונימי אינו מזוהה באופן ודאי:** WAF יחשב בקשות לפי IP, ולא לפי אדם. משתמשים מאותו IP ציבורי (לדוגמה רשת משרדית) חולקים מכסה; משתמש שמחליף IP עשוי לקבל מכסה נוספת. אין להציג מגבלה זו כהגנה מושלמת מפני שימוש לרעה.
2. **מגבלת חמש בדיחות בדקה:** מיושמת כ־**חמש בקשות HTTP חדשות ל־`/api/jokes` בחלון Fixed Window של 60 שניות לכל IP**, ולא כמגבלה יומית או כספירת בקשות פנימיות ל־OpenAI. חלון קבוע מאפשר פרצי בקשות סמוך לגבול החלון; אין הבטחת Rolling Window. הניסיון החוזר ל־OpenAI נעשה בתוך אותה בקשת HTTP ואינו צורך מכסת WAF נוספת.
3. **תגובות WAF:** כאשר הסף נחצה, WAF מחזיר HTTP `429` לפני שה־Route Handler פועל. לפיכך ההודעה בעברית נוצרת בצד הלקוח בעת קבלת `429`, גם אם גוף התשובה מ־WAF אינו בפורמט JSON של האפליקציה.
4. **התקנת PWA משתנה לפי מכשיר ודפדפן:** יש לספק manifest, icons ו־HTTPS, אך לא להבטיח הופעת Install Prompt בכל דפדפן. אין תמיכה ב־Offline. אין להוסיף Service Worker לצורך caching; אם תנאי התקנה בפלטפורמת יעד מסוימת מחייבים Service Worker, יש לספק handler מינימלי ללא cache של ממשק או API וללא התנהגות Offline.
5. **הוצאות:** גישה ציבורית חופשית עלולה ליצור עלויות API גם עם הגבלה לכל IP. יש להגדיר התראות ומגבלות הוצאה בחשבון OpenAI, ולבדוק חיוב Vercel. תוכנית Vercel Hobby מיועדת לפרויקטים אישיים לא־מסחריים; שימוש מסחרי מחייב תוכנית המתאימה לתנאי השירות.
6. **משך תגובה:** זמני GPT-5 עשויים להשתנות. שתי פניות עוקבות (בכישלון) עשויות לייקר את הבקשה ולהאריך את ההמתנה. יוגדרו Timeouts קצרים ומוגדרים, ולא יישמר מצב ב־Function לאחר סיום התשובה.

## 2. ארכיטקטורת המערכת

### 2.1 מבנה המערכת ואחריות הרכיבים

```mermaid
flowchart TD
  U[דפדפן / PWA מותקן] --> F[Next.js Frontend - מסך יחיד]
  F -->|POST /api/jokes| W[Vercel WAF - 5 requests / 60s / IP]
  W -->|בקשה מותרת| B[Next.js Route Handler - Node.js]
  W -->|HTTP 429| F
  B --> V[אימות קלט והגדרות יצירה]
  V --> O[OpenAI SDK - Responses API - GPT-5]
  O --> V
  V --> B
  B -->|JSON| F
  F -->|Clipboard API| C[לוח במכשיר]
```

- **Client:** מציג את תיבת הנושא, כפתור `צור בדיחה`, בדיחה אחת ותחתיה הכפתורים `בדיחה נוספת` ו־`העתק בדיחה`; מטפל בטעינה, בהודעות שגיאה ובהעתקה.
- **WAF:** מגביל בקשות נכנסות לנתיב היצירה לפני התשלום על שימוש במודל.
- **Route Handler:** מאמת JSON ונושא, מכין הוראות מודל, מבצע קריאה ל־GPT-5 עם ניסיון חוזר אחד על כישלון בר־חזרה, מחזיר תוצאה מסוננת כטקסט או קוד שגיאה.
- **OpenAI API:** מחולל את טקסט הבדיחה. לא מתבצע חיבור ישיר בין הדפדפן ל־OpenAI.
- **Vercel:** מארח Assets סטטיים ואת ה־Route Handler, מספק HTTPS ותהליכי Preview/Production.

### 2.2 חלוקה ל־Modules לוגיים

| שכבה / Module | אחריות |
| --- | --- |
| `Joke UI` | קלט, כפתורים, בדיחה מוצגת, חיווי טעינה, הצגת שגיאות בעברית |
| `Client Joke State` | `draftTopic`, `displayedJoke`, `lastSuccessfulTopic`, `requestStatus`; נשמרים בזיכרון בלבד |
| `Joke API Client` | שליחת `POST` ב־same-origin, פירוש Status Codes ו־JSON |
| `Joke Route` | בקרת Method, Content-Type, Body Size ואורך הנושא; הפעלת שירות יצירה |
| `Joke Generation Service` | בניית הנחיות ל־GPT-5, מדיניות Retry/Timeout, אימות תגובת המודל |
| `OpenAI Adapter` | קריאה ל־Responses API עם Secret בסביבת שרת בלבד |
| `Vercel WAF Policy` | Rate Limit עצמאי של הנתיב `/api/jokes` לפי IP |
| `PWA Metadata` | Manifest, אייקונים ומידע להתקנה |

אין צורך ב־State Management library, מערכת Events, Queue, Cron, WebSocket, ORM או שירותי Microservices.

### 2.3 Data Model ושמירת מידע

אין Database, Object Storage, `localStorage`, `sessionStorage` או היסטוריית בדיחות. מידע המשמש את ה־UI חי בזיכרון של העמוד הנוכחי:

| שדה | טיפוס | משמעות |
| --- | --- | --- |
| `draftTopic` | `string` | הטקסט הנוכחי בתיבה, עד 100 תווים |
| `displayedJoke` | `string \| null` | הבדיחה היחידה המוצגת |
| `lastSuccessfulTopic` | `string \| null` | הנושא שבו נוצרה בהצלחה הבדיחה המוצגת; מחרוזת ריקה מייצגת בדיחה כללית |
| `requestStatus` | `idle \| loading \| error` | מצב בקשת היצירה |
| `errorCode` | `string \| null` | מזהה שגיאה לוגי לצורך הצגת הודעה בעברית |

**כללי מצב:**
- `צור בדיחה` משתמש בערך הנוכחי של `draftTopic`; נושא שכל כולו רווחים מטופל כריק. אין לשנות את `displayedJoke` או `lastSuccessfulTopic` עם תחילת הבקשה.
- `בדיחה נוספת` משתמש בערך `lastSuccessfulTopic`, גם אם `draftTopic` השתנה. הכפתור זמין רק לאחר הצלחת יצירה ראשונה.
- הצלחה מחליפה את הבדיחה ומעדכנת `lastSuccessfulTopic` לאותו נושא ששימש בבקשה שהצליחה.
- שגיאה משאירה את הבדיחה הקודמת, אם קיימת. רענון העמוד מאפס את כל המצבים.
- בעת בקשה פעילה כפתורי היצירה מושבתים כדי למנוע כפילות; ההעתקה מתייחסת לבדיחה שכרגע מוצגת.
- כדי למנוע תוצאה ישנה שדורסת חדשה, יש לאפשר בקשת יצירה אחת פעילה בכל זמן; ניתן לבטל בקשת דפדפן בביטול ניווט. ביטול בצד הלקוח אינו מבטיח ביטול חיוב עבור בקשת API שכבר נשלחה.
- אין שמירה מקומית של בדיחות דרך PWA cache. לוגים תשתיתיים ונתוני שימוש בספקי שירות עשויים להישמר לפי מדיניותם ואינם "היסטוריה" מנוהלת על ידי האפליקציה.

### 2.4 ממשק API

**Endpoint יחיד:** `POST /api/jokes` ב־HTTPS, תחת אותו Origin של האתר.

**Request:**

```json
{"topic":"חתולים"}
```

`topic` הוא `string` אופציונלי, עד 100 תווים. מותר `""` או היעדר שדה ליצירת בדיחה כללית. JSON פגום, טיפוסים שאינם `string` ונושא ארוך מהמותר נדחים. יש להגביל גם את גודל גוף הבקשה ברמת ה־Backend (למשל 1KB) להגנה מפני קלטים חריגים; זהו סף תפעולי ולא מגבלת מוצר נוספת.

**Success — HTTP 200:**

```json
{"joke":"למה החתול ישב ליד המחשב? כי הוא חיפש את העכבר!"}
```

**Errors — מבנה JSON אחיד, כאשר הבקשה מגיעה ל־Backend:**

```json
{"error":{"code":"AI_UNAVAILABLE"}}
```

| HTTP | קוד לוגי | התנהגות |
| --- | --- | --- |
| `400` | `INVALID_INPUT` | קלט לא תקין או נושא מעל 100 תווים |
| `413` | `PAYLOAD_TOO_LARGE` | גוף בקשה גדול מהמגבלה |
| `429` | `RATE_LIMITED` | ה־WAF חוסם; הלקוח מפרש קוד HTTP גם ללא JSON |
| `502` | `AI_UNAVAILABLE` | שירות AI לא השלים יצירה לאחר ניסיון חוזר אחד, או החזיר תוכן בלתי שמיש |
| `503` | `SERVICE_UNAVAILABLE` | תקלת תצורה או זמינות זמנית של השירות |
| `504` | `AI_TIMEOUT` | חלפו מגבלות הזמן שהוגדרו ב־Backend |

ה־Frontend אינו מציג הודעות מערכת גולמיות מה־Backend או מ־OpenAI. הצגת השגיאה תמיד בשפת הממשק — עברית. דוגמאות הודעות: `לא הצלחנו ליצור בדיחה כרגע. אפשר לנסות שוב.`; ב־429: `יצרת יותר מדי בדיחות בזמן קצר. נסה שוב בעוד דקה.`. אין התחייבות ל־`Retry-After` כשהחסימה מבוצעת ב־WAF; אם כותרת תקפה קיימת ניתן להשתמש בה להצגת זמן, אחרת הודעה כללית.

**Headers והתנהגות HTTP:** `Content-Type: application/json`, `Cache-Control: no-store` לתגובות API; לדרוש POST בלבד, ואין להגדיר CORS פתוח. בדפדפן יש להשתמש ב־`fetch('/api/jokes', ...)`; אין להטמיע מפתחות ב־Request או ב־Frontend bundle. `Content-Security-Policy` ו־Headers אבטחה סבירים יוגדרו ב־Next.js/Vercel בהתאם ליישום בפועל.

### 2.5 זרימות המידע

**יצירת בדיחה:**
1. המשתמש מזין נושא או משאיר תיבה ריקה, ולוחץ `צור בדיחה`.
2. Frontend שולח בקשת `POST` אחת ל־`/api/jokes`; מתבצע חיווי טעינה.
3. Vercel WAF סופר את הבקשה לפי IP ומחזיר `429` כשהמכסה נחצתה. בקשה חסומה אינה מגיעה ל־OpenAI.
4. Route Handler בודק את הקלט, מבצע נרמול רווחים לצורך ההנחיות ומכין בקשה ל־GPT-5.
5. ה־Backend שולח ל־OpenAI Responses API קריאה עם `model: 'gpt-5'`, `store: false`, הוראות נפרדות מהקלט וגבול יצירה תפעולי ל־output tokens כדי למנוע תשובות חריגות בעלותן. אין מגבלת מספר משפטים במוצר.
6. הוראות המודל: יצירת בדיחה המתייחסת לנושא; סגנון ואורך גמישים; נושא בעברית → בדיחה בעברית, נושא באנגלית → בדיחה באנגלית, ללא נושא → בדיחה כללית בעברית. הנושא יטופל כ־**נתון**, לא כפקודה להתגבר על הוראות המערכת.
7. בתגובה תקינה ולא ריקה, ה־Backend מחזיר את הטקסט בלבד ללא מטא־נתוני ספק. הלקוח מחליף את הבדיחה הקודמת באותו מסך.
8. אין Persist של נתוני בקשה או בדיחה. מצב הדפדפן יאופס ברענון.

**בדיחה נוספת:** לחיצה על `בדיחה נוספת` מפעילה אותו Endpoint עם `lastSuccessfulTopic`, ולא עם `draftTopic` הנוכחי. התוצאה מחליפה את הקודמת רק בהצלחה.

**ניסיון חוזר:** Backend מבצע **לכל היותר שתי קריאות OpenAI עבור בקשת משתמש יחידה** — קריאה ראשונה ועוד ניסיון חוזר אוטומטי אחד על כשל זמני (כגון network failure, timeout, HTTP 429 של OpenAI או שגיאות 5xx). אין לבצע Retry על קלט לא חוקי, שגיאות אימות/הרשאות/תקציב, או 429 מ־Vercel WAF. ה־OpenAI SDK עשוי לבצע Retries באופן מובנה: יש להגדיר `maxRetries: 0` ולנהל ניסיון חוזר מפורש אחד, כדי שלא ייווצרו ניסיונות נוספים בלי כוונה. יש להגדיר Timeout כולל לרכיב יצירת הבדיחה, שיאפשר ניסיון חוזר תוך משך זמן ה־Function. אין להפעיל Retry אוטומטי נוסף ב־Frontend.

**העתקה:** לחיצה על `העתק בדיחה` מפעילה Browser Clipboard API עם `displayedJoke` הנוכחי, בהקשר HTTPS. במקרה של כישלון העתקה מוצגת הודעה בעברית; אין צורך בפנייה לשרת.

### 2.6 אבטחה, פרטיות ותוכן

- כל הפניות ל־OpenAI מתבצעות מ־Route Handler ב־Node.js בלבד. מפתח `OPENAI_API_KEY` נשמר ב־Server-side Environment Variables של Vercel; **לעולם לא** בשם `NEXT_PUBLIC_*`, לא ב־GitHub, לא ב־manifest, לא ב־logs ולא בתגובה למשתמש.
- `topic` הוא קלט משתמש לא מהימן: לאמת טיפוס, אורך ופורמט, ולא להריץ אותו כקוד. להציבו בתוכן הבקשה כנתון ולא כהוראת מערכת. להציג טקסט בדיחה באמצעות React text rendering בלבד, ללא `dangerouslySetInnerHTML`.
- אין Authentication ואין Authorization של משתמשים, בהתאם ל־PRD. Rate Limiting אינו תחליף לחסינות מלאה מפני abuse; ניתן להפעיל הגנות תשתית בסיסיות בלי להוסיף זרימת משתמש חדשה.
- אין לבנות מערך זיהוי/מעקב אישי או להניח שמכסה לפי IP מזהה משתמש מסוים בוודאות.
- ב־Responses API להשתמש ב־`store: false`, ללא thread/conversation state, וללא שמירת prompts או בדיחות ביומני האפליקציה. הגדרה זו אינה מבטלת בהכרח כל עיבוד או שמירה הנובעים ממדיניות ספקי התשתית; יש לעיין בתנאי OpenAI ו־Vercel.
- ניהול תקינות: אין לחשוף stack traces, prompt פנימי, מזהי חשבון או פרטי חשבונית/מפתחות; רישום תפעולי מינימלי של HTTP status, זמן תגובה וקודי שגיאה מבלי לשמור תוכן בדיחות.
- להגדיר בקרות הוצאה והתראות בחשבון OpenAI ולנטר WAF/Vercel, מאחר שהגבלה לכל IP אינה חוסמת תנועה המגיעה מכתובות רבות.
- התכנים נוצרים בידי מודל הסתברותי: אין הבטחה לבדיחה מצחיקה בכל קריאה או לזיהוי מושלם של טקסט דו־לשוני. ה־PRD מגדיר עברית ואנגלית; לגבי קלט מעורב, להנחות את המודל להשתמש בשפה הדומיננטית; בהיעדר שפה דומיננטית — עברית. זו **הנחת מימוש** לטיפול במקרה קצה, לא יכולת מוצר חדשה.

### 2.7 PWA וממשק

- להשתמש ב־Next.js Web App Manifest הכולל `name`/`short_name` בעברית (שם המוצר הסופי יוגדר בעיצוב), `start_url: '/'`, `display: 'standalone'`, `lang: 'he'`, `dir: 'rtl'`, ואייקונים בגדלים מתאימים, כולל 192×192 ו־512×512.
- להגדיר `lang="he"` ו־`dir="rtl"` למסמך, ולהבטיח ממשק רספונסיבי למובייל. טקסט הנושא או הבדיחה באנגלית יוצג בכיווניות מתאימה (`dir="auto"`) בלי לשנות את כיוון הממשק כולו.
- אין שימוש ב־Service Worker לניהול קאש Offline, ואין שמירת API responses; התקנה והיקף התמיכה בה תלויים בדרישות הדפדפן והמכשיר.
- טקסט הכפתורים נשאר בעברית כמוגדר ב־PRD: `צור בדיחה`, `בדיחה נוספת`, `העתק בדיחה`. חיווי טעינה והודעות שגיאה בעברית. אין לקבוע עיצוב חזותי סופי מעבר לעקרונות שימושיות ונגישות בסיסיים.
- להציג את תוכן הבדיחה באופן קריא ובעל תמיכה בנגישות מקלדת וב־screen reader; ניתן להשתמש ב־`aria-live` להצגת התוצאה ללא מעבר מסך.

### 2.8 Hosting, GitHub ו־Deployment

**ניהול Repository**
- Repository יחיד ב־GitHub מכיל Next.js Frontend, Route Handler, manifest, קבצי assets סטטיים ותצורת פריסה.
- ענף `main` הוא מקור ה־Production. פיתוח מבוצע ב־feature branches ו־Pull Requests; אין צורך במספר Repositories או בתהליך CI/CD עצמאי רק לצורך פריסה.
- `.gitignore` כולל `.env*` מלבד קובץ דוגמה ללא סודות. לשמור lockfile; להגדיר פקודות בדיקה ובנייה סטנדרטיות (TypeScript, lint, build) כדי לזהות כשל לפני merge.

**סביבות**

| סביבה | מקור קוד / כתובת | Secrets |
| --- | --- | --- |
| Local Development | מחשב המפתח, `localhost` | `.env.local` שאינו מועלה ל־GitHub; מפתח OpenAI ייעודי לפיתוח אם זמין |
| Preview | Deployment אוטומטי לענף/PR ב־Vercel | `OPENAI_API_KEY` ב־Vercel Preview בלבד, מומלץ עם מכסת הוצאות נפרדת; להגביל גישה ל־Preview אם ניתן, כדי למנוע צריכת API ציבורית |
| Production | `main` והדומיין הפעיל ב־Vercel | `OPENAI_API_KEY` ב־Vercel Production בלבד, מפתח ייעודי ל־Production |

אין צורך בסביבות Supabase או ב־Database Migrations. אין לייבא סוד Production למחשב פיתוח. משתנים אחרים, כגון מזהה המודל ו־Timeout, הם הגדרות Backend וניתן לשמר את ערכי ברירת המחדל בקוד או להגדירם בסביבה; אין להעביר סודות ל־Client.

**Deployment אוטומטי**
1. מחברים את Repository של GitHub ל־Vercel כפרויקט Next.js אחד.
2. Push לענף פיתוח / Pull Request מפעיל Build ו־Preview Deployment עם URL ייעודי.
3. לאחר בדיקות ואישור קוד, Merge ל־`main` מפעיל Build ו־Production Deployment אוטומטי, ללא הרצת פקודות פריסה ידנית בכל שינוי.
4. Vercel מגיש Frontend ו־Route Handler מאותו Origin ב־HTTPS; הגדרות WAF (מסלול `/api/jokes`, מפתח IP, 5 בקשות, 60 שניות, פעולה 429) מוגדרות ומפורסמות ב־Vercel Dashboard — **אינן נקבעות אוטומטית מקוד ה־Repository**.
5. במקרה של Deployment פגום ניתן להשתמש ב־Vercel Rollback לגרסה תקינה. שינויי Environment Variables ו־WAF נבדקים בנפרד כי אינם בהכרח חלק מה־Git Commit.

**תצורת Function**
- Node.js Runtime; העדפת Region סמוך לרוב המשתמשים ולנקודת הגישה ל־OpenAI, ללא Multi-region יזום.
- `maxDuration` וה־SDK Timeout חייבים להתאים זה לזה. נקודת פתיחה סבירה: תקרת בקשה כוללת של כ־45–60 שניות עם שני ניסיונות מוגבלים בזמן (למשל עד כ־20–25 שניות לניסיון), ומרווח לטיפול בתגובה. אלה **ערכי תפעול מומלצים**, לא דרישות מוצר, ויש לכייל לפי התנהגות GPT-5 בפועל.
- לא לשמור מונים בזיכרון Function; WAF הוא מקור האמת למכסה.
- אין Cache HTTP על תוכן בדיחות או על בקשות יצירה, ואין שימוש ב־ISR/SSG לשמירת בדיחות.

### 2.9 התאמה ל־PRD וקריטריוני אימות מרכזיים

| דרישה | מימוש / בדיקה |
| --- | --- |
| נושא עד 100 תווים | מגבלה ב־UI ואימות חוזר ב־Backend; בקשת 101 תווים נדחית |
| נושא ריק | `topic: ""` יוצר בדיחה כללית בעברית |
| שפה לפי הנושא | הנחיות GPT-5 לנושא בעברית/אנגלית; בדיקות קלט בשתי השפות |
| סגנון ואורך גמישים | Prompt ללא מגבלת אורך סיפור קשיחה; הגבלת Tokens טכנית למניעת עלות חריגה בלבד |
| הצגת בדיחה אחת | התוצאה החדשה מחליפה את הקודמת רק בהצלחה |
| בדיחה נוספת | משתמשת ב־`lastSuccessfulTopic` ולא בשדה העריכה |
| העתקה | Clipboard API ותגובה לכישלון |
| Retry יחיד | SDK retries מבוטלים; עד שתי פניות OpenAI לכל Request, ורק בתקלות זמניות |
| 5 בדיחות בדקה | WAF: עד 5 בקשות API חדשות לכל IP בכל חלון 60 שניות; הבאה מקבלת 429 |
| ללא הרשמה וללא Database | Endpoint ציבורי; אין טבלאות, אחסון מקומי או חשבונות |
| PWA ללא Offline | Manifest, Icons ו־HTTPS; אין cache לצורך פעולה ללא רשת |
| API Key ב־Backend בלבד | `OPENAI_API_KEY` זמין רק ל־Route Handler; אינו מופיע ב־Build Client |
| פריסה מ־GitHub | Preview לכל PR ו־Production אוטומטי מ־`main` |

## 3. מקורות רשמיים והערות עדכניות

ההחלטות לעיל מבוססות בעיקר על תיעוד רשמי שנבדק במועד עריכת המסמך. תמחור ומגבלות שירות משתנים ולכן יש לאמת אותם שוב בעת פתיחת חשבונות/עלייה לאוויר:

1. [Next.js — Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) — Backend מובנה ב־App Router.
2. [Next.js — PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps) — Manifest, אייקונים והתנהגות התקנה.
3. [Vercel — Git Deployments](https://vercel.com/docs/git) — פריסה אוטומטית ו־Preview/Production.
4. [Vercel — WAF Rate Limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting) — Fixed Window, מפתח IP, 429, זמינות ותמחור.
5. [Vercel — Functions Limits](https://vercel.com/docs/functions/limitations) — זמני ריצה, משאבים ומודל Serverless.
6. [Vercel — Hobby Plan](https://vercel.com/docs/plans/hobby) — מגבלות תוכנית חינמית ושימוש אישי לא־מסחרי בלבד.
7. [OpenAI — GPT-5 Model](https://developers.openai.com/api/docs/models/gpt-5) — זהות המודל ויכולות ה־API.
8. [OpenAI — Text Generation](https://developers.openai.com/api/docs/guides/text) — שימוש ב־Responses API.
9. [OpenAI — Responses Storage](https://developers.openai.com/api/docs/guides/migrate-to-responses) — שימוש ב־`store: false`.
10. [OpenAI — API Pricing](https://developers.openai.com/api/docs/pricing) — חיוב מבוסס Tokens; ללא תקציב משתמש שהוגדר אין התחייבות לעלות חודשית מסוימת.
11. [OpenAI — Production Best Practices](https://developers.openai.com/api/docs/guides/production-best-practices) — שמירת Secrets, בקרות הוצאה ואמינות.

**דגש תפעולי:** Vercel WAF מספק בחבילות Hobby/Pro מנגנון Fixed Window לפי IP, והוא עשוי לחייב עבור בקשות לפי התעריף וההקצאות התקפים. אין להניח שתוכנית חינמית מבטיחה שירות ציבורי בלתי מוגבל. OpenAI מחייב בנפרד, לרבות ניסיון יצירה שני אם הקריאה הראשונה הספיקה לצרוך Tokens. אין רכיבי Database, Authentication או Storage שיש לתמחר.
