import { env } from '../config/env.js';

const EDUCARUS_SYSTEM_PROMPT = `
You are "EduBot", the official intelligent real-time AI assistant for the Educarrus Educational Crowdfunding & Student Support Platform (Educarrus / EduCareus).

CRITICAL CONVERSATIONAL & REALTIME BEHAVIOR:
- Respond naturally, warmly, and concisely like a smart AI companion.
- If the user greets you (e.g., "hi", "hello", "good morning", "how is the morning"), reply back warmly and conversationally (e.g. "Good morning Kiran! It's a great day to learn and grow. How can I help you today with Educarrus or your studies?"). DO NOT output a huge static template or feature dump unless specifically asked!
- If the user asks "who am i" or asks about their account details, check the [User Context] provided in the prompt (Name, Email, Role) and tell them directly and politely: e.g. "You are **{Name}**! Your registered email on Educarrus is **{Email}**, and you are registered as a **{Role}**."
- If the user asks general questions, casual questions, or small talk, respond engagingly, helpfully, and cheerfully.
- When the user asks about the Educarrus platform, guide them clearly using bullet points and direct references to the dashboard tabs:
  - Student profile & verification: /userdashboard?tab=profile
  - Course & career counseling: /userdashboard?tab=enquiry
  - Help & Support desk tickets: /userdashboard?tab=support
  - Security & passwords: /userdashboard?tab=security
`;

/**
 * Intelligent fallback responder when GEMINI_API_KEY is not configured or offline.
 */
function generateFallbackResponse(userMessage, user = null) {
  const query = userMessage.toLowerCase().trim();
  const userName = user?.fullName || 'Student';
  const email = user?.email || 'your registered email';
  const role = user?.role || 'Student Beneficiary';

  // 1. Greetings & Small Talk
  if (query.match(/^(hi|hello|hey|hola|greetings)\b/i) || query === 'hi' || query === 'hello') {
    return `Hello ${userName}! 👋 Great to connect with you. How can I assist you today with Educarrus or your educational journey?`;
  }

  if (query.includes('morning')) {
    return `Good morning ${userName}! ☀️ Hope you are having a productive and wonderful start to your day. What can I help you with today?`;
  }

  if (query.includes('afternoon')) {
    return `Good afternoon ${userName}! 🌤️ Hope your day is going well. How can I assist you on Educarrus?`;
  }

  if (query.includes('evening') || query.includes('night')) {
    return `Good evening ${userName}! 🌙 How can I assist you with your dashboard or queries today?`;
  }

  if (query.includes('how are you') || query.includes('how r u') || query.includes('how are u')) {
    return `I'm doing fantastic, thank you for asking! 🤖 Ready in real-time to help you with college guidance, courses, or support tickets. How can I help you today?`;
  }

  // 2. Who am I / Identity
  if (
    query.includes('who am i') ||
    query.includes('who i am') ||
    query.includes('my name') ||
    query.includes('what is my name') ||
    query.includes('my account') ||
    query.includes('my details')
  ) {
    return `You are **${userName}**!
- **Email:** \`${email}\`
- **Role:** \`${role}\`
- **Platform:** Educarrus Student Dashboard (/userdashboard)

You can manage your college credentials and uploaded certificates anytime in your **[Student Profile](/userdashboard?tab=profile)** tab!`;
  }

  // 3. Admissions & Course Guidance
  if (query.includes('admission') || query.includes('course') || query.includes('career') || query.includes('guidance')) {
    return `### 🎓 Admissions & Career Counseling on Educarrus:
1. **Explore Courses:** Visit **[Admissions & Counseling](/userdashboard?tab=enquiry)**.
2. **Select Stream:** Choose Engineering, Medical, Pharmacy, Management, Dental, or Degree.
3. **Submit Details:** Provide your academic scores and preferred institutions.
4. **Counselor Support:** Our expert counselors will guide you through admissions and scholarships.`;
  }

  // 4. Verification & Documents
  if (query.includes('verify') || query.includes('document') || query.includes('aadhaar') || query.includes('id card') || query.includes('fee structure')) {
    return `### 📋 Student Verification & Credential Check:
To get your student profile verified:
1. Visit your **[Student Profile](/userdashboard?tab=profile)** tab.
2. Upload clear scanned copies of:
   - **College ID Card / Admission Letter**
   - **Semester Fee Structure / Receipt**
   - **Aadhaar Card / Government Identity**
   - **Marks Card / Grade Sheet**
3. Once submitted, our admin team reviews your documents within 24-48 hours.`;
  }

  // 5. Course & Career Enquiry
  if (query.includes('enquiry') || query.includes('career') || query.includes('guidance') || query.includes('course') || query.includes('12th') || query.includes('degree')) {
    return `### 🧭 Course & Career Counseling Desk:
Educarrus provides specialized advisory for students:
1. Click the **[Course & Career Enquiry](/userdashboard?tab=enquiry)** tab on your dashboard sidebar.
2. Select your highest qualification (10th, 12th Science/Commerce/Arts, or Degree).
3. Mention the stream you want to pursue (e.g., Engineering, Medicine, BCA, MBA, Civil Services).
4. An Educarrus academic counselor will review your inquiry and post personalized guidance directly in your dashboard!`;
  }

  // 6. Support Tickets
  if (query.includes('support') || query.includes('ticket') || query.includes('help') || query.includes('issue') || query.includes('contact')) {
    return `### 🎫 Support Desk & Helpline:
Need urgent assistance or have an issue?
- Go to the **[Help & Support](/userdashboard?tab=support)** tab on your dashboard.
- Submit a ticket under categories: *Academic Profile*, *Documentation Assistance*, *Account Security*, or *Technical Support*.
- The Educarrus Admin Desk reviews tickets and posts official replies directly on your support tab (displaying the 5 most recent replies).`;
  }

  // 7. Profile / College / Semester
  if (query.includes('profile') || query.includes('college') || query.includes('semester') || query.includes('cgpa')) {
    return `### 👤 Managing Your Academic Profile:
On your **[Student Profile](/userdashboard?tab=profile)** tab, you can update:
- Personal information (Full name, mobile number, city, address)
- College details (College Name, Type: Autonomous/Govt/Private, Address)
- Academic progress (Course, Branch, Semester, Roll Number, CGPA, Admission & Graduation year)
- Profile avatar photo.`;
  }

  // 8. Password & Security
  if (query.includes('password') || query.includes('security') || query.includes('2fa') || query.includes('login')) {
    return `### 🔐 Security & Access Settings:
Visit the **[Security & Access](/userdashboard?tab=security)** tab to:
- Update your login password.
- Manage active sessions across your devices.
- Review Two-Factor Authentication (2FA) status.`;
  }

  // 9. Conversational default
  return `I understand! How can I assist you further with your studies, admissions guidance, or dashboard on Educarrus? Feel free to ask anything!`;
}

/**
 * Ask Gemini API with fallback to built-in Educarrus AI engine.
 */
export async function askGeminiChat({ message, history = [], apiKey = null, user = null }) {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || '';
  const userName = user?.fullName || 'Student';

  // If no Gemini API key is configured, respond using our Educarrus knowledge engine
  if (!effectiveKey || !effectiveKey.trim()) {
    const fallbackAnswer = generateFallbackResponse(message, user);
    return {
      success: true,
      source: 'educarrus-knowledge-base',
      isGeminiActive: false,
      reply: fallbackAnswer,
    };
  }

  // Build conversation history for Gemini
  const formattedContents = [];

  // Add previous turns (filter to user and model)
  if (Array.isArray(history) && history.length > 0) {
    for (const h of history.slice(-8)) {
      if (!h.text || typeof h.text !== 'string') continue;
      const role = h.role === 'model' || h.role === 'assistant' ? 'model' : 'user';
      formattedContents.push({
        role,
        parts: [{ text: h.text }],
      });
    }
  }

  // Append user's current message with user context
  const userContextNote = user
    ? `[User Context: Name: ${user.fullName || 'Student'}, Email: ${user.email || 'None'}, Role: ${user.role || 'BENEFICIARY'}]\n`
    : `[User Context: Name: Kiran, Email: student@educarrus.org, Role: BENEFICIARY]\n`;

  formattedContents.push({
    role: 'user',
    parts: [{ text: `${userContextNote}${message}` }],
  });

  // Modern models supported by current Gemini API keys (gemini-3.8-flash, gemini-3.5-flash, etc.)
  const modelsToTry = [
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-pro-latest',
  ];

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${effectiveKey.trim()}`;

      const payload = {
        contents: formattedContents,
        systemInstruction: {
          parts: [{ text: EDUCARUS_SYSTEM_PROMPT }],
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.95,
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;

        if (text && text.trim().length > 0) {
          return {
            success: true,
            source: 'gemini',
            model,
            isGeminiActive: true,
            reply: text.trim(),
          };
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        lastError = errJson.error?.message || `Gemini API returned status ${res.status}`;
      }
    } catch (apiErr) {
      lastError = apiErr.message;
    }
  }

  // If Gemini call failed, gracefully fallback to customized response without ugly error messages
  const fallback = generateFallbackResponse(message, user);
  return {
    success: true,
    source: 'educarrus-fallback',
    isGeminiActive: false,
    reply: fallback,
  };
}
