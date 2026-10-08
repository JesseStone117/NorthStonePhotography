export const categories = [
  { id: 'graduation', title: 'Graduation', tag: 'The next beginning', description: 'Big dreams. A well-earned moment.', cover: 'graduation-rmgrad-71' },
  { id: 'couples', title: 'Couples & Engagement', tag: 'Your kind of love', description: 'The two of you, just as you are.', cover: 'couples-carbaugh-240' },
  { id: 'family', title: 'Family', tag: 'Your favorite people', description: 'Little hands. A whole lot of heart.', cover: 'family-img-0249' },
  { id: 'maternity', title: 'Maternity', tag: 'A love already growing', description: 'The sweetest kind of anticipation.', cover: 'maternity-eden-2' },
];

export const favorites = [
  'couples-good-148', 'family-kings-007', 'graduation-adriannygrad-030',
  'maternity-img-8396', 'couples-mbvacation-048', 'graduation-mw-056',
  'family-img-0249', 'maternity-eden-3', 'couples-osborne-053',
  'graduation-rmgrad-71', 'couples-good-123', 'family-kings-117',
  'maternity-eden-2', 'couples-carbaugh-240', 'family-crac2025-32',
  'graduation-cggrad-242', 'maternity-img-8174', 'couples-good-332',
];

export const descriptions = {
  'couples-good-148': 'A couple sharing a close embrace in an autumn field',
  'couples-good-123': 'A candid black-and-white portrait of a laughing couple',
  'couples-good-194': 'A couple walking hand in hand along a leafy trail',
  'couples-good-211': 'A black-and-white close-up of a couple holding hands',
  'couples-good-332': 'A smiling woman showing her engagement ring while holding her partner’s hand',
  'couples-carbaugh-240': 'A couple embracing beneath brilliant orange autumn leaves',
  'couples-carbaugh-257': 'A black-and-white detail of two people holding hands',
  'couples-carbaugh-6': 'A close-up of an engagement ring against a partner’s plaid shirt',
  'couples-ci-002': 'A quiet black-and-white glimpse of a couple through a window',
  'couples-ci-048': 'A couple together in a wildflower meadow in black and white',
  'couples-arizona2026-82': 'A couple smiling at each other in a black-and-white portrait',
  'couples-mbvacation-041': 'A joyful couple embracing on the beach at sunset',
  'couples-mbvacation-048': 'A couple holding hands on the beach under a pink evening sky',
  'couples-mbvacation-126': 'A couple taking an evening walk by the ocean',
  'couples-osborne-035': 'A couple sharing a quiet moment in a forest filled with golden light',
  'couples-osborne-053': 'A black-and-white photograph of a couple walking through the woods',
  'couples-osborne-214': 'A playful couple peeking around a tree in the forest',
  'family-img-0249': 'Parents holding their baby close in a sunlit field',
  'family-img-0348': 'A father cradling his baby outdoors in soft natural light',
  'family-kings-007': 'A tender black-and-white close-up of a mother and her newborn',
  'family-kings-083': 'A candid black-and-white family moment among the trees',
  'family-kings-117': 'Parents lifting their child between them in a green woodland clearing',
  'family-kings-238': 'A family walking hand in hand through the forest at golden hour',
  'family-crac2025-32': 'A family standing together among the grasses at sunset',
  'family-crac2025-40': 'A mother and her young child sharing a close embrace at sunset',
  'family-arizona2026-12': 'An extended family smiling together in a desert landscape at sunset',
  'family-arizona2026-96': 'A black-and-white photograph of a father walking with his toddler',
  'family-mbvacation-143': 'Parents holding their two young children beside the ocean',
  'family-mbvacation-149': 'An extended family gathered on the beach in the evening light',
  'graduation-272': 'A smiling graduate holding her diploma and flowers in a navy graduation gown',
  'graduation-ad-095': 'A graduate in a red gown standing beneath sunlit campus trees',
  'graduation-adriannygrad-030': 'A graduate in a red cap and gown smiling on the campus steps',
  'graduation-cggrad-220': 'A graduate in a red gown posing on a campus walkway',
  'graduation-cggrad-242': 'A smiling graduate in his cap sitting on a bench beneath spring trees',
  'graduation-img-7158': 'A graduate in a red cap and gown celebrating beside a campus tree',
  'graduation-img-7260': 'A close-up of a graduation tassel against a red cap',
  'graduation-mw-034': 'A graduate in a red cap and gown sitting beside a stone wall',
  'graduation-mw-056': 'A graduate in a red cap and gown in warm evening light',
  'graduation-rmgrad-58': 'A graduate standing in front of a brick campus building',
  'graduation-rmgrad-71': 'A smiling graduate in a red cap and gown seated on a sunny park bench',
  'maternity-78-img-5164': 'Expectant parents forming a heart with their hands over a floral dress',
  'maternity-eden-2': 'An expectant mother in a soft green dress holding wildflowers',
  'maternity-eden-3': 'An expectant couple sharing an embrace in the woods in black and white',
  'maternity-img-8110': 'Expectant parents holding ultrasound photographs in a winter landscape',
  'maternity-img-8174': 'An expectant mother holding tiny baby shoes against a soft green dress',
  'maternity-img-8216': 'An expectant mother silhouetted beside the water beneath leafy branches',
  'maternity-img-8396': 'An expectant mother holding flowers at her belly beside the water at sunset',
};

export function orderPortfolio(photos) {
  const rank = new Map(favorites.map((id, index) => [id, index]));
  return photos.filter(photo => categories.some(category => category.id === photo.category))
    .sort((a, b) => (rank.get(a.id) ?? 1000) - (rank.get(b.id) ?? 1000));
}

export function filterPortfolio(photos, category) {
  return category === 'all' ? photos : photos.filter(photo => photo.category === category);
}

export function inquiryEmail(data, email) {
  const category = categories.find(item => item.id === data.session);
  if (!category) throw new Error('Please choose a session type.');
  const name = data.name.trim();
  const replyTo = data.email.trim();
  const message = data.message.trim();
  if (!name || !replyTo || !message) throw new Error('Please add your name, email, and a little about your story.');
  const subject = `${category.title} session inquiry — ${name}`;
  const body = `Hi Sarah,\n\nI’d love to plan a ${category.title.toLowerCase()} session.\n\nName: ${name}\nEmail: ${replyTo}\nSession: ${category.title}\nPreferred date: ${data.date || 'Flexible'}\nLocation: ${data.location?.trim() || 'Let’s find a place together'}\n\nA little about my story:\n${message}\n\nLooking forward to hearing from you!`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
