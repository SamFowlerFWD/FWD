import React, { useState } from 'react';

interface QuizQuestion {
  id: number;
  question: string;
  answers: {
    text: string;
    points: {
      automation: number;
      website: number;
      app: number;
      hosting: number;
    };
  }[];
}

interface ServiceRecommendation {
  service: string;
  title: string;
  description: string;
  savings: string;
  timeframe: string;
  href: string;
  icon: string;
  urgency: string;
}

const ServiceQuiz: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({
    automation: 0,
    website: 0,
    app: 0,
    hosting: 0
  });
  const [showResult, setShowResult] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const questions: QuizQuestion[] = [
    {
      id: 1,
      question: "What's your biggest business pain point right now?",
      answers: [
        { 
          text: "Spending too much time on repetitive tasks", 
          points: { automation: 3, website: 0, app: 1, hosting: 0 }
        },
        { 
          text: "Not getting enough leads/customers online", 
          points: { automation: 0, website: 3, app: 1, hosting: 0 }
        },
        { 
          text: "Need custom software but can't afford £100k+", 
          points: { automation: 1, website: 0, app: 3, hosting: 0 }
        },
        { 
          text: "Website/app keeps crashing or running slow", 
          points: { automation: 0, website: 0, app: 0, hosting: 3 }
        }
      ]
    },
    {
      id: 2,
      question: "How many hours per week do you waste on manual tasks?",
      answers: [
        { 
          text: "Less than 10 hours", 
          points: { automation: 1, website: 0, app: 0, hosting: 0 }
        },
        { 
          text: "10-20 hours", 
          points: { automation: 2, website: 0, app: 1, hosting: 0 }
        },
        { 
          text: "20-40 hours", 
          points: { automation: 3, website: 0, app: 2, hosting: 0 }
        },
        { 
          text: "More than 40 hours", 
          points: { automation: 4, website: 0, app: 3, hosting: 0 }
        }
      ]
    },
    {
      id: 3,
      question: "What's your current monthly software/hosting spend?",
      answers: [
        { 
          text: "Under £500", 
          points: { automation: 1, website: 1, app: 0, hosting: 1 }
        },
        { 
          text: "£500 - £2,000", 
          points: { automation: 2, website: 1, app: 1, hosting: 2 }
        },
        { 
          text: "£2,000 - £5,000", 
          points: { automation: 3, website: 1, app: 2, hosting: 3 }
        },
        { 
          text: "Over £5,000", 
          points: { automation: 3, website: 0, app: 3, hosting: 4 }
        }
      ]
    },
    {
      id: 4,
      question: "What would have the biggest impact on your business?",
      answers: [
        { 
          text: "Eliminating errors and manual work", 
          points: { automation: 3, website: 0, app: 1, hosting: 0 }
        },
        { 
          text: "Getting 3x more customers from my website", 
          points: { automation: 0, website: 3, app: 0, hosting: 0 }
        },
        { 
          text: "Having custom software that fits perfectly", 
          points: { automation: 1, website: 0, app: 3, hosting: 0 }
        },
        { 
          text: "Never worrying about downtime again", 
          points: { automation: 0, website: 0, app: 0, hosting: 3 }
        }
      ]
    },
    {
      id: 5,
      question: "How quickly do you need to see ROI?",
      answers: [
        { 
          text: "Within 4 weeks", 
          points: { automation: 3, website: 1, app: 0, hosting: 2 }
        },
        { 
          text: "Within 2 months", 
          points: { automation: 2, website: 2, app: 1, hosting: 1 }
        },
        { 
          text: "Within 3-6 months", 
          points: { automation: 1, website: 3, app: 2, hosting: 1 }
        },
        { 
          text: "Long-term growth is fine", 
          points: { automation: 0, website: 2, app: 3, hosting: 0 }
        }
      ]
    }
  ];

  const recommendations: Record<string, ServiceRecommendation> = {
    automation: {
      service: 'automation',
      title: 'Business Process Automation',
      description: 'Your business is losing money every day on repetitive tasks. Automation will save you 30+ hours per week immediately.',
      savings: 'Save £3,000+/month',
      timeframe: 'ROI in 4 weeks',
      href: '/services/business-process-automation',
      icon: '⚡',
      urgency: '17 competitors already automated this month'
    },
    website: {
      service: 'website',
      title: 'AI-Powered Website',
      description: 'Your website is costing you customers. An AI-powered site will triple your conversions and pay for itself in 8 weeks.',
      savings: 'Save £7,000 vs agencies',
      timeframe: 'Live in 3 weeks',
      href: '/services/ai-powered-websites',
      icon: '🚀',
      urgency: '23 Norfolk businesses launched AI sites this week'
    },
    app: {
      service: 'app',
      title: 'Custom App Development',
      description: 'Stop paying for 10 different tools. One custom app will do everything you need for 70% less than traditional development.',
      savings: 'Save £85,000+',
      timeframe: 'Launch in 8 weeks',
      href: '/services/custom-app-development',
      icon: '📱',
      urgency: 'Only 2 development slots left for Q1'
    },
    hosting: {
      service: 'hosting',
      title: 'AI Hosting & Maintenance',
      description: 'Your current hosting is costing you customers and money. AI-powered hosting prevents problems before they happen.',
      savings: 'Save £400+/month',
      timeframe: 'Migration in 48 hours',
      href: '/services/ai-hosting-maintenance',
      icon: '🛡️',
      urgency: '99.99% uptime guaranteed'
    }
  };

  const handleAnswer = (points: typeof scores) => {
    const newScores = {
      automation: scores.automation + points.automation,
      website: scores.website + points.website,
      app: scores.app + points.app,
      hosting: scores.hosting + points.hosting
    };
    setScores(newScores);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResult(true);
    }
  };

  const getRecommendation = (): ServiceRecommendation => {
    const winner = Object.entries(scores).reduce((a, b) => 
      scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b
    )[0];
    return recommendations[winner];
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScores({ automation: 0, website: 0, app: 0, hosting: 0 });
    setShowResult(false);
    setIsStarted(false);
  };

  if (!isStarted) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-ai-purple to-trust-blue rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-4">
            🎯
          </div>
          <h3 className="text-3xl font-bold text-deep-space mb-3">
            Which Service Should You Start With?
          </h3>
          <p className="text-gray-600 mb-2">
            Get a personalized recommendation based on your business needs
          </p>
          <p className="text-sm text-gold font-medium">
            Takes 30 seconds • See exact savings • No email required
          </p>
        </div>
        
        <button
          onClick={() => setIsStarted(true)}
          className="bg-gradient-to-r from-ai-purple to-trust-blue hover:from-ai-purple/90 hover:to-trust-blue/90 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-200 text-lg"
        >
          Start Free Assessment →
        </button>
        
        <p className="text-xs text-gray-500 mt-4">
          Join 287+ Norfolk businesses who discovered their perfect solution
        </p>
      </div>
    );
  }

  if (showResult) {
    const recommendation = getRecommendation();
    
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-success-green to-trust-blue rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-4 animate-bounce">
            {recommendation.icon}
          </div>
          <h3 className="text-3xl font-bold text-deep-space mb-2">
            Your Perfect Starting Point:
          </h3>
          <h4 className="text-2xl font-bold ai-gradient-text mb-4">
            {recommendation.title}
          </h4>
        </div>

        <div className="bg-gradient-to-br from-ai-purple/5 to-trust-blue/5 rounded-xl p-6 mb-6">
          <p className="text-lg text-gray-700 mb-4">{recommendation.description}</p>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Potential Savings</p>
              <p className="text-2xl font-bold text-success-green">{recommendation.savings}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Time to Value</p>
              <p className="text-2xl font-bold text-ai-purple">{recommendation.timeframe}</p>
            </div>
          </div>

          <div className="bg-gold/10 border border-gold/20 rounded-lg p-3 mb-6">
            <p className="text-sm text-gold font-medium text-center">
              ⚠️ {recommendation.urgency}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={recommendation.href}
              className="flex-1 text-center bg-gold hover:bg-gold/90 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200"
            >
              Get Started Now →
            </a>
            <button
              onClick={resetQuiz}
              className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Want to explore all options?
          </p>
          <a href="#services" className="text-ai-purple hover:text-ai-purple/80 font-medium text-sm">
            View All Services →
          </a>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-ai-purple to-trust-blue h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <h3 className="text-2xl font-bold text-deep-space mb-6">
        {question.question}
      </h3>

      {/* Answers */}
      <div className="space-y-3">
        {question.answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(answer.points)}
            className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-ai-purple hover:bg-ai-purple/5 transition-all duration-200 group"
          >
            <span className="text-gray-700 group-hover:text-deep-space font-medium">
              {answer.text}
            </span>
          </button>
        ))}
      </div>

      {/* Skip Link */}
      <div className="mt-6 text-center">
        <button
          onClick={() => setShowResult(true)}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Skip to recommendation →
        </button>
      </div>
    </div>
  );
};

export default ServiceQuiz;