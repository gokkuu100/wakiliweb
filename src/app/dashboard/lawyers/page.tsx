'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Scale, 
  Search,
  MapPin,
  Star,
  Phone,
  Mail,
  Briefcase,
  Award,
  Clock,
  MessageSquare,
  Filter,
  Brain
} from 'lucide-react';

export default function LawyersPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const nearbyLawyers = [
    {
      id: 1,
      name: 'Sarah Mwangi & Associates',
      type: 'Law Firm',
      specialties: ['Corporate Law', 'Contract Law', 'Employment Law'],
      rating: 4.8,
      reviews: 124,
      location: 'Westlands, Nairobi',
      distance: '2.3 km',
      experience: '15+ years',
      phone: '+254 700 123 456',
      email: 'info@sarahmwangi.co.ke',
      verified: true,
      responseTime: '< 2 hours'
    },
    {
      id: 2,
      name: 'James Kiprotich',
      type: 'Solo Practitioner',
      specialties: ['Property Law', 'Family Law', 'Civil Litigation'],
      rating: 4.6,
      reviews: 89,
      location: 'CBD, Nairobi',
      distance: '5.1 km',
      experience: '12+ years',
      phone: '+254 722 987 654',
      email: 'james@kiprotichlaw.co.ke',
      verified: true,
      responseTime: '< 4 hours'
    },
    {
      id: 3,
      name: 'Grace Wanjiku Legal Services',
      type: 'Solo Practitioner',
      specialties: ['Intellectual Property', 'Technology Law', 'Startups'],
      rating: 4.9,
      reviews: 67,
      location: 'Karen, Nairobi',
      distance: '8.7 km',
      experience: '10+ years',
      phone: '+254 733 456 789',
      email: 'grace@wanjikulaw.co.ke',
      verified: true,
      responseTime: '< 1 hour'
    }
  ];

  const suggestedLawyers = [
    {
      id: 1,
      name: 'Corporate Law Specialists',
      reason: 'Based on your recent NDA and service agreements',
      lawyers: [
        {
          name: 'Sarah Mwangi & Associates',
          match: 95,
          specialty: 'Corporate & Contract Law'
        },
        {
          name: 'Kimani & Partners',
          match: 88,
          specialty: 'Business Law'
        }
      ]
    },
    {
      id: 2,
      name: 'Employment Law Experts',
      reason: 'For your employment contract needs',
      lawyers: [
        {
          name: 'James Kiprotich',
          match: 92,
          specialty: 'Employment & Labor Law'
        },
        {
          name: 'Wanjiru Legal Consultants',
          match: 85,
          specialty: 'HR & Employment'
        }
      ]
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find a Lawyer</h1>
          <p className="text-gray-600">Connect with qualified legal professionals in Kenya</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, specialty, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="nearby" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="nearby" className="flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              Lawyers Near Me
            </TabsTrigger>
            <TabsTrigger value="suggested" className="flex items-center">
              <Brain className="mr-2 h-4 w-4" />
              AI Suggestions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nearby" className="space-y-4">
            {nearbyLawyers.map((lawyer) => (
              <Card key={lawyer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Scale className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {lawyer.name}
                        </h3>
                        {lawyer.verified && (
                          <Badge className="bg-green-100 text-green-800">Verified</Badge>
                        )}
                        <Badge variant="outline">{lawyer.type}</Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm font-medium">{lawyer.rating}</span>
                          <span className="ml-1 text-sm text-gray-500">({lawyer.reviews} reviews)</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          {lawyer.location} • {lawyer.distance}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {lawyer.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center">
                          <Award className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{lawyer.experience} experience</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <span>Responds {lawyer.responseTime}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{lawyer.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Contact
                      </Button>
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="suggested" className="space-y-4">
            {suggestedLawyers.map((suggestion) => (
              <Card key={suggestion.id} className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-900">
                    <Brain className="mr-2 h-5 w-5" />
                    {suggestion.name}
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    {suggestion.reason}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {suggestion.lawyers.map((lawyer, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{lawyer.name}</h4>
                          <p className="text-sm text-gray-600">{lawyer.specialty}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className="bg-green-100 text-green-800">
                            {lawyer.match}% match
                          </Badge>
                          <Button size="sm">Contact</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Can't find the right lawyer?
              </h3>
              <p className="text-blue-700 mb-4">
                Tell us about your legal need and we'll help you find the perfect match.
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <MessageSquare className="mr-2 h-4 w-4" />
                Get Personalized Recommendations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}