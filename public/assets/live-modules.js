const api=window.MFCI;
const marketStatus=document.getElementById("marketStatus"),copilotForm=document.getElementById("copilotForm"),copilotChat=document.getElementById("copilotChat"),copilotQuestion=document.getElementById("copilotQuestion"),copilotSend=document.getElementById("copilotSend"),copilotStatus=document.getElementById("copilotStatus");
let marketBusy=false,autoRefreshStarted=false;

async function postOwnerApi(path,body){
 const user=api?.getAuth()?.currentUser;
 if(!user)throw new Error("Sign in again to use this feature.");
 const token=await user.getIdToken();
 const response=await fetch(path,{method:"POST",headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(body)});
 let payload={};try{payload=await response.json()}catch{}
 if(!response.ok)throw new Error(payload.error||"The secure service is temporarily unavailable.");
 return payload;
}

window.refreshMarketData=async(options={})=>{
 const quiet=Boolean(options?.quiet);
 if(marketBusy||!api)return;
 const holdings=(api.getDb().investments||[]).filter(item=>item.symbol&&Number(item.units)>0);
 if(!holdings.length){marketStatus.textContent="Add a symbol and shares/units to enable live portfolio pricing.";marketStatus.className="market-status";return}
 marketBusy=true;marketStatus.textContent="Refreshing secure market prices…";marketStatus.className="market-status";
 try{
  const payload=await postOwnerApi("/api/market",{symbols:holdings.map(item=>item.symbol)}),quotes=new Map((payload.quotes||[]).map(quote=>[quote.symbol,quote]));
  let updated=0;
  holdings.forEach(item=>{const quote=quotes.get(String(item.symbol).toUpperCase());if(!quote)return;const cadPrice=Number(quote.cadPrice);if(Number.isFinite(cadPrice)&&cadPrice>=0){item.current=Math.round(Number(item.units)*cadPrice*100)/100;updated++}item.dailyChange=Math.round(Number(quote.dailyChange||0)*100)/100;item.marketPrice=Number(quote.price);item.marketCurrency=quote.currency;item.fxToCad=quote.fxToCad;item.quoteUpdated=payload.fetchedAt;item.updated=payload.fetchedAt});
  if(updated)await api.persist();
  const note=payload.errors?.length?` ${payload.errors.join(" ")}`:"";
  marketStatus.textContent=`Live prices refreshed ${new Date(payload.fetchedAt).toLocaleString("en-CA")}.${note}`;marketStatus.className="market-status live";
 }catch(error){marketStatus.textContent=error.message;marketStatus.className="market-status error";if(!quiet)alert(error.message)}finally{marketBusy=false}
};

window.addEventListener("mfci:data-ready",()=>{
 if(autoRefreshStarted)return;
 const holdings=api?.getDb()?.investments||[],stale=holdings.some(item=>item.symbol&&Number(item.units)>0&&(!item.quoteUpdated||Date.now()-new Date(item.quoteUpdated).getTime()>15*60*1000));
 if(stale){autoRefreshStarted=true;window.refreshMarketData({quiet:true})}
});

function daysLate(due){if(!due)return 0;const now=new Date(),end=new Date(`${due}T23:59:59`);return end<now?Math.max(0,Math.floor((now-end)/86400000)):0}
function copilotContext(){
 const db=api.getDb(),invoices=(db.invoices||[]).map(item=>{const total=Number(item.total||0),paid=Number(item.paid||0);return{number:String(item.number||""),customer:String(item.customer||""),property:String(item.property||""),total,paid,balance:Math.max(0,total-paid),due:String(item.due||""),daysOverdue:Math.max(0,daysLate(item.due)),status:paid>=total?"paid":paid>0?"partial":"unpaid"}}),expenses=(db.expenses||[]).map(item=>({date:String(item.date||""),category:String(item.category||""),job:String(item.job||""),amount:Number(item.amount||0),description:String(item.notes||"").slice(0,180)})),jobs=(db.jobs||[]).map(item=>({name:String(item.name||""),customer:String(item.customer||""),status:String(item.status||""),start:String(item.start||""),notes:String(item.notes||"").slice(0,180)})),investments=(db.investments||[]).map(item=>({name:String(item.name||""),symbol:String(item.symbol||""),invested:Number(item.invested||0),current:Number(item.current||0),dailyChange:Number(item.dailyChange||0),currency:String(item.marketCurrency||"CAD")}));
 const receivable=invoices.reduce((sum,item)=>sum+item.balance,0),overdue=invoices.filter(item=>item.daysOverdue>0&&item.balance>0).reduce((sum,item)=>sum+item.balance,0),expenseTotal=expenses.reduce((sum,item)=>sum+item.amount,0),portfolioValue=investments.reduce((sum,item)=>sum+item.current,0);
 return{generatedAt:new Date().toISOString(),business:{receivable,overdue,expenseTotal,portfolioValue,activeJobs:jobs.filter(item=>item.status==="Active").length},invoices,expenses,jobs,investments};
}
function addBubble(kind,text){const bubble=document.createElement("div");bubble.className=`bubble ${kind}`;bubble.textContent=text;copilotChat.appendChild(bubble);copilotChat.scrollTop=copilotChat.scrollHeight;return bubble}
async function sendCopilot(){
 const question=copilotQuestion.value.trim();if(!question||copilotSend.disabled)return;
 addBubble("user",question);copilotQuestion.value="";copilotSend.disabled=true;copilotStatus.textContent="Analyzing the secure workspace…";const reply=addBubble("assistant","Thinking…");
 try{const payload=await postOwnerApi("/api/copilot",{question,context:copilotContext()});reply.textContent=payload.answer;copilotStatus.textContent=""}catch(error){reply.textContent=error.message;copilotStatus.textContent="The copilot could not complete that request.";copilotStatus.className="market-status error"}finally{copilotSend.disabled=false}
}
window.askCopilot=question=>{copilotQuestion.value=question;sendCopilot()};
copilotForm?.addEventListener("submit",event=>{event.preventDefault();sendCopilot()});
