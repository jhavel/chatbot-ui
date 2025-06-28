// Test script to check message display issues
const { createClient } = require('@supabase/supabase-js')

// You'll need to add your Supabase URL and anon key here
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing')
console.log('Supabase Key:', supabaseKey ? 'Found' : 'Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testMessageRetrieval() {
  try {
    // Get the 5 most recent chats
    const { data: chats, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (chatError) {
      console.error('Error fetching chats:', chatError)
      return
    }

    if (!chats || chats.length === 0) {
      console.log('No chats found')
      return
    }

    for (const chat of chats) {
      console.log('---')
      console.log('Chat ID:', chat.id)
      console.log('Name:', chat.name)
      console.log('Created:', chat.created_at)
      console.log('Workspace:', chat.workspace_id)
      console.log('User:', chat.user_id)
      // Get messages for this chat
      const { data: messages, error: messageError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chat.id)
        .order('sequence_number', { ascending: true })

      if (messageError) {
        console.error('Error fetching messages:', messageError)
        continue
      }

      console.log('Messages found:', messages.length)
      messages.forEach((message, index) => {
        console.log(`  Message ${index + 1}:`)
        console.log(`    ID: ${message.id}`)
        console.log(`    Role: ${message.role}`)
        console.log(`    Content: ${message.content.substring(0, 100)}...`)
        console.log(`    Content length: ${message.content.length}`)
        console.log(`    Sequence: ${message.sequence_number}`)
      })
    }
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testMessageRetrieval() 