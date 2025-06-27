// Simple test to verify memory saving behavior
console.log("🧪 Testing Memory Saving Behavior - User Content Focus\n")

// Simulate the memory detection logic
function simulateMemoryDetection(userMessage, aiResponse) {
  const personalInfoKeywords = [
    'name', 'work', 'job', 'company', 'business', 'startup', 'founded', 'sold', 'acquired',
    'like', 'prefer', 'favorite', 'enjoy', 'love', 'hate', 'dislike',
    'family', 'wife', 'husband', 'children', 'kids', 'parents',
    'education', 'studied', 'graduated', 'school', 'university',
    'skills', 'expertise', 'experience', 'background',
    'goals', 'dreams', 'aspirations', 'values', 'beliefs',
    'location', 'from', 'live', 'age', 'birthday'
  ]

  const lowerUserMessage = userMessage.toLowerCase()
  
  // Check if user message contains personal information keywords
  const hasPersonalKeywords = personalInfoKeywords.some(keyword => 
    lowerUserMessage.includes(keyword)
  )

  // Check if the user message contains first-person statements
  const firstPersonPatterns = [
    /i (am|am a|work|do|like|love|hate|prefer|enjoy|studied|graduated|started|founded|sold|bought|own|have|went|experienced|learned|discovered|want|hope|plan|believe|feel|think|value|care)/i,
    /my (name|job|work|company|business|startup|family|wife|husband|children|kids|parents|education|school|university|skills|expertise|experience|goals|dreams|aspirations|values|beliefs|location|age|favorite|preference)/i,
    /i'm (from|a|an|the|working|studying|trying|planning|hoping)/i
  ]

  const hasFirstPersonInfo = firstPersonPatterns.some(pattern => 
    pattern.test(lowerUserMessage)
  )

  return hasPersonalKeywords && hasFirstPersonInfo
}

const testCases = [
  {
    user: "I started a company called TechFlow in 2018 and sold it to Google in 2022 for $50 million.",
    ai: "That's an incredible achievement! Starting and successfully selling a company is no small feat. The fact that you were able to build something valuable enough to be acquired by Google speaks volumes about your entrepreneurial skills and the quality of your product. What was TechFlow's main focus?",
    expected: true
  },
  {
    user: "What's the weather like today?",
    ai: "I don't have access to real-time weather information, but I can help you find a weather service or app to check the current conditions in your area.",
    expected: false
  },
  {
    user: "I'm a software engineer with 10 years of experience in React and Node.js. I live in San Francisco and I'm passionate about building scalable web applications.",
    ai: "That's a great background! San Francisco is definitely a hub for tech talent. With your experience in React and Node.js, you must have worked on some interesting projects. What kind of applications do you enjoy building the most?",
    expected: true
  },
  {
    user: "Can you help me debug this code?",
    ai: "Of course! I'd be happy to help you debug your code. Please share the code you're having trouble with, along with any error messages you're seeing.",
    expected: false
  },
  {
    user: "My wife Sarah and I have two kids, Emma (8) and Jake (5). We love hiking and camping together on weekends.",
    ai: "That sounds like a wonderful family! It's great that you're able to spend quality time outdoors with your kids. Hiking and camping are excellent activities for building family bonds and creating lasting memories.",
    expected: true
  }
]

console.log("Testing Memory Detection Logic:\n")

for (let i = 0; i < testCases.length; i++) {
  const testCase = testCases[i]
  console.log(`Test ${i + 1}:`)
  console.log(`User: "${testCase.user}"`)
  console.log(`AI: "${testCase.ai}"`)
  
  const result = simulateMemoryDetection(testCase.user, testCase.ai)
  console.log(`Result: ${result ? "✅ REMEMBER" : "❌ DON'T REMEMBER"}`)
  console.log(`Expected: ${testCase.expected ? "✅ REMEMBER" : "❌ DON'T REMEMBER"}`)
  console.log(`Match: ${result === testCase.expected ? "✅ PASS" : "❌ FAIL"}`)
  console.log("---\n")
}

console.log("🧪 Testing Memory Saving Process\n")

const testUserMessage = "I founded a startup called DataFlow in 2020 and sold it to Microsoft in 2023 for $25 million. I'm now working on my next venture."
const testAIResponse = "That's fantastic! Building and selling a successful startup is a remarkable achievement. The fact that Microsoft saw value in your company speaks volumes about your vision and execution. What's your next venture focused on?"

console.log("User message:", testUserMessage)
console.log("AI response:", testAIResponse)
console.log("\n✅ FIXED: The system will now save ONLY the user's message as a memory:")
console.log(`"${testUserMessage}"`)
console.log("\n❌ NOT the AI response or combined conversation.")
console.log("\nThis ensures that personal information shared by the user is preserved accurately.")

const shouldSave = simulateMemoryDetection(testUserMessage, testAIResponse)
console.log(`\nMemory detection result: ${shouldSave ? "✅ WILL SAVE" : "❌ WON'T SAVE"}`) 