import { POLICY } from "./config";

export const LEGAL_DOCS = {
  terms: { key: "terms", href: "/terms", version: POLICY.termsVersion },
  privacy: { key: "privacy", href: "/privacy", version: POLICY.privacyVersion },
  refund: { key: "refund", href: "/refund-policy", version: POLICY.refundVersion },
  copyright: { key: "copyright", href: "/copyright-policy", version: POLICY.copyrightVersion },
};

/**
 * Plain-language policy text. These are product documents for the MPSC Pulse
 * platform — they are not legal advice and should be reviewed by a lawyer
 * before public launch.
 */
export const LEGAL_CONTENT = {
  terms: {
    en: {
      title: "Terms & Conditions",
      intro:
        "These terms explain how you may use MPSC Pulse. By creating an account or using the app you agree to them.",
      sections: [
        {
          heading: "1. Your account",
          body: [
            "You must provide accurate details when registering, including a working mobile number and email address.",
            "Your account is personal. Do not share your login credentials. You are responsible for activity that happens under your account.",
            "You must be able to enter into a binding agreement in India, or have permission from a parent or guardian.",
          ],
        },
        {
          heading: "2. Using the learning content",
          body: [
            "Course lectures, notes and tests are licensed to you for personal exam preparation only.",
            "You may not record, re-upload, resell, publicly share or redistribute any lecture, PDF or test content.",
            "We may add, update, reorder or remove content to keep courses aligned with the current MPSC syllabus.",
          ],
        },
        {
          heading: "3. Free and paid access",
          body: [
            "Some courses and materials are free. Others require a purchase and may include a validity period.",
            "Where a validity period applies, access ends when it expires unless renewed.",
            "We may change the price or the free/paid status of a course at any time. Access already granted to you is not withdrawn because of a later price change.",
          ],
        },
        {
          heading: "4. XP, streaks and leaderboards",
          body: [
            "XP, levels, streaks, badges and leaderboard positions are engagement features. They are calculated on our servers.",
            "Attempting to manipulate XP, streaks, ranks or test scores may result in reset of your statistics or suspension of your account.",
          ],
        },
        {
          heading: "5. Acceptable use",
          body: [
            "Do not attempt to gain unauthorised access to the platform, other accounts, or admin functionality.",
            "Do not use automated tools to scrape content, questions or answers.",
            "Do not upload or transmit unlawful, abusive or infringing material through any feature we provide.",
          ],
        },
        {
          heading: "6. Availability and changes",
          body: [
            "We aim to keep MPSC Pulse available but cannot promise uninterrupted service. Maintenance and outages can happen.",
            "We may update these terms. If a change is significant, we will increase the version number and ask you to accept the new version before continuing.",
          ],
        },
        {
          heading: "7. Ending access",
          body: [
            "You may delete your account at any time from Settings. Deletion removes your profile, progress and XP.",
            "We may suspend or end access if these terms are broken.",
          ],
        },
        {
          heading: "8. Contact",
          body: ["For questions about these terms, contact support through the app."],
        },
      ],
    },
    mr: {
      title: "अटी व शर्ती",
      intro:
        "MPSC Pulse कसे वापरावे हे या अटी स्पष्ट करतात. खाते तयार करून किंवा अ‍ॅप वापरून तुम्ही या अटींना सहमती देता.",
      sections: [
        {
          heading: "१. तुमचे खाते",
          body: [
            "नोंदणी करताना अचूक माहिती द्या — चालू मोबाइल क्रमांक व ईमेल पत्ता आवश्यक आहे.",
            "तुमचे खाते वैयक्तिक आहे. लॉगिन माहिती कोणाशी शेअर करू नका. तुमच्या खात्याखालील सर्व हालचालींची जबाबदारी तुमची आहे.",
            "तुम्ही भारतात करार करण्यास पात्र असावे, अथवा पालकांची परवानगी असावी.",
          ],
        },
        {
          heading: "२. अभ्यास सामग्रीचा वापर",
          body: [
            "व्याख्याने, नोट्स व चाचण्या केवळ तुमच्या वैयक्तिक परीक्षा तयारीसाठी परवानाकृत आहेत.",
            "कोणतेही व्याख्यान, पीडीएफ किंवा चाचणी रेकॉर्ड करणे, पुन्हा अपलोड करणे, विकणे किंवा सार्वजनिकपणे वाटणे प्रतिबंधित आहे.",
            "अभ्यासक्रम अद्ययावत ठेवण्यासाठी आम्ही सामग्री जोडू, बदलू किंवा काढू शकतो.",
          ],
        },
        {
          heading: "३. मोफत व सशुल्क प्रवेश",
          body: [
            "काही कोर्सेस मोफत आहेत. काहींसाठी खरेदी आवश्यक असते व वैधता कालावधी असू शकतो.",
            "वैधता संपल्यावर नूतनीकरण न केल्यास प्रवेश थांबतो.",
            "आम्ही कोर्सची किंमत किंवा मोफत/सशुल्क स्थिती कधीही बदलू शकतो. आधीच दिलेला प्रवेश नंतरच्या किंमत बदलामुळे काढला जात नाही.",
          ],
        },
        {
          heading: "४. XP, मालिका व क्रमवारी",
          body: [
            "XP, स्तर, मालिका, बॅजेस व क्रमवारी ही सहभाग वैशिष्ट्ये आहेत आणि आमच्या सर्व्हरवर मोजली जातात.",
            "XP, मालिका, क्रमांक किंवा गुणांमध्ये फेरफार करण्याचा प्रयत्न केल्यास आकडेवारी पुन्हा शून्य केली जाऊ शकते किंवा खाते निलंबित होऊ शकते.",
          ],
        },
        {
          heading: "५. योग्य वापर",
          body: [
            "व्यासपीठ, इतर खाती किंवा प्रशासक कार्यप्रणालीमध्ये अनधिकृत प्रवेशाचा प्रयत्न करू नका.",
            "सामग्री, प्रश्न किंवा उत्तरे स्वयंचलित साधनांनी काढू नका.",
            "बेकायदेशीर, अपमानास्पद किंवा हक्कभंग करणारी सामग्री पाठवू नका.",
          ],
        },
        {
          heading: "६. उपलब्धता व बदल",
          body: [
            "आम्ही सेवा सुरू ठेवण्याचा प्रयत्न करतो, परंतु अखंड सेवेची हमी देत नाही. देखभाल व तांत्रिक अडथळे शक्य आहेत.",
            "या अटी अद्ययावत होऊ शकतात. महत्त्वाचा बदल असल्यास आवृत्ती क्रमांक वाढवून पुन्हा स्वीकृती मागितली जाईल.",
          ],
        },
        {
          heading: "७. प्रवेश समाप्ती",
          body: [
            "सेटिंग्जमधून तुम्ही कधीही खाते हटवू शकता. यामुळे प्रोफाइल, प्रगती व XP काढले जातात.",
            "अटींचा भंग झाल्यास आम्ही प्रवेश निलंबित करू शकतो.",
          ],
        },
        { heading: "८. संपर्क", body: ["या अटींबाबत प्रश्नांसाठी अ‍ॅपमधून सपोर्टशी संपर्क करा."] },
      ],
    },
  },

  privacy: {
    en: {
      title: "Privacy Policy",
      intro:
        "This policy describes what we collect, why we collect it, and the choices you have.",
      sections: [
        {
          heading: "1. What we collect",
          body: [
            "Account details: name, email address, mobile number and a securely hashed password.",
            "Preferences: your chosen interface language and notification settings.",
            "Learning activity: lectures watched, watch position, completion, PDF views, test answers, scores, XP, streaks and badges.",
            "Consent records: which Terms and Privacy Policy version you accepted, when, in which language and on which platform.",
          ],
        },
        {
          heading: "2. What we do not store",
          body: [
            "We never store your password in readable form — only a bcrypt hash.",
            "We do not collect payment card details inside the app.",
          ],
        },
        {
          heading: "3. Why we use your data",
          body: [
            "To create and secure your account and verify who you are.",
            "To show your progress, dashboard, analytics, XP, streaks and leaderboard position.",
            "To send you product notifications such as new lectures, new tests and announcements.",
            "To improve course quality using aggregated statistics such as average test scores and hardest questions.",
          ],
        },
        {
          heading: "4. Video and third-party services",
          body: [
            "Lectures are hosted on YouTube as unlisted videos and embedded in the app. When a player loads, YouTube may set cookies and receive technical data under its own privacy policy.",
            "We do not use Firebase, Zoom SDK, Agora or third-party video streaming infrastructure.",
          ],
        },
        {
          heading: "5. Who can see your data",
          body: [
            "Platform administrators can see your name, email, mobile, enrolments, progress, XP and account status in order to run the platform. They cannot see your password.",
            "Other students can only see your name, avatar, level and XP on leaderboards.",
          ],
        },
        {
          heading: "6. Retention and deletion",
          body: [
            "We keep your data while your account is active.",
            "You can delete your account from Settings. This removes your profile, progress, XP and badges.",
          ],
        },
        {
          heading: "7. Your choices",
          body: [
            "You can change your language and notification preferences at any time.",
            "You can request a copy of your data or ask us to correct it by contacting support.",
          ],
        },
        {
          heading: "8. Changes",
          body: [
            "If we make a significant change we will raise the policy version and ask you to accept it before continuing to use the app.",
          ],
        },
      ],
    },
    mr: {
      title: "गोपनीयता धोरण",
      intro:
        "आम्ही कोणती माहिती गोळा करतो, का करतो आणि तुम्हाला कोणते पर्याय आहेत हे हे धोरण सांगते.",
      sections: [
        {
          heading: "१. आम्ही काय गोळा करतो",
          body: [
            "खाते माहिती: नाव, ईमेल, मोबाइल क्रमांक व सुरक्षितपणे हॅश केलेला पासवर्ड.",
            "प्राधान्ये: निवडलेली भाषा व सूचना सेटिंग्ज.",
            "अभ्यास हालचाल: पाहिलेली व्याख्याने, प्ले स्थिती, पूर्णता, पीडीएफ वापर, चाचणी उत्तरे, गुण, XP, मालिका व बॅजेस.",
            "संमती नोंदी: कोणती आवृत्ती, कधी, कोणत्या भाषेत व कोणत्या प्लॅटफॉर्मवर स्वीकारली.",
          ],
        },
        {
          heading: "२. आम्ही काय साठवत नाही",
          body: [
            "तुमचा पासवर्ड वाचनीय स्वरूपात कधीही साठवला जात नाही — केवळ bcrypt हॅश साठवला जातो.",
            "अ‍ॅपमध्ये कार्ड तपशील गोळा केले जात नाहीत.",
          ],
        },
        {
          heading: "३. माहितीचा वापर",
          body: [
            "खाते तयार करणे, सुरक्षित ठेवणे व ओळख पडताळणे.",
            "प्रगती, डॅशबोर्ड, विश्लेषण, XP, मालिका व क्रमवारी दाखवणे.",
            "नवीन व्याख्याने, चाचण्या व घोषणा यांच्या सूचना पाठवणे.",
            "सरासरी गुण व कठीण प्रश्न यांसारख्या एकत्रित आकडेवारीने सामग्रीची गुणवत्ता सुधारणे.",
          ],
        },
        {
          heading: "४. व्हिडिओ व तृतीय पक्ष सेवा",
          body: [
            "व्याख्याने YouTube वर unlisted स्वरूपात होस्ट केली जातात व अ‍ॅपमध्ये एम्बेड केली जातात. प्लेअर लोड झाल्यावर YouTube स्वतःच्या धोरणानुसार कुकीज व तांत्रिक माहिती वापरू शकते.",
            "आम्ही Firebase, Zoom SDK, Agora किंवा तृतीय पक्ष व्हिडिओ स्ट्रीमिंग यंत्रणा वापरत नाही.",
          ],
        },
        {
          heading: "५. माहिती कोण पाहू शकतो",
          body: [
            "व्यासपीठ चालवण्यासाठी प्रशासक तुमचे नाव, ईमेल, मोबाइल, प्रवेश, प्रगती, XP व खाते स्थिती पाहू शकतात. पासवर्ड पाहू शकत नाहीत.",
            "इतर विद्यार्थी केवळ क्रमवारीत तुमचे नाव, अवतार, स्तर व XP पाहू शकतात.",
          ],
        },
        {
          heading: "६. साठवण व हटवणे",
          body: [
            "खाते सक्रिय असेपर्यंत माहिती ठेवली जाते.",
            "सेटिंग्जमधून खाते हटवल्यास प्रोफाइल, प्रगती, XP व बॅजेस काढले जातात.",
          ],
        },
        {
          heading: "७. तुमचे पर्याय",
          body: [
            "भाषा व सूचना प्राधान्ये कधीही बदलू शकता.",
            "माहितीची प्रत मागणे किंवा दुरुस्ती करण्यासाठी सपोर्टशी संपर्क करा.",
          ],
        },
        {
          heading: "८. बदल",
          body: ["महत्त्वाचा बदल झाल्यास आवृत्ती वाढवून पुन्हा स्वीकृती मागितली जाईल."],
        },
      ],
    },
  },

  refund: {
    en: {
      title: "Refund Policy",
      intro:
        "This policy explains how refunds work for paid courses on MPSC Pulse.",
      sections: [
        {
          heading: "1. Digital content",
          body: [
            "Paid courses are digital learning products. Once lectures, notes or tests have been accessed, the content cannot be returned.",
          ],
        },
        {
          heading: "2. When a refund may be considered",
          body: [
            "A duplicate payment was taken for the same course.",
            "Payment was completed but access was not granted because of a technical failure on our side.",
            "The purchased course was withdrawn by us before you could reasonably use it.",
          ],
        },
        {
          heading: "3. How to request",
          body: [
            "Contact support from within the app with your registered email, the course name and the payment reference.",
            "Requests should be raised as soon as you notice the problem.",
          ],
        },
        {
          heading: "4. Processing",
          body: [
            "Approved refunds are returned to the original payment method.",
            "Timelines depend on your bank or payment provider.",
          ],
        },
        {
          heading: "5. Validity and price changes",
          body: [
            "Expiry of a course validity period is not a ground for a refund.",
            "A later price reduction, discount or switch of a course to free access is not a ground for a refund of an earlier purchase.",
          ],
        },
      ],
    },
    mr: {
      title: "परतावा धोरण",
      intro: "MPSC Pulse वरील सशुल्क कोर्सेससाठी परतावा कसा चालतो हे हे धोरण सांगते.",
      sections: [
        {
          heading: "१. डिजिटल सामग्री",
          body: [
            "सशुल्क कोर्सेस ही डिजिटल उत्पादने आहेत. व्याख्याने, नोट्स किंवा चाचण्या वापरल्यानंतर सामग्री परत करता येत नाही.",
          ],
        },
        {
          heading: "२. परतावा कधी विचारात घेतला जाऊ शकतो",
          body: [
            "एकाच कोर्ससाठी दुहेरी पेमेंट झाले असल्यास.",
            "पेमेंट पूर्ण होऊनही आमच्या तांत्रिक अडचणीमुळे प्रवेश मिळाला नसल्यास.",
            "खरेदी केलेला कोर्स वापरण्याआधीच आम्ही मागे घेतल्यास.",
          ],
        },
        {
          heading: "३. विनंती कशी करावी",
          body: [
            "नोंदणीकृत ईमेल, कोर्सचे नाव व पेमेंट संदर्भासह अ‍ॅपमधून सपोर्टशी संपर्क करा.",
            "अडचण लक्षात आल्यावर लवकरात लवकर विनंती करा.",
          ],
        },
        {
          heading: "४. प्रक्रिया",
          body: [
            "मंजूर परतावा मूळ पेमेंट पद्धतीवर परत केला जातो.",
            "कालावधी तुमच्या बँकेवर किंवा पेमेंट प्रदात्यावर अवलंबून असतो.",
          ],
        },
        {
          heading: "५. वैधता व किंमत बदल",
          body: [
            "वैधता संपणे हे परताव्याचे कारण नाही.",
            "नंतर किंमत कमी होणे, सूट मिळणे किंवा कोर्स मोफत होणे हे आधीच्या खरेदीच्या परताव्याचे कारण नाही.",
          ],
        },
      ],
    },
  },

  copyright: {
    en: {
      title: "Copyright & Content Policy",
      intro:
        "All learning material on MPSC Pulse is protected. This policy explains what is allowed and how to report a problem.",
      sections: [
        {
          heading: "1. Ownership",
          body: [
            "Lectures, notes, question banks, explanations, design and branding on MPSC Pulse belong to the platform or to the respective instructors.",
          ],
        },
        {
          heading: "2. What you may do",
          body: [
            "Watch lectures and read notes for your own MPSC preparation.",
            "Download a PDF only where the download action is shown for that material.",
          ],
        },
        {
          heading: "3. What is not allowed",
          body: [
            "Screen recording, re-uploading or mirroring lectures on any platform.",
            "Selling, renting, or sharing course access, PDFs or question banks.",
            "Removing watermarks or attribution from any material.",
          ],
        },
        {
          heading: "4. A note on protection",
          body: [
            "Where downloads are disabled we hide the download action and the server does not return a download URL. Any client-side deterrent against screenshots or recording is only a deterrent — it is not a guarantee, and we do not claim that content can be made technically impossible to copy.",
          ],
        },
        {
          heading: "5. Reporting infringement",
          body: [
            "If you believe material on MPSC Pulse infringes your copyright, contact support with a description of the work, where it appears, and your contact details.",
            "If you find MPSC Pulse content republished elsewhere, please report it to us.",
          ],
        },
      ],
    },
    mr: {
      title: "स्वामित्व व सामग्री धोरण",
      intro:
        "MPSC Pulse वरील सर्व अभ्यास सामग्री संरक्षित आहे. काय अनुमत आहे व तक्रार कशी करावी हे हे धोरण सांगते.",
      sections: [
        {
          heading: "१. मालकी",
          body: [
            "व्याख्याने, नोट्स, प्रश्नसंच, स्पष्टीकरणे, रचना व ब्रँडिंग हे व्यासपीठाचे किंवा संबंधित शिक्षकांचे आहे.",
          ],
        },
        {
          heading: "२. तुम्ही काय करू शकता",
          body: [
            "स्वतःच्या MPSC तयारीसाठी व्याख्याने पाहणे व नोट्स वाचणे.",
            "ज्या सामग्रीसाठी डाउनलोड पर्याय दिसतो तेवढीच पीडीएफ डाउनलोड करणे.",
          ],
        },
        {
          heading: "३. काय अनुमत नाही",
          body: [
            "स्क्रीन रेकॉर्डिंग करणे, व्याख्याने पुन्हा अपलोड करणे किंवा इतरत्र प्रसारित करणे.",
            "कोर्स प्रवेश, पीडीएफ किंवा प्रश्नसंच विकणे, भाड्याने देणे किंवा शेअर करणे.",
            "सामग्रीवरील वॉटरमार्क किंवा श्रेय काढणे.",
          ],
        },
        {
          heading: "४. संरक्षणाबाबत स्पष्टता",
          body: [
            "डाउनलोड बंद असल्यास डाउनलोड पर्याय लपवला जातो व सर्व्हर डाउनलोड URL देत नाही. स्क्रीनशॉट किंवा रेकॉर्डिंगविरोधी कोणतीही क्लायंट-बाजू उपाययोजना केवळ प्रतिबंधक आहे — ती हमी नाही, आणि सामग्री तांत्रिकदृष्ट्या कॉपी करणे अशक्य आहे असा दावा आम्ही करत नाही.",
          ],
        },
        {
          heading: "५. हक्कभंगाची तक्रार",
          body: [
            "MPSC Pulse वरील सामग्रीने तुमच्या स्वामित्वाचा भंग होत असल्यास, कामाचे वर्णन, स्थान व संपर्क तपशीलासह सपोर्टशी संपर्क करा.",
            "MPSC Pulse ची सामग्री अन्यत्र प्रकाशित दिसल्यास कृपया आम्हाला कळवा.",
          ],
        },
      ],
    },
  },
};
