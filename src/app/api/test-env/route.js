// src/app/api/test-env/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDb from '@/Lib/database';



export async function GET() {
  console.log("\n--- TEST DE VARIABLE D'ENVIRONNEMENT ---");
  const testVar = process.env.TEST_VARIABLE;
  const mongoVarDefined = !!process.env.MONGO_URI;
  const clerkVarDefined = !!process.env.CLERK_SECRET_KEY;
  const geminiVarDefined = !!process.env.GEMINI_API_KEY;

  console.log('TEST_VARIABLE:', testVar);
  console.log('MONGO_URI est définie ?', mongoVarDefined);
  console.log('CLERK_SECRET_KEY est définie ?', clerkVarDefined);
  console.log('GEMINI_API_KEY est définie ?', geminiVarDefined);
  console.log("---------------------------------------\n");

  return NextResponse.json({ 
    test: testVar || "Variable de test NON TROUVÉE",
    mongo: mongoVarDefined,
    clerk: clerkVarDefined,
    gemini: geminiVarDefined
  });
}