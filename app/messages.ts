// UI texts, taken from the wording table in spec/DESIGN.md.

export const MESSAGES = {
  title: "מחולל בדיחות",
  subtitle: "בדיחה על כל נושא שתרצו",
  topicLabel: "נושא הבדיחה",
  topicPlaceholder: "מה נושא הבדיחה?",
  generate: "צור בדיחה",
  loading: "מייצר בדיחה...",
  cardTitlePrefix: "בדיחה על",
  cardTitleGeneral: "בדיחה כללית",
  another: "בדיחה נוספת",
  copy: "העתק בדיחה",
  copied: "הועתק!",
  copyFailed: "לא הצלחנו להעתיק. אפשר לסמן את הטקסט ולהעתיק ידנית.",
  generalError: "משהו השתבש. נסו שוב בעוד רגע.",
  refused: "על הנושא הזה לא נצליח להצחיק. נסו נושא אחר.",
  timeoutError: "זה לקח יותר מדי זמן. נסו שוב.",
  offlineError: "אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב.",
  rateLimited: "הגעתם למגבלה של 5 בדיחות בדקה. נסו שוב בעוד דקה.",
  invalidInput: "הנושא לא תקין. נסו לנסח אותו אחרת.",
} as const;
