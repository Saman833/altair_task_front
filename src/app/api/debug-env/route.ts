import { NextResponse } from 'next/server';

export async function GET() {
  const allEnvVars = process.env;
  const relevantVars = Object.keys(allEnvVars)
    .filter(key => key.includes('API') || key.includes('URL') || key.includes('RAILWAY'))
    .reduce((obj, key) => {
      obj[key] = allEnvVars[key];
      return obj;
    }, {} as Record<string, string | undefined>);

  return NextResponse.json({
    message: 'Environment variables debug',
    timestamp: new Date().toISOString(),
    relevantEnvVars: relevantVars,
    allEnvVarKeys: Object.keys(allEnvVars),
    nodeEnv: process.env.NODE_ENV,
    railwayEnvironment: process.env.RAILWAY_ENVIRONMENT,
    railwayProjectId: process.env.RAILWAY_PROJECT_ID,
    railwayServiceId: process.env.RAILWAY_SERVICE_ID
  });
} 