# תוכנית — Milestone 1: הקמת הפרויקט וסביבת בדיקה זמינה

## מטרה
בסיס Next.js App Router + TypeScript עם מסך הבית הבסיסי בעברית (RTL, מותאם למובייל), בלי AI ובלי תוכן מדומה. חיבור GitHub ו־Vercel נעשה על ידי המשתמש, בהדרכה.

## קבצים ליצירה
| קובץ | תפקיד |
| --- | --- |
| `package.json` | תלויות (`next`, `react`, `react-dom`, `typescript`, `eslint`, `eslint-config-next`, טיפוסים) ופקודות `dev`, `build`, `start`, `lint`, `typecheck` |
| `tsconfig.json` | הגדרות TypeScript במצב strict |
| `next.config.ts` | הגדרות Next.js בסיסיות |
| `eslint.config.mjs` | ESLint (flat config) עם `eslint-config-next/core-web-vitals` ו־`typescript` |
| `next-env.d.ts` | נוצר אוטומטית ע"י Next.js |
| `app/layout.tsx` | `<html lang="he" dir="rtl">`, metadata, viewport למובייל |
| `app/globals.css` | איפוס בסיסי, `box-sizing`, מניעת גלילה אופקית |
| `app/page.tsx` | המסך היחיד: כותרת "מחולל בדיחות", תיאור "בדיחה על כל נושא שתרצו", תווית "נושא הבדיחה", שדה קלט (עד 100 תווים) עם מונה, כפתור "צור בדיחה" |
| `app/page.module.css` | פריסה של עמודה אחת במובייל, לפי סדר ה־Wireframes |
| `.gitignore` | הוספת `.next/`, `next-env.d.ts`, `*.tsbuildinfo` (בלי לשנות את השורות הקיימות) |

## גישה
- המסך בנוי לפי סדר ה־Wireframes: Header ← קלט + מונה ← כפתור ראשי. אין עדיין כרטיס בדיחה וכפתורי "בדיחה נוספת"/"העתק בדיחה" (שייכים ל־Milestones 2–3).
- כפתור "צור בדיחה" מושבת, ולידו הערה קטנה שיצירת בדיחות עדיין לא זמינה, כדי לא לטעון שהיכולת פועלת.
- השדה והמונה הם רכיב Client פשוט (`useState`) — זו תשתית מינימלית ולא לוגיקת יצירה.
- עיצוב בסיסי ונקי בלבד; השפה העיצובית המלאה (Comic/Pop Art) שייכת ל־Milestone 3.
- אין Secrets ואין משתני סביבה ב־Milestone זה, לכן אין צורך ב־`.env.example`.

## בדיקות
- `npm run typecheck`, `npm run lint`, `npm run build` עוברים ללא שגיאות.
- הרצה מקומית ובדיקה ברוחב 375px: RTL, ללא גלילה אופקית, מונה תווים מתעדכן ונעצר ב־100.
- חיפוש מחרוזות שנראות כמו מפתחות בקוד.

## מה דורש את המשתמש (לא מבוצע אוטומטית)
- יצירת Repository ב־GitHub ומסירת הכתובת, ואישור push.
- חיבור ה־Repository ל־Vercel והפעלת Preview Deployments.
