import { useCallback, useRef, useState, useEffect } from "react";

const STORAGE_KEY = "podcast-voice-settings";
const VOICE_CACHE_KEY = "tts-voice-cache";

// Known authentic Indian voices by provider - prioritize these for authentic Indian sound
const INDIAN_VOICE_PRIORITY: Record<string, string[]> = {
  hi: ["Heera", "Hemant", "Kalpana", "Lekha", "Swara", "Aditi", "Ravi", "Sapna", "Neerja"],
  mr: ["Aishwarya", "Sakhi", "Nachiket", "Aarohi"],
  gu: ["Dhwani", "Nishtha", "Niranjan"],
  ta: ["Valluvar", "Pallavi", "Vani", "Shruti"],
  te: ["Chitra", "Mohan", "Shruti", "Shruthi"],
  bn: ["Tanishaa", "Bashkar", "Bondita"],
  kn: ["Sapna", "Gagan"],
  ml: ["Sobhana", "Midhun"],
  pa: ["Harleen", "Harjinder"],
  or: ["Subhadra", "Subhasini"],
  as: ["Pahi", "Priyom"],
};

// Devanagari script languages that need special punctuation handling
const DEVANAGARI_LANGUAGES = ['hi', 'mr', 'sa', 'ne', 'kok'];
const INDIC_LANGUAGES = ['hi', 'mr', 'gu', 'bn', 'pa', 'or', 'as', 'ta', 'te', 'kn', 'ml'];

interface VoiceSettings {
  host1VoiceName: string;
  host2VoiceName: string;
  host1Pitch: number;
  host2Pitch: number;
  host1Rate: number;
  host2Rate: number;
}

interface WebSpeechOptions {
  speaker?: "host1" | "host2";
  rate?: number;
  pitch?: number;
  language?: string;
  voiceName?: string; // Explicit voice name to use (from dropdown selection)
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

// Prepare text for natural speech with pauses - makes it sound human-like
const prepareTextForSpeech = (text: string, language: string): string => {
  let prepared = text;
  
  // Add longer pauses after sentences for human-like pacing (like Hindi voice)
  prepared = prepared.replace(/\. /g, '. ... ');
  prepared = prepared.replace(/! /g, '! ... ');
  prepared = prepared.replace(/\? /g, '? ... ');
  
  // Add pauses after commas for smoother word-by-word reading (all languages)
  prepared = prepared.replace(/,\s+/g, ', ... ');
  
  // Add pause after colons and semicolons for better pacing
  prepared = prepared.replace(/:\s+/g, ': ... ');
  prepared = prepared.replace(/;\s+/g, '; ... ');
  
  // Add pauses around dashes for natural reading
  prepared = prepared.replace(/[-–—]\s*/g, ' ... ');
  
  // For Devanagari languages, handle Indian punctuation (purna viram)
  if (DEVANAGARI_LANGUAGES.includes(language)) {
    // Pause after purna viram (full stop) ।
    prepared = prepared.replace(/।\s*/g, '। ... ');
    // Pause after double danda ॥
    prepared = prepared.replace(/॥\s*/g, '॥ ... ');
  }
  
  return prepared;
};

// Language code to BCP 47 language tag mapping
const LANGUAGE_TAGS: Record<string, string> = {
  en: "en-US",
  hi: "hi-IN",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  pt: "pt-BR",
  ja: "ja-JP",
  zh: "zh-CN",
  ko: "ko-KR",
  ar: "ar-SA",
  ta: "ta-IN",
  te: "te-IN",
  bn: "bn-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  or: "or-IN",
  as: "as-IN",
  ks: "ks-IN",
  ru: "ru-RU",
  it: "it-IT",
  nl: "nl-NL",
  pl: "pl-PL",
  tr: "tr-TR",
  vi: "vi-VN",
  th: "th-TH",
  id: "id-ID",
};

// Extended voice patterns for different languages - IMPROVED for gender detection
const VOICE_PATTERNS: Record<string, { male: RegExp; female: RegExp }> = {
  // English - Comprehensive male patterns
  en: {
    male: /\b(david|james|daniel|mark|paul|tom|george|matthew|arthur|henry|alex|aaron|adam|brian|chris|eric|fred|john|kevin|michael|peter|richard|robert|william|guy|male|man|conrad|florian|jan|stefan|hans|markus|andreas|thomas|oliver|charles|edward|jack|jacob|joseph|ryan|sean|stephen|timothy|andrew|anthony|benjamin|brandon|christopher|derek|donald|douglas|ethan|gabriel|gregory|harold|howard|ian|jason|jeffrey|jeremy|jonathan|justin|kenneth|larry|lawrence|leonard|marcus|martin|nathan|nicholas|patrick|phillip|ralph|raymond|roger|ronald|russell|samuel|scott|shawn|simon|stanley|theodore|victor|walter|wayne|zachary)\b/i,
    female: /\b(samantha|karen|victoria|fiona|moira|susan|zira|hazel|emma|alice|kate|linda|lisa|mary|nancy|rachel|sarah|tessa|amy|catherine|emily|jessica|jennifer|nicole|olivia|female|woman|vicki|anna|marlene|petra|sabine|katja|julia|claudia|allison|ava|joana|paulina|monica|lucia|amelie|celine|aurelie|sara|amanda|angela|ashley|barbara|betty|brenda|carol|carolyn|christina|cynthia|danielle|deborah|diana|donna|dorothy|elizabeth|eva|evelyn|frances|gloria|grace|heather|helen|irene|jacqueline|janet|janice|jean|joyce|judith|judy|julia|julie|karen|katherine|kathleen|kelly|kimberly|laura|lauren|lori|louise|margaret|maria|marie|martha|melissa|michelle|mildred|pamela|patricia|paula|rebecca|rita|rose|ruby|ruth|sandra|sharon|shirley|sophia|stephanie|teresa|theresa|tiffany|virginia|wanda)\b/i,
  },
  // Hindi - Male vs Female patterns
  hi: {
    male: /\b(ravi|amit|arun|krishna|raj|sanjay|hemant|madhur|prabhat|arvind|vijay|prakash|suresh|mahesh|kiran|male|man|rohan|arjun|deepak|gaurav|manish|nikhil|rahul|sachin|siddharth|vikram|akash|ankit|ashish|bharat|chetan|dinesh|ganesh|girish|harsh|hitesh|jatin|lalit|manoj|mukesh|naresh|nilesh|pankaj|rajesh|rakesh|ramesh|ritesh|rohit|sandeep|satish|shailesh|sunil|tushar|umesh|varun|yogesh)\b/i,
    female: /\b(lekha|aditi|neerja|swara|priya|anita|sunita|kavita|meera|lakshmi|sneha|divya|anjali|pooja|neha|female|woman|heera|kalpana|aarti|archana|asha|bhavna|chitra|deepika|ekta|garima|geeta|isha|jaya|jyoti|kiran|komal|lalita|madhuri|mamta|manisha|meenakshi|monika|namita|nandini|nidhi|nikita|nisha|pallavi|poonam|preeti|priyanka|radha|renu|rina|ritu|rupa|sakshi|sangeeta|sapna|sarita|seema|shikha|shilpa|shruti|simran|sonia|sujata|sunaina|sushma|tanvi|tara|varsha|vidya)\b/i,
  },
  // Tamil
  ta: {
    male: /\b(kumar|rajan|murali|prakash|vijay|ganesh|valluvar|muthu|male|man|arun|bala|chandra|deva|gopi|hari|karthik|mani|raja|ravi|senthil|siva|suresh|vasu)\b/i,
    female: /\b(vani|veena|priya|lakshmi|devi|meena|pallavi|female|woman|anu|bhavani|chitra|geetha|jaya|kala|lalitha|malathi|nandini|padma|radha|rani|saroja|selvi|shanthi|sita|sudha|usha|vasanthi)\b/i,
  },
  // Telugu
  te: {
    male: /\b(ravi|krishna|vijay|prasad|venkat|mohan|male|man|anil|bhaskar|gopal|hari|kiran|murthy|naidu|pavan|prakash|rajesh|ramesh|sandeep|satish|suresh|vamsi)\b/i,
    female: /\b(lakshmi|priya|devi|swathi|madhavi|shruti|female|woman|anuradha|bhavani|chitra|divya|geetha|jyothi|kavitha|lalitha|padma|radha|rani|sita|sudha|sunitha|uma|vasantha)\b/i,
  },
  // Bengali
  bn: {
    male: /\b(tanmoy|arnab|raj|amit|bashkar|male|man|arijit|bikash|debashish|dipankar|gautam|indrajit|jayanta|kartik|malay|niloy|partha|prasenjit|ranjan|sanjib|shubham|soumya|suman|sunil|tapan)\b/i,
    female: /\b(tanishaa|ria|priya|anjali|bondita|female|woman|aditi|anindita|arundhati|barnali|bidisha|chitra|debika|gargi|indrani|jayashree|joyeeta|kakali|lopamudra|madhabi|mallika|mitali|mousumi|nandini|paromita|poulami|rimjhim|rupa|sangita|sharmila|sonali|suchitra|sunanda|swapna|tanushree|ujjayini)\b/i,
  },
  // Marathi
  mr: {
    male: /\b(aaditya|rahul|amit|nachiket|male|man|ajay|anil|ashok|deepak|ganesh|girish|mahesh|manoj|milind|nikhil|pramod|prashant|rajendra|sachin|sanjay|satish|shashank|shivaji|sunil|tushar|vijay|vinayak|vishwas)\b/i,
    female: /\b(aishwarya|sakhi|priya|aarohi|female|woman|anjali|archana|ashwini|bharati|chitra|deepa|gauri|jyoti|kalyani|kavita|madhavi|manisha|meera|neha|pooja|pradnya|priyanka|rashmi|rupali|sadhana|sangeeta|shilpa|shruti|smita|sonali|sujata|sunanda|swati|vaishali|vandana)\b/i,
  },
  // Gujarati
  gu: {
    male: /\b(dhruv|ketan|jay|niranjan|male|man|anil|bharat|chirag|darshan|gaurav|haresh|hitesh|jignesh|kamlesh|mahesh|manish|mehul|mukesh|naresh|paresh|prakash|pranav|rajesh|rakesh|sandip|suresh|tushar|umesh|vipul|vishal)\b/i,
    female: /\b(dhwani|nishtha|priya|hemant|female|woman|anjali|bhavna|chitra|darshana|dipika|gita|heena|jigisha|jyoti|kalpana|komal|leela|mamta|meera|neelam|nidhi|pooja|rekha|reshma|sangeeta|sonal|swati|trupti|usha|varsha|vidya)\b/i,
  },
  // Kannada
  kn: {
    male: /\b(suresh|ramesh|prakash|gagan|male|man|anil|ashok|basavaraj|chandrashekhar|deepak|ganesh|girish|krishna|kumar|mahesh|manjunath|murthy|nagaraj|praveen|raghav|rajesh|sanjay|satish|shivakumar|sunil|venkatesh|vinay|vishwanath)\b/i,
    female: /\b(sapna|gagan|priya|female|woman|anuradha|bhavani|chitra|deepa|geetha|jayashree|jyothi|kavitha|lakshmi|madhavi|meera|nagalakshmi|padma|poornima|radha|rashmi|rekha|shantha|shobha|sita|sudha|sunitha|swarna|uma|vasantha)\b/i,
  },
  // Malayalam
  ml: {
    male: /\b(midhun|sreejith|arun|male|man|anand|biju|dileep|gopakumar|hari|jayakumar|krishnan|manoj|mohanlal|murali|pradeep|rajan|rajesh|ramesh|santhosh|satheesh|sreekumar|sunil|unnikrishnan|vijay|vinod)\b/i,
    female: /\b(sobhana|anjali|priya|female|woman|ammu|aswathy|bhavana|chithra|deepa|geetha|jayalakshmi|jyothi|kavitha|lakshmi|meera|nandini|padma|parvathy|radha|revathi|saritha|shobha|sreevidya|sudha|sunitha|usha|vasantha)\b/i,
  },
  // Punjabi
  pa: {
    male: /\b(harjinder|amardeep|singh|male|man|ajit|baljit|davinder|gurmeet|gurpreet|harpreet|jagjit|jasveer|kuldeep|mandeep|manpreet|navjot|paramjit|parminder|rajinder|ranveer|satinder|sukhdev|surinder)\b/i,
    female: /\b(harleen|amarjeet|kaur|female|woman|amandeep|baljeet|gurleen|harpreet|jaspreet|kulwinder|manpreet|navneet|parminder|preet|rajwinder|randeep|satwinder|simran|sukhjeet|surinder)\b/i,
  },
  // Odia
  or: {
    male: /\b(manoranjan|subrat|male|man|ajay|ananta|ashok|biswajit|debasis|ganesh|girish|jagannath|manoj|nilakantha|prasanna|prashant|rajesh|sanjay|satya|subhash|suresh|tushar)\b/i,
    female: /\b(subhasini|sukanya|female|woman|anjali|annapurna|archana|binodini|chandra|gitanjali|jyotirmayee|kalpana|lopamudra|madhusmita|manjulata|mitali|nandini|priyanka|rashmi|sangita|sasmita|sujata|sunanda)\b/i,
  },
  // Assamese
  as: {
    male: /\b(bishnu|male|man|ankur|bhaskar|chandan|debajit|dilip|gautam|hemanta|jayanta|kamal|madhab|manoj|nabajyoti|partha|pranjal|ranjan|rupam|sanjib|satya|subham|sunil|tapan)\b/i,
    female: /\b(priyom|female|woman|aditi|anjali|bandita|barnali|barsha|bidisha|bobita|garima|gitanjali|jolly|juri|madhusmita|mousumi|nilakshi|pahi|pallavi|priyanka|rashmi|sangita|sonali|suchitra|sunita)\b/i,
  },
  // Spanish
  es: {
    male: /\b(jorge|diego|pablo|carlos|andres|miguel|juan|antonio|enrique|male|man|alberto|alejandro|alfonso|angel|arturo|benito|bernardo|cesar|daniel|eduardo|emilio|ernesto|esteban|federico|fernando|francisco|gerardo|gonzalo|guillermo|hector|ignacio|javier|jesus|jose|julio|lorenzo|luis|manuel|marco|mario|martin|mauricio|oscar|pedro|rafael|ramon|raul|ricardo|roberto|rodolfo|ruben|salvador|sergio|vicente)\b/i,
    female: /\b(lucia|elena|isabela|carmen|rosa|maria|ana|sofia|laura|monica|female|woman|adriana|alejandra|alicia|amelia|andrea|angelica|beatriz|blanca|carolina|catalina|cecilia|claudia|cristina|daniela|diana|dolores|elena|elisa|emilia|esperanza|estela|eva|fernanda|gabriela|gloria|graciela|guadalupe|ines|irene|isabel|josefina|julia|leticia|lourdes|lucia|luisa|margarita|martha|mercedes|miriam|natalia|olga|patricia|paula|raquel|rebeca|regina|rocio|sandra|silvia|susana|teresa|valentina|veronica|victoria|yolanda)\b/i,
  },
  // French
  fr: {
    male: /\b(thomas|henri|pierre|jean|louis|nicolas|mathieu|olivier|male|man|alain|alexandre|antoine|arnaud|bernard|charles|christophe|claude|damien|denis|didier|dominique|emmanuel|eric|etienne|fabien|florian|francois|frederic|gerard|guillaume|guy|hugo|jacques|jerome|joel|julien|laurent|lionel|luc|marc|marcel|martin|michel|patrice|patrick|paul|philippe|raymond|rene|robert|roger|sebastien|serge|stephane|thierry|vincent|yves)\b/i,
    female: /\b(aurelie|amelie|marie|sophie|camille|chloe|lea|manon|julie|nathalie|female|woman|agnes|alice|andrea|anna|anne|beatrice|brigitte|caroline|catherine|cecile|chantal|charlotte|christine|claire|colette|corinne|danielle|delphine|diane|dominique|eliane|elisabeth|elodie|emilie|emma|estelle|eve|florence|francoise|gabrielle|genevieve|helene|henriette|irene|isabelle|jacqueline|jeanne|joelle|josephine|judith|juliette|laetitia|laura|laurence|louise|lucie|madeleine|margot|marianne|marion|martine|mathilde|michele|mireille|monique|nicole|odette|pascale|patricia|pauline|rachel|renee|sandrine|sarah|simone|solange|stephanie|suzanne|sylvie|therese|valerie|veronique|virginie|yvette|yvonne)\b/i,
  },
  // German
  de: {
    male: /\b(stefan|hans|markus|michael|andreas|thomas|florian|jan|conrad|male|man|achim|alexander|alfred|bernd|bernhard|christian|christoph|clemens|daniel|david|dennis|dieter|dietrich|dirk|eberhard|egon|erich|ernst|fabian|felix|frank|franz|friedrich|fritz|georg|gerhard|gottfried|gunter|gustav|harald|hartmut|heinrich|helmut|herbert|hermann|holger|horst|hubert|ingo|jakob|johannes|jonas|jorg|josef|jurgen|karl|klaus|kurt|lars|lorenz|lothar|ludwig|lukas|manfred|marco|martin|matthias|maximilian|moritz|nico|norbert|oliver|oskar|otto|patrick|paul|peter|philipp|rainer|ralf|reinhard|reinhold|robert|roland|rolf|rudolf|sebastian|siegfried|simon|steffen|sven|theo|thorsten|tobias|udo|ulrich|uwe|volker|walter|werner|wilhelm|wolfgang)\b/i,
    female: /\b(vicki|anna|marlene|petra|sabine|katja|julia|claudia|female|woman|adelheid|agnes|alexandra|andrea|angelika|anke|annette|antje|astrid|barbara|beate|bianca|birgit|brigitte|carola|christa|christiane|christina|dagmar|daniela|doris|edith|elfriede|elke|elisabeth|elsa|erika|eva|franziska|frieda|gabriele|gerda|gertrud|gisela|greta|gudrun|hanna|hannelore|heide|heidi|heike|helene|helga|herta|hildegard|ilse|ines|ingeborg|ingrid|irene|jutta|karin|karola|katharina|kerstin|klara|kristina|lena|lidia|lieselotte|lotte|luise|magdalena|manuela|margit|margot|maria|marianne|marie|marion|martha|martina|melanie|michaela|monika|nadine|nicole|petra|renate|rosa|rosemarie|ruth|sabrina|sandra|silke|simone|sonja|stefanie|susanne|tanja|ursula|ute|vera|waltraud)\b/i,
  },
  // Japanese
  ja: {
    male: /\b(kenji|takumi|haruki|ichiro|keita|ryu|shota|yuki|male|man|akira|daisuke|daiki|genki|hajime|hayato|hideki|hiroki|hiroshi|isamu|jun|kaito|kazuki|kei|ken|kenta|koji|kosei|makoto|masaki|masaru|naoki|noboru|osamu|ren|ryota|satoshi|seiji|shinji|shun|sora|sota|taichi|takashi|takuya|tatsuya|teppei|tetsuya|tomoki|toru|tsuyoshi|yamato|yoshiki|yosuke|yuji|yuta|yuuki)\b/i,
    female: /\b(nanami|haruka|mizuki|yui|sakura|mio|aoi|rin|ayaka|female|woman|ai|aiko|akane|akemi|ami|asami|asuka|aya|ayumi|chie|chieko|chika|emi|erika|fumiko|hanako|hina|hinata|hitomi|honoka|kaori|kasumi|kazue|keiko|koharu|kotone|kumi|maki|makiko|manami|maria|mariko|masako|mayumi|megumi|mei|mika|miki|minako|miwa|miyako|momoko|nana|naoko|natsumi|nozomi|rena|rika|riko|rina|saki|satoko|sayaka|sayuri|shizuka|sumiko|tamaki|tomoko|tsubasa|yoko|yuka|yukari|yuki|yukiko|yuko|yumi|yumiko|yuriko)\b/i,
  },
  // Korean
  ko: {
    male: /\b(seojun|minho|jiho|hyun|jongsu|dongwook|male|man|byungho|chanwoo|daehyun|donghae|donghun|eunsoo|gunwoo|gyuho|haejin|hyunwoo|insoo|jaehyun|jihoon|jinwoo|joonho|jungkook|junhyuk|kihoon|kyungsoo|minseok|minwoo|namjoon|sanghoon|seokjin|seungho|sungho|taehyung|woojin|yoongi|youngho|yunho)\b/i,
    female: /\b(soyeon|yuna|jieun|minji|heami|sunhi|female|woman|ahyoung|arim|bora|chaeyoung|dahyun|eunji|gyuri|haeun|hayoung|heejin|hyejin|hyuna|jeongyeon|jihyo|jimin|jiyeon|mina|minjae|naeun|nayeon|rina|saerom|seulgi|seoyoung|sohee|somin|soobin|soojin|suji|suzy|tzuyu|yeji|yerin|yoojin|yoona|yuri)\b/i,
  },
  // Chinese
  zh: {
    male: /\b(yunyang|yunxi|xiaoming|wei|chen|long|male|man|baolin|changwei|chenguang|dawei|dongsheng|guoqiang|haifeng|hao|haoran|jian|jianguo|jianhua|jianwei|jie|jun|lei|liang|ming|pengfei|qiang|sheng|wei|wenjun|xiaodong|xiaolong|yang|yong|yuan|yuxiang|zhenyu|zhigang|zhiwei|zhiyong)\b/i,
    female: /\b(xiaoxiao|xiaoyi|xiaohan|huihui|yaoyao|yunzhi|mei|ling|female|woman|chunhua|fang|fangfang|guiying|haiyan|hongmei|huifang|hui|juan|junjun|lili|lin|lingling|meifeng|meiling|meimei|minmin|na|ping|qian|qing|qingqing|ting|tingting|wei|weiwei|xia|xiang|xiaoli|xiaomei|xiaoli|xiulan|xiuying|xuemei|yan|yanyan|ying|yuan|yue|yunfei|zhen|zhenzhen)\b/i,
  },
  // Arabic
  ar: {
    male: /\b(naayf|hamdan|omar|ahmed|mohammad|ali|male|man|abdallah|abdulaziz|abdulkarim|abdulrahman|abdullah|adel|adnan|ayman|basim|bilal|faisal|farid|fouad|hamed|hassan|hussein|ibrahim|ismail|jamal|kamal|khalid|mahmoud|malik|marwan|mounir|mustafa|nabil|nader|nasser|rashid|saleh|salim|sami|samir|tariq|walid|yasser|youssef|zaid|zaki)\b/i,
    female: /\b(fatima|hala|salma|layla|amina|yasmin|zariyah|female|woman|abeer|ahlam|aida|aisha|alia|amani|amal|amira|asma|badriya|dalia|dana|dina|farah|farida|hadeel|hanan|hayat|hind|houda|inas|jamila|khadija|laila|lama|lamia|leila|lina|lubna|maha|majida|mariam|may|mona|nada|nadine|nagla|nawal|noor|noura|ola|rania|reem|ruba|safa|samia|samira|sara|sawsan|siham|suha|wafa|widad|yara|zahra|zainab)\b/i,
  },
  // Portuguese
  pt: {
    male: /\b(antonio|nicolau|duarte|heitor|julio|male|man|afonso|alberto|alexandre|alvaro|andre|artur|bernardo|bruno|carlos|daniel|david|diogo|eduardo|emanuel|fabio|fernando|filipe|francisco|gabriel|goncalo|guilherme|gustavo|henrique|hugo|joao|joaquim|jorge|jose|leonardo|luca|luis|manuel|marco|mario|martim|mateus|miguel|nuno|oscar|paulo|pedro|rafael|ricardo|rodrigo|rui|samuel|santiago|sergio|simao|tiago|tomas|vasco|vicente|vitor)\b/i,
    female: /\b(fernanda|raquel|francisca|ines|camila|beatriz|female|woman|adriana|alice|amanda|ana|andreia|angelica|bianca|bruna|carla|carolina|catarina|claudia|daniela|diana|eduarda|elena|eva|filipa|gabriela|helena|isabel|jessica|joana|julia|juliana|lara|laura|leonor|leticia|lidia|lucia|luciana|luisa|madalena|margarida|maria|mariana|marta|melissa|monica|patricia|paula|rafaela|renata|rita|rosa|sara|silvia|sofia|susana|teresa|vanessa|vera|vitoria)\b/i,
  },
  // Russian
  ru: {
    male: /\b(dmitry|pavel|maxim|ivan|aleksei|nikolai|mikhail|male|man|alexander|alexei|anatoly|andrei|anton|artem|boris|denis|evgeny|fedor|georgy|grigory|igor|ilya|kirill|konstantin|leonid|nikita|oleg|roman|sergei|stanislav|stepan|vadim|valentin|valery|vasily|viktor|vitaly|vladimir|vyacheslav|yakov|yaroslav|yuri)\b/i,
    female: /\b(svetlana|dariya|ekaterina|olga|tatiana|irina|maria|female|woman|aleksandra|alina|alla|anastasia|anna|antonina|daria|diana|elena|elizaveta|evgenia|galina|inna|julia|kira|ksenia|larisa|lidia|liudmila|margarita|marina|nadezhda|natalia|nina|oksana|polina|raisa|sofia|tamara|valentina|valeria|vera|veronika|viktoria|yana|yulia|zhanna|zinaida|zoya)\b/i,
  },
  // Italian
  it: {
    male: /\b(diego|benigno|luca|marco|andrea|giuseppe|francesco|male|man|alberto|alessandro|alfredo|aldo|angelo|antonio|arturo|augusto|benedetto|bernardo|bruno|carlo|cesare|claudio|daniele|davide|domenico|edoardo|emanuele|emilio|enrico|enzo|ettore|fabio|federico|filippo|flavio|gabriele|giacomo|gianni|giorgio|giovanni|giuliano|giulio|guido|lorenzo|luciano|luigi|marcello|mario|massimo|matteo|maurizio|mauro|nicola|paolo|pietro|raffaele|renato|riccardo|roberto|rocco|salvatore|sandro|sergio|simone|stefano|tommaso|umberto|vincenzo|vittorio)\b/i,
    female: /\b(elsa|isabella|francesca|giulia|alessia|chiara|paola|female|woman|adriana|agnese|alessandra|alice|angelica|anna|antonella|arianna|aurora|beatrice|benedetta|bianca|camilla|carla|carlotta|carolina|caterina|cecilia|claudia|costanza|cristina|daniela|diana|elena|eleonora|elisa|elisabetta|emanuela|emma|erica|federica|fiorella|franca|gabriella|gaia|giorgia|giovanna|ginevra|grazia|ilaria|irene|laura|lavinia|letizia|lidia|liliana|lina|lisa|lorenza|luana|lucia|luciana|luisa|maddalena|mara|margherita|maria|marianna|marina|marta|martina|matilde|michela|mirella|monica|nadia|nicoletta|ornella|patrizia|raffaella|renata|roberta|rosa|rossella|sabrina|sandra|sara|serena|silvana|silvia|simona|sofia|stefania|susanna|valentina|valeria|vanessa|veronica|virginia|vittoria)\b/i,
  },
  // Default fallback
  default: {
    male: /\b(male|man|guy|boy|sir|mr|mister|dude|gentleman|father|dad|uncle|brother|son|nephew|grandfather|grandpa|king|prince|lord|baron|duke|earl|count|knight|lad|fellow|chap|bloke|gent)\b/i,
    female: /\b(female|woman|girl|lady|miss|mrs|ms|madam|dame|mother|mom|aunt|sister|daughter|niece|grandmother|grandma|queen|princess|duchess|countess|baroness|lass|gal|maiden)\b/i,
  },
};

// Quality indicators - prefer these voices (extended with Indian voice names)
const QUALITY_INDICATORS = /\b(neural|natural|premium|enhanced|wavenet|online|remote|lekha|aditi|swara|heera)\b/i;

// Known male voice patterns - CRITICAL for correct gender assignment
const MALE_VOICE_NAMES = /\b(david|james|daniel|mark|ravi|hemant|amit|roger|brian|eric|guy|male|man|alex|aaron|adam|chris|fred|john|kevin|michael|peter|richard|robert|william|tom|george|matthew|arthur|henry|paul|charles|edward|conrad|florian|jan|stefan|hans|markus|andreas|thomas|oliver|benjamin|brandon|christopher|derek|donald|douglas|ethan|gabriel|gregory|harold|howard|ian|jason|jeffrey|jeremy|jonathan|justin|kenneth|larry|lawrence|leonard|marcus|martin|nathan|nicholas|patrick|phillip|ralph|raymond|roger|ronald|russell|samuel|scott|shawn|simon|stanley|theodore|victor|walter|wayne|zachary)\b/i;

// Known female voice patterns - extended for better female voice detection across all languages
const FEMALE_VOICE_NAMES = /\b(lekha|aditi|priya|swara|female|woman|raveena|kajal|suman|veena|meera|ananya|divya|kavya|shreya|nisha|pallavi|sunita|varsha|rekha|geeta|jyoti|nandini|lakshmi|sarita|shobha|heera|kalpana|chhaya|zira|hazel|samantha|karen|moira|tessa|fiona|victoria|susan|allison|ava|joana|paulina|monica|lucia|amelie|celine|aurelie|sara|anna|petra|katja|yuna|kyoko|nanami|tingting|xiaoxiao|xiaoyi|zhiyu|yelda|elif|zeynep|filiz|vani|deepa|anjali|pooja|neha|ria|tanishaa|bondita|aishwarya|sakhi|aarohi|dhwani|nishtha|sapna|sobhana|subhasini|priyom|harleen|sarah|alice|kate|linda|lisa|mary|nancy|rachel|tessa|amy|catherine|emily|jessica|jennifer|nicole|olivia|emma|vicki|marlene|sabine|julia|claudia)\b/i;

// Natural speech parameters - ALL LANGUAGES use Hindi-like natural reading style
// Different pitch for male vs female voices
const LANGUAGE_SPEECH_PARAMS: Record<string, { rate: number; malePitch: number; femalePitch: number }> = {
  // Indian Languages - Hindi baseline applied to all
  hi: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  mr: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  gu: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  ta: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  te: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  bn: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  kn: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  ml: { rate: 0.82, malePitch: 0.92, femalePitch: 1.03 },
  pa: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  or: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  as: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  ks: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  // European Languages
  en: { rate: 0.88, malePitch: 0.90, femalePitch: 1.03 },
  es: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  fr: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  de: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  it: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  pt: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  ru: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  nl: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  pl: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  // Asian Languages
  ja: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  zh: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  ko: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  vi: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  th: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  id: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  ms: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  // Middle Eastern
  ar: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  fa: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  ur: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  he: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
  tr: { rate: 0.85, malePitch: 0.92, femalePitch: 1.03 },
};

interface UseWebSpeechTTSReturn {
  speak: (text: string, options?: WebSpeechOptions) => Promise<void>;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  getVoicesForLanguage: (language: string) => SpeechSynthesisVoice[];
  setPreferredVoice: (voiceName: string, language: string) => void;
  getPreferredVoice: (language: string) => string | null;
}

function getStoredSettings(): VoiceSettings | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// Cache voice selection for consistency
function cacheVoiceSelection(voiceName: string, speaker: string, language: string): void {
  try {
    const cache = JSON.parse(localStorage.getItem(VOICE_CACHE_KEY) || "{}");
    cache[`${language}-${speaker}`] = voiceName;
    localStorage.setItem(VOICE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
}

function getCachedVoice(speaker: string, language: string): string | null {
  try {
    const cache = JSON.parse(localStorage.getItem(VOICE_CACHE_KEY) || "{}");
    return cache[`${language}-${speaker}`] || null;
  } catch {
    return null;
  }
}

// Determine if a voice is male or female
function isVoiceMale(voice: SpeechSynthesisVoice): boolean {
  return MALE_VOICE_NAMES.test(voice.name) && !FEMALE_VOICE_NAMES.test(voice.name);
}

function isVoiceFemale(voice: SpeechSynthesisVoice): boolean {
  return FEMALE_VOICE_NAMES.test(voice.name);
}

// Sort voices by quality with Indian voice priority and gender separation
function sortByQuality(
  voiceList: SpeechSynthesisVoice[], 
  language?: string,
  preferMale?: boolean
): SpeechSynthesisVoice[] {
  const langPrefix = language?.split('-')[0] || '';
  const priorityList = INDIAN_VOICE_PRIORITY[langPrefix] || [];
  
  return [...voiceList].sort((a, b) => {
    // FIRST priority: Gender matching
    if (preferMale !== undefined) {
      const aIsMale = isVoiceMale(a);
      const bIsMale = isVoiceMale(b);
      const aIsFemale = isVoiceFemale(a);
      const bIsFemale = isVoiceFemale(b);
      
      if (preferMale) {
        // Prefer male voices
        if (aIsMale && !bIsMale) return -1;
        if (!aIsMale && bIsMale) return 1;
        // Deprioritize explicitly female voices
        if (!aIsFemale && bIsFemale) return -1;
        if (aIsFemale && !bIsFemale) return 1;
      } else {
        // Prefer female voices
        if (aIsFemale && !bIsFemale) return -1;
        if (!aIsFemale && bIsFemale) return 1;
        // Deprioritize explicitly male voices
        if (!aIsMale && bIsMale) return -1;
        if (aIsMale && !bIsMale) return 1;
      }
    }
    
    // SECOND priority: Check if voice is in Indian priority list (authentic Indian voices)
    if (priorityList.length > 0) {
      const aInPriority = priorityList.some(name => a.name.toLowerCase().includes(name.toLowerCase()));
      const bInPriority = priorityList.some(name => b.name.toLowerCase().includes(name.toLowerCase()));
      if (aInPriority && !bInPriority) return -1;
      if (!aInPriority && bInPriority) return 1;
    }
    
    // THIRD priority: Prefer -IN region voices for Indian languages (authentic accent)
    if (INDIC_LANGUAGES.includes(langPrefix)) {
      const aIsIndian = a.lang.endsWith('-IN');
      const bIsIndian = b.lang.endsWith('-IN');
      if (aIsIndian && !bIsIndian) return -1;
      if (!aIsIndian && bIsIndian) return 1;
    }
    
    // Fourth priority: quality indicators (neural, natural, premium)
    const aHasQuality = QUALITY_INDICATORS.test(a.name);
    const bHasQuality = QUALITY_INDICATORS.test(b.name);
    if (aHasQuality && !bHasQuality) return -1;
    if (!aHasQuality && bHasQuality) return 1;

    // Fifth priority: online/remote voices (much more natural sounding)
    if (!a.localService && b.localService) return -1;
    if (a.localService && !b.localService) return 1;

    return 0;
  });
}

export function useWebSpeechTTS(): UseWebSpeechTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isMountedRef = useRef(true);

  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Track mounted state to prevent state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load voices (they load asynchronously in some browsers)
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      if (isMountedRef.current) {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
      }
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  // Select appropriate voice based on speaker and language
  // CRITICAL: host1 (Alex) = MALE, host2 (Sarah) = FEMALE
  const selectVoice = useCallback(
    (speaker: "host1" | "host2", language: string = "en"): SpeechSynthesisVoice | null => {
      if (voices.length === 0) return null;

      // CRITICAL: host1 is Alex (MALE), host2 is Sarah (FEMALE)
      const isMaleSpeaker = speaker === "host1";
      
      // Get target language tag
      const langTag = LANGUAGE_TAGS[language] || language;
      const langPrefix = langTag.split("-")[0].toLowerCase();

      // Check for cached voice first - but validate gender matches
      const cachedVoiceName = getCachedVoice(speaker, language);
      if (cachedVoiceName) {
        const cachedVoice = voices.find((v) => v.name === cachedVoiceName);
        if (cachedVoice) {
          // Validate cached voice matches expected gender
          const cachedIsMale = isVoiceMale(cachedVoice);
          const cachedIsFemale = isVoiceFemale(cachedVoice);
          
          if ((isMaleSpeaker && cachedIsMale) || (!isMaleSpeaker && cachedIsFemale)) {
            return cachedVoice;
          }
          // Gender mismatch - don't use cached voice
          console.warn(`Cached voice ${cachedVoiceName} gender mismatch for speaker ${speaker}, reselecting`);
        }
      }

      // Check for user-configured voice (only for English in podcast settings)
      if (language === "en") {
        const storedSettings = getStoredSettings();
        if (storedSettings) {
          const configuredName =
            speaker === "host1" ? storedSettings.host1VoiceName : storedSettings.host2VoiceName;

          if (configuredName) {
            const configuredVoice = voices.find((v) => v.name === configuredName);
            if (configuredVoice) {
              cacheVoiceSelection(configuredVoice.name, speaker, language);
              return configuredVoice;
            }
          }
        }
      }

      // Filter voices by language - try multiple matching strategies
      let languageVoices = voices.filter((v) => {
        const voiceLang = v.lang.toLowerCase();
        return (
          voiceLang.startsWith(langPrefix) ||
          voiceLang === langTag.toLowerCase() ||
          voiceLang.split("-")[0] === langPrefix
        );
      });

      // If no voices found for this language, log and fall back to English
      if (languageVoices.length === 0) {
        console.warn(`No voices found for language: ${language} (${langPrefix}), falling back to English`);
        if (language !== "en") {
          return selectVoice(speaker, "en");
        }
        // Last resort: use any available voice
        languageVoices = voices;
      }
      
      // For Indian languages, prefer -IN region voices for authentic accent
      if (INDIC_LANGUAGES.includes(langPrefix)) {
        const indianRegionVoices = languageVoices.filter(v => v.lang.endsWith('-IN'));
        if (indianRegionVoices.length > 0) {
          languageVoices = indianRegionVoices;
          console.log(`Using ${indianRegionVoices.length} authentic Indian region voices for ${language}`);
        }
      }

      // Sort by quality with gender preference - CRITICAL FIX
      const sortedVoices = sortByQuality(languageVoices, language, isMaleSpeaker);

      // Get language-specific patterns or use default
      const patterns = VOICE_PATTERNS[langPrefix] || VOICE_PATTERNS.default;

      // Try to find gender-appropriate voice
      let selectedVoice: SpeechSynthesisVoice | null = null;

      if (isMaleSpeaker) {
        // CRITICAL: For host1 (Alex), MUST find a MALE voice
        selectedVoice = sortedVoices.find((v) => {
          const isMale = patterns.male.test(v.name) || isVoiceMale(v);
          const isFemale = patterns.female.test(v.name) || isVoiceFemale(v);
          return isMale && !isFemale;
        }) || null;
        
        // If no explicit male found, pick first that's NOT female
        if (!selectedVoice) {
          selectedVoice = sortedVoices.find((v) => {
            const isFemale = patterns.female.test(v.name) || isVoiceFemale(v);
            return !isFemale;
          }) || null;
        }
      } else {
        // CRITICAL: For host2 (Sarah), MUST find a FEMALE voice
        selectedVoice = sortedVoices.find((v) => {
          const isFemale = patterns.female.test(v.name) || isVoiceFemale(v);
          return isFemale;
        }) || null;
        
        // If no explicit female found, pick first that's NOT male
        if (!selectedVoice) {
          selectedVoice = sortedVoices.find((v) => {
            const isMale = patterns.male.test(v.name) || isVoiceMale(v);
            return !isMale;
          }) || null;
        }
      }

      // If no gender match found, pick based on position in sorted list
      if (!selectedVoice) {
        // For male, pick first; for female, pick second (or first if only one)
        const index = isMaleSpeaker ? 0 : Math.min(1, sortedVoices.length - 1);
        selectedVoice = sortedVoices[index] || null;
      }

      // Cache the selection for consistency
      if (selectedVoice) {
        cacheVoiceSelection(selectedVoice.name, speaker, language);
        console.log(`Selected voice for ${speaker} (${isMaleSpeaker ? 'male' : 'female'}): ${selectedVoice.name}`);
      }

      return selectedVoice;
    },
    [voices]
  );

  const speak = useCallback(
    (text: string, options: WebSpeechOptions = {}): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!isSupported) {
          reject(new Error("Web Speech API is not supported in this browser"));
          return;
        }

        // Cancel any ongoing speech
        speechSynthesis.cancel();

        const langPrefix = (options.language || "en").split("-")[0].toLowerCase();
        
        // Prepare text with natural pauses for smoother reading
        const preparedText = prepareTextForSpeech(text, langPrefix);
        const utterance = new SpeechSynthesisUtterance(preparedText);
        utteranceRef.current = utterance;

        // CRITICAL: Determine if speaker should be male (host1) or female (host2)
        const speaker = options.speaker || "host1";
        const isMaleSpeaker = speaker === "host1";

        // Voice selection priority:
        // 1. Explicit voiceName from options (from dropdown)
        // 2. User's cached preferred voice (validated for gender)
        // 3. Automatic gender-appropriate voice selection
        let selectedVoice: SpeechSynthesisVoice | null = null;

        // Priority 1: Explicit voiceName passed from dropdown
        if (options.voiceName) {
          selectedVoice = voices.find((v) => v.name === options.voiceName) || null;
        }

        // Priority 2: Check for manually selected preferred voice in cache
        if (!selectedVoice) {
          const preferredVoiceName = getCachedVoice("preferred", langPrefix);
          if (preferredVoiceName) {
            selectedVoice = voices.find((v) => v.name === preferredVoiceName) || null;
          }
        }

        // Priority 3: Auto-select based on speaker gender
        if (!selectedVoice) {
          selectedVoice = selectVoice(speaker, options.language);
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
          // Also set the lang to match the voice for better pronunciation
          utterance.lang = selectedVoice.lang;
        } else if (options.language) {
          // Set language even if no voice found
          utterance.lang = LANGUAGE_TAGS[options.language] || options.language;
        }

        // Get stored settings for pitch/rate
        const storedSettings = getStoredSettings();

        // Get language-specific natural speech parameters
        const langCode = options.language || "en";
        const langParams = LANGUAGE_SPEECH_PARAMS[langCode] || LANGUAGE_SPEECH_PARAMS.en;

        // Add slight random variation for more human-like reading (±2%)
        const rateVariation = (Math.random() * 0.04 - 0.02);
        
        // Apply rate - use options first, then language defaults, then stored settings
        if (options.rate !== undefined) {
          utterance.rate = options.rate + rateVariation;
        } else if (storedSettings && options.language === "en") {
          // Only use stored podcast settings for English
          const storedRate = speaker === "host1" ? storedSettings.host1Rate : storedSettings.host2Rate;
          utterance.rate = storedRate + rateVariation;
        } else {
          // Use language-tuned natural rate with slight variation
          utterance.rate = langParams.rate + rateVariation;
        }

        // Apply pitch - use options first, then gender-appropriate defaults, then stored settings
        // CRITICAL: Different pitch for male vs female voices
        if (options.pitch !== undefined) {
          utterance.pitch = options.pitch;
        } else if (storedSettings && options.language === "en") {
          const storedPitch = speaker === "host1" ? storedSettings.host1Pitch : storedSettings.host2Pitch;
          utterance.pitch = storedPitch;
        } else {
          // Use gender-appropriate pitch
          utterance.pitch = isMaleSpeaker ? langParams.malePitch : langParams.femalePitch;
        }
        
        console.log(`TTS for ${speaker} (${isMaleSpeaker ? 'male' : 'female'}): voice=${selectedVoice?.name}, rate=${utterance.rate.toFixed(3)}, pitch=${utterance.pitch}`);
        

        utterance.volume = 1;

        utterance.onstart = () => {
          if (isMountedRef.current) {
            setIsSpeaking(true);
          }
          options.onStart?.();
        };

        utterance.onend = () => {
          if (isMountedRef.current) {
            setIsSpeaking(false);
          }
          options.onEnd?.();
          resolve();
        };

        utterance.onerror = (event) => {
          if (isMountedRef.current) {
            setIsSpeaking(false);
          }
          // "interrupted" and "canceled" are expected when canceling speech, not real errors
          if (event.error === "interrupted" || event.error === "canceled") {
            resolve();
            return;
          }
          const error = new Error(`Speech synthesis error: ${event.error}`);
          options.onError?.(error);
          reject(error);
        };

        speechSynthesis.speak(utterance);
      });
    },
    [isSupported, voices, selectVoice]
  );

  const cancel = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel();
      if (isMountedRef.current) {
        setIsSpeaking(false);
      }
    }
  }, [isSupported]);

  // Get voices filtered by language
  const getVoicesForLanguage = useCallback(
    (language: string): SpeechSynthesisVoice[] => {
      const langPrefix = language.split("-")[0].toLowerCase();
      
      // Filter voices by language
      let filtered = voices.filter((v) =>
        v.lang.toLowerCase().startsWith(langPrefix)
      );

      // If no voices for this language, return all voices
      if (filtered.length === 0) {
        filtered = voices;
      }

      // Sort: prioritize neural/premium voices, then alphabetically
      return filtered.sort((a, b) => {
        const qualityA = QUALITY_INDICATORS.test(a.name) ? 0 : 1;
        const qualityB = QUALITY_INDICATORS.test(b.name) ? 0 : 1;
        if (qualityA !== qualityB) return qualityA - qualityB;
        return a.name.localeCompare(b.name);
      });
    },
    [voices]
  );

  // Set preferred voice for a language
  const setPreferredVoice = useCallback(
    (voiceName: string, language: string): void => {
      const langPrefix = language.split("-")[0].toLowerCase();
      cacheVoiceSelection(voiceName, "preferred", langPrefix);
    },
    []
  );

  // Get preferred voice for a language
  const getPreferredVoice = useCallback(
    (language: string): string | null => {
      const langPrefix = language.split("-")[0].toLowerCase();
      return getCachedVoice("preferred", langPrefix);
    },
    []
  );

  return {
    speak,
    cancel,
    isSpeaking,
    isSupported,
    voices,
    getVoicesForLanguage,
    setPreferredVoice,
    getPreferredVoice,
  };
}
