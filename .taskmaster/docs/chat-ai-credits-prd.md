# PRD: Chat AI Interface + Credit System

## Overview
Add a ChatGPT-like conversational AI interface with a monthly credit system for usage tracking. Free users get 100 credits monthly (renewable). Credits are consumed by chat messages (3 credits), AI project generation (15 credits), and URL scraping (5 credits).

## Core Features

### 1. Credit System Foundation
- Extend userUsage table with creditsRemaining, creditsTotal, lastCreditReset fields
- Create credit management backend with atomic deduction and monthly reset logic
- Initialize 100 credits for all new users on signup
- Display credit balance in UI navbar with color-coded warnings (green >50, yellow 20-50, red <20)
- Integrate credit checks into existing AI generation and URL scraping features

### 2. Chat Database Schema
- Create chatSessions table with userId, displayId (CH-XXXXXX format), title, timestamps, messageCount
- Create chatMessages table with sessionId, role (user/assistant/system), content, tokens, creditsUsed, timestamp
- Add display ID counter for chat sessions using existing counter pattern
- Implement proper indexes for efficient queries (by_userId, by_sessionId, by_displayId)

### 3. Chat Backend Logic
- Build session management: create, list, get, delete, rename chat sessions
- Build message storage: save user messages, save assistant responses, fetch message history
- Implement sendChatMessage action with credit validation, Azure OpenAI integration, and context awareness
- Create user context integration to include recent projects and active tasks in chat context (opt-in)

### 4. Chat Frontend UI
- Create /chat route with sidebar layout (session list on left, messages on right)
- Build chat session sidebar component with "New Chat" button, session switching, rename/delete actions
- Build message area component with role-based styling (user right-aligned blue, assistant left-aligned gray)
- Build chat input component with auto-resize textarea, send button, credit cost indicator, context toggle
- Create empty state with suggested prompts and quick start guide

### 5. Streaming Responses
- Implement polling-based streaming approach (simpler than HTTP streaming in Convex)
- Create streaming mutations: startStreamingMessage, appendStreamChunk, finalizeStreamMessage
- Update chat action to batch-update message every 50ms or 10 tokens during generation
- Add frontend polling to display partial content with typing indicator during generation

### 6. Credit Purchase Integration
- Update pricing page with credit top-up packages (500/$5, 1000/$9, 5000/$40)
- Create purchase dialog with package selection using Autumn checkout integration
- Implement Autumn webhook handler for credit fulfillment after successful purchase
- Add Pro plan option with unlimited credits via Autumn subscription check

### 7. Integration & Polish
- Add "Chat AI" navigation item to sidebar with MessageSquare icon
- Add "Quick Chat" card to dashboard showing recent chat sessions
- Implement credit warning toasts when balance drops below 20
- Create blocking dialog when insufficient credits with "Buy More" CTA
- Ensure mobile responsiveness with collapsible session sidebar and touch-friendly UI

### 8. Testing & Quality Assurance
- Test complete chat flow: create session, send messages, verify credit deduction
- Test context inclusion with user projects and tasks
- Verify monthly credit reset logic works correctly
- Test insufficient credit scenarios and purchase flow end-to-end
- Test edge cases: long messages, empty sessions, concurrent sends, credit race conditions

## Technical Requirements

### Environment Variables
- AZURE_OPENAI_ENDPOINT (existing)
- AZURE_OPENAI_KEY (existing)
- AZURE_OPENAI_DEPLOYMENT (existing)
- AUTUMN_SECRET_KEY (existing)

### Credit Costs
- Chat message: 3 credits per message
- AI project generation: 15 credits per generation
- URL scraping: 5 credits per URL

### Credit Model
- Free tier: 100 credits monthly renewable
- Credits reset automatically on first action after month boundary
- Pro tier: Unlimited credits via Autumn subscription

### Database Indexes Required
- chatSessions: by_userId, by_displayId, by_userId_and_updatedAt
- chatMessages: by_sessionId, by_userId

### AI Model Configuration
- Use existing Azure OpenAI setup with o1-series models
- Include conversation history (last 10 messages) for context
- Optional: Include user's projects/tasks data when context toggle enabled
- Implement proper token counting for credit accuracy

## Success Metrics
- Users can create and manage multiple chat sessions
- Messages stream smoothly with <2s response time
- Credit deduction is accurate and atomic (no race conditions)
- Monthly credit reset works reliably
- Purchase flow completes successfully with Autumn
- Mobile UI is fully functional and touch-friendly

## Timeline
- Foundation (credit system): 5 hours
- Chat core (schema + backend + basic UI): 10 hours
- Streaming implementation: 4 hours
- Polish and integration: 5 hours
- Total: 24 hours (3 full dev days or 1 week part-time)

## Priority
HIGH - Implement before hackathon tasks (16-21) as requested by user