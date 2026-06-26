/* LLM trip narrative generator */
var STORAGE_KEY = 'locus.llmConfig';

var DEFAULT_CONFIG = {
  endpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-4o-mini',
  apiKey: ''
};

export function getLLMConfig() {
  if (typeof window === 'undefined' || !window.localStorage) return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  try {
    var raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return Object.assign(JSON.parse(JSON.stringify(DEFAULT_CONFIG)), JSON.parse(raw));
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

export function saveLLMConfig(config) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch (e) {}
}

function buildPrompt(trip, placeNames) {
  var startStr = trip.startTime ? trip.startTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  var endStr = trip.endTime ? trip.endTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  var durationDays = trip.startTime && trip.endTime
    ? Math.ceil((trip.endTime.getTime() - trip.startTime.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0;

  var places = [];
  if (trip.path) {
    var seen = {};
    for (var i = 0; i < trip.path.length; i++) {
      var key = trip.path[i].lat.toFixed(4) + ', ' + trip.path[i].lng.toFixed(4);
      if (!seen[key] && placeNames[key]) {
        seen[key] = true;
        var pn = placeNames[key];
        places.push(pn.city || pn.district || pn.formatted || key);
      }
    }
  }

  return [
    '\u4f60\u662f\u4e00\u4f4d\u65c5\u884c\u53d9\u4e8b\u8005\u3002',
    '',
    '\u65f6\u95f4\uff1a' + startStr + ' \u81f3 ' + endStr,
    '\u7167\u7247\u6570\uff1a' + (trip.photoCount || 0),
    '\u9014\u7ecf\u5730\u70b9\uff1a' + (places.length > 0 ? places.join('\u3001') : '\u672a\u77e5'),
    '',
    '{"name": "\u65c5\u884c\u540d\u79f0", "description": "\u65c5\u884c\u63f8\u8ff0"}'
  ].join('\\n\n');
}

function parseLLMResponse(text) {
  try { return JSON.parse(text); } catch (e) {}
  var m = text.match(/```(?:json)?\s*\n?([\\s\S]*?)\n?```/);
  if (m) { try { return JSON.parse(m[1]); } catch (e2) {} }
  var s = text.indexOf('{'), e = text.lastIndexOf('}');
  if (s >= 0 && e > s) { try { return JSON.parse(text.slice(s, e + 1)); } catch (e2) {} }
  return null;
}

export async function generateTripNarrative(trip, placeNames, config) {
  var cfg = config || getLLMConfig();
  if (!cfg.apiKey) return null;
  var prompt = buildPrompt(trip, placeNames);
  var res = await fetch(cfg.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: 'system', content: 'You are a JSON generator. Output only JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7, max_tokens: 500
    })
  });
  if (!res.ok) throw new Error('LLM API error ' + res.status);
  var data = await res.json();
  var text = (data.choices && data.choices[0] && data.choices[0].message) ? data.choices[0].message.content : '';
  var parsed = parseLLMResponse(text);
  if (!parsed) return null;
  return { name: parsed.name || '', description: parsed.description || '', generatedAt: new Date().toISOString() };
}
