# Contract Generation System

A comprehensive AI-powered contract generation system built with Next.js frontend and FastAPI backend, designed for Kenyan legal standards.

## Overview

This system guides users through a 5-step process to create legally compliant contracts:

1. **Initial Prompt**: User describes their contract needs
2. **Template Selection**: AI suggests and user selects appropriate contract templates  
3. **Clause Creation**: AI generates mandatory clauses based on user requirements
4. **Custom Clauses**: Users can add optional and custom clauses
5. **Final Review**: Legal compliance analysis and contract completion

## Features

### Frontend (Next.js)
- **Step-by-step wizard interface** with progress tracking
- **Real-time AI analysis** of user input
- **Interactive clause editing** with approval workflow
- **Contract preview** with HTML rendering
- **PDF download** functionality
- **Responsive design** with Tailwind CSS
- **TypeScript** for type safety

### Backend (FastAPI)
- **AI-powered contract analysis** using OpenAI GPT-4
- **Dynamic prompt system** for different contract types
- **Session tracking** for contract creation workflow
- **Legal compliance scoring** for Kenyan law
- **PDF generation** using ReportLab
- **Database integration** with Supabase
- **Comprehensive error handling**

## Architecture

```
Frontend (Next.js)
├── ContractCreationFlow.tsx (Main coordinator)
├── Step1InitialPrompt.tsx (User input & AI analysis)
├── Step2TemplateSelection.tsx (Template selection)
├── Step3ClauseCreation.tsx (Mandatory clause generation)
├── Step4CustomClauses.tsx (Optional & custom clauses)
├── Step5FinalReview.tsx (Legal analysis & completion)
├── types.ts (TypeScript interfaces)
└── utils.ts (Helper functions)

Backend (FastAPI)
├── contract_generation.py (API routes)
├── contract_creation_service.py (Business logic)
├── ai_template_suggestion_service.py (AI services)
└── openai_service.py (OpenAI integration)
```

## Step-by-Step Workflow

### Step 1: Initial Prompt
- User enters detailed contract description (minimum 10 characters)
- AI analyzes the input and suggests appropriate contract templates
- Extracts keywords and determines if the request can be handled
- Provides reasoning for template suggestions

**API Endpoint**: `POST /api/contract-generation/analyze-prompt`

### Step 2: Template Selection  
- Displays AI-suggested templates with confidence scores
- Shows template details, use cases, and match percentages
- User selects preferred template
- Creates contract session for tracking progress

**API Endpoint**: `POST /api/contract-generation/create-session`

### Step 3: Clause Creation
- User provides detailed explanation (minimum 200 words)
- User enters party information via App ID search
- AI generates mandatory clauses based on template and user requirements
- Sequential approval workflow for each mandatory clause
- Users can edit clauses and trigger AI re-analysis

**API Endpoints**: 
- `POST /api/contract-generation/sessions/{id}/analyze-contract`
- `POST /api/contract-generation/search-user`

### Step 4: Custom Clauses
- Displays optional clauses from template (user can select/deselect)
- Users can create up to 4 custom clauses
- AI generates legal content for custom clause specifications
- Approval/rejection workflow for all clauses

**API Endpoint**: `POST /api/contract-generation/sessions/{id}/generate-custom-clauses`

### Step 5: Final Review
- AI performs legal compliance analysis
- Generates contract preview in HTML format
- Shows legal compliance score and risk assessment
- Kenyan law compliance verification
- PDF download and contract completion

**API Endpoints**:
- `POST /api/contract-generation/sessions/{id}/generate-preview`
- `POST /api/contract-generation/sessions/{id}/complete`
- `GET /api/contract-generation/sessions/{id}/download`

## Database Schema

### Key Tables
- `contract_creation_sessions`: Tracks the creation workflow
- `contract_templates`: Available contract templates
- `contracts`: Final contract records
- `users`: User information for party details
- `ai_contract_prompts`: Dynamic AI prompts for different contract types

## AI Integration

### OpenAI GPT-4 Integration
- **Dynamic prompt system** based on contract type
- **Structured clause generation** with legal formatting
- **Kenyan law compliance** built into prompts
- **Context-aware analysis** using user requirements
- **Fallback mechanisms** for AI failures

### Legal Compliance
- **Kenyan legal standards** compliance checking
- **Risk assessment** for contract terms  
- **Legal reference citations** for clauses
- **Compliance scoring** (0-100%)

## Usage

### Starting Contract Creation
```typescript
import ContractCreationFlow from './components/contract-generation/ContractCreationFlow';

<ContractCreationFlow
  onComplete={(session) => console.log('Contract completed:', session)}
  onCancel={() => console.log('User cancelled')}
  existingSessionId={optionalSessionId}
/>
```

### API Usage Examples

**Analyze User Prompt:**
```javascript
const response = await fetch('/api/contract-generation/analyze-prompt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_prompt: "I need a non-disclosure agreement for my business"
  })
});
```

**Create Session:**
```javascript
const response = await fetch('/api/contract-generation/create-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    template_id: "nda-template-id",
    initial_prompt: "User's original request",
    ai_analysis_data: { /* AI analysis results */ }
  })
});
```

## Error Handling

### Frontend
- **Comprehensive validation** for each step
- **User-friendly error messages** 
- **Retry mechanisms** for failed operations
- **Loading states** for all async operations

### Backend  
- **Structured error responses** with HTTP status codes
- **Logging** for debugging and monitoring
- **Fallback responses** when AI services fail
- **Input validation** for all endpoints

## Security Considerations

- **JWT authentication** for all API endpoints
- **Input sanitization** for user content
- **Session validation** for contract operations
- **Access control** for contract data

## Future Enhancements

1. **Multi-language support** for contracts
2. **Electronic signature integration**
3. **Contract templates marketplace**
4. **Advanced legal analytics**
5. **Contract version control**
6. **Collaboration features** for multiple parties
7. **Integration with legal databases**
8. **Mobile application**

## Development Setup

1. **Frontend Setup:**
```bash
cd wakiliaiweb
npm install
npm run dev
```

2. **Backend Setup:**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

3. **Environment Variables:**
```bash
# Backend
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Frontend  
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Testing

- **Unit tests** for utility functions
- **Integration tests** for API endpoints
- **E2E tests** for complete workflow
- **AI response validation** tests

## Performance Considerations

- **Optimistic UI updates** for better UX
- **Caching** for template data
- **Lazy loading** for large contract previews
- **Background processing** for AI operations
- **Database indexing** for faster queries

This system provides a complete solution for AI-powered contract generation with a focus on user experience, legal compliance, and scalability.
