export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiUrl = 'http://wa.kosan.biz.id';
  const username = 'admin';
  const password = '12345Nabila!!!';
  
  const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
  
  const results: Record<string, any> = {};
  
  // Test 1: Check /app/devices
  try {
    const devicesRes = await fetch(`${apiUrl}/app/devices`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    const devicesText = await devicesRes.text();
    results.devices = {
      status: devicesRes.status,
      statusText: devicesRes.statusText,
      body: devicesText,
    };
  } catch (e) {
    results.devices = { error: (e as Error).message };
  }
  
  // Test 2: Check /app/login (generate QR)
  try {
    const loginRes = await fetch(`${apiUrl}/app/login`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    const loginText = await loginRes.text();
    results.login = {
      status: loginRes.status,
      statusText: loginRes.statusText,
      body: loginText,
    };
  } catch (e) {
    results.login = { error: (e as Error).message };
  }
  
  // Test 3: Check info/status endpoint if exists
  try {
    const infoRes = await fetch(`${apiUrl}/app/info`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    const infoText = await infoRes.text();
    results.info = {
      status: infoRes.status,
      statusText: infoRes.statusText,
      body: infoText,
    };
  } catch (e) {
    results.info = { error: (e as Error).message };
  }

  // Test 4: Check reconnect endpoint
  try {
    const reconnectRes = await fetch(`${apiUrl}/app/reconnect`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    const reconnectText = await reconnectRes.text();
    results.reconnect = {
      status: reconnectRes.status,
      statusText: reconnectRes.statusText,
      body: reconnectText,
    };
  } catch (e) {
    results.reconnect = { error: (e as Error).message };
  }
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    endpoint: apiUrl,
    results,
  }, { status: 200 });
}
