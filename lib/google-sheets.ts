import { google } from "googleapis";
function client() {
  const email=process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key=process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g,"\n");
  if(!email||!key||!process.env.GOOGLE_SHEET_ID) throw new Error("Google Sheets is not configured. Add the required Vercel environment variables.");
  const auth=new google.auth.JWT({email,key,scopes:["https://www.googleapis.com/auth/spreadsheets"]});
  return google.sheets({version:"v4",auth});
}
export async function readDataset() {
  const s=client();
  const r=await s.spreadsheets.values.get({spreadsheetId:process.env.GOOGLE_SHEET_ID,range:process.env.GOOGLE_DATASET_RANGE||"Dataset!A:L"});
  const rows=r.data.values||[]; if(rows.length<2)return [];
  const headers=rows[0].map(v=>String(v).trim());
  return rows.slice(1).filter(row=>row[0]).map(row=>{
    const x:Record<string,string>={}; headers.forEach((h,i)=>x[h]=String(row[i]??""));
    return {id:x.scenario_id,title:x.title,intro:x.intro,background:x.background,evidence:JSON.parse(x.evidence_json||"[]"),question:x.question,options:JSON.parse(x.options_json||"[]"),condition:x.condition||"Baseline",aiAdvice:x.ai_advice,aiRecommendation:x.ai_recommendation,aiConfidence:x.ai_confidence,claims:JSON.parse(x.claims_json||"[]")};
  });
}
export async function appendResponse(d:{participantId:string;scenarioId:string;scenarioOrder:number;condition:string;initialAnswer:string;initialConfidence:number;aiRecommendation:string;verificationResponses:string[];finalAnswer:string;finalConfidence:number}) {
  const s=client();
  await s.spreadsheets.values.append({spreadsheetId:process.env.GOOGLE_SHEET_ID,range:process.env.GOOGLE_RESPONSES_RANGE||"Responses!A:K",valueInputOption:"USER_ENTERED",insertDataOption:"INSERT_ROWS",requestBody:{values:[[new Date().toISOString(),d.participantId,d.scenarioId,d.scenarioOrder,d.condition,d.initialAnswer,d.initialConfidence,d.aiRecommendation,JSON.stringify(d.verificationResponses),d.finalAnswer,d.finalConfidence]]}});
}
