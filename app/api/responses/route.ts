import { NextRequest,NextResponse } from "next/server"; import { appendResponse } from "@/lib/google-sheets";
export const runtime="nodejs";
export async function POST(req:NextRequest){try{const d=await req.json();for(const k of ["participantId","scenarioId","initialAnswer","finalAnswer"])if(!d[k])return NextResponse.json({error:`Missing ${k}.`},{status:400});await appendResponse(d);return NextResponse.json({ok:true});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Could not save response."},{status:500});}}
