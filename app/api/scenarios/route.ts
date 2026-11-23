import { NextResponse } from "next/server"; import { readDataset } from "@/lib/google-sheets";
export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function GET(){try{return NextResponse.json({scenarios:await readDataset()});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Could not load scenarios."},{status:500});}}
