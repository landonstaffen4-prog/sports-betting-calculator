export function recordId(){return typeof globalThis.crypto?.randomUUID==='function'?globalThis.crypto.randomUUID():'record-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2);}
export const VERSION = '0.2.0';
export const ONTARIO = Object.freeze({bet99_ca_on:'BET99 Ontario',betano_ca_on:'Betano Ontario',betmgm_ca_on:'BetMGM Ontario',betrivers_ca_on:'BetRivers Ontario',pointsbetca:'PointsBet Ontario',proline_ca_on:'PROLINE Ontario',sportsinteraction_ca_on:'Sports Interaction Ontario'});
export const REFERENCES = Object.freeze({pinnacle:'Pinnacle',betonlineag:'BetOnline',fanduel:'FanDuel US',draftkings:'DraftKings US'});
export const SPORTS = Object.freeze({basketball_nba:'NBA',americanfootball_nfl:'NFL',icehockey_nhl:'NHL',baseball_mlb:'MLB'});
export const DEFAULT_POLICY = Object.freeze({maxAgeSeconds:90,minFamilies:3,minStressEV:0.02,maxDispersion:0.06,maxHold:0.12,requireAnchor:true,maxDecimalOdds:4});

export function finite(x,label='Number') { if(typeof x!=='number'||!Number.isFinite(x))throw new Error(label+' must be a finite number');return x; }
export function prob(p){finite(p,'Probability');if(p<0||p>1)throw new Error('Probability must be between 0 and 1');return p;}
export function decimal(d){finite(d,'Decimal odds');if(d<=1||d>10001)throw new Error('Decimal odds must exceed 1 and not exceed 10001');return d;}
export function toDecimal(v,format='american'){const n=Number(v);finite(n,'Odds');if(format==='decimal')return decimal(n);if(format!=='american'||Math.abs(n)<100)throw new Error('Use American odds of +100 or higher, or −100 or lower');return n>0?1+n/100:1+100/Math.abs(n);}
export function toAmerican(d){decimal(d);return d>=2?Math.round((d-1)*100):-Math.round(100/(d-1));}
export function roi(p,d,push=0,commission=0){prob(p);prob(push);prob(commission);decimal(d);if(p+push>1+1e-10)throw new Error('Win and push probabilities exceed 100%');return p*(d-1)*(1-commission)-(1-p-push);}
export function minPrice(p,edge=0,push=0,commission=0){prob(p);prob(push);prob(commission);finite(edge);if(!p||commission===1||edge<0||p+push>1)throw new Error('No finite valid minimum price');return 1+(edge+1-p-push)/(p*(1-commission));}
export function devig(prices,method='proportional'){
 if(!Array.isArray(prices)||prices.length<2)throw new Error('Complete outcome prices required');
 const q=prices.map(d=>1/decimal(d)),sum=q.reduce((a,b)=>a+b,0);let p;
 if(method==='proportional')p=q.map(x=>x/sum);
 else if(method==='additive'){p=q.map(x=>x-(sum-1)/q.length);if(p.some(x=>x<0||x>1))throw new Error('Invalid additive probabilities');}
 else if(method==='power'){let lo=0,hi=1;while(q.reduce((s,x)=>s+x**hi,0)>1)hi*=2;for(let i=0;i<100;i++){const mid=(hi+lo)/2;if(q.reduce((s,x)=>s+x**mid,0)>1)lo=mid;else hi=mid;}p=q.map(x=>x**((lo+hi)/2));}
 else throw new Error('Unknown margin-removal method');return p;
}
export function scenarios(rows){if(!Array.isArray(rows)||!rows.length)throw new Error('Add scenarios');let w=0,p=0;for(const row of rows){w+=prob(row.weight);p+=prob(row.weight)*prob(row.probability);}if(Math.abs(w-1)>1e-8)throw new Error('Scenario weights must total 100%');return p;}
export function parlayEV(joint,d){return roi(prob(joint),decimal(d));}
export function kelly(p,d,fraction=.25){prob(fraction);return fraction*Math.max(0,roi(p,d)/(d-1));}
export function arb(prices,total=100){finite(total);if(total<=0)throw new Error('Positive total stake required');const q=prices.map(d=>1/decimal(d)),sum=q.reduce((a,b)=>a+b,0);if(q.length<2)throw new Error('Complete outcomes required');return {hold:sum-1,arbitrage:sum<1-1e-10,stakes:q.map(x=>total*x/sum),profit:total*(1/sum-1),note:'Theoretical only; acceptance, matching rules, fees and rounding remain unverified.'};}
function median(a){const b=[...a].sort((x,y)=>x-y),i=Math.floor(b.length/2);return b.length%2?b[i]:(b[i-1]+b[i])/2;}
export function epoch(v){const t=typeof v==='number'?v:Date.parse(v);if(!Number.isFinite(t))throw new Error('Invalid timestamp');return t;}
export function family(book){const b=book.toLowerCase();if(b.includes('kambi')||b.startsWith('betrivers'))return 'kambi';if(b.startsWith('betmgm'))return 'betmgm';if(b.startsWith('fanduel'))return 'fanduel';if(b.startsWith('draftkings'))return 'draftkings';if(b.startsWith('betonline')||b==='lowvig')return 'betonline';return b;}
export function policyChecked(overrides={}){
 const p={...DEFAULT_POLICY,...overrides};for(const [k,min,max] of [['maxAgeSeconds',15,300],['minFamilies',3,8],['minStressEV',0,0.5],['maxDispersion',0.005,0.2],['maxHold',0,0.3],['maxDecimalOdds',1.1,100]]){finite(p[k],k);if(p[k]<min||p[k]>max)throw new Error('Invalid policy: '+k);}if(!Number.isInteger(p.minFamilies)||typeof p.requireAnchor!=='boolean')throw new Error('Invalid policy');return p;
}

// Quote schema: eventId, contractKey, outcomes (same order), prices, book,
// family, sourceType, confirmedAt, receivedAt, startAt, region, hasPush.
export function evaluate(candidate,references,overrides={},now=Date.now()){
 const p=policyChecked(overrides),reasons=[],excluded=[],retained=[];
 const result={decision:'INSUFFICIENT_DATA',mode:candidate.sourceType||'manual',reasons,excluded,references:retained,centralProbability:null,stressProbability:null,centralEV:null,stressEV:null,minDecimal:null,policy:p,version:VERSION};
 const check=(q,isCandidate=false)=>{
  try{if(!q.book||!q.family||!q.contractKey||!Array.isArray(q.outcomes)||q.outcomes.length!==2||new Set(q.outcomes).size!==2||q.prices.length!==2) return 'Incomplete contract';decimal(q.prices[0]);if(!isCandidate)decimal(q.prices[1]);
   if(!['manual','demo','live','import'].includes(q.sourceType))return 'Unknown data provenance';
   const t=epoch(q.confirmedAt),r=epoch(q.receivedAt);if(t>now+1000||r>now+1000||t>r+1000)return 'Future/inconsistent timestamp';if(now-t>p.maxAgeSeconds*1000)return 'Stale source confirmation';
   if(q.suspended)return 'Suspended';if(q.materialNewsAt&&t<epoch(q.materialNewsAt))return 'Quote predates material news';
  }catch{return 'Invalid odds or timestamps';}return null;
 };
 const error=check(candidate,true);if(error){reasons.push(error);return result;}
 if(epoch(candidate.startAt)<=now){reasons.push('Event started; pregame only');return result;}
 if(candidate.region!=='CA-ON'){reasons.push('Offer is not an Ontario product');return result;}
 if(candidate.hasPush){reasons.push('Push probability required; automatic evaluation unavailable');return result;}
 if(candidate.prices[0]>p.maxDecimalOdds){reasons.push('Outside configured odds range');return result;}
 const groups=new Map();
 for(const ref of references){let reason=check(ref);if(!reason&&(ref.contractKey!==candidate.contractKey||JSON.stringify(ref.outcomes)!==JSON.stringify(candidate.outcomes)||ref.eventId!==candidate.eventId))reason='Different bet terms';if(!reason&&(ref.book===candidate.book||ref.family===candidate.family))reason='Self/shared-feed reference';if(!reason&&ref.sourceType!==candidate.sourceType)reason='Mixed data modes';if(!reason&&!Object.hasOwn(REFERENCES,ref.book)&&candidate.sourceType==='live')reason='Not in configured reference basket';
  if(!reason&&candidate.materialNewsAt&&epoch(ref.confirmedAt)<epoch(candidate.materialNewsAt))reason='Reference predates flagged news';
  if(reason){excluded.push({book:ref.book,reason});continue;}const prev=groups.get(ref.family);if(!prev||epoch(ref.confirmedAt)>epoch(prev.confirmedAt))groups.set(ref.family,ref);
 }
 const all=[],central=[];
 for(const ref of groups.values()){
  const hold=ref.prices.reduce((s,d)=>s+1/d,0)-1;if(hold<-.0001||hold>p.maxHold){excluded.push({book:ref.book,reason:'Reference margin outside bounds'});continue;}
  try{const methods={};for(const m of ['proportional','additive','power'])methods[m]=devig(ref.prices,m)[0];all.push(...Object.values(methods));central.push(methods.proportional);retained.push({book:ref.book,family:ref.family,prices:ref.prices,confirmedAt:ref.confirmedAt,methods,hold});}catch{excluded.push({book:ref.book,reason:'Invalid de-vig estimate'});}
 }
 if(retained.length<p.minFamilies){reasons.push('Fewer than '+p.minFamilies+' distinct usable reference families');return result;}
 if(p.requireAnchor&&candidate.sourceType==='live'&&!retained.some(r=>r.book==='pinnacle')){reasons.push('Configured Pinnacle anchor unavailable or stale');return result;}
 result.centralProbability=median(central);result.stressProbability=Math.min(...all);result.centralEV=roi(result.centralProbability,candidate.prices[0]);result.stressEV=roi(result.stressProbability,candidate.prices[0]);result.minDecimal=minPrice(result.stressProbability,p.minStressEV);
 if(Math.max(...all)-Math.min(...all)>p.maxDispersion){reasons.push('Reference/method disagreement exceeds tolerance');return result;}
 if(result.stressEV+1e-12<p.minStressEV){result.decision='PASS';reasons.push('Stressed value below required margin');return result;}
 result.decision=candidate.sourceType==='demo'?'DEMO_CANDIDATE':'REVIEW_CANDIDATE';reasons.push(candidate.sourceType==='demo'?'Invented prices; demonstration only':'Estimated value only; verify rules, news and actual offer');
 return result;
}

const safeText=x=>typeof x==='string'&&x.length<250?x.trim():'';
export function normaliseEvents(events,sourceType='live',receivedAt=new Date().toISOString()){
 if(!Array.isArray(events)||events.length>300)throw new Error('Invalid or oversized odds response');const quotes=[],issues=[],coverage=new Map();
 for(const event of events){
  if(!event||typeof event!=='object'){issues.push('Skipped invalid event');continue;}
  const eventId=safeText(event.id),home=safeText(event.home_team),away=safeText(event.away_team);if(!eventId||!home||!away||!SPORTS[event.sport_key]||!Number.isFinite(Date.parse(event.commence_time))){issues.push('Skipped event with incomplete identity');continue;}
  for(const b of event.bookmakers||[]){if(!b?.key||!safeText(b.title))continue;for(const m of b.markets||[]){
   coverage.set(b.key,{book:b.key,title:b.title,region:ONTARIO[b.key]?'CA-ON':'Reference only',markets:[...new Set([...(coverage.get(b.key)?.markets||[]),m.key])],lastSeen:m.last_update||null});
   const rows=m.outcomes||[];const groups=new Map();
   if(m.key==='h2h'||m.key==='spreads'||m.key==='totals')groups.set('',rows);else if(['player_points','player_rebounds','player_assists','player_threes','player_points_rebounds_assists'].includes(m.key)){
    for(const row of rows){const key=JSON.stringify([row.description,row.point]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
   }else continue;
   for(const group of groups.values()){
    if(group.length!==2){issues.push('Incomplete/tied market excluded: '+b.key+' '+m.key);continue;}
    let ordered,line,subject='game',labels,hasPush=false;
    if(m.key==='h2h'){ordered=[group.find(o=>o.name===home),group.find(o=>o.name===away)];line='none';labels=[home,away];}
    else if(m.key==='spreads'){ordered=[group.find(o=>o.name===home),group.find(o=>o.name===away)];if(!ordered.every(Boolean)||!Number.isFinite(ordered[0].point)||ordered[0].point!==-ordered[1].point){issues.push('Unmatched spread excluded');continue;}line=String(ordered[0].point);labels=[home,away];hasPush=Number.isInteger(ordered[0].point);}
    else {ordered=[group.find(o=>o.name==='Over'),group.find(o=>o.name==='Under')];if(!ordered.every(Boolean)||!Number.isFinite(ordered[0].point)||ordered[0].point!==ordered[1].point){issues.push('Unmatched total excluded');continue;}line=String(ordered[0].point);labels=['Over','Under'];hasPush=Number.isInteger(ordered[0].point);if(m.key.startsWith('player_')){subject=safeText(ordered[0].description);if(!subject||subject!==ordered[1].description)continue;}}
    if(!ordered.every(Boolean)||!m.last_update){issues.push('Missing outcomes or market timestamp');continue;}
    try{ordered.forEach(o=>decimal(o.price));}catch{issues.push('Invalid provider price');continue;}
    const contractKey=JSON.stringify([event.sport_key,eventId,m.key,subject,line,'full_game','standard_provider_market_rules_unverified']);
    const base={eventId,home,away,eventLabel:away+' at '+home,sport:event.sport_key,market:m.key,subject,line,contractKey,outcomes:labels,prices:ordered.map(o=>o.price),book:b.key,bookTitle:b.title,family:family(b.key),sourceType,confirmedAt:m.last_update,receivedAt,startAt:event.commence_time,region:ONTARIO[b.key]?'CA-ON':'reference',hasPush,rulesVerified:false};
    quotes.push(base);
   }
  }}
 }
 return {quotes,issues:[...new Set(issues)].slice(0,50),coverage:[...coverage.values()]};
}
export function flipQuote(q){return {...q,outcomes:[q.outcomes[1],q.outcomes[0]],prices:[q.prices[1],q.prices[0]],selectionIndex:1};}
export function scanEvents(events,policy={},sourceType='live',now=Date.now()){
 const n=normaliseEvents(events,sourceType,new Date(now).toISOString()),results=[];
 for(const q of n.quotes.filter(q=>Object.hasOwn(ONTARIO,q.book))){for(let side=0;side<2;side++){
  const candidate=side?flipQuote(q):{...q,selectionIndex:0};const refs=n.quotes.filter(r=>r.contractKey===q.contractKey&&r.book!==q.book).map(r=>side?flipQuote(r):r);
  const value=evaluate(candidate,refs,policy,now);results.push({id:JSON.stringify([q.contractKey,q.book,side]),quote:candidate,value});
 }}
 results.sort((a,b)=>{const rank=x=>x.value.decision.includes('CANDIDATE')?0:x.value.decision==='PASS'?1:2;return rank(a)-rank(b)||(b.value.stressEV??-999)-(a.value.stressEV??-999);});
 return {...n,results,asOf:new Date(now).toISOString(),mode:sourceType,version:VERSION};
}

export function ledgerStats(records){let staked=0,profit=0,open=0,won=0,lost=0,peak=0,maxDrawdown=0;const calibration=[];
 for(const r of [...records].sort((a,b)=>epoch(a.settledAt||a.createdAt)-epoch(b.settledAt||b.createdAt))){const stake=finite(r.stake);if(stake<0)throw new Error('Negative stake');decimal(r.odds);if(r.result==='open'){open+=stake;continue;}if(!['won','lost','push','void'].includes(r.result))throw new Error('Unknown settlement');if(r.result==='won'){profit+=stake*(r.odds-1);won++;}if(r.result==='lost'){profit-=stake;lost++;}if(r.result!=='void')staked+=stake;profit-=Number(r.fees)||0;peak=Math.max(peak,profit);maxDrawdown=Math.max(maxDrawdown,peak-profit);if(['won','lost'].includes(r.result)&&Number.isFinite(r.probability)&&r.probability>0&&r.probability<1)calibration.push({p:r.probability,y:r.result==='won'?1:0});}
 const brier=calibration.length?calibration.reduce((s,r)=>s+(r.p-r.y)**2,0)/calibration.length:null;
 const logLoss=calibration.length?-calibration.reduce((s,r)=>s+r.y*Math.log(r.p)+(1-r.y)*Math.log(1-r.p),0)/calibration.length:null;
 return {staked,profit,open,won,lost,roi:staked?profit/staked:null,maxDrawdown,brier,logLoss,calibrationN:calibration.length};
}
export function validateRecord(r){if(!r||typeof r!=='object')throw new Error('Invalid record');if(!safeText(r.event)||!safeText(r.selection)||!safeText(r.book))throw new Error('Event, selection and book are required');const stake=finite(Number(r.stake));if(stake<=0||stake>1e8)throw new Error('Invalid stake');decimal(Number(r.odds));if(!['paper','placed'].includes(r.kind)||!['open','won','lost','push','void'].includes(r.result))throw new Error('Invalid record type or settlement');epoch(r.createdAt);if(r.settledAt)epoch(r.settledAt);if(r.kind==='placed'&&r.acceptedConfirmed!==true)throw new Error('Confirm accepted odds and stake');if(r.kind==='placed'&&r.mode==='demo')throw new Error('Demo entries cannot be actual bets');const fees=r.fees==null?0:Number(r.fees);if(fees<0||!Number.isFinite(fees))throw new Error('Invalid fees');if(r.probability!=null)prob(Number(r.probability));return {id:safeText(r.id)||recordId(),createdAt:r.createdAt,settledAt:r.result==='open'?null:(r.settledAt||r.createdAt),event:r.event,selection:r.selection,book:r.book,stake,odds:Number(r.odds),kind:r.kind,result:r.result,fees,probability:r.probability==null?null:Number(r.probability),mode:['demo','manual','live','import'].includes(r.mode)?r.mode:'manual',notes:typeof r.notes==='string'?r.notes.slice(0,1000):'',acceptedConfirmed:r.acceptedConfirmed===true};}
