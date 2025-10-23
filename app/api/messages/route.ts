import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/messages
 * Get conversations or messages based on query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = request.headers.get('x-tenant-id');
    const conversationId = searchParams.get('conversationId');
    const type = searchParams.get('type') || 'conversations';

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    if (type === 'messages' && conversationId) {
      // Get messages for a specific conversation
      const { data: messages, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
      }

      return NextResponse.json({ messages: messages || [] });
    }

    // Get conversations for a tenant
    const { data: conversations, error } = await supabase
      .from('whatsapp_conversations')
      .select(`
        id,
        phone,
        customer_name,
        last_message,
        last_message_time,
        unread_count,
        status,
        customer_id
      `)
      .eq('tenant_id', tenantId)
      .order('last_message_time', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    return NextResponse.json({ conversations: conversations || [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/messages
 * Send a new message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = request.headers.get('x-tenant-id');
    const { conversationId, content, type = 'text' } = body;

    if (!tenantId || !conversationId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, conversationId, content' },
        { status: 400 }
      );
    }

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Create message record
    const { data: message, error: msgError } = await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversationId,
        tenant_id: tenantId,
        content,
        type,
        is_from_me: true,
        status: 'sent',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (msgError) {
      console.error('Error creating message:', msgError);
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }

    // Update conversation last_message and last_message_time
    const { error: updateError } = await supabase
      .from('whatsapp_conversations')
      .update({
        last_message: content,
        last_message_time: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Error updating conversation:', updateError);
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
