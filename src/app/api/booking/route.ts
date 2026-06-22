import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.warn('GOOGLE_SHEET_WEBHOOK_URL is not set. Simulating success.');
      return NextResponse.json({ success: true, simulated: true });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script responded with status: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json({ success: true, result });
    
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save data' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.warn('GOOGLE_SHEET_WEBHOOK_URL is not set.');
      return NextResponse.json({ success: true, data: [] });
    }

    const response = await fetch(webhookUrl, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn('GOOGLE_SHEET_WEBHOOK_URL is not set.');
      return NextResponse.json({ success: true, simulated: true });
    }

    const payload = {
      action: 'delete',
      id: body.id
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 'success') {
      return NextResponse.json({ success: true });
    } else {
      throw new Error(data.message || 'Unknown error from Google Apps Script');
    }
  } catch (error) {
    console.error('Error deleting from Google Sheets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete data' },
      { status: 500 }
    );
  }
}
