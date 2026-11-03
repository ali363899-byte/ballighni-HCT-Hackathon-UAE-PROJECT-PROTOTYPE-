// Translate UI controls only; preserve entered accounts and evidence findings.
const copy = {
  Voice: "الصوت",
  "Your voice. Your pace.": "صوتك، بالوتيرة التي تناسبك.",
  "Extra large touch targets": "أزرار لمس أكبر",
  "More space between lines and paragraphs": "مسافات أكبر بين السطور والفقرات",
  "Dictate into this field": "أملِ النص لهذا الحقل",
  "Stop listening": "إيقاف الاستماع",
  "Speak a navigation command": "انطق أمر تنقل",
  "Read this page aloud": "اقرأ هذه الصفحة بصوت عالٍ",
  "Stop voice / reading": "إيقاف الصوت / القراءة",
  "Commands you can say": "أوامر يمكنك قولها",

  "Start an incident report": "ابدأ بلاغاً عن حادث",
  "Analyze evidence & prepare draft →": "حلّل الأدلة وأعد المسودة ←",
  "Analyze evidence / retry ↗": "حلّل الأدلة / أعد المحاولة ↖",
  "Connect another participant": "اربط مشاركاً آخر",
  "Create an invitation for the other person": "أنشئ دعوة للشخص الآخر",
  "I already have the other participant’s code": "لدي رمز المشارك الآخر",
  "Request connection for this report →": "اطلب ربط هذا البلاغ ←",
  "Check for statement updates ↻": "تحقق من تحديثات الإفادات ↻",
  "Your draft": "مسودتك",
  Submitted: "مُرسل",
  "Human review": "مراجعة بشرية",
  Closed: "مغلق",
  "Your AI assistants": "مساعدوك بالذكاء الاصطناعي",

  Overview: "نظرة عامة",
  "New report": "بلاغ جديد",
  "My cases": "بلاغاتي",
  "Review desk": "مكتب المراجعة",
  "Accessibility ♿": "إمكانية الوصول ♿",
  "Accessibility & support": "إمكانية الوصول والدعم",
  "Sign in ↗": "تسجيل الدخول ↗",
  "Connection help ↗": "مساعدة الاتصال ↗",
  "Connection settings": "إعدادات الاتصال",
  "About the prototype ↗": "حول النموذج الأولي ↗",
  "YOUR REPORTING SPACE": "مساحة البلاغات",
  "A little clarity, when it matters.": "وضوح أكبر عندما تحتاج إليه.",
  "ONE CONNECTED INCIDENT JOURNEY": "رحلة واحدة مترابطة للبلاغ",
  "LESS FRICTION. MORE CLARITY.": "خطوات أقل. وضوح أكبر.",
  "One report.": "بلاغ واحد.",
  "A clearer way": "طريق أوضح",
  "forward.": "للمضي قدماً.",
  "Report an incident": "الإبلاغ عن حادث",
  "How can we help?": "كيف يمكننا مساعدتك؟",
  "Choose the path that fits your situation": "اختر المسار المناسب لحالتك",
  "I was involved": "أنا طرف في الحادث",
  "I witnessed an incident": "شاهدت حادثاً",
  "Follow my case": "متابعة بلاغي",
  "Capture once": "سجّل مرة واحدة",
  "Review your draft": "راجع المسودة",
  "Stay informed": "تابع المستجدات",
  "AI assists.": "الذكاء الاصطناعي يساعد.",
  "People decide.": "والقرار للبشر.",
  "Explore a synthetic example ↗": "استعراض مثال افتراضي ↗",
  "Hackathon prototype": "نموذج أولي للهاكاثون",
  "Not an official government service.": "ليست خدمة حكومية رسمية.",
  "Safety is the main priority.": "السلامة هي الأولوية الأولى.",
  "If anyone has been injured, a fire has occurred, or there is immediate danger, urgently call the official emergency channels. Do not wait for a report.":
    "إذا أُصيب أي شخص أو اندلع حريق أو وُجد خطر فوري، اتصل فوراً بقنوات الطوارئ الرسمية. لا تنتظر تقديم البلاغ.",
  "Police · 999": "الشرطة · 999",
  "Fire / Civil Defence · 997": "الإطفاء / الدفاع المدني · 997",
  "Ambulance · 998": "الإسعاف · 998",
  "Let’s start with safety.": "لنبدأ بالسلامة.",
  "Your perspective matters.": "مشاهداتك مهمة.",
  "Is anyone injured or in immediate danger?": "هل يوجد مصاب أو خطر فوري؟",
  "Yes / I’m not sure": "نعم / لست متأكداً",
  "No immediate danger →": "لا يوجد خطر فوري ←",
  "I am safely stopped and can report without distraction. I will not use this app while driving.":
    "أنا متوقف في مكان آمن ويمكنني تقديم البلاغ دون تشتت. لن أستخدم التطبيق أثناء القيادة.",
  "Pause this report. Get urgent help.": "أوقف البلاغ واطلب المساعدة العاجلة.",
  "Call police · 999": "اتصل بالشرطة · 999",
  "Call Fire / Civil Defence · 997": "اتصل بالإطفاء / الدفاع المدني · 997",
  "Call ambulance · 998": "اتصل بالإسعاف · 998",
  "DRIVER REPORT": "بلاغ أحد الأطراف",
  "WITNESS REPORT": "بلاغ شاهد",
  "01 / Safety": "٠١ / السلامة",
  "01 / Safety ✓": "٠١ / السلامة ✓",
  "02 / Details & evidence": "٠٢ / التفاصيل والأدلة",
  "03 / Review & confirm": "٠٣ / المراجعة والتأكيد",
  "Tell us what you observed.": "أخبرنا بما شاهدته.",
  "Approximate location": "الموقع التقريبي",
  "When did it happen?": "متى حدث ذلك؟",
  "What happened?": "ماذا حدث؟",
  Photos: "الصور",
  "Save & prepare draft →": "حفظ وإعداد المسودة ←",
  Cancel: "إلغاء",
  "Support and connected accounts": "الدعم والحسابات المرتبطة",
  "Your involvement": "دورك في الحادث",
  "Involved participant": "طرف في الحادث",
  "I consider myself an affected participant": "أعتبر نفسي طرفاً متضرراً",
  Witness: "شاهد",
  "Communication / access support request": "طلب دعم للتواصل أو إمكانية الوصول",
  "Use my saved communication card": "استخدام بطاقة التواصل المحفوظة",
  "Other participant’s private invitation code":
    "رمز الدعوة الخاص بالطرف الآخر",
  "Your reports, in one place.": "بلاغاتك في مكان واحد.",
  "The review desk.": "مكتب المراجعة.",
  "Find a case": "البحث عن بلاغ",
  "Search reference or location": "البحث بالمرجع أو الموقع",
  "YOUR CASES": "بلاغاتك",
  "CASES IN QUEUE": "قائمة المراجعة",
  "INFORMATION REQUESTED": "معلومات مطلوبة",
  CLOSED: "مغلقة",
  Draft: "مسودة",
  Submitted: "مُقدّم",
  "Under review": "قيد المراجعة",
  "More information": "معلومات إضافية",
  Closed: "مغلق",
  "CASE FILE": "ملف البلاغ",
  "Case file": "ملف البلاغ",
  "REPORT TYPE": "نوع البلاغ",
  "INCIDENT TIME": "وقت الحادث",
  RECEIVED: "وقت الاستلام",
  "Reporter’s account": "إفادة مقدّم البلاغ",
  Evidence: "الأدلة",
  "Evidence findings": "ملاحظات الأدلة",
  "AI observations · unverified": "ملاحظات الذكاء الاصطناعي · غير متحققة",
  "Manual drafting mode": "إعداد المسودة يدوياً",
  "Prepare / retry analysis ↗": "إعداد التحليل / إعادة المحاولة ↗",
  "Check and confirm your draft": "راجع المسودة وأكّدها",
  "Edit the report before submitting": "عدّل المسودة قبل الإرسال",
  "Confirm & submit →": "تأكيد وتقديم ←",
  "Confirmed report": "المسودة المؤكدة",
  "Case timeline": "السجل الزمني",
  "Refresh updates ↻": "تحديث المستجدات ↻",
  "Export case JSON ↓": "تصدير بيانات البلاغ ↓",
  "Next review action": "إجراء المراجعة التالي",
  "Next status": "الحالة التالية",
  "Reason / request": "السبب / الطلب",
  "Save review action →": "حفظ إجراء المراجعة ←",
  "Possible related reports": "بلاغات قد تكون مرتبطة",
  "Accept link": "قبول الربط",
  "Reject link": "رفض الربط",
  "Human review note": "ملاحظة المراجع البشري",
  "Correct or qualify a finding": "تصحيح ملاحظة أو توضيحها",
  "Evidence source": "مصدر الدليل",
  "Save human correction →": "حفظ التصحيح البشري ←",
  "Respond to the request": "الرد على الطلب",
  "Your response": "ردّك",
  "Send for review →": "إرسال للمراجعة ←",
  "PEOPLE OF DETERMINATION": "أصحاب الهمم",
  "Support that adapts to you.": "دعم يتكيف مع احتياجاتك.",
  "Make the interface comfortable": "اضبط الواجهة لتناسبك",
  "Larger, easier-to-read text": "نص أكبر وأسهل للقراءة",
  "High-contrast view": "تباين عالٍ",
  "Reduce animation and motion": "تقليل الحركة والمؤثرات",
  "My communication card": "بطاقة التواصل الخاصة بي",
  "Save my preferences →": "حفظ تفضيلاتي ←",
  "Read my card aloud": "قراءة بطاقتي بصوت عالٍ",
  "Stop reading": "إيقاف القراءة",
  "A calmer reporting journey": "رحلة بلاغ أكثر هدوءاً",
  "Start a safely stopped report →": "ابدأ البلاغ بعد التوقف الآمن ←",
  "Injuries, fire or immediate danger?": "إصابة أو حريق أو خطر فوري؟",
  "YOUR BALLIGHNI ACCOUNT": "حسابك في بلّغني",
  "Welcome back.": "مرحباً بعودتك.",
  "Make space for clarity.": "ابدأ رحلة أوضح.",
  Username: "اسم المستخدم",
  Password: "كلمة المرور",
  "Reviewer setup code": "رمز إعداد حساب المراجع",
  "Sign in →": "تسجيل الدخول ←",
  "Create account →": "إنشاء حساب ←",
  "New here? Create an account": "مستخدم جديد؟ أنشئ حساباً",
  "Already registered? Sign in": "لديك حساب؟ سجّل الدخول",
  "Close sign-in": "إغلاق تسجيل الدخول",
  "Connect your workspace.": "اربط مساحة العمل.",
  "Backend URL": "عنوان الخادم",
  "Save connection →": "حفظ الاتصال ←",
  "Test connection": "اختبار الاتصال",
  "Participant statements": "إفادات الأطراف",
  "ONE INCIDENT · SEPARATE ACCOUNTS": "حادث واحد · إفادات منفصلة",
  "Routing history": "سجل الإحالة",
  "SIMULATION · NOT TRANSMITTED": "محاكاة · لم يتم الإرسال",
  "Joint review & report packet": "المراجعة المشتركة وحزمة التقرير",
  "HUMAN REVIEW REQUIRED": "المراجعة البشرية مطلوبة",
  "Review both sides, preserve both accounts.":
    "راجع الطرفين واحتفظ بكل إفادة.",
  "Preliminary joint report": "التقرير المشترك الأولي",
  "Review summary / unresolved disagreements":
    "ملخص المراجعة / الخلافات غير المحسومة",
  "Approve this prototype packet →": "اعتماد حزمة النموذج الأولي ←",
  "Download report text ↓": "تنزيل نص التقرير ↓",
  "Simulate department intake": "محاكاة استلام الجهة",
  "Simulate insurance intake": "محاكاة استلام التأمين",
};
let language =
  localStorage.getItem("ballighni-language") === "ar" ? "ar" : "en";
const original = new WeakMap();
let queued = false;
function apply() {
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walk.nextNode())) {
    if (
      node.parentElement?.closest(
        "script,style,textarea,.narrative,.finding p,.timeline p,figcaption,#participant-code",
      )
    )
      continue;
    const key = node.nodeValue.trim();
    if (copy[key]) original.set(node, node.nodeValue);
    const source = original.get(node);
    if (!source) continue;
    const next =
      language === "ar"
        ? source.replace(source.trim(), copy[source.trim()])
        : source;
    if (next !== node.nodeValue) node.nodeValue = next;
  }
  const button = document.querySelector("#language-toggle");
  if (button) {
    button.textContent = language === "ar" ? "English" : "العربية";
    button.lang = language === "ar" ? "en" : "ar";
  }
}
export function setupLanguage() {
  document.querySelector("#language-toggle").onclick = () => {
    language = language === "ar" ? "en" : "ar";
    localStorage.setItem("ballighni-language", language);
    apply();
  };
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  }).observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
  });
  apply();
}
