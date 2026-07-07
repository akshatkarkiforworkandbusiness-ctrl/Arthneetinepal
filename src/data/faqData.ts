// Expanded bilingual FAQ data for landing page

export interface FAQItem {
  id: number;
  question: string;
  questionNepali: string;
  answer: string;
  answerNepali: string;
  category: 'general' | 'program' | 'technical' | 'partnership';
}

export const FAQ_DATA: FAQItem[] = [
  {
    id: 1,
    question: "What is Arthneeti and how can I join?",
    questionNepali: "अर्थनीति के हो र म सामेल कसरी हुन सक्छु?",
    answer: "Arthneeti is a student-led financial literacy initiative that conducts free workshops in schools across Nepal. To join, simply sign up on our website or attend one of our open sessions at partner schools. No prior knowledge is required.",
    answerNepali: "अर्थनीति विद्यार्थीहरूद्वारा सञ्चालित वित्तीय साक्षरता अभियान हो जसले नेपालभरका विद्यालयहरूमा निःशुल्क कार्यशाला आयोजना गर्दछ। सामेल हुन हाम्रो वेबसाइटमा साइन अप गर्नुहोस् वा हाम्रो कुनै खुला कार्यशालामा उपस्थित हुनुहोस्। कुनै अघिल्बो ज्ञान आवश्यक छैन।",
    category: 'general'
  },
  {
    id: 2,
    question: "Is it really free to attend sessions?",
    questionNepali: "कार्यशालामा सामेल हुनु साँच्चिकै निःशुल्क हो?",
    answer: "Yes, all Arthneeti sessions are completely free. We believe financial literacy should be accessible to every student in Nepal, regardless of their background. Our programs are supported by partnerships and donations.",
    answerNepali: "हो, अर्थनीतिका सबै कार्यशालाहरू पूर्णतया निःशुल्क छन्। हामी विश्वास गर्छौं कि वित्तीय साक्षरता नेपालका हरेक विद्यार्थीको लागि सुलभ हुनुपर्छ, उनीहरूको पृष्ठभूमिको बेवास्ता गरी। हाम्रा कार्यक्रमहरू साझेदारी र दानबाट समर्थित छन्।",
    category: 'general'
  },
  {
    id: 3,
    question: "What will I learn in the financial literacy program?",
    questionNepali: "वित्तीय साक्षरता कार्यक्रममा म के सिक्नेछु?",
    answer: "You'll learn budgeting with the 50/30/20 rule, building emergency funds, understanding banking operations, digital payment security, and how Nepal Rastra Bank regulates the financial system. Everything is taught through interactive activities.",
    answerNepali: "तपाईंले 50/30/20 नियमबाट बजेटिङ, आपतकालीन कोष निर्माण, बैंकिङ कार्यहरू बुझ्ने, डिजिटल भुक्तानी सुरक्षा, र नेपाल राष्ट्र बैंकले वित्तीय प्रणालीलाई कसरी नियमन गर्छ भन्ने सिक्नेछु। सबै कुरा अन्तरक्रियात्मक गतिविधिहरू मार्फत सिकाइन्छ।",
    category: 'program'
  },
  {
    id: 4,
    question: "How does the stock market simulation work?",
    questionNepali: "शेयर बजार सिमुलेशन कसरी काम गर्छ?",
    answer: "We use a simulated trading platform where you can practice buying and selling stocks with virtual money. You'll learn to read charts, analyze companies, and understand market trends without risking real money.",
    answerNepali: "हामी एउटा सिमुलेटेड ट्रेडिङ प्लेटफर्म प्रयोग गर्छौं जहाँ तपाईंले भर्चुअल पैसाले सेयर किन्न र बेच्नको अभ्यास गर्न सक्नुहुन्छ। तपाईंले चार्ट पढ्ने, कम्पनी विश्लेषण गर्ने, र बजार प्रवृत्ति बुझ्न सिक्नेछु, बिना वास्तविक पैसा जोखिममा पार्ने।",
    category: 'program'
  },
  {
    id: 5,
    question: "Can I get a certificate after completing the program?",
    questionNepali: "कार्यक्रम सकेपछि के मलाई प्रमाणपत्र मिल्छ?",
    answer: "Yes! After completing all modules and passing the final assessment, you'll receive a printable certificate from Arthneeti. This certificate recognizes your financial literacy skills and can be added to your academic portfolio.",
    answerNepali: "हो! सबै मोड्युलहरू सकेपछि र अन्तिम मूल्याङ्कन उत्तीर्ण गरेपछि, तपाईंलाई अर्थनीतिबाट एउटा प्रिन्टेबल प्रमाणपत्र प्राप्त हुनेछ। यो प्रमाणपत्रले तपाईंको वित्तीय साक्षरता सीपलाई मान्यता दिन्छ र तपाईंको शैक्षिक पोर्टफोलियोमा थप्न सकिन्छ।",
    category: 'program'
  },
  {
    id: 6,
    question: "Do you conduct sessions outside Kathmandu?",
    questionNepali: "तपाईहरू काठमाडौं बाहेक पनि कार्यशाला गर्नुहुन्छ?",
    answer: "Yes! We're expanding across Nepal. We've conducted sessions in multiple districts and are actively partnering with schools nationwide. Contact us to bring Arthneeti to your school.",
    answerNepali: "हो! हामी नेपालभर विस्तार हुँदै छौं। हामीले धेरै जिल्लाहरूमा कार्यशालाहरू आयोजना गरिसकेका छौं र राष्ट्रिय स्तरमा विद्यालयहरूसँग सक्रिय रूपमा साझेदारी गरिरहेका छौं। तपाईंको विद्यालयमा अर्थनीति ल्याउन हामीलाई सम्पर्क गर्नुहोस्।",
    category: 'partnership'
  },
  {
    id: 7,
    question: "How can my school partner with Arthneeti?",
    questionNepali: "मेरो विद्यालयले अर्थनीतिसँग साझेदारी कसरी गर्न सक्छ?",
    answer: "Schools can partner with us by reaching out through our website or email. We'll work with your administration to schedule sessions, customize curriculum for your students, and provide all necessary materials.",
    answerNepali: "विद्यालयहरूले हाम्रो वेबसाइट वा इमेल मार्फत सम्पर्क गरेर साझेदारी गर्न सक्छन्। हामी तपाईंको प्रशासनसँग काम गरी तपाईंका विद्यार्थीहरूका लागि कार्यशाला तालिका बनाउने, पाठ्यक्रम अनुकूलित गर्ने, र सबै आवश्यक सामग्रीहरू प्रदान गर्ने छौं।",
    category: 'partnership'
  },
  {
    id: 8,
    question: "What is NEPSE and how do I start investing?",
    questionNepali: "नेप्से (NEPSE) भनेको के हो र लगानी कसरी सुरु गर्ने?",
    answer: "NEPSE is the Nepal Stock Exchange - Nepal's only stock market. To start investing, you need to open a DEMAT account at a bank or broker, register on Meroshare for IPO applications, and open a Trading Account for secondary market trading.",
    answerNepali: "नेप्से नेपाल स्टक एक्सचेन्ज हो - नेपालको एकमात्र शेयर बजार। लगानी सुरु गर्न, तपाईंले बैंक वा ब्रोकरमा डिम्याट खाता खोल्नुपर्छ, IPO आवेदनका लागि मेरोसेयरमा दर्ता गर्नुपर्छ, र दोस्रो बजार व्यापारका लागि ट्रेडिङ खाता खोल्नुपर्छ।",
    category: 'technical'
  },
  {
    id: 9,
    question: "Are sessions available in Nepali language?",
    questionNepali: "कार्यशालाहरू नेपाली भाषामा उपलब्ध छन्?",
    answer: "Absolutely! All our sessions are conducted in both Nepali and English. Our materials are bilingual, and our instructors are fluent in both languages to ensure everyone understands the content.",
    answerNepali: "निश्चित रूपमा! हाम्रा सबै कार्यशालाहरू नेपाली र अंग्रेजी दुवै भाषामा सञ्चालन गरिन्छ। हाम्रा सामग्रीहरू द्विभाषिक छन्, र हाम्रा प्रशिक्षकहरू दुवै भाषामा कुशल छन् ताकि सबैले सामग्री बुझ्न सकून्।",
    category: 'general'
  },
  {
    id: 10,
    question: "How do I apply for IPOs in Nepal?",
    questionNepali: "नेपालमा आईपीओ (IPO) कसरी आवेदन दिने?",
    answer: "To apply for IPOs, you need a DEMAT account and Meroshare access. When a company opens its IPO, you can apply through your broker's Meroshare portal. We teach the complete IPO application process in our sessions.",
    answerNepali: "IPO आवेदन दिन, तपाईंलाई डिम्याट खाता र मेरोसेयर पहुँच चाहिन्छ। जब कुनै कम्पनीले IPO खोल्छ, तपाईंले आफ्नो ब्रोकरको मेरोसेयर पोर्टलमार्फत आवेदन दिन सक्नुहुन्छ। हामीले हाम्रा कार्यशालाहरूमा पूर्ण IPO आवेदन प्रक्रिया सिकाउँछौं।",
    category: 'technical'
  }
];

// Category labels
export const FAQ_CATEGORIES = {
  general: { label: 'General', labelNepali: 'सामान्य' },
  program: { label: 'Program', labelNepali: 'कार्यक्रम' },
  technical: { label: 'Technical', labelNepali: 'प्राविधिक' },
  partnership: { label: 'Partnership', labelNepali: 'साझेदारी' }
};
