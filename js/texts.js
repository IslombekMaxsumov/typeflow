/* Texts to type, in the three text languages (separate from the interface
   language). Common words, folk proverbs (public domain, no author) and the
   practice lessons. Uzbek is Latin with plain apostrophes (o', g'), so it can
   be typed on any keyboard. */
window.TEXTS = {
  words: {
    en: ("the be of and a to in he have it that for they with as not on she at by this we you do but from or which one would all will " +
      "there say who make when can more if no man out other so what time up go about than into could state only new year some take come " +
      "these know see use get like then first any work now may such give over think most even find day also after way many must look before " +
      "great back through long where much should well people down own just because good each those feel seem how high too place little world " +
      "very still nation hand old life tell write become here show house both between need mean call develop under last right move thing " +
      "general school never same another begin while number part turn real leave might want point form off child few small since against " +
      "ask late home interest large person end open public follow during present without again hold around possible head consider word " +
      "program problem however lead system set order eye plan run keep face fact group play stand increase early course change help line " +
      "city water light night morning river family friend teacher student music garden window paper money market reason simple future").split(" "),
    ru: ("и в не на я быть он с что а по это она этот к но они мы как из у который то за свой весь год от так о для ты же все тот мочь вы " +
      "человек такой его сказать только или ещё бы себя один уже до время если сам когда другой вот говорить наш мой знать стать при чтобы " +
      "дело жизнь кто первый очень два день её новый рука даже во со раз где там под можно ну какой после их работа без самый потом надо " +
      "хотеть ли слово идти большой должен место иметь ничто сейчас тут лицо каждый друг нет теперь ни глаз тоже тогда видеть вопрос через " +
      "да здесь дом город сила думать нужно спросить ребёнок понимать вода земля конец книга школа утро вечер ночь улица дорога окно хлеб " +
      "чай мать отец брат сестра солнце небо ветер снег лес море река поле гора всё учитель студент музыка семья окно деньги рынок причина " +
      "простой будущий светлый тихий быстрый жёлтый зелёный синий красный белый чёрный сегодня завтра вчера всегда иногда").split(" "),
    uz: ("va bu bir men sen u biz siz ular nima qanday qayerda kim bilan uchun ham emas bor yo'q katta kichik yaxshi yomon yangi eski kun tun " +
      "ertalab kechqurun bugun ertaga kecha yil oy hafta soat vaqt odam bola ota ona aka uka opa singil do'st uy maktab kitob daftar qalam suv " +
      "non choy osh meva olma uzum anor qovun tarvuz shahar qishloq ko'cha yo'l mashina avtobus poyezd tog' daryo dengiz osmon quyosh yulduz " +
      "shamol qor yomg'ir bahor yoz kuz qish ish o'qish yozish o'qituvchi talaba til so'z gap savol javob ha rahmat salom xayr kel ket ol " +
      "ber qil ko'r eshit ayt bil ishla o'yna yugur tur o'tir ich ye sev o'yla tushun yordam baxt sevgi go'zal tez sekin oson qiyin issiq " +
      "sovuq uzun qisqa oq qora qizil yashil ko'k sariq bog' gul daraxt qush ot it mushuk bozor pul narx ovqat dasturxon mehmon qo'shiq " +
      "musiqa rasm o'yin sport futbol g'alaba dunyo vatan xalq tarix kelajak orzu fikr ilm bilim").split(" "),
  },
  sentences: {
    en: [
      "Practice makes perfect.", "Actions speak louder than words.", "Slow and steady wins the race.",
      "Where there is a will, there is a way.", "The early bird catches the worm.", "Rome was not built in a day.",
      "Knowledge is power.", "Better late than never.", "Every journey begins with a single step.",
      "Time and tide wait for no man.", "A rolling stone gathers no moss.", "Do not judge a book by its cover.",
      "Two heads are better than one.", "Honesty is the best policy.", "Look before you leap.",
      "Fortune favours the bold.", "All good things come to those who wait.", "When in Rome, do as the Romans do.",
      "Necessity is the mother of invention.", "The pen is mightier than the sword.", "Many hands make light work.",
      "An apple a day keeps the doctor away.", "Still waters run deep.", "Every cloud has a silver lining.",
    ],
    ru: [
      "Без труда не выловишь и рыбку из пруда.", "Тише едешь - дальше будешь.", "Век живи - век учись.",
      "Не откладывай на завтра то, что можно сделать сегодня.", "Под лежачий камень вода не течёт.",
      "Семь раз отмерь, один раз отрежь.", "Друзья познаются в беде.", "Делу время, потехе час.",
      "Ученье свет, а неученье тьма.", "Повторение - мать учения.", "Лучше поздно, чем никогда.",
      "Не имей сто рублей, а имей сто друзей.", "Терпение и труд всё перетрут.", "Сделал дело - гуляй смело.",
      "Слово не воробей, вылетит - не поймаешь.", "Глаза боятся, а руки делают.", "Москва не сразу строилась.",
      "Кончил дело - гуляй смело.", "Старый друг лучше новых двух.", "Знание - сила.",
      "Утро вечера мудренее.", "Цыплят по осени считают.", "Готовь сани летом, а телегу зимой.", "Всякому овощу своё время.",
    ],
    uz: [
      "Ilm olish igna bilan quduq qazishdek.", "Tomchi-tomchi ko'l bo'lur.", "Mehnat qilsang, rohat ko'rasan.",
      "Daraxt mevasidan, odam mehnatidan bilinadi.", "Yaxshi so'z jon ozig'i.", "Sabr tagi sariq oltin.",
      "Bilagi zo'r birni yiqar, bilimi zo'r mingni yiqar.", "O'qigan o'zar, o'qimagan to'zar.", "Vaqt oltindan qimmat.",
      "Do'st boshga qaraydi, dushman oyoqqa.", "Kitob bilim manbai.", "Ko'p o'qigan ko'p biladi.",
      "Ishning boshi qiyin.", "Til qilichdan o'tkir.", "Hunar - hunardan unar.",
      "Ota-onang qadrini bil.", "Oz-oz o'rganib dono bo'lur.", "Birlashgan o'zar, birlashmagan to'zar.",
      "Ertangi ishni bugun qil.", "Yaxshidan bog' qoladi, yomondan dog'.", "Avval o'yla, keyin so'yla.",
      "Ko'rpangga qarab oyoq uzat.", "Odobni odobsizdan o'rgan.", "Yer haydasang kuzda, don olasan yozda.",
    ],
  },
};

/* Keyboard layouts for the practice keyboard (rows of keys, lowercase).
   The Uzbek apostrophe (o', g') is the key to the right of L. */
window.KEYBOARDS = {
  latin: ["1234567890", "qwertyuiop", "asdfghjkl'", "zxcvbnm,."],
  cyrillic: ["ё1234567890", "йцукенгшщзхъ", "фывапролджэ", "ячсмитьбю."],
};

/* Practice lessons: six per language, in this order: home row, top row,
   bottom row, special letters, numbers, common words.
   letters: the keys a drill uses (it builds short pseudo-words from them)
   words: "common" or "special" (real words matching `pattern`) or "caps"
   (capitals and punctuation, for English). */
window.LESSONS = [
  { id: "uz-home", lang: "uz", keyboard: "latin", key: "home", letters: "asdfghjkl" },
  { id: "uz-top", lang: "uz", keyboard: "latin", key: "top", letters: "qwertyuiop" },
  { id: "uz-bottom", lang: "uz", keyboard: "latin", key: "bottom", letters: "zxcvbnm" },
  { id: "uz-special", lang: "uz", keyboard: "latin", key: "uzSpecial", words: "special", pattern: "o'|g'|sh|ch" },
  { id: "uz-numbers", lang: "uz", keyboard: "latin", key: "numbers", letters: "0123456789" },
  { id: "uz-words", lang: "uz", keyboard: "latin", key: "words", words: "common" },
  { id: "ru-home", lang: "ru", keyboard: "cyrillic", key: "home", letters: "фывапролдж" },
  { id: "ru-top", lang: "ru", keyboard: "cyrillic", key: "top", letters: "йцукенгшщз" },
  { id: "ru-bottom", lang: "ru", keyboard: "cyrillic", key: "bottom", letters: "ячсмитьбю" },
  { id: "ru-special", lang: "ru", keyboard: "cyrillic", key: "ruSpecial", words: "special", pattern: "ё|й|щ|ы|ъ|ь|э|ю" },
  { id: "ru-numbers", lang: "ru", keyboard: "cyrillic", key: "numbers", letters: "0123456789" },
  { id: "ru-words", lang: "ru", keyboard: "cyrillic", key: "words", words: "common" },
  { id: "en-home", lang: "en", keyboard: "latin", key: "home", letters: "asdfghjkl" },
  { id: "en-top", lang: "en", keyboard: "latin", key: "top", letters: "qwertyuiop" },
  { id: "en-bottom", lang: "en", keyboard: "latin", key: "bottom", letters: "zxcvbnm" },
  { id: "en-special", lang: "en", keyboard: "latin", key: "enSpecial", words: "caps" },
  { id: "en-numbers", lang: "en", keyboard: "latin", key: "numbers", letters: "0123456789" },
  { id: "en-words", lang: "en", keyboard: "latin", key: "words", words: "common" },
];
