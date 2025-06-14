'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Scale, 
  FileText, 
  Users, 
  Shield, 
  MessageSquare, 
  Search, 
  BookOpen, 
  CheckCircle, 
  Star,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Zap,
  Clock,
  Award,
  Lock,
  Globe,
  Briefcase
} from 'lucide-react';

export default function LegalAILandingPage() {
  const [activeUserType, setActiveUserType] = useState<'users' | 'lawyers'>('users');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Scale className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                LegalAI
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition-colors">How it Works</a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors">Pricing</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors">Contact</a>
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                Sign In
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200">
              AI-Powered Legal Solutions for Kenya
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Your Legal Assistant,
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block">
                Powered by AI
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              From contract creation to legal research, LegalAI empowers everyone in Kenya with intelligent legal tools. 
              Whether you're an individual or a legal professional, we've got you covered.
            </p>
            
            {/* Dual CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
                onClick={() => setActiveUserType('users')}
              >
                <Users className="mr-2 h-5 w-5" />
                For Individuals
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg"
                onClick={() => setActiveUserType('lawyers')}
              >
                <Briefcase className="mr-2 h-5 w-5" />
                For Lawyers
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-gray-500">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span>Bank-level Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-blue-600" />
                <span>Kenya Law Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <span>24/7 AI Assistant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Everyone
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you're creating your first contract or conducting complex legal research, 
              LegalAI adapts to your needs.
            </p>
          </div>

          <Tabs value={activeUserType} onValueChange={(value) => setActiveUserType(value as 'users' | 'lawyers')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-12">
              <TabsTrigger value="users" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>For Individuals</span>
              </TabsTrigger>
              <TabsTrigger value="lawyers" className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4" />
                <span>For Lawyers</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
                  <CardHeader>
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>Smart Contract Creation</CardTitle>
                    <CardDescription>
                      Create professional contracts in minutes with AI guidance. From NDAs to service agreements.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-green-200">
                  <CardHeader>
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                      <Shield className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle>Digital Signatures</CardTitle>
                    <CardDescription>
                      Send contracts for signatures with full audit trails. Legally binding and secure.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200">
                  <CardHeader>
                    <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                      <MessageSquare className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle>Legal AI Chat</CardTitle>
                    <CardDescription>
                      Ask questions about Kenyan law and get instant, accurate answers from our AI assistant.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-200">
                  <CardHeader>
                    <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                      <BookOpen className="h-6 w-6 text-orange-600" />
                    </div>
                    <CardTitle>Document Summaries</CardTitle>
                    <CardDescription>
                      Upload legal documents and get clear, plain-English summaries instantly.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-teal-200">
                  <CardHeader>
                    <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
                      <Users className="h-6 w-6 text-teal-600" />
                    </div>
                    <CardTitle>Lawyer Referrals</CardTitle>
                    <CardDescription>
                      Get matched with qualified lawyers and law firms for complex legal matters.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-indigo-200">
                  <CardHeader>
                    <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                      <Lock className="h-6 w-6 text-indigo-600" />
                    </div>
                    <CardTitle>Secure Storage</CardTitle>
                    <CardDescription>
                      Store all your contracts and legal documents securely in the cloud with easy access.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="lawyers">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
                  <CardHeader>
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                      <Search className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>Legal Research AI</CardTitle>
                    <CardDescription>
                      Powerful AI-driven research across Kenyan law, case precedents, and legal statutes.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-green-200">
                  <CardHeader>
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle>Document Analysis</CardTitle>
                    <CardDescription>
                      Upload legal documents for instant analysis, insights, and relevant citations.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200">
                  <CardHeader>
                    <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                      <Scale className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle>Case Law Comparison</CardTitle>
                    <CardDescription>
                      Compare documents against relevant case law and legal precedents automatically.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-200">
                  <CardHeader>
                    <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                      <Zap className="h-6 w-6 text-orange-600" />
                    </div>
                    <CardTitle>Brief Generation</CardTitle>
                    <CardDescription>
                      Generate legal briefs with AI assistance, complete with citations and arguments.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-teal-200">
                  <CardHeader>
                    <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
                      <BookOpen className="h-6 w-6 text-teal-600" />
                    </div>
                    <CardTitle>Legal Library</CardTitle>
                    <CardDescription>
                      Access comprehensive legal databases and stay updated with latest legal developments.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-indigo-200">
                  <CardHeader>
                    <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                      <MessageSquare className="h-6 w-6 text-indigo-600" />
                    </div>
                    <CardTitle>AI Legal Assistant</CardTitle>
                    <CardDescription>
                      24/7 AI assistant specialized in Kenyan law for instant legal guidance and research.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How LegalAI Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, intuitive, and powerful. Get started in minutes.
            </p>
          </div>

          <Tabs value={activeUserType} onValueChange={(value) => setActiveUserType(value as 'users' | 'lawyers')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-12">
              <TabsTrigger value="users">For Individuals</TabsTrigger>
              <TabsTrigger value="lawyers">For Lawyers</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Describe Your Need</h3>
                  <p className="text-gray-600">
                    Tell our AI what kind of contract or legal document you need in plain English.
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600">2</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">AI Guides You</h3>
                  <p className="text-gray-600">
                    Our AI asks relevant questions and guides you through each step of the process.
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-purple-600">3</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Get Your Document</h3>
                  <p className="text-gray-600">
                    Receive a professional, legally sound document ready for signature and use.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lawyers">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Upload & Query</h3>
                  <p className="text-gray-600">
                    Upload documents or ask research questions about Kenyan law and precedents.
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600">2</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
                  <p className="text-gray-600">
                    Our AI analyzes documents and provides insights, citations, and legal precedents.
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-purple-600">3</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Get Results</h3>
                  <p className="text-gray-600">
                    Receive comprehensive reports with citations, alternative arguments, and recommendations.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that works for you. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Individual Plan */}
            <Card className="relative border-2 hover:border-blue-200 transition-colors">
              <CardHeader className="text-center">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Individual Plan</CardTitle>
                <CardDescription>Perfect for personal legal needs</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">KSh 2,500</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>5 Contract creations per month</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Unlimited AI legal chat</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Document summaries</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Digital signatures</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Secure document storage</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Lawyer referrals</span>
                </div>
                <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Lawyer Plan */}
            <Card className="relative border-2 border-blue-600 hover:border-blue-700 transition-colors">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                Most Popular
              </Badge>
              <CardHeader className="text-center">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Legal Professional</CardTitle>
                <CardDescription>For lawyers and law firms</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">KSh 8,500</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Unlimited legal research</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Document analysis & insights</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Case law comparison</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Legal brief generation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Priority AI assistant</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Advanced legal library access</span>
                </div>
                <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Got questions? We've got answers.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Is this legal in Kenya?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Yes, LegalAI operates in full compliance with Kenyan laws and regulations. Our AI-generated contracts 
                are legally binding when properly executed, and our platform adheres to the highest standards of legal 
                and data protection requirements in Kenya.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Do I need a lawyer to use this?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                No, LegalAI is designed for non-lawyers to create simple, standard contracts independently. However, 
                for complex legal matters or when you're unsure, we recommend consulting with a qualified lawyer. 
                Our platform can connect you with legal professionals when needed.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">
                What kind of contracts can I generate?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                LegalAI can help you create various types of contracts including Non-Disclosure Agreements (NDAs), 
                Service Agreements, Employment Contracts, Rental Agreements, Sale Agreements, and many other standard 
                legal documents commonly used in Kenya.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Can lawyers use this too?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Absolutely! LegalAI offers specialized features for legal professionals including advanced legal research, 
                document analysis, case law comparison, and AI-assisted brief generation. Our lawyer plan is specifically 
                designed to enhance legal practice efficiency and research capabilities.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">
                How secure is my data?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                We employ bank-level security measures including end-to-end encryption, secure data centers, 
                and strict access controls. Your legal documents and personal information are protected with 
                the highest security standards and are never shared with third parties.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Can I try it before purchasing?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Yes! We offer a 14-day free trial for both individual and professional plans. You can explore 
                all features and create your first contract at no cost. No credit card required to start your trial.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Legal Professionals
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what our users say about LegalAI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600">
                  "LegalAI has revolutionized how I handle routine legal research. The AI assistant understands 
                  Kenyan law incredibly well and saves me hours of work every day."
                </p>
                <div>
                  <p className="font-semibold">Sarah Mwangi</p>
                  <p className="text-sm text-gray-500">Senior Associate, Nairobi Law Firm</p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600">
                  "As a small business owner, creating contracts used to be expensive and time-consuming. 
                  LegalAI made it simple and affordable. Highly recommended!"
                </p>
                <div>
                  <p className="font-semibold">James Kiprotich</p>
                  <p className="text-sm text-gray-500">CEO, Tech Startup</p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600">
                  "The document analysis feature is incredible. It helped me identify potential issues 
                  in a contract that I would have missed. This tool is a game-changer."
                </p>
                <div>
                  <p className="font-semibold">Grace Wanjiku</p>
                  <p className="text-sm text-gray-500">Solo Practitioner</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Legal Work?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of Kenyans who trust LegalAI for their legal needs. 
            Start your free trial today and experience the future of legal technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Scale className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold">LegalAI</span>
              </div>
              <p className="text-gray-400">
                Empowering Kenya with AI-powered legal solutions for everyone.
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <span className="text-sm">hello@legalai.co.ke</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-blue-400" />
                <span className="text-sm">+254 700 000 000</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-400" />
                <span className="text-sm">Nairobi, Kenya</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Legal Resources</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 LegalAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}