// API route for AI prompt analysis
import { NextRequest, NextResponse } from 'next/server';

// Template keyword mapping for analysis
const TEMPLATE_KEYWORDS = {
  nda: {
    keywords: ['confidential', 'secret', 'protect idea', 'business information', 'private', 'stolen', 'leak'],
    phrases: ['protect this idea', 'confidential information', 'business discussions']
  },
  employment: {
    keywords: ['employment', 'job', 'hire', 'employee', 'work', 'salary', 'position'],
    phrases: ['hire a new employee', 'employment contract', 'job agreement']
  },
  service_agreement: {
    keywords: ['service', 'consulting', 'professional services', 'freelance', 'contractor'],
    phrases: ['providing services', 'consulting services', 'service agreement']
  },
  rental_agreement: {
    keywords: ['rent', 'rental', 'lease', 'property', 'tenant', 'landlord'],
    phrases: ['rent out my property', 'lease agreement', 'rental contract']
  }
};

function analyzePrompt(prompt: string) {
  const lowerPrompt = prompt.toLowerCase();
  const suggestions = [];

  // Analyze each template type
  for (const [templateType, data] of Object.entries(TEMPLATE_KEYWORDS)) {
    let score = 0;
    const matchingKeywords: string[] = [];

    // Check keywords
    data.keywords.forEach(keyword => {
      if (lowerPrompt.includes(keyword)) {
        score += 1;
        matchingKeywords.push(keyword);
      }
    });

    // Check phrases (higher weight)
    data.phrases.forEach(phrase => {
      if (lowerPrompt.includes(phrase)) {
        score += 2;
        matchingKeywords.push(phrase);
      }
    });

    if (score > 0) {
      const confidence = Math.min((score / (data.keywords.length + data.phrases.length * 2)) * 100, 100);
      
      suggestions.push({
        template_id: `${templateType}_template`,
        template_name: getTemplateName(templateType),
        contract_type: templateType,
        confidence_score: Math.round(confidence * 10) / 10,
        matching_keywords: matchingKeywords,
        reasoning: generateReasoning(confidence, matchingKeywords)
      });
    }
  }

  // Sort by confidence
  suggestions.sort((a, b) => b.confidence_score - a.confidence_score);

  // Add default NDA if no matches
  if (suggestions.length === 0) {
    suggestions.push({
      template_id: 'nda_template',
      template_name: 'Non-Disclosure Agreement',
      contract_type: 'nda',
      confidence_score: 30,
      matching_keywords: [],
      reasoning: 'General purpose confidentiality protection'
    });
  }

  return suggestions;
}

function getTemplateName(templateType: string): string {
  const names = {
    nda: 'Non-Disclosure Agreement',
    employment: 'Employment Contract',
    service_agreement: 'Service Agreement',
    rental_agreement: 'Rental Agreement'
  };
  return names[templateType as keyof typeof names] || 'Contract Template';
}

function generateReasoning(confidence: number, keywords: string[]): string {
  if (confidence > 70) {
    return `High confidence match based on key terms: ${keywords.slice(0, 3).join(', ')}`;
  } else if (confidence > 40) {
    return `Moderate match based on terms: ${keywords.slice(0, 2).join(', ')}`;
  } else {
    return 'Low confidence match with limited relevant terms';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const suggestions = analyzePrompt(prompt);
    const topSuggestion = suggestions[0];

    const response = {
      suggested_templates: suggestions.slice(0, 3), // Top 3
      extracted_keywords: suggestions.flatMap(s => s.matching_keywords).slice(0, 5),
      contract_intent: topSuggestion ? topSuggestion.contract_type : 'general',
      analysis_summary: topSuggestion 
        ? `Based on your description, I recommend creating a ${topSuggestion.template_name}. This matches your needs with ${topSuggestion.confidence_score}% confidence.`
        : 'I couldn\'t find a perfect template match. Let me suggest some general contract options.',
      confidence_level: topSuggestion?.confidence_score > 70 ? 'high' : topSuggestion?.confidence_score > 40 ? 'medium' : 'low'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error analyzing prompt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
