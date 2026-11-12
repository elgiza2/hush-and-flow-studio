/** Browser-safe bilingual copy for the main Ceyo landing page. */
export type LandingLang = "ar" | "en";

type Row = { title: string; body: string; color: string };
type Faq = { q: string; a: string };

export interface LandingCopy {
  text: Record<string, string>;
  rows: Row[];
  faqs: Faq[];
}

const en: LandingCopy = {
  text: {
    language: "العربية",
    menuBots: "Bots", menuGroups: "Groups", menuWork: "Routines", menuFaq: "Questions",
    startCta: "Start with Ceyo",
    heroEyebrow: "Personal bots that work with you",
    heroBody: "Create your own bots, put them together in group chats, and let them think, talk, browse and get work done while you get on with your day.",
    heroSecondary: "Meet the bots",
    chatTitle: "Launch team", chatMembers: "3 bots · you",
    chatUser: "Plan a launch post for our new product.",
    bot1: "Ceyo", bot2: "Researcher", bot3: "Writer",
    chatBot1: "On it. I'll split this between the team.",
    chatBot2: "I looked at three similar launches, here is what worked.",
    chatBot3: "Draft is ready, two versions for you to pick from.",
    triLabel: "What Ceyo bots do",
    tri0Small: "Your main bot", tri0Role: "Always by your side",
    tri0Title: "One bot that knows you",
    tri0Body: "It remembers what matters and talks with you by voice.",
    tri1Question: "Which name should we pick for the shop?",
    tri1Reply0: "Short names are easier to remember.",
    tri1Reply1: "I checked: two of them are already taken.",
    tri1Reply2: "My vote goes to the third one.",
    tri1Cta: "Create a group",
    tri1Title: "Bots in groups",
    tri1Body: "Every bot replies on its own, no mention needed.",
    tri2Small: "Works on a schedule", tri2Value: "While you sleep",
    tri2Tag0: "Every few minutes", tri2Tag1: "Daily", tri2Tag2: "Weekly",
    tri2Title: "Works on its own",
    tri2Body: "Bots repeat tasks and bring you the result.",
    storyTitle: "Everything a bot can do",
    storyIntro: "Each bot gets its own tools. You decide what it's allowed to do, and you stay in charge of your accounts.",
    faqTitle: "Questions",
    ctaTitle: "Your bots are waiting",
    ctaBody: "Create your first bot in a minute. Free to start.",
    fPower: "Toggle the lights", fTagline: "Personal bots and group chats in one calm place.",
    fCopyright: "© 2026 Ceyo",
    fColProduct: "Product", fWebApp: "Open the web app",
    fColCompany: "Ceyo", fAbout: "About", fContact: "Contact",
    fColLegal: "Legal", fPrivacy: "Privacy", fTerms: "Terms",
  },
  rows: [
    { color: "aurora", title: "Talk and call", body: "Chat in writing or call your bot and talk with it by voice, each bot with its own voice." },
    { color: "ocean", title: "A computer of its own", body: "Bots can run code, work with files and make videos and documents you can download." },
    { color: "mint", title: "Browse the web", body: "A bot can open websites, look at the page and click through. When a site needs your login, you sign in yourself." },
    { color: "ember", title: "Connect your apps", body: "Link the apps you already use so bots can work with them, after you approve each account." },
    { color: "sun", title: "Remember and read", body: "Bots keep notes about you and read the files you share, across every chat." },
  ],
  faqs: [
    { q: "What is Ceyo?", a: "Ceyo is a place to create personal bots, chat with them alone or in groups, and give them tasks." },
    { q: "Do I need to mention a bot for it to reply in a group?", a: "No. Every bot in the group replies on its own. Mentioning a bot only narrows the reply to that bot." },
    { q: "Can a bot work when I'm not in the app?", a: "Yes. Routines let a bot repeat a task every few minutes, daily or weekly and send the result to your chat." },
    { q: "Does Ceyo know my passwords?", a: "No. When a website needs a login, you sign in yourself on a secure screen, the bot never asks for your password." },
    { q: "Is there a phone app?", a: "Yes, Ceyo has an Android app, and you can also use it in any browser." },
    { q: "Is it free?", a: "You can start for free. Paid plans give you more usage." },
  ],
};

const ar: LandingCopy = {
  text: {
    language: "English",
    menuBots: "الروبوتات", menuGroups: "المجموعات", menuWork: "المهام المتكررة", menuFaq: "الأسئلة",
    startCta: "ابدأ مع Ceyo",
    heroEyebrow: "روبوتات شخصية بتشتغل معاك",
    heroBody: "اعمل روبوتاتك الخاصة، جمّعهم في مجموعات، وخليهم يفكروا ويتكلموا ويتصفحوا ويخلّصوا الشغل وانت مكمل يومك.",
    heroSecondary: "اتعرف على الروبوتات",
    chatTitle: "فريق الإطلاق", chatMembers: "٣ روبوتات · انت",
    chatUser: "جهزوا لي بوست إطلاق للمنتج الجديد.",
    bot1: "Ceyo", bot2: "الباحث", bot3: "الكاتب",
    chatBot1: "حاضر، هقسم الشغل على الفريق.",
    chatBot2: "بصيت على ٣ إطلاقات شبهنا، ودي الحاجات اللي نجحت.",
    chatBot3: "المسودة جاهزة، نسختين تختار منهم.",
    triLabel: "روبوتات Ceyo بتعمل إيه",
    tri0Small: "الروبوت الأساسي", tri0Role: "معاك على طول",
    tri0Title: "روبوت واحد فاهمك",
    tri0Body: "بيفتكر الحاجات المهمة وتقدر تكلمه بالصوت.",
    tri1Question: "نختار أنهي اسم للمتجر؟",
    tri1Reply0: "الأسامي القصيرة أسهل في الحفظ.",
    tri1Reply1: "اتأكدت: اتنين منهم محجوزين.",
    tri1Reply2: "صوتي للاسم التالت.",
    tri1Cta: "اعمل مجموعة",
    tri1Title: "روبوتات في مجموعة",
    tri1Body: "كل روبوت بيرد لوحده من غير منشن.",
    tri2Small: "بيشتغل بمواعيد", tri2Value: "وانت نايم",
    tri2Tag0: "كل كام دقيقة", tri2Tag1: "كل يوم", tri2Tag2: "كل أسبوع",
    tri2Title: "بيشتغل لوحده",
    tri2Body: "الروبوت بيكرر المهمة ويجيبلك النتيجة.",
    storyTitle: "كل اللي الروبوت يقدر يعمله",
    storyIntro: "كل روبوت ليه أدواته. انت اللي بتحدد مسموح له بإيه، وحساباتك تفضل في إيدك.",
    faqTitle: "أسئلة",
    ctaTitle: "روبوتاتك مستنياك",
    ctaBody: "اعمل أول روبوت ليك في دقيقة. البداية مجانية.",
    fPower: "تشغيل وإطفاء النور", fTagline: "روبوتات شخصية ومجموعات في مكان واحد هادي.",
    fCopyright: "© 2026 Ceyo",
    fColProduct: "المنتج", fWebApp: "افتح التطبيق على الويب",
    fColCompany: "Ceyo", fAbout: "عننا", fContact: "تواصل معانا",
    fColLegal: "قانوني", fPrivacy: "الخصوصية", fTerms: "الشروط",
  },
  rows: [
    { color: "aurora", title: "كلام ومكالمات", body: "اكتب للروبوت أو كلمه مكالمة بالصوت، وكل روبوت ليه صوته." },
    { color: "ocean", title: "كمبيوتر خاص بيه", body: "الروبوت يقدر يشغل كود، يشتغل على ملفات، ويعمل فيديوهات ومستندات تنزلها." },
    { color: "mint", title: "يتصفح النت", body: "الروبوت يفتح المواقع ويشوف الصفحة ويضغط فيها. ولو الموقع محتاج تسجيل دخول، انت اللي بتسجل بنفسك." },
    { color: "ember", title: "يربط تطبيقاتك", body: "اربط التطبيقات اللي بتستخدمها عشان الروبوتات تشتغل عليها، بعد موافقتك على كل حساب." },
    { color: "sun", title: "يفتكر ويقرا", body: "الروبوتات بتحتفظ بملاحظات عنك وبتقرا الملفات اللي بتبعتها، في كل الشاتات." },
  ],
  faqs: [
    { q: "يعني إيه Ceyo؟", a: "Ceyo مكان تعمل فيه روبوتات شخصية، تكلمهم لوحدهم أو في مجموعات، وتديهم مهام." },
    { q: "لازم أعمل منشن للروبوت عشان يرد في المجموعة؟", a: "لأ. كل روبوت في المجموعة بيرد لوحده. المنشن بس بيخلي الرد من الروبوت اللي ذكرته." },
    { q: "الروبوت يقدر يشتغل وانا مش فاتح التطبيق؟", a: "أيوه. المهام المتكررة بتخلي الروبوت يكرر مهمة كل كام دقيقة أو كل يوم أو كل أسبوع ويبعتلك النتيجة في الشات." },
    { q: "Ceyo بيعرف كلمات السر بتاعتي؟", a: "لأ. لما موقع يحتاج تسجيل دخول، انت بتسجل بنفسك من شاشة آمنة، والروبوت عمره ما يطلب كلمة السر." },
    { q: "فيه تطبيق للموبايل؟", a: "أيوه، فيه تطبيق أندرويد، وتقدر تستخدمه كمان من أي متصفح." },
    { q: "هو مجاني؟", a: "تقدر تبدأ مجانًا، والباقات المدفوعة بتديك استخدام أكتر." },
  ],
};

export const LANDING_COPY: Record<LandingLang, LandingCopy> = { en, ar };

export function detectLandingLang(saved: string | null, query: string | null, device: string | undefined): LandingLang {
  void query; void saved;
  void device;
  return "en";
}
