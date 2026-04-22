// Netlify serverless function for Claude-powered show analysis
// Uses raw fetch instead of SDK to avoid npm dependency for drag-and-drop deploy

const FANDOMS = {
  romantasy: { label: "Romantasy", audience: 8500000, category: "Fantasy & Sci-Fi", connections: ["booktok", "dark_romance", "fantasy_epic", "fae_fantasy", "ya_fantasy"] },
  fantasy_epic: { label: "Epic Fantasy", audience: 12000000, category: "Fantasy & Sci-Fi", connections: ["grimdark", "progression_fantasy", "litrpg", "romantasy", "tabletop_rpg"] },
  grimdark: { label: "Grimdark Fantasy", audience: 3200000, category: "Fantasy & Sci-Fi", connections: ["fantasy_epic", "dark_romance", "cosmic_horror", "military_fantasy"] },
  urban_fantasy: { label: "Urban Fantasy", audience: 5500000, category: "Fantasy & Sci-Fi", connections: ["paranormal_romance", "vampire", "werewolf", "witchcraft", "ya_fantasy"] },
  cozy_fantasy: { label: "Cozy Fantasy", audience: 2800000, category: "Fantasy & Sci-Fi", connections: ["romantasy", "cottagecore", "slice_of_life", "booktok"] },
  fae_fantasy: { label: "Fae / Faerie Fantasy", audience: 4100000, category: "Fantasy & Sci-Fi", connections: ["romantasy", "dark_romance", "ya_fantasy", "booktok"] },
  military_fantasy: { label: "Military Fantasy", audience: 2200000, category: "Fantasy & Sci-Fi", connections: ["grimdark", "fantasy_epic", "progression_fantasy", "space_opera"] },
  space_opera: { label: "Space Opera", audience: 7000000, category: "Fantasy & Sci-Fi", connections: ["hard_scifi", "military_fantasy", "anime_manga", "space_western"] },
  hard_scifi: { label: "Hard Sci-Fi", audience: 4500000, category: "Fantasy & Sci-Fi", connections: ["space_opera", "cyberpunk", "cli_fi", "tech_thriller"] },
  cyberpunk: { label: "Cyberpunk", audience: 5200000, category: "Fantasy & Sci-Fi", connections: ["hard_scifi", "anime_manga", "indie_games", "dystopian"] },
  dystopian: { label: "Dystopian", audience: 9000000, category: "Fantasy & Sci-Fi", connections: ["ya_fantasy", "cyberpunk", "cli_fi", "literary_fiction"] },
  ya_fantasy: { label: "YA Fantasy", audience: 11000000, category: "Fantasy & Sci-Fi", connections: ["romantasy", "fae_fantasy", "dystopian", "booktok", "urban_fantasy"] },
  progression_fantasy: { label: "Progression Fantasy", audience: 3500000, category: "Fantasy & Sci-Fi", connections: ["litrpg", "fantasy_epic", "web_serial", "anime_manga", "xianxia"] },
  litrpg: { label: "LitRPG", audience: 2900000, category: "Fantasy & Sci-Fi", connections: ["progression_fantasy", "web_serial", "indie_games", "tabletop_rpg"] },
  xianxia: { label: "Xianxia / Wuxia", audience: 6000000, category: "Fantasy & Sci-Fi", connections: ["progression_fantasy", "anime_manga", "web_serial", "martial_arts"] },
  space_western: { label: "Space Western", audience: 1800000, category: "Fantasy & Sci-Fi", connections: ["space_opera", "western", "hard_scifi"] },
  dark_romance: { label: "Dark Romance", audience: 6200000, category: "Romance & Drama", connections: ["romantasy", "booktok", "grimdark", "paranormal_romance", "spicy_romance"] },
  paranormal_romance: { label: "Paranormal Romance", audience: 4800000, category: "Romance & Drama", connections: ["dark_romance", "vampire", "werewolf", "urban_fantasy", "spicy_romance"] },
  spicy_romance: { label: "Spicy / Steamy Romance", audience: 7500000, category: "Romance & Drama", connections: ["dark_romance", "booktok", "paranormal_romance", "contemporary_romance"] },
  contemporary_romance: { label: "Contemporary Romance", audience: 9500000, category: "Romance & Drama", connections: ["spicy_romance", "booktok", "romcom", "literary_fiction"] },
  romcom: { label: "Romantic Comedy", audience: 8000000, category: "Romance & Drama", connections: ["contemporary_romance", "booktok", "slice_of_life"] },
  literary_fiction: { label: "Literary Fiction", audience: 6500000, category: "Romance & Drama", connections: ["contemporary_romance", "dystopian", "historical_fiction", "book_clubs"] },
  historical_fiction: { label: "Historical Fiction", audience: 5800000, category: "Romance & Drama", connections: ["literary_fiction", "western", "book_clubs", "regency"] },
  regency: { label: "Regency / Period Drama", audience: 4200000, category: "Romance & Drama", connections: ["historical_fiction", "contemporary_romance", "booktok"] },
  cosmic_horror: { label: "Cosmic Horror", audience: 3800000, category: "Horror & Thriller", connections: ["grimdark", "slasher", "weird_fiction", "podcast_fiction"] },
  slasher: { label: "Slasher / Gore", audience: 4500000, category: "Horror & Thriller", connections: ["final_girl", "cosmic_horror", "true_crime", "horror_comedy"] },
  final_girl: { label: "Final Girl / Survival Horror", audience: 3200000, category: "Horror & Thriller", connections: ["slasher", "true_crime", "ya_fantasy", "horror_comedy"] },
  true_crime: { label: "True Crime", audience: 15000000, category: "Horror & Thriller", connections: ["podcast_fiction", "slasher", "final_girl", "tech_thriller", "mystery"] },
  mystery: { label: "Mystery / Whodunit", audience: 8500000, category: "Horror & Thriller", connections: ["true_crime", "tech_thriller", "cozy_mystery", "literary_fiction"] },
  cozy_mystery: { label: "Cozy Mystery", audience: 3600000, category: "Horror & Thriller", connections: ["mystery", "cozy_fantasy", "book_clubs", "slice_of_life"] },
  tech_thriller: { label: "Tech Thriller", audience: 4000000, category: "Horror & Thriller", connections: ["hard_scifi", "cyberpunk", "true_crime", "mystery"] },
  horror_comedy: { label: "Horror Comedy", audience: 2500000, category: "Horror & Thriller", connections: ["slasher", "final_girl", "weird_fiction"] },
  weird_fiction: { label: "Weird Fiction / New Weird", audience: 1800000, category: "Horror & Thriller", connections: ["cosmic_horror", "horror_comedy", "literary_fiction"] },
  booktok: { label: "BookTok", audience: 20000000, category: "Community & Platform", connections: ["romantasy", "dark_romance", "spicy_romance", "ya_fantasy", "contemporary_romance", "fae_fantasy", "cozy_fantasy"] },
  book_clubs: { label: "Book Clubs / Reese, Oprah", audience: 12000000, category: "Community & Platform", connections: ["literary_fiction", "historical_fiction", "contemporary_romance", "mystery", "cozy_mystery"] },
  fanfiction: { label: "Fanfiction (AO3/Wattpad)", audience: 18000000, category: "Community & Platform", connections: ["anime_manga", "kpop", "ya_fantasy", "dark_romance", "web_serial"] },
  web_serial: { label: "Web Serial (Royal Road)", audience: 5000000, category: "Community & Platform", connections: ["litrpg", "progression_fantasy", "fanfiction", "xianxia", "indie_games"] },
  podcast_fiction: { label: "Fiction Podcasts", audience: 8000000, category: "Community & Platform", connections: ["true_crime", "cosmic_horror", "audio_drama", "indie_creators"] },
  audio_drama: { label: "Audio Drama", audience: 3500000, category: "Community & Platform", connections: ["podcast_fiction", "indie_creators", "horror_comedy"] },
  indie_creators: { label: "Indie Creator Economy", audience: 10000000, category: "Community & Platform", connections: ["podcast_fiction", "web_serial", "indie_games", "audio_drama"] },
  anime_manga: { label: "Anime / Manga", audience: 25000000, category: "Genre Fiction", connections: ["xianxia", "progression_fantasy", "fanfiction", "kpop", "cyberpunk", "space_opera"] },
  kpop: { label: "K-Pop / K-Drama", audience: 22000000, category: "Genre Fiction", connections: ["anime_manga", "fanfiction", "contemporary_romance", "romcom"] },
  vampire: { label: "Vampire Fiction", audience: 5500000, category: "Genre Fiction", connections: ["paranormal_romance", "urban_fantasy", "dark_romance", "werewolf", "gothic"] },
  werewolf: { label: "Werewolf / Shifter", audience: 4200000, category: "Genre Fiction", connections: ["paranormal_romance", "urban_fantasy", "vampire", "dark_romance"] },
  witchcraft: { label: "Witchcraft / Witch Lit", audience: 3800000, category: "Genre Fiction", connections: ["urban_fantasy", "cottagecore", "fae_fantasy", "paranormal_romance"] },
  gothic: { label: "Gothic Fiction", audience: 3000000, category: "Genre Fiction", connections: ["vampire", "literary_fiction", "dark_romance", "weird_fiction"] },
  western: { label: "Western", audience: 2500000, category: "Genre Fiction", connections: ["historical_fiction", "space_western", "literary_fiction"] },
  cli_fi: { label: "Climate Fiction", audience: 2000000, category: "Genre Fiction", connections: ["dystopian", "hard_scifi", "literary_fiction"] },
  martial_arts: { label: "Martial Arts Fiction", audience: 3500000, category: "Genre Fiction", connections: ["xianxia", "anime_manga", "progression_fantasy"] },
  cottagecore: { label: "Cottagecore / Pastoral", audience: 6000000, category: "Niche & Emerging", connections: ["cozy_fantasy", "witchcraft", "slice_of_life", "booktok"] },
  slice_of_life: { label: "Slice of Life", audience: 4500000, category: "Niche & Emerging", connections: ["cozy_fantasy", "cottagecore", "romcom", "anime_manga", "cozy_mystery"] },
  indie_games: { label: "Indie Game Narratives", audience: 15000000, category: "Niche & Emerging", connections: ["litrpg", "cyberpunk", "web_serial", "tabletop_rpg", "indie_creators"] },
  tabletop_rpg: { label: "Tabletop RPG / D&D", audience: 13000000, category: "Niche & Emerging", connections: ["fantasy_epic", "litrpg", "indie_games", "podcast_fiction"] },
  solarpunk: { label: "Solarpunk", audience: 1200000, category: "Niche & Emerging", connections: ["cli_fi", "cottagecore", "hard_scifi"] },
  mythic_retelling: { label: "Mythic Retelling", audience: 5000000, category: "Niche & Emerging", connections: ["literary_fiction", "romantasy", "historical_fiction", "ya_fantasy"] },
  afrofuturism: { label: "Afrofuturism", audience: 3000000, category: "Niche & Emerging", connections: ["space_opera", "cyberpunk", "literary_fiction", "indie_creators"] },
};

const SHOW_DATABASE = [
  { title: "Leverage Redemption", fandoms: ["mystery", "cozy_mystery", "tech_thriller", "slice_of_life"], themes: ["heist", "con artists", "found family", "justice", "Robin Hood"] },
  { title: "Stranger Things", fandoms: ["cosmic_horror", "ya_fantasy", "slasher", "dystopian"], themes: ["80s nostalgia", "coming of age", "supernatural", "small town horror"] },
  { title: "Bridgerton", fandoms: ["regency", "spicy_romance", "booktok", "contemporary_romance"], themes: ["period drama", "steamy romance", "high society", "love stories"] },
  { title: "The Witcher", fandoms: ["grimdark", "fantasy_epic", "dark_romance", "anime_manga"], themes: ["monster hunting", "dark fantasy", "chosen one", "magic"] },
  { title: "Wednesday", fandoms: ["gothic", "ya_fantasy", "mystery", "horror_comedy"], themes: ["supernatural school", "dark humor", "outcasts", "coming of age"] },
  { title: "Shadow and Bone", fandoms: ["ya_fantasy", "romantasy", "fantasy_epic", "dark_romance"], themes: ["chosen one", "war", "magic systems", "slow burn romance"] },
  { title: "House of the Dragon", fandoms: ["fantasy_epic", "grimdark", "dark_romance"], themes: ["political intrigue", "dragons", "civil war", "succession"] },
  { title: "The Last of Us", fandoms: ["dystopian", "cosmic_horror", "indie_games"], themes: ["post-apocalyptic", "survival", "found family", "fungal horror"] },
  { title: "Squid Game", fandoms: ["dystopian", "kpop", "slasher", "mystery"], themes: ["survival games", "class warfare", "Korean drama", "social commentary"] },
  { title: "One Piece", fandoms: ["anime_manga", "fantasy_epic", "space_opera"], themes: ["adventure", "pirates", "found family", "world building"] },
  { title: "Fourth Wing", fandoms: ["romantasy", "ya_fantasy", "dark_romance", "booktok"], themes: ["dragon riders", "military academy", "enemies to lovers", "spicy fantasy"] },
  { title: "A Court of Thorns and Roses", fandoms: ["romantasy", "fae_fantasy", "dark_romance", "booktok", "spicy_romance"], themes: ["fae world", "mates", "spicy romance", "power awakening"] },
  { title: "Game of Thrones", fandoms: ["fantasy_epic", "grimdark", "dark_romance"], themes: ["political intrigue", "dragons", "war", "betrayal"] },
  { title: "The Bear", fandoms: ["slice_of_life", "literary_fiction"], themes: ["culinary drama", "family", "pressure", "redemption", "found family"] },
  { title: "Yellowjackets", fandoms: ["final_girl", "mystery", "slasher", "true_crime"], themes: ["survival", "dark secrets", "dual timeline", "female ensemble"] },
  { title: "Fallout", fandoms: ["dystopian", "indie_games", "cyberpunk", "space_western"], themes: ["post-nuclear", "retro-futurism", "wasteland", "dark humor"] },
  { title: "Arcane", fandoms: ["indie_games", "cyberpunk", "anime_manga", "fantasy_epic"], themes: ["class divide", "sisters", "steampunk", "animation"] },
  { title: "Percy Jackson", fandoms: ["ya_fantasy", "mythic_retelling", "fantasy_epic"], themes: ["Greek mythology", "coming of age", "quests", "chosen one"] },
  { title: "Dune", fandoms: ["space_opera", "hard_scifi", "literary_fiction"], themes: ["desert planet", "politics", "ecology", "chosen one"] },
  { title: "Baldur's Gate 3", fandoms: ["tabletop_rpg", "fantasy_epic", "indie_games", "dark_romance"], themes: ["D&D adventure", "party dynamics", "romance options", "epic quest"] },
  { title: "Critical Role", fandoms: ["tabletop_rpg", "fantasy_epic", "fanfiction", "podcast_fiction"], themes: ["actual play", "D&D campaigns", "voice actors", "epic storytelling"] },
  { title: "The Mandalorian", fandoms: ["space_opera", "space_western", "fantasy_epic"], themes: ["bounty hunter", "found family", "lone warrior", "galactic adventure"] },
  { title: "Severance", fandoms: ["dystopian", "mystery", "literary_fiction", "tech_thriller"], themes: ["corporate dystopia", "identity", "work-life split", "psychological thriller"] },
  { title: "The Boys", fandoms: ["grimdark", "cyberpunk", "horror_comedy", "dystopian"], themes: ["dark superheroes", "corporate evil", "satire", "extreme violence"] },
  { title: "Silo", fandoms: ["dystopian", "hard_scifi", "mystery", "literary_fiction"], themes: ["underground bunker", "secrets", "post-apocalyptic", "control"] },
  { title: "Demon Slayer", fandoms: ["anime_manga", "martial_arts", "fantasy_epic"], themes: ["demon hunting", "brotherhood", "swordsmanship", "tragedy"] },
  { title: "Jujutsu Kaisen", fandoms: ["anime_manga", "martial_arts", "cosmic_horror"], themes: ["cursed energy", "sorcery", "dark action", "school battles"] },
  { title: "Outlander", fandoms: ["historical_fiction", "spicy_romance", "regency", "booktok"], themes: ["time travel", "Scottish highlands", "war", "epic love"] },
  { title: "Twilight", fandoms: ["vampire", "paranormal_romance", "ya_fantasy", "dark_romance", "fanfiction"], themes: ["forbidden love", "vampires", "love triangle", "supernatural"] },
  { title: "Stardew Valley", fandoms: ["indie_games", "cottagecore", "slice_of_life", "cozy_fantasy"], themes: ["farming sim", "community", "romance", "peaceful escape"] },
];

function buildFandomReference() {
  const lines = [];
  for (const [key, f] of Object.entries(FANDOMS)) {
    lines.push(`${key}: "${f.label}" (${f.category}, ${(f.audience / 1000000).toFixed(1)}M audience)`);
  }
  return lines.join('\n');
}

async function analyzeWithClaude(query, apiKey) {
  const fandomRef = buildFandomReference();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a content intelligence analyst for 3rd Space, a media platform. Analyze the following show/movie/book/game and map it to our fandom ecosystem.

Title to analyze: "${query}"

Our fandom keys and their details:
${fandomRef}

Return a JSON object (and ONLY a JSON object, no markdown) with this structure:
{
  "title": "Official title of the show/movie/book/game",
  "fandoms": [
    { "key": "fandom_key", "label": "Fandom Label", "audience": 8500000, "reason": "Brief reason for connection" }
  ],
  "themes": ["theme1", "theme2", "theme3", "theme4", "theme5"],
  "adjacentFandoms": [
    { "key": "fandom_key", "label": "Fandom Label", "audience": 8500000 }
  ],
  "totalAudience": 45000000,
  "promoTips": [
    "Promotion tip 1",
    "Promotion tip 2",
    "Promotion tip 3"
  ]
}

Rules:
- Pick 3-6 direct fandoms from the list above that best match this title
- Pick 3-8 adjacent fandoms (connected to the direct ones but not directly matching)
- Themes should be 4-6 specific thematic keywords
- totalAudience should be the sum of all direct + adjacent fandom audiences (no double counting)
- promoTips should be 3-4 actionable promotion strategies for 3rd Space
- Only use fandom keys from the provided list
- If you do not recognize the title, still try your best guess based on the name
- IMPORTANT: Do not mix horror fandoms into non-horror shows, or romance into non-romance shows unless genuinely relevant`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.content[0].text;
  let jsonStr = text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }
  return JSON.parse(jsonStr);
}

function staticLookup(query) {
  const q = query.trim().toLowerCase();
  let match = SHOW_DATABASE.find(s => s.title.toLowerCase() === q);
  if (!match) {
    match = SHOW_DATABASE.find(s =>
      s.title.toLowerCase().includes(q) || q.includes(s.title.toLowerCase())
    );
  }
  if (!match) return null;

  const fandomDetails = match.fandoms
    .filter(k => FANDOMS[k])
    .map(k => ({
      key: k,
      label: FANDOMS[k].label,
      audience: FANDOMS[k].audience,
      reason: 'Static database match',
    }));

  const directKeys = new Set(match.fandoms);
  const adjacentKeys = new Set();
  for (const fk of match.fandoms) {
    if (FANDOMS[fk]) {
      for (const conn of FANDOMS[fk].connections || []) {
        if (!directKeys.has(conn) && FANDOMS[conn]) {
          adjacentKeys.add(conn);
        }
      }
    }
  }

  let totalAudience = 0;
  const allKeys = new Set([...directKeys, ...adjacentKeys]);
  for (const k of allKeys) {
    if (FANDOMS[k]) totalAudience += FANDOMS[k].audience;
  }

  return {
    title: match.title,
    fandoms: fandomDetails,
    themes: match.themes || [],
    adjacentFandoms: Array.from(adjacentKeys).map(k => ({
      key: k,
      label: FANDOMS[k].label,
      audience: FANDOMS[k].audience,
    })),
    totalAudience,
    promoTips: [],
    source: 'static',
  };
}

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers });
  }

  const url = new URL(req.url);
  const query = url.searchParams.get('q');

  if (!query || !query.trim()) {
    return new Response(JSON.stringify({ error: 'Missing query parameter: q' }), {
      status: 400, headers,
    });
  }

  const apiKey = Netlify.env.get('ANTHROPIC_API_KEY');

  if (!apiKey) {
    const staticResult = staticLookup(query);
    if (staticResult) {
      return new Response(JSON.stringify(staticResult), { status: 200, headers });
    }
    return new Response(JSON.stringify({ fallback: true }), { status: 200, headers });
  }

  try {
    const result = await analyzeWithClaude(query.trim(), apiKey);
    return new Response(JSON.stringify({ ...result, source: 'claude' }), {
      status: 200, headers,
    });
  } catch (err) {
    console.error('Claude API error:', err.message || err);
    const staticResult = staticLookup(query);
    if (staticResult) {
      return new Response(JSON.stringify(staticResult), { status: 200, headers });
    }
    return new Response(JSON.stringify({ fallback: true, error: 'AI analysis unavailable' }), {
      status: 200, headers,
    });
  }
};

export const config = {
  path: "/api/analyze-show"
};
