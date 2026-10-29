import type { Grading } from "./adhkar";
import type { Localized } from "./curriculum";

// Where each morning and evening dhikr comes from and how the scholars graded it, shown behind the
// source button on its card. Rulings are as recorded in the dorar.net hadith encyclopedia and the
// books it cites (checked October 2026). Each entry of adhkar-texts.json names its grading by key.

const L = (ar: string, en: string): Localized => ({ ar, en });

const S = {
  albani: L("الألباني", "al-Albānī"),
  ibnBaz: L("ابن باز", "Ibn Bāz"),
  ibnHajar: L("ابن حجر", "Ibn Ḥajar"),
  nawawi: L("النووي", "al-Nawawī"),
  arnaut: L("شعيب الأرناؤوط", "Shuʿayb al-Arnaʾūṭ"),
  mundhiri: L("المنذري", "al-Mundhirī"),
  haythami: L("الهيثمي", "al-Haythamī"),
  tirmidhi: L("الترمذي", "al-Tirmidhī"),
  ibnQayyim: L("ابن القيم", "Ibn al-Qayyim"),
  shakir: L("أحمد شاكر", "Aḥmad Shākir"),
  hakim: L("الحاكم", "al-Ḥākim"),
  bukhari: L("البخاري", "al-Bukhārī"),
  muslim: L("مسلم", "Muslim"),
  bukhariMuslim: L("البخاري ومسلم", "al-Bukhārī & Muslim"),
  musnadEditors: L("محققو المسند", "Musnad editors"),
};

const r = (who: Localized, ar: string, en: string) => ({ who, ruling: L(ar, en) });

// Where to read the rulings: a dorar.net search lists every scholar's ruling on the hadith with the
// book and number. A second link is given where one ruling only shows up under another wording.
const dorar = (q: string) => `https://dorar.net/hadith/search?q=${encodeURIComponent(q)}`;
const all = (q: string) => ({ label: L("أحكام العلماء في الدرر السنية", "All rulings on dorar.net"), url: dorar(q) });

const links: Record<string, Grading["links"]> = {
  kursi: [all("أجير من الجن حتى يمسي")],
  quls: [all("تكفيك من كل شيء")],
  baqarah: [all("الآيتين من آخر سورة البقرة في ليلة كفتاه")],
  "asbahna-mulk": [all("أمسينا وأمسى الملك لله والحمد لله")],
  sayyid: [all("سيد الاستغفار أن تقول")],
  bismillah: [
    all("بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء"),
    { label: L("لفظ الفضل", "The virtue's wording"), url: dorar("لم تصبه فجأة بلاء") },
  ],
  bika: [all("اللهم بك أصبحنا وبك أمسينا")],
  fitrah: [all("أصبحنا على فطرة الإسلام")],
  adada: [all("عدد خلقه ورضا نفسه وزنة عرشه")],
  afini: [all("اللهم عافني في بدني")],
  afw: [all("استر عوراتي وآمن روعاتي")],
  "ya-hayy": [all("يا حي يا قيوم برحمتك أستغيث")],
  "alim-ghayb": [all("عالم الغيب والشهادة فاطر السماوات والأرض رب كل شيء ومليكه")],
  kalimat: [
    all("أعوذ بكلمات الله التامات من شر ما خلق حين يمسي"),
    { label: L("حكم ابن باز", "Ibn Bāz's ruling"), url: dorar("لم تضره حمة تلك الليلة") },
  ],
  shirk: [all("نعوذ بك من أن نشرك بك شيئا نعلمه")],
  hamm: [all("غلبة الدين وقهر الرجال")],
  "astaghfir-azim": [all("أستغفر الله الذي لا إله إلا هو الحي القيوم وأتوب إليه")],
  tahlil: [all("في يوم مائة مرة كانت له عدل عشر رقاب")],
  tasbih: [all("حين يصبح وحين يمسي سبحان الله وبحمده مائة مرة")],
  istighfar: [
    { label: L("رواية الصباح في الدرر السنية", "The morning narration on dorar.net"), url: dorar("ما أصبحت غداة قط إلا استغفرت الله فيها مائة مرة") },
    { label: L("مائة مرة في اليوم", "A hundred times a day"), url: dorar("لأستغفر الله وأتوب إليه في اليوم مائة مرة") },
  ],
};

// The hadith itself in its collection, outside dorar: sunnah.com (which also shows al-Albānī's or
// Dārussalām's grading for the Sunan), or hadithunlocked.com for collections sunnah.com doesn't carry.
// Each link was opened and checked to show this hadith (Oct 2026). sunnah.com's own numbering can
// differ from the printed books (Muslim 2709 is its "2709a").
const BOOK = {
  bukhari: L("صحيح البخاري", "Ṣaḥīḥ al-Bukhārī"),
  muslim: L("صحيح مسلم", "Ṣaḥīḥ Muslim"),
  abudawud: L("سنن أبي داود", "Sunan Abī Dāwūd"),
  tirmidhi: L("جامع الترمذي", "Jāmiʿ al-Tirmidhī"),
  ibnmajah: L("سنن ابن ماجه", "Sunan Ibn Mājah"),
  adab: L("الأدب المفرد", "al-Adab al-Mufrad"),
  ahmad: L("مسند أحمد", "Musnad Aḥmad"),
  hakim: L("مستدرك الحاكم", "al-Mustadrak of al-Ḥākim"),
  nasaikubra: L("السنن الكبرى للنسائي", "al-Nasāʾī, al-Sunan al-Kubrā"),
};
const at = (site: string, book: keyof typeof BOOK, n: string, path = `${book}:${n}`) => ({
  label: L(`${BOOK[book].ar} (${n.replace(/[a-z]$/, "")}) — ${site}`, `${BOOK[book].en} ${n.replace(/[a-z]$/, "")} on ${site}`),
  url: `https://${site}/${path}`,
});
const sn = (book: keyof typeof BOOK, n: string) => at("sunnah.com", book, n);
const hu = (book: keyof typeof BOOK, n: string) => at("hadithunlocked.com", book, n);

const sources: Record<string, Grading["links"]> = {
  kursi: [hu("nasaikubra", "10731"), sn("bukhari", "2311")],
  quls: [sn("abudawud", "5082"), sn("tirmidhi", "3575")],
  baqarah: [sn("bukhari", "5009"), sn("muslim", "807")],
  "asbahna-mulk": [sn("muslim", "2723")],
  sayyid: [sn("bukhari", "6306")],
  bismillah: [sn("abudawud", "5088"), sn("tirmidhi", "3388"), sn("ibnmajah", "3869")],
  bika: [sn("tirmidhi", "3391"), sn("abudawud", "5068")],
  fitrah: [hu("ahmad", "15360")],
  adada: [sn("muslim", "2726")],
  afini: [sn("abudawud", "5090")],
  afw: [sn("abudawud", "5074"), sn("ibnmajah", "3871")],
  "ya-hayy": [hu("hakim", "2000")],
  "alim-ghayb": [sn("abudawud", "5067"), sn("tirmidhi", "3392"), sn("tirmidhi", "3529")],
  kalimat: [sn("muslim", "2709a")],
  shirk: [sn("adab", "716")],
  hamm: [sn("bukhari", "6363"), sn("abudawud", "1555")],
  "astaghfir-azim": [sn("abudawud", "1517"), sn("tirmidhi", "3577")],
  tahlil: [sn("bukhari", "3293"), sn("muslim", "2691")],
  tasbih: [sn("muslim", "2692"), sn("bukhari", "6405")],
  istighfar: [sn("ibnmajah", "3815"), sn("muslim", "2702")],
};

const base: Record<string, Omit<Grading, "links">> = {
  kursi: {
    verdict: "sahih",
    takhrij: "رواه النسائي في الكبرى (10731) وابن حبان (417)، وصححه الألباني في صحيح الترغيب (662)",
    reason: L(
      "حديث أُبي بن كعب: من قالها حين يصبح أُجير من الجن حتى يمسي، ومن قالها حين يمسي أُجير منهم حتى يصبح. وذكر الألباني في موضع آخر أن لفظ الصباح والمساء زيادة شاذة، وقراءتها عند النوم ثابتة في البخاري (2311) على كل حال.",
      "Ubayy ibn Kaʿb's hadith: whoever recites it in the morning is protected from the jinn until evening, and in the evening until morning. Al-Albānī elsewhere called the morning/evening wording an irregular addition (shādhdh); reciting it at bedtime is in al-Bukhārī (2311) either way.",
    ),
    rulings: [
      r(S.albani, "صحيح (صحيح الترغيب 662)", "Ṣaḥīḥ (Ṣaḥīḥ al-Targhīb 662)"),
      r(S.mundhiri, "إسناده جيد", "Isnād jayyid"),
      r(S.haythami, "رجاله ثقات", "Its narrators are trustworthy"),
    ],
  },
  quls: {
    verdict: "sahih",
    takhrij: "رواه أبو داود (5082) والترمذي (3575)، وحسنه الألباني وابن باز",
    reason: L(
      "حديث عبد الله بن خبيب، وفيه: «قل هو الله أحد والمعوذتين حين تمسي وحين تصبح ثلاث مرات تكفيك من كل شيء».",
      "ʿAbd Allāh ibn Khubayb's hadith names the evening and the morning and the count of three, and says they suffice you against everything.",
    ),
    rulings: [
      r(S.tirmidhi, "حسن صحيح غريب", "Ḥasan ṣaḥīḥ gharīb"),
      r(S.albani, "حسن (صحيح أبي داود 5082)", "Ḥasan (Ṣaḥīḥ Abī Dāwūd 5082)"),
      r(S.ibnBaz, "إسناده حسن (مجموع الفتاوى 26/26)", "Isnād ḥasan (Majmūʿ 26/26)"),
      r(S.nawawi, "إسناده صحيح", "Isnād ṣaḥīḥ"),
      r(S.ibnHajar, "حسن", "Ḥasan"),
    ],
  },
  baqarah: {
    verdict: "sahih",
    takhrij: "متفق عليه: البخاري (5009) ومسلم (807)",
    reason: L(
      "حديث أبي مسعود البدري: «من قرأ بالآيتين من آخر سورة البقرة في ليلة كفتاه». فهي من أذكار الليل، والليل يبدأ من المغرب، فذكرها مع أذكار المساء مناسب.",
      "Abū Masʿūd al-Badrī's hadith: whoever recites them in a night, they suffice him. It belongs to the night, which starts at maghrib, so placing it with the evening adhkār fits.",
    ),
    rulings: [r(S.bukhariMuslim, "في الصحيحين", "In both Ṣaḥīḥs")],
  },
  "asbahna-mulk": {
    verdict: "sahih",
    takhrij: "رواه مسلم (2723)",
    reason: L(
      "حديث ابن مسعود في صحيح مسلم، وفيه لفظ المساء ثم: «وإذا أصبح قال ذلك أيضا: أصبحنا وأصبح الملك لله».",
      "Ibn Masʿūd's hadith in Ṣaḥīḥ Muslim gives the evening wording and then the morning one.",
    ),
    rulings: [
      r(S.muslim, "في صحيح مسلم", "In Ṣaḥīḥ Muslim"),
      r(S.albani, "صحيح (أبو داود 5071، الترمذي 3390)", "Ṣaḥīḥ (Abū Dāwūd 5071, al-Tirmidhī 3390)"),
    ],
  },
  sayyid: {
    verdict: "sahih",
    takhrij: "رواه البخاري (6306)",
    reason: L(
      "حديث شداد بن أوس: «من قالها من النهار موقنا بها فمات من يومه قبل أن يمسي فهو من أهل الجنة»، وكذلك في الليل.",
      "Shaddād ibn Aws's hadith: whoever says it by day with certainty and dies before evening is of the people of Paradise, and the same by night.",
    ),
    rulings: [
      r(S.bukhari, "في صحيح البخاري", "In Ṣaḥīḥ al-Bukhārī"),
      r(S.albani, "صحيح، باللفظ المذكور هنا (أبو داود 5070)", "Ṣaḥīḥ, in the wording shown here (Abū Dāwūd 5070)"),
    ],
  },
  bismillah: {
    verdict: "sahih",
    takhrij: "رواه أبو داود (5088) والترمذي (3388) وابن ماجه (3869)، وصححه الألباني وابن باز",
    reason: L(
      "حديث عثمان بن عفان، وفيه ذكر الصباح والمساء والعدد ثلاثا.",
      "ʿUthmān's hadith names the morning and evening and the count of three.",
    ),
    rulings: [
      r(S.albani, "صحيح (صحيح أبي داود 5088)", "Ṣaḥīḥ (Ṣaḥīḥ Abī Dāwūd 5088)"),
      r(S.ibnBaz, "صحيح", "Ṣaḥīḥ"),
      r(S.arnaut, "حسن", "Ḥasan"),
    ],
    notes: [
      L(
        "لفظ الفضل في الحديث: «لم يضره شيء»، وعند أبي داود: «لم تصبه فجأة بلاء».",
        "The hadith's wording of the virtue is «لم يضره شيء» (nothing harms him); Abū Dāwūd has «لم تصبه فجأة بلاء».",
      ),
    ],
  },
  bika: {
    verdict: "sahih",
    takhrij: "رواه الترمذي (3391) وأبو داود (5068)، وصححه الألباني",
    reason: L(
      "حديث أبي هريرة. ورجّح ابن القيم أن المحفوظ «وإليك النشور» في الصباح و«وإليك المصير» في المساء، وهو المذكور هنا.",
      "Abū Hurayrah's hadith. Ibn al-Qayyim judged «النشور» in the morning and «المصير» in the evening the best-preserved wording, which is what's shown here.",
    ),
    rulings: [
      r(S.albani, "صحيح (صحيح الترمذي 3391)", "Ṣaḥīḥ (Ṣaḥīḥ al-Tirmidhī 3391)"),
      r(S.ibnBaz, "إسناده صحيح (مجموع الفتاوى 26/27)", "Isnād ṣaḥīḥ (Majmūʿ 26/27)"),
      r(S.nawawi, "إسناده صحيح", "Isnād ṣaḥīḥ"),
    ],
  },
  fitrah: {
    verdict: "sahih",
    takhrij: "رواه أحمد (15360)، وصححه الألباني في الصحيحة (2989) وابن باز",
    reason: L(
      "حديث عبد الرحمن بن أبزى، وذِكر المساء في رواية أبي بن كعب. ولفظ «وعلى دين نبينا محمد» ثابت في رواية أحمد.",
      "ʿAbd al-Raḥmān ibn Abzā's hadith; the evening is in Ubayy ibn Kaʿb's narration. The wording «وعلى دين نبينا محمد» is in Aḥmad's text.",
    ),
    rulings: [
      r(S.albani, "صحيح (الصحيحة 2989، صحيح الجامع 4674)", "Ṣaḥīḥ (al-Ṣaḥīḥah 2989; Ṣaḥīḥ al-Jāmiʿ 4674)"),
      r(S.ibnBaz, "صحيح (مجموع الفتاوى 26/33)", "Ṣaḥīḥ (Majmūʿ 26/33)"),
      r(S.arnaut, "إسناده صحيح على شرط الشيخين", "Ṣaḥīḥ on the conditions of al-Bukhārī and Muslim"),
      r(S.ibnHajar, "حسن", "Ḥasan"),
    ],
  },
  adada: {
    verdict: "sahih",
    takhrij: "رواه مسلم (2726)",
    reason: L(
      "حديث جويرية: قالها النبي ﷺ ثلاث مرات بعد صلاة الفجر.",
      "Juwayriyah's hadith: the Prophet ﷺ said these words three times after Fajr.",
    ),
    rulings: [r(S.muslim, "في صحيح مسلم", "In Ṣaḥīḥ Muslim")],
    notes: [
      L(
        "الحديث يقيده بالصباح، ولم يرد ذكره في المساء.",
        "The hadith ties it to the morning; no narration places it in the evening.",
      ),
    ],
  },
  afini: {
    verdict: "sahih",
    takhrij: "رواه أبو داود (5090)، وحسنه الألباني وابن حجر",
    reason: L(
      "«اللهم عافني في بدني…» و«اللهم إني أعوذ بك من الكفر والفقر…» حديث واحد عن أبي بكرة، وفي آخره: «تعيدها ثلاثا حين تصبح وثلاثا حين تمسي». وفي إسناده جعفر بن ميمون وفيه لين.",
      "«اللهم عافني في بدني…» and «اللهم إني أعوذ بك من الكفر والفقر…» are one hadith of Abū Bakrah, ending «repeat them three times in the morning and three in the evening». One narrator, Jaʿfar ibn Maymūn, is considered soft.",
    ),
    rulings: [
      r(S.albani, "إسناده حسن (صحيح أبي داود 5090، صحيح الأدب المفرد 542)، وضعفه في ضعيف الجامع (1210)", "Isnād ḥasan (Ṣaḥīḥ Abī Dāwūd 5090; Ṣaḥīḥ al-Adab al-Mufrad 542), though he weakened it in Ḍaʿīf al-Jāmiʿ 1210"),
      r(S.ibnHajar, "حسن", "Ḥasan"),
      r(S.ibnBaz, "حسن", "Ḥasan"),
    ],
  },
  afw: {
    verdict: "sahih",
    takhrij: "رواه أبو داود (5074) وابن ماجه (3871)، وصححه الألباني",
    reason: L(
      "حديث ابن عمر: لم يكن رسول الله ﷺ يدع هؤلاء الدعوات حين يمسي وحين يصبح.",
      "Ibn ʿUmar: the Prophet ﷺ never left these words in the evening and the morning.",
    ),
    rulings: [
      r(S.albani, "صحيح (صحيح الترغيب 659)", "Ṣaḥīḥ (Ṣaḥīḥ al-Targhīb 659)"),
      r(S.nawawi, "صحيح", "Ṣaḥīḥ"),
      r(S.arnaut, "إسناده صحيح", "Isnād ṣaḥīḥ"),
      r(S.shakir, "صحيح", "Ṣaḥīḥ"),
    ],
  },
  "ya-hayy": {
    verdict: "sahih",
    takhrij: "رواه النسائي في الكبرى (10405) والحاكم (2000)، وحسنه الألباني في صحيح الجامع (5820)",
    reason: L(
      "أوصى به النبي ﷺ فاطمة: «أن تقولي إذا أصبحت وإذا أمسيت».",
      "The Prophet ﷺ told Fāṭimah to say it in the morning and the evening.",
    ),
    rulings: [
      r(S.albani, "حسن (صحيح الجامع 5820)", "Ḥasan (Ṣaḥīḥ al-Jāmiʿ 5820)"),
      r(S.hakim, "صحيح", "Ṣaḥīḥ"),
      r(S.mundhiri, "إسناده صحيح", "Isnād ṣaḥīḥ"),
    ],
    notes: [L("لم يرد في الحديث عدد، فيكفي أن يقال مرة واحدة.", "The hadith gives no count; saying it once is enough.")],
  },
  "alim-ghayb": {
    verdict: "sahih",
    takhrij: "رواه أبو داود (5067) والترمذي (3392، 3529)، وصححه الألباني",
    reason: L(
      "علّمه النبي ﷺ أبا بكر: «قله إذا أصبحت وإذا أمسيت وإذا أخذت مضجعك». وزيادة «وأن أقترف على نفسي سوءا…» ثابتة في رواية أخرى (الترمذي 3529).",
      "The Prophet ﷺ taught it to Abū Bakr for the morning, the evening and bedtime. The ending «وأن أقترف على نفسي سوءا…» is in another authentic narration (al-Tirmidhī 3529).",
    ),
    rulings: [
      r(S.tirmidhi, "حسن صحيح", "Ḥasan ṣaḥīḥ"),
      r(S.albani, "صحيح", "Ṣaḥīḥ"),
      r(S.ibnQayyim, "صحيح", "Ṣaḥīḥ"),
    ],
  },
  kalimat: {
    verdict: "sahih",
    takhrij: "رواه مسلم (2709) والترمذي (3604)، وصححه الألباني في صحيح الترغيب (652)",
    reason: L(
      "ثابت في المساء ثلاثا: «من قال حين يمسي ثلاث مرات… لم تضره حُمة تلك الليلة».",
      "Authentic for the evening, three times: no sting harms him that night.",
    ),
    rulings: [
      r(S.muslim, "في صحيح مسلم (في المساء)", "In Ṣaḥīḥ Muslim (evening)"),
      r(S.albani, "صحيح (صحيح الترغيب 652)", "Ṣaḥīḥ (Ṣaḥīḥ al-Targhīb 652)"),
      r(S.ibnBaz, "إسناده حسن (مجموع الفتاوى 26/32)", "Isnād ḥasan (Majmūʿ 26/32)"),
      r(S.ibnHajar, "رواية الصباح «لها أصل» فقط (نتائج الأفكار 2/360)", "The morning narration only «has a basis» (Natāʾij 2/360)"),
    ],
    notes: [
      L(
        "الأحاديث تذكر المساء، وروايته في الصباح ضعيفة السند.",
        "The hadiths name the evening; the morning narration has only weak support.",
      ),
    ],
  },
  shirk: {
    verdict: "sahih",
    takhrij: "رواه أحمد (19606)، وحسنه لغيره الألباني في صحيح الترغيب (36)",
    reason: L(
      "دعاء ثابت من حديث أبي موسى، لكن لم يرد في شيء من رواياته تقييده بالصباح والمساء.",
      "An authentic duʿāʾ from Abū Mūsā's hadith, but no narration ties it to the morning or evening.",
    ),
    rulings: [
      r(S.albani, "حسن لغيره (صحيح الترغيب 36)، ولفظ قريب صحيح (صحيح الأدب المفرد 551)", "Ḥasan li-ghayrih (Ṣaḥīḥ al-Targhīb 36); a related wording ṣaḥīḥ (Ṣaḥīḥ al-Adab al-Mufrad 551)"),
      r(S.musnadEditors, "إسناده وحده ضعيف (أبو علي الكاهلي مجهول)", "Weak chain alone (Abū ʿAlī al-Kāhilī is unknown)"),
    ],
    notes: [
      L(
        "ليس من أذكار الصباح والمساء، والتكرار ثلاثا في رواية أضعف.",
        "Not a morning or evening dhikr, and saying it three times rests on a weaker narration.",
      ),
    ],
  },
  hamm: {
    verdict: "sahih",
    takhrij: "أصله في البخاري (6363)، وتقييده بالصباح والمساء رواه أبو داود (1555) وضعفه الألباني",
    reason: L(
      "كان النبي ﷺ يكثر من هذا الدعاء (البخاري). وإنما ورد تقييده بالصباح والمساء في رواية أبي سعيد في قصة أبي أمامة، وضعفها الألباني والأرناؤوط.",
      "The Prophet ﷺ often made this duʿāʾ (al-Bukhārī). Only Abū Saʿīd's narration about Abū Umāmah ties it to morning and evening, and al-Albānī and al-Arnaʾūṭ weaken it.",
    ),
    rulings: [
      r(S.bukhari, "الدعاء نفسه في صحيح البخاري", "The duʿāʾ itself is in Ṣaḥīḥ al-Bukhārī"),
      r(S.albani, "رواية الصباح والمساء ضعيفة (ضعيف أبي داود 1555)", "The morning/evening narration is weak (Ḍaʿīf Abī Dāwūd 1555)"),
      r(S.arnaut, "إسناده ضعيف", "Weak chain"),
      r(S.mundhiri, "قبله", "Accepted it"),
    ],
    notes: [
      L(
        "تقييده بالصباح والمساء ضعيف، ولم يرد فيه عدد.",
        "Its link to the morning and evening is weak, and no narration gives a count.",
      ),
    ],
  },
  "astaghfir-azim": {
    verdict: "sahih",
    takhrij: "رواه أبو داود (1517) والترمذي (3577) وصححه الألباني، وليس مقيدا بالصباح والمساء",
    reason: L(
      "ثابت، وثبت تكراره ثلاثا: «غُفر له وإن كان فرّ من الزحف». أما الروايات التي تقيده ببعد الفجر أو عند النوم فضعيفة.",
      "Authentic, including saying it three times: he is forgiven even if he fled the battlefield. The narrations that set it after Fajr or at bedtime are weak.",
    ),
    rulings: [
      r(S.albani, "صحيح (صحيح أبي داود 1517)، والتكرار ثلاثا صحيح (الصحيحة 2727)", "Ṣaḥīḥ (Ṣaḥīḥ Abī Dāwūd 1517); ×3 ṣaḥīḥ (al-Ṣaḥīḥah 2727)"),
      r(S.mundhiri, "إسناده جيد متصل", "Isnād jayyid muttaṣil"),
      r(S.ibnBaz, "رواية الثلاث عند النوم ضعيفة ومتنها منكر", "The bedtime ×3 version is weak and its text munkar"),
    ],
    notes: [L("ذكر ثابت عام، غير مقيد بالصباح والمساء.", "An authentic general dhikr, not tied to the morning or evening.")],
  },
  tahlil: {
    verdict: "sahih",
    takhrij: "متفق عليه: البخاري (3293) ومسلم (2691)، وفيه: في يوم مائة مرة",
    reason: L(
      "في الحديث: «من قال… في يوم مائة مرة… وكانت له حرزا من الشيطان يومه ذلك حتى يمسي»، فالأفضل قولها أول النهار. وثبت قولها مرة وعشرا في الصباح في روايات أخرى.",
      "The hadith says a hundred times in a day, a protection from Shayṭān that day until evening, so it is best said early in the day. Saying it once or ten times in the morning is in other authentic narrations.",
    ),
    rulings: [r(S.bukhariMuslim, "في الصحيحين (أبو هريرة)", "In both Ṣaḥīḥs (Abū Hurayrah)")],
  },
  tasbih: {
    verdict: "sahih",
    takhrij: "رواه مسلم (2692)، و«حطت خطاياه» عند البخاري (6405)",
    reason: L(
      "عند مسلم: «من قال حين يصبح وحين يمسي: سبحان الله وبحمده مائة مرة، لم يأت أحد يوم القيامة بأفضل مما جاء به…»، وعند البخاري: «من قال في يوم مائة مرة حطت خطاياه وإن كانت مثل زبد البحر».",
      "Muslim has the morning and evening ×100 with «no one brings anything better on the Day of Resurrection»; al-Bukhārī has ×100 in a day, sins forgiven even if like the foam of the sea.",
    ),
    rulings: [
      r(S.muslim, "الصباح والمساء مائة مرة", "Morning and evening ×100"),
      r(S.bukhari, "في يوم مائة مرة", "×100 in a day"),
    ],
  },
  istighfar: {
    verdict: "sahih",
    takhrij: "رواه ابن ماجه (3815) وصححه الألباني، وأصله في مسلم (2702)؛ وفي الصباح رواه النسائي في الكبرى (10275) وصححه الألباني في الصحيحة (1600)",
    reason: L(
      "كان النبي ﷺ يستغفر الله ويتوب إليه في اليوم مائة مرة. وفي حديث أبي موسى: «ما أصبحت غداة قط إلا استغفرت الله فيها مائة مرة».",
      "The Prophet ﷺ sought forgiveness a hundred times a day. Abū Mūsā's narration «I never entered a morning without seeking Allah's forgiveness a hundred times» places it in the morning.",
    ),
    rulings: [
      r(S.albani, "حسن صحيح (صحيح ابن ماجه 3091)، ورواية الصباح صحيحة (الصحيحة 1600)", "Ḥasan ṣaḥīḥ (Ṣaḥīḥ Ibn Mājah 3091); the morning narration ṣaḥīḥ (al-Ṣaḥīḥah 1600)"),
      r(S.muslim, "مائة مرة في اليوم", "A hundred times a day"),
    ],
    notes: [
      L(
        "الفضل المذكور هنا («مائة حسنة… حرزا من الشيطان») هو فضل «لا إله إلا الله وحده لا شريك له…» مائة مرة، لا فضل الاستغفار.",
        "The virtue shown here («مائة حسنة… حرزا من الشيطان») belongs to «لا إله إلا الله وحده لا شريك له…» a hundred times, not to istighfār.",
      ),
    ],
  },
};

export const gradings: Record<string, Grading> = Object.fromEntries(
  Object.entries(base).map(([key, g]) => [key, { ...g, links: [...(sources[key] ?? []), ...(links[key] ?? [])] }]),
);
