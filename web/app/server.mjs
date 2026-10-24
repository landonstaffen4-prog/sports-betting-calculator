// The build embeds engine.mjs, page, style and client into one Worker module.
const RATE = new Map();
// BET99 is documented paid-only; the default request stays on free-tier coverage.
const FIXED_BOOKS = [...Object.keys(ONTARIO).filter(k=>k!=='bet99_ca_on'),...Object.keys(REFERENCES)];
const PROP_MARKETS = ['player_points','player_rebounds','player_assists','player_threes','player_points_rebounds_assists'];
const ERRORS = {INVALID_KEY:'The data provider rejected the API key.',DEACTIVATED_KEY:'This data key is inactive.',OUT_OF_USAGE_CREDITS:'The data plan has no usage credits remaining.',EXCEEDED_FREQ_LIMIT:'The provider rate limit was reached. Wait before retrying.',EVENT_NOT_FOUND:'The event is no longer available.',INVALID_MARKET:'This market is not supported by the data plan.',INVALID_MARKET_COMBO:'The requested markets are not supported together.'};
function response(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}});}
function limited(user,now){const prior=RATE.get(user)||{last:0,since:now,n:0};if(now-prior.since>3600000){prior.since=now;prior.n=0;}if(now-prior.last<10000||prior.n>=30)return true;prior.last=now;prior.n++;RATE.set(user,prior);if(RATE.size>1000)RATE.delete(RATE.keys().next().value);return false;}
async function readBody(request){const raw=await request.text();if(raw.length>40000)throw new Error('Request too large');const body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('Object required');return body;}
function demoEvents(now){const ts=new Date(now).toISOString(),start=new Date(now+3*3600000).toISOString();return [{id:'demo-event-only',sport_key:'basketball_nba',home_team:'DEMO Harbor',away_team:'DEMO Valley',commence_time:start,bookmakers:[
 {key:'betano_ca_on',title:'DEMO Ontario offer',markets:[{key:'totals',last_update:ts,outcomes:[{name:'Over',point:221.5,price:2.05},{name:'Under',point:221.5,price:1.78}]}]},
 ...[['pinnacle',1.75,2.1],['betonlineag',1.72,2.15],['fanduel',1.7,2.2],['draftkings',1.74,2.12]].map(([key,o,u])=>({key,title:'DEMO '+REFERENCES[key],markets:[{key:'totals',last_update:ts,outcomes:[{name:'Over',point:221.5,price:o},{name:'Under',point:221.5,price:u}]}]}))
 ]}];}
export async function handleRequest(request,env={},fetcher=fetch){
 const url=new URL(request.url),path=url.pathname,now=Date.now();
 if(path==='/api/config')return response({version:VERSION,serverKeyConfigured:!!env.ODDS_API_KEY,privateSite:true,books:ONTARIO,references:REFERENCES,sports:SPORTS,policy:DEFAULT_POLICY,creditsEstimate:3,newsSource:'https://official.nba.com/nba-injury-report-2026-27-season/'});
 if(path==='/api/demo'){return response({events:demoEvents(now),mode:'demo',fetchedAt:new Date(now).toISOString(),warning:'Invented events and prices. Never place these bets.'});}
 if(path==='/api/health')return response({ok:true,version:VERSION,liveFeedConnected:!!env.ODDS_API_KEY,independentModelValidated:false});
 if(path==='/api/scan'||path==='/api/props'){
  if(request.method!=='POST')return response({error:'Use POST'},405);
  const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return response({error:'Cross-origin request rejected'},403);
  const user=request.headers.get('oai-authenticated-user-id');if(!user)return response({error:'Sign in to the private site before fetching account data.'},401);
  let body;try{body=await readBody(request);}catch{return response({error:'Invalid or oversized JSON request'},400);}
  const key=request.headers.get('x-odds-api-key')||env.ODDS_API_KEY;
  if(!key)return response({error:'Connect a data API key in Settings. No live feed is connected.'},428);
  if(!/^[a-zA-Z0-9_-]{12,128}$/.test(key))return response({error:'Invalid API key format'},400);
  const sport=body.sport||'basketball_nba';if(!Object.hasOwn(SPORTS,sport))return response({error:'Unsupported sport'},400);
  let markets=['h2h','spreads','totals'];let endpoint='https://api.the-odds-api.com/v4/sports/'+sport+'/odds';
  if(path==='/api/props'){
   if(sport!=='basketball_nba')return response({error:'The first prop adapter supports NBA only.'},400);
   if(typeof body.eventId!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(body.eventId))return response({error:'Choose an event from a fetched slate'},400);
   markets=Array.isArray(body.markets)?body.markets:['player_points','player_rebounds','player_assists'];if(!markets.length||markets.length>3||markets.some(m=>!PROP_MARKETS.includes(m)))return response({error:'Choose one to three supported NBA prop markets'},400);
   endpoint='https://api.the-odds-api.com/v4/sports/'+sport+'/events/'+encodeURIComponent(body.eventId)+'/odds';
  }
  if(limited(user,now))return response({error:'Fetch budget reached. Wait at least 10 seconds between requests; this instance allows 30 per hour.'},429);
  const upstream=new URL(endpoint);upstream.search=new URLSearchParams({apiKey:key,bookmakers:FIXED_BOOKS.join(','),markets:markets.join(','),oddsFormat:'decimal',dateFormat:'iso'}).toString();
  let raw;try{raw=await fetcher(upstream.toString(),{headers:{accept:'application/json'},signal:AbortSignal.timeout(18000)});}catch{return response({error:'The odds provider did not respond. Previous results are not refreshed.'},502);}
  let data;try{data=await raw.json();}catch{return response({error:'Invalid provider response; no new prices accepted'},502);}
  if(!raw.ok){const code=typeof data?.error_code==='string'?data.error_code:'';return response({error:ERRORS[code]||(raw.status===401?'API key or plan access was rejected.':raw.status===429?'Provider rate limit reached.':'The provider rejected this request. Check plan and coverage.'),code:ERRORS[code]?code:undefined},raw.status===401||raw.status===403?401:raw.status===429?429:502);}
  const events=path==='/api/props'?[data]:data;if(!Array.isArray(events)||events.length>300)return response({error:'Unexpected provider event payload'},502);
  const quotas={remaining:raw.headers.get('x-requests-remaining'),used:raw.headers.get('x-requests-used'),last:raw.headers.get('x-requests-last')};
  // Never return the upstream URL or API key; only the provider's odds payload.
  return response({events,mode:'live',fetchedAt:new Date().toISOString(),quotas,coverageNote:'Only returned Ontario products are executable candidates. US/international books are informational. Rules and injuries require separate review.'});
 }
 if(path==='/api/injuries'){
  try{const r=await fetcher('https://official.nba.com/nba-injury-report-2026-27-season/',{signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error();const html=await r.text();const matches=[...html.matchAll(/https:\/\/ak-static\.cms\.nba\.com\/referee\/injury\/Injury-Report_[^"'<>\s]+\.pdf/g)].map(m=>m[0]);const links=[...new Set(matches)].map(u=>{const m=u.match(/Injury-Report_(\d{4}-\d{2}-\d{2})_(\d{2})_(\d{2})(AM|PM)/);return {url:u,label:m?m[1]+' '+m[2]+':'+m[3]+' '+m[4]+' ET':'Official injury report'};}).slice(-8).reverse();return response({source:'NBA Official',sourceUrl:'https://official.nba.com/nba-injury-report-2026-27-season/',links,checkedAt:new Date().toISOString(),note:'Report links only. Player statuses and probabilities are not automatically extracted.'});}catch{return response({sourceUrl:'https://official.nba.com/nba-injury-report-2026-27-season/',links:[],note:'Report retrieval unavailable. Open the official source and verify the latest report.'});}
 }
 if(path.startsWith('/api/'))return response({error:'Not found'},404);
 if(path==='/app.js')return new Response(CLIENT,{headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-cache','x-content-type-options':'nosniff'}});
 if(path==='/style.css')return new Response(STYLE,{headers:{'content-type':'text/css; charset=utf-8','cache-control':'no-cache','x-content-type-options':'nosniff'}});
 if(path==='/engine.js')return new Response(ENGINE_SOURCE,{headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-cache','x-content-type-options':'nosniff'}});
 if(path!=='/'&&path!=='/index.html')return new Response('Not found',{status:404});
 return new Response(PAGE,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; object-src 'none'"}});
}
export default {fetch:handleRequest};
