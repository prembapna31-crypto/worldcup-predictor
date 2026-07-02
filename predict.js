export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { apiKey, teamA, teamB, stage } = req.body;

  if (!apiKey || !teamA || !teamB) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const prompt = `You are a world-class football analyst covering FIFA World Cup 2026. Analyse this match:

${teamA} vs ${teamB} — Stage: ${stage}

Return ONLY a valid JSON object (no markdown, no backticks) with exactly this structure:
{
  "winner": "team name or DRAW",
  "confidence": "67%",
  "prob_a": 55,
  "prob_b": 35,
  "prob_draw": 10,
  "score_a": 2,
  "score_b": 1,
  "overview": "2-3 sentence punchy overview of why this match matters and who has the edge. Be opinionated but grounded.",
  "factors": [
    {"icon": "📈", "text": "factor 1 — specific, insightful"},
    {"icon": "🛡️", "text": "factor 2 — specific, insightful"},
    {"icon": "⚡", "text": "factor 3 — specific, insightful"}
  ],
  "tactics": "2-3 sentences on how each team will set up tactically and where the battle will be won or lost.",
  "player_watch": "Name one key player from either side and explain in 1-2 sentences why they could be the difference-maker."
}

Be specific with real knowledge about these teams — their managers, style, key players, recent form, and World Cup 2026 campaign. Make it fun to read but analytically credible.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    const raw = data.content.map(c => c.text || '').join('');
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
