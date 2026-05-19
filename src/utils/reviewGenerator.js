// ── Template fallback (used when OpenAI key is not set or call fails) ─────────

const positiveAdjectives = [
  'amazing', 'fantastic', 'wonderful', 'exceptional', 'outstanding',
  'excellent', 'brilliant', 'superb', 'incredible', 'impressive',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/** Returns a shuffled copy of the array */
function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const templates = {
  restaurant: {
    5: [
      (n) => `Absolutely ${pick(positiveAdjectives)} experience at ${n}! The food was delicious, the service impeccable, and the atmosphere perfect. Every dish was beautifully presented and tasted even better than it looked. Will definitely be back soon!`,
      (n) => `${n} has quickly become my favourite spot in town. The menu has something for everyone and the staff are always welcoming and attentive. The quality of ingredients is evident in every bite.`,
      (n) => `Had a truly memorable meal at ${n}. From the moment we walked in we were treated like family. The chef clearly takes pride in every dish — fresh, flavourful, and generous portions. Five stars without hesitation!`,
    ],
    4: [
      (n) => `Really enjoyed our visit to ${n}. The food was tasty and the service friendly and efficient. Loved the ambiance — cozy and welcoming. Slight wait at peak hours but absolutely worth it.`,
      (n) => `${n} delivers a great dining experience. The menu variety is impressive and everything we tried was fresh and well-prepared. Service was prompt and friendly. Will be back for sure!`,
      (n) => `Solid choice for a meal out. Food quality at ${n} is consistently good and the staff are always pleasant. Would recommend to anyone looking for a reliable spot.`,
    ],
  },
  cafe: {
    5: [
      (n) => `${n} is my go-to spot and for good reason. The coffee is exceptional, the pastries are fresh every morning, and the vibe is just right for working or catching up with friends. A gem of a cafe!`,
      (n) => `I've tried a lot of cafes in the area but ${n} stands out. The baristas really know their craft — every cup is perfect. The space is cozy and the staff always make you feel welcome.`,
      (n) => `Discovered ${n} a few months ago and I've been coming back weekly. Great coffee, fantastic baked goods, and a relaxed atmosphere that's hard to find. Exactly what a neighbourhood cafe should be.`,
    ],
    4: [
      (n) => `Really pleased with ${n}. Coffee is consistently good, the food options are varied, and the service is always friendly. Gets busy on weekends but it's worth the wait.`,
      (n) => `${n} is a great little cafe. The drinks are well made and the staff are attentive without being overbearing. Nice spot to work or meet friends.`,
      (n) => `Enjoyable visit to ${n}. Good coffee, decent food selection, and a comfortable setting. Prices are fair for the quality. Will definitely return.`,
    ],
  },
  clothing: {
    5: [
      (n) => `Shopping at ${n} is always a treat! The collection is curated and on-trend, and the staff genuinely help you find what suits you without any pushy sales tactics. Left with more than I planned but zero regrets!`,
      (n) => `${n} has become my first stop for anything fashion-related. The quality of their pieces is far above what you'd expect for the price, and the styling advice from the team is always spot-on.`,
      (n) => `I was blown away by the range at ${n}. Every piece felt carefully chosen and the store is laid out beautifully. The staff were warm, patient, and really knew their inventory. Will be back every season!`,
    ],
    4: [
      (n) => `Great shopping experience at ${n}. Good variety of styles and the staff were helpful when I needed a second opinion. Prices are fair for the quality. Found exactly what I was looking for.`,
      (n) => `Really happy with my purchase from ${n}. The quality is solid and the team made the experience enjoyable. The store is well-organised and easy to browse. Would definitely shop here again.`,
      (n) => `${n} has a solid selection and friendly staff. Found a few great pieces and the checkout was quick and easy. Nice store with a good atmosphere.`,
    ],
  },
  cosmetics: {
    5: [
      (n) => `${n} is my absolute go-to for all things beauty! The range of products is incredible and the staff are so knowledgeable — they helped me find the perfect foundation match and recommended products I didn't even know I needed. Love this place!`,
      (n) => `Every visit to ${n} feels like a treat. The staff take time to understand your skin type and preferences before recommending anything. No pressure, just genuine expert advice. Outstanding experience every time.`,
      (n) => `I've tried many beauty stores but ${n} is on another level. The product selection is vast, everything is well-displayed, and the team genuinely care about helping you find the right fit. Prices are great too!`,
    ],
    4: [
      (n) => `Really happy with my experience at ${n}. Good range of brands and the staff were helpful without being pushy. Found some great products and the store is clean and well-organised.`,
      (n) => `${n} is a solid beauty destination. Knowledgeable staff, fair prices, and a good variety of products. The tester display is well-maintained which I appreciate. Will be back!`,
      (n) => `Nice experience shopping at ${n}. The team were friendly and pointed me in the right direction. Good stock levels and a pleasant shopping environment.`,
    ],
  },
  salon: {
    5: [
      (n) => `${n} is simply the best! My stylist listened carefully to exactly what I wanted and delivered results beyond my expectations. The salon is spotlessly clean and the whole experience felt like a luxury treat.`,
      (n) => `Incredible service at ${n}. From booking to finish everything was seamless. The team is talented, professional, and genuinely passionate about what they do. Left feeling absolutely confident and happy.`,
      (n) => `Had an ${pick(positiveAdjectives)} experience at ${n}! The atmosphere is relaxing, the staff warm and welcoming, and the results speak for themselves. Booking my next appointment already!`,
    ],
    4: [
      (n) => `Really pleased with my visit to ${n}. My stylist was skilled and attentive. Got exactly what I asked for and the price was very reasonable. Happy to recommend to friends and family!`,
      (n) => `Great experience at ${n}! Everyone was friendly and professional. The salon has a great vibe and the products they use are high quality. Will definitely be back.`,
      (n) => `${n} delivers consistently good results. The team are always welcoming and make you feel comfortable throughout. A trustworthy and skilled salon.`,
    ],
  },
  gym: {
    5: [
      (n) => `${n} has completely transformed my fitness routine. The equipment is modern and always well-maintained, the trainers are genuinely supportive, and the atmosphere motivates you to push harder. Best gym I've ever been a member of!`,
      (n) => `I've been to many gyms but ${n} stands out for the community feel. The staff know members by name, the classes are varied and challenging, and the facility is always clean. Worth every penny.`,
      (n) => `Joining ${n} was one of the best decisions I've made. Excellent range of equipment, great group classes, and a positive environment. The trainers are approachable and really know their stuff.`,
    ],
    4: [
      (n) => `Really happy with ${n}. Good range of equipment, classes are well-scheduled, and the staff are friendly. Gets busy at peak times but it's a great gym overall.`,
      (n) => `${n} is a solid gym with everything you need. Clean facilities, good equipment, and helpful trainers. Good value for the membership fee.`,
      (n) => `Enjoying my membership at ${n}. The facility is well-kept and the classes are motivating. Staff are always on hand if you need guidance. Would recommend.`,
    ],
  },
  hotel: {
    5: [
      (n) => `Our stay at ${n} was absolutely wonderful. The room was immaculate, the bed incredibly comfortable, and every staff member we encountered was warm and attentive. Will absolutely be choosing ${n} for every future visit to the area.`,
      (n) => `${n} exceeded every expectation. Check-in was smooth, the room was beautifully appointed, and the little personal touches throughout our stay made us feel genuinely valued. Outstanding hospitality.`,
      (n) => `I travel frequently and ${n} is one of the best hotels I've stayed at. Perfect location, spotless rooms, and staff who go above and beyond. The breakfast alone is worth staying for!`,
    ],
    4: [
      (n) => `Really enjoyed our stay at ${n}. Comfortable room, good facilities, and friendly staff. Great location and good value for money. Would stay here again without hesitation.`,
      (n) => `${n} made for a very pleasant stay. The room was clean and well-equipped, check-in was efficient, and the team were always helpful. A solid choice for the area.`,
      (n) => `Good experience at ${n}. Comfortable beds, nice amenities, and attentive service. Minor things could be improved but overall a positive stay.`,
    ],
  },
  health: {
    5: [
      (n) => `${n} is a clinic I trust completely. The staff take time to listen, explain everything clearly, and follow up after appointments. The facility is clean and modern. Exactly the kind of healthcare experience everyone deserves.`,
      (n) => `I've been coming to ${n} for a couple of years and the quality of care is consistently excellent. The team are professional, thorough, and genuinely caring. Appointments are on time and the whole experience is stress-free.`,
      (n) => `Outstanding experience at ${n}. From reception to the consultation, everything was handled with professionalism and warmth. Felt completely at ease and left with clear, helpful guidance.`,
    ],
    4: [
      (n) => `Really pleased with ${n}. The staff are knowledgeable and attentive, the facility is clean, and appointments run on time. Would recommend to anyone looking for reliable healthcare.`,
      (n) => `Good experience at ${n}. Professional team, clear communication, and a welcoming environment. Felt well looked after throughout. Will continue to use their services.`,
      (n) => `${n} provides solid, professional care. The staff are approachable and the clinic is well-organised. Appointments are efficient without feeling rushed.`,
    ],
  },
  auto: {
    5: [
      (n) => `${n} is the only place I trust with my car. The team are honest, incredibly skilled, and always explain exactly what's needed before doing any work. Fair pricing and my car comes back in perfect condition every time.`,
      (n) => `Had an ${pick(positiveAdjectives)} experience at ${n}. They diagnosed the issue quickly, kept me updated throughout, and finished ahead of schedule. Transparent pricing and genuinely friendly service. Highly recommended!`,
      (n) => `${n} has earned a customer for life. Brought my car in for a major service and was impressed by the professionalism and attention to detail. The team clearly care about quality, not just throughput.`,
    ],
    4: [
      (n) => `Good experience at ${n}. Work was done on time, pricing was fair, and the team communicated well throughout. My car is running great. Would recommend for reliable auto service.`,
      (n) => `${n} did a great job on my car. Honest assessment, reasonable prices, and friendly staff. The work was completed as promised and I felt confident in their expertise.`,
      (n) => `Reliable service from ${n}. They sorted the issue efficiently and kept me informed. Good value and trustworthy team. Will be returning for future maintenance.`,
    ],
  },
  default: {
    5: [
      (n) => `${n} delivered an absolutely ${pick(positiveAdjectives)} experience. The team are professional, friendly, and clearly passionate about what they do. Every interaction was positive and the quality of their work speaks for itself.`,
      (n) => `Outstanding experience with ${n}. From start to finish everything exceeded my expectations. The staff are attentive, knowledgeable, and genuinely care about customer satisfaction. Five stars!`,
      (n) => `I've been really impressed by ${n}. Exceptional quality, ${pick(positiveAdjectives)} service, and a team that truly goes the extra mile. Will be recommending to everyone I know.`,
    ],
    4: [
      (n) => `Really great experience with ${n}. Professional team, good quality, and friendly service. Everything was handled smoothly and efficiently. Will definitely be using them again.`,
      (n) => `${n} impressed me with their professionalism and care. Good communication throughout and the end result was exactly what I was hoping for. Overall a very positive experience.`,
      (n) => `Happy with my experience at ${n}. The team clearly know what they're doing and were very helpful. Good value for the quality provided. Would recommend.`,
    ],
  },
};

function getCategoryKey(category = '') {
  const c = category.toLowerCase();
  if (c.includes('restaurant') || c.includes('food') || c.includes('bar') || c.includes('bakery')) return 'restaurant';
  if (c.includes('cafe') || c.includes('coffee'))                        return 'cafe';
  if (c.includes('clothing') || c.includes('fashion') || c.includes('boutique') || c.includes('apparel')) return 'clothing';
  if (c.includes('cosmetic') || c.includes('makeup') || c.includes('beauty supply') || c.includes('skincare')) return 'cosmetics';
  if (c.includes('salon') || c.includes('hair') || c.includes('beauty spa') || c.includes('spa') || c.includes('barber')) return 'salon';
  if (c.includes('gym') || c.includes('fitness') || c.includes('yoga') || c.includes('pilates')) return 'gym';
  if (c.includes('hotel') || c.includes('resort') || c.includes('inn') || c.includes('stay')) return 'hotel';
  if (c.includes('clinic') || c.includes('dental') || c.includes('pharmacy') || c.includes('hospital') || c.includes('health')) return 'health';
  if (c.includes('auto') || c.includes('car') || c.includes('garage') || c.includes('mechanic') || c.includes('service center')) return 'auto';
  if (c.includes('retail') || c.includes('shop') || c.includes('store'))  return 'clothing'; // generic retail → clothing templates
  return 'default';
}

// 3-star and below templates (honest, constructive — 6 options each so regeneration gives variety)
const lowerTemplates = {
  3: [
    (n) => `Decent experience at ${n} overall. Some things were great but there's definitely room for improvement. The staff were friendly enough and I got what I came for. Might give it another try.`,
    (n) => `Average visit to ${n}. Nothing stood out as exceptional but nothing was particularly bad either. The basics were covered and the team were polite. Okay for what it is.`,
    (n) => `Mixed experience at ${n}. There were some positives — friendly service and a reasonable price point — but a few things fell short of expectations. Worth trying if you're in the area.`,
    (n) => `It was okay at ${n}. Not bad, not great. Service was fine, the overall quality was passable. Feel like there's a better version of this place waiting to come out. Maybe next time.`,
    (n) => `Had a so-so visit to ${n}. Some things worked well, a couple of things didn't. The team were pleasant enough. Probably try it once more before making a final judgment.`,
    (n) => `${n} was alright. Nothing to rave about but nothing to complain about either. Got what I needed but left feeling like it could have been a bit better. Average overall.`,
  ],
  2: [
    (n) => `Disappointing visit to ${n}. Had higher expectations. Service was slow and the quality wasn't quite there. Maybe an off day — might try once more before writing it off.`,
    (n) => `Not quite what I hoped for at ${n}. A couple of things went wrong and the experience felt rushed. The staff were okay but the overall visit didn't meet expectations.`,
    (n) => `Below average experience at ${n}. There's potential here but it needs work. The location and concept are good but the execution needs attention.`,
    (n) => `Left ${n} feeling a bit let down. The service was inconsistent and quality wasn't what I expected for the price. Hope they sort things out because the place has potential.`,
    (n) => `Visited ${n} on a recommendation but was underwhelmed. A few things went wrong that shouldn't have. Not the worst but definitely not good enough to return soon.`,
    (n) => `${n} didn't deliver on this occasion. Slow service, below-par quality, and felt like they weren't particularly bothered. Hopefully just an off day — wouldn't write it off entirely just yet.`,
  ],
  1: [
    (n) => `Unfortunately had a very poor experience at ${n}. Hoping they take feedback on board and improve, as there's clearly potential.`,
    (n) => `Really let down by ${n} on this occasion. Several things went wrong and the overall experience was not good. Would not return unless things significantly improve.`,
    (n) => `Not a good experience at ${n}. Poor service and quality that didn't match what was advertised. Hopefully just a one-off.`,
    (n) => `${n} was a real disappointment. Nothing worked as it should — the service was poor and the quality was well below what's acceptable. Wouldn't recommend based on my visit.`,
    (n) => `Very poor visit to ${n}. The staff seemed disorganised and the overall quality was not acceptable. Left frustrated. Needs major improvement across the board.`,
    (n) => `Gave ${n} a chance based on reviews but had a genuinely bad experience. Service was slow and dismissive and the quality was poor. Hopefully they improve — right now I can't recommend it.`,
  ],
};

function getTemplateReviews(businessName, category, rating) {
  let pool;
  if (rating <= 3) {
    pool = lowerTemplates[rating] ?? lowerTemplates[3];
  } else {
    const key      = getCategoryKey(category);
    const ratingKey = rating >= 5 ? 5 : 4;
    pool = templates[key]?.[ratingKey] ?? templates.default[ratingKey];
  }
  // Pick 3 randomly from the pool so regeneration always gives a different set
  return shuffled(pool).slice(0, 3).map(fn => fn(businessName));
}

// ── OpenAI generation (via Supabase Edge Function — key never hits the browser) ─

function buildPrompt(businessName, category, rating, ctx) {
  const {
    description, highlights, vibe = [],
    products, staffNames, customerTypes,
    complainedFeatures, tone = 'casual', reviewLength = 'medium',
  } = ctx;

  const sentimentMap = {
    5: 'had a genuinely great experience',
    4: 'had a good experience with minor room for improvement',
    3: 'had a mixed experience — some things were good, others not',
    2: 'was somewhat disappointed',
    1: 'had a poor experience and wants to be honest about it',
  };
  const experienceLine = sentimentMap[rating] ?? 'visited';

  const toneGuide = {
    casual:       'casual and conversational — like texting a friend. Short sentences OK. Occasional informal phrasing ("def", "tbh", "honestly"). No stiff language.',
    enthusiastic: 'enthusiastic and warm. Excited but believable — not over the top.',
    neutral:      'balanced and honest — acknowledges both positives and areas to improve. Matter-of-fact tone.',
    professional: 'polished and articulate — complete sentences, measured praise, no slang.',
  };

  const wordMap = { short: '20–30', medium: '30–45', long: '45–60' };
  const wordCount = wordMap[reviewLength] ?? '30–45';

  const ctx_lines = [];
  if (description)                      ctx_lines.push(`About: ${description}`);
  if (products)                         ctx_lines.push(`Products/services: ${products}`);
  if (complainedFeatures || highlights)  ctx_lines.push(`Most praised: ${complainedFeatures || highlights}`);
  if (vibe.length > 0)                  ctx_lines.push(`Ambience: ${vibe.join(', ')}`);
  if (staffNames)                       ctx_lines.push(`Staff names: ${staffNames}`);
  if (customerTypes)                    ctx_lines.push(`Typical customers: ${customerTypes}`);

  const contextBlock = ctx_lines.length > 0
    ? `\n\nBUSINESS CONTEXT:\n${ctx_lines.join('\n')}`
    : '';

  const personas = customerTypes
    ? customerTypes.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3)
    : ['first-time visitor', 'regular customer', 'someone visiting for a special occasion'];
  while (personas.length < 3) personas.push(['another regular', 'a first-timer', 'someone on a special visit'][personas.length - 1] ?? 'a customer');

  const staffInstruction = staffNames
    ? `- At least ONE review must naturally mention a staff member by first name (pick from: ${staffNames}). Make it organic.`
    : '';

  const productInstruction = products
    ? `- At least ONE review must casually mention a specific product or service from: ${products}.`
    : '';

  const languageInstruction = (ctx.language && ctx.language !== 'English')
    ? `\nLANGUAGE: Write ALL 3 reviews entirely in ${ctx.language}. Do not mix English in. The reviews must read naturally to a native ${ctx.language} speaker.\n`
    : '';

  return `You write realistic Google reviews. Every review you produce could have been typed by a real customer on their phone.
[variation-seed: ${Math.random().toString(36).slice(2, 8)}]

BUSINESS: "${businessName}" — a ${category}
CUSTOMER EXPERIENCE: ${experienceLine} (${rating}/5 stars)${contextBlock}

Write exactly 3 Google reviews:
Review 1 — customer type: ${personas[0]}
Review 2 — customer type: ${personas[1]}
Review 3 — customer type: ${personas[2]}

TONE: ${toneGuide[tone] ?? toneGuide.casual}
LENGTH: Each review should be about ${wordCount} words.
${languageInstruction}

STRICT RULES:
- Each review must sound like a completely different person — different vocab, rhythm, focus point.
- Vary the opening: one can start with what they bought, one with who helped them, one with why they came.
${staffInstruction}
${productInstruction}
- Each review must include ONE emotional outcome: feeling confident, comfortable, happy, not rushed, valued, surprised, relieved, excited about a purchase, etc.
- BANNED words/phrases: "excellent service", "highly recommended", "best store ever", "hidden gem", "top-notch", "second to none", "look no further", "amazing experience" as standalone sentence, "I would recommend".
- No emojis. No markdown. No numbering. No bullet points.
- Do NOT start any review with the business name.
- Occasional casual grammar is fine and encouraged.

Separate the 3 reviews with exactly ||| on its own line. Output only the reviews — no labels, no preamble.`;
}

async function generateWithAI(businessName, category, rating, ctx = {}) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return null;

  const prompt = buildPrompt(businessName, category, rating, ctx);

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 45_000);

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/generate-reviews`, {
      method:  'POST',
      signal:  controller.signal,
      headers: {
        'Content-Type': 'application/json',
        apikey:         import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
        Authorization:  `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''}`,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      console.warn('[ReviewGen] Edge Function returned', res.status, '— falling back to templates');
      return null;
    }

    const json = await res.json();

    if (json.fallbackReason) {
      console.warn('[ReviewGen] AI unavailable:', json.fallbackReason, '— using templates');
      return null;
    }

    return json.reviews ?? null;
  } catch (err) {
    const reason = err?.name === 'AbortError' ? 'timeout' : 'network';
    console.warn(`[ReviewGen] fetch failed (${reason}):`, err, '— using templates');
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns { reviews: string[], isAI: boolean }.
 *
 * isAI = true  → OpenAI generated, personalised to the business.
 * isAI = false → Template fallback (OpenAI unavailable / not configured).
 *
 * Callers can use isAI to show a subtle "AI-powered" indicator in the UI,
 * and the console.warn above makes fallbacks visible in DevTools / Supabase
 * Function logs so ops knows when the AI pipeline is broken.
 */
export async function generateReviews(businessName, category, rating, context = {}) {
  const aiReviews = await generateWithAI(businessName, category, rating, context);
  if (aiReviews) return { reviews: aiReviews, isAI: true };
  return { reviews: getTemplateReviews(businessName, category, rating), isAI: false };
}