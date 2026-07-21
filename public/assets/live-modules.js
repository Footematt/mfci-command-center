const api=window.MFCI;
const marketStatus=document.getElementById("marketStatus"),copilotForm=document.getElementById("copilotForm"),copilotChat=document.getElementById("copilotChat"),copilotQuestion=document.getElementById("copilotQuestion"),copilotSend=document.getElementById("copilotSend"),copilotStatus=document.getElementById("copilotStatus");
const advertisingForm=document.getElementById("advertisingForm"),advertisingGenerate=document.getElementById("advertisingGenerate"),advertisingStatus=document.getElementById("advertisingStatus"),advertisingResults=document.getElementById("advertisingResults");
let marketBusy=false,autoRefreshStarted=false;
let lastAdvertisingCampaign=null;

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

async function copyText(text){
 if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);
 const area=document.createElement("textarea");area.value=text;area.style.position="fixed";area.style.opacity="0";document.body.appendChild(area);area.select();document.execCommand("copy");area.remove();
}
function campaignText(campaign){
 const schedule=(campaign.schedule||[]).map(item=>`${item.day} — ${item.platform}\n${item.content}`).join("\n\n"),checklist=(campaign.checklist||[]).map(item=>`• ${item}`).join("\n");
 return[ campaign.campaignName, "", "STRATEGY", campaign.strategy, "", "CALL TO ACTION", campaign.callToAction, "", "FACEBOOK", campaign.facebookPost, "", "INSTAGRAM", campaign.instagramPost, "", "LINKEDIN", campaign.linkedinPost, "", "SHORT VIDEO / REEL", campaign.reelScript, "", "NEW LEAD REPLY", campaign.leadReply, "", "POSTING SCHEDULE", schedule, "", "BEFORE PUBLISHING", checklist ].join("\n");
}
function renderAdvertisingCampaign(campaign){
 lastAdvertisingCampaign=campaign;
 const textFields={adCampaignName:campaign.campaignName||"Campaign pack",adStrategy:campaign.strategy,adCallToAction:campaign.callToAction,adFacebook:campaign.facebookPost,adInstagram:campaign.instagramPost,adLinkedIn:campaign.linkedinPost,adReel:campaign.reelScript,adLeadReply:campaign.leadReply};
 Object.entries(textFields).forEach(([id,value])=>{const element=document.getElementById(id);if(element)element.textContent=value||""});
 const schedule=document.getElementById("adSchedule");schedule.replaceChildren();(campaign.schedule||[]).forEach(item=>{const row=document.createElement("div");row.className="item";const content=document.createElement("div"),title=document.createElement("b"),details=document.createElement("p");title.textContent=`${item.day} · ${item.platform}`;details.textContent=item.content;content.append(title,details);row.append(content);schedule.append(row)});
 const checklist=document.getElementById("adChecklist");checklist.replaceChildren();(campaign.checklist||[]).forEach(item=>{const row=document.createElement("div");row.className="item";row.textContent=`✓ ${item}`;checklist.append(row)});
 advertisingResults.classList.remove("hidden");advertisingResults.scrollIntoView({behavior:"smooth",block:"start"});
}
advertisingForm?.addEventListener("submit",async event=>{
 event.preventDefault();if(advertisingGenerate.disabled)return;
 const campaign={goal:document.getElementById("adGoal").value,service:document.getElementById("adService").value.trim(),serviceArea:document.getElementById("adArea").value.trim(),audience:document.getElementById("adAudience").value.trim(),offer:document.getElementById("adOffer").value.trim(),platforms:document.getElementById("adPlatforms").value,tone:document.getElementById("adTone").value,dailyBudget:document.getElementById("adBudget").value.trim(),notes:document.getElementById("adNotes").value.trim()};
 if(!campaign.service||!campaign.serviceArea){advertisingStatus.textContent="Enter the service and current service area.";advertisingStatus.className="campaign-status error";return}
 advertisingGenerate.disabled=true;advertisingGenerate.textContent="Creating campaign…";advertisingStatus.textContent="The Advertising Pilot is preparing your campaign pack…";advertisingStatus.className="campaign-status";
 try{const payload=await postOwnerApi("/api/advertising-pilot",{campaign,context:copilotContext()});renderAdvertisingCampaign(payload.campaign);advertisingStatus.textContent="Campaign pack created. Review every draft before publishing."}
 catch(error){advertisingStatus.textContent=error.message;advertisingStatus.className="campaign-status error"}
 finally{advertisingGenerate.disabled=false;advertisingGenerate.textContent="Create campaign pack"}
});
document.getElementById("advertisingClear")?.addEventListener("click",()=>{lastAdvertisingCampaign=null;advertisingResults.classList.add("hidden");advertisingStatus.textContent="";advertisingStatus.className="campaign-status"});
document.getElementById("copyCampaignPack")?.addEventListener("click",async event=>{if(!lastAdvertisingCampaign)return;await copyText(campaignText(lastAdvertisingCampaign));const old=event.currentTarget.textContent;event.currentTarget.textContent="Copied";setTimeout(()=>event.currentTarget.textContent=old,1400)});
document.querySelectorAll("[data-copy-target]").forEach(button=>button.addEventListener("click",async()=>{const target=document.getElementById(button.dataset.copyTarget);if(!target)return;await copyText(target.textContent);const old=button.textContent;button.textContent="Copied";setTimeout(()=>button.textContent=old,1400)}));
