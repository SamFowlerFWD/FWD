import React, { useState } from 'react';
import { 
  Twitter, Instagram, Linkedin, Facebook, 
  Hash, Clock, TrendingUp, Calendar,
  Sparkles, Copy, Check, BarChart3
} from 'lucide-react';
import { trackMetric } from './ValueCounter';

interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  maxLength: number;
}

interface GeneratedPost {
  platform: string;
  content: string;
  hashtags: string[];
  bestTime: string;
  estimatedReach: number;
  engagement: number;
}

const platforms: Platform[] = [
  { id: 'twitter', name: 'Twitter/X', icon: <Twitter className="w-5 h-5" />, color: 'bg-black', maxLength: 280 },
  { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-5 h-5" />, color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600', maxLength: 2200 },
  { id: 'linkedin', name: 'LinkedIn', icon: <Linkedin className="w-5 h-5" />, color: 'bg-blue-700', maxLength: 3000 },
  { id: 'facebook', name: 'Facebook', icon: <Facebook className="w-5 h-5" />, color: 'bg-blue-600', maxLength: 63206 }
];

const postTypes = [
  'Product Launch',
  'Company Update', 
  'Industry News',
  'Customer Success',
  'Behind the Scenes',
  'Educational Content',
  'Promotional Offer',
  'Event Announcement'
];

export default function SocialMediaCenter() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['twitter']);
  const [postType, setPostType] = useState('Product Launch');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<'professional' | 'casual' | 'excited'>('professional');
  const [generating, setGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const generatePosts = async () => {
    if (!topic || selectedPlatforms.length === 0) return;
    
    setGenerating(true);
    
    try {
      const response = await fetch('/api/playground/social-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          postType,
          topic,
          tone
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedPosts(data.posts);
      } else {
        // Fallback to mock data
        generateMockPosts();
      }
      
      trackMetric({
        demosCompleted: 1,
        tokensUsed: selectedPlatforms.length * 50,
        timeSaved: 30,
        potentialSavings: 250
      });
    } catch (error) {
      // Use mock data for demo
      generateMockPosts();
    } finally {
      setGenerating(false);
    }
  };

  const generateMockPosts = () => {
    const mockPosts: GeneratedPost[] = selectedPlatforms.map(platformId => {
      const platform = platforms.find(p => p.id === platformId)!;
      
      const templates = {
        twitter: {
          professional: `🚀 Exciting news! ${topic || 'Our latest innovation'} is here to transform your business. Experience the future of automation today.\n\n`,
          casual: `Hey everyone! 👋 ${topic || 'Something amazing'} just dropped and we're pumped to share it with you!\n\n`,
          excited: `🎉 BIG ANNOUNCEMENT! ${topic || 'This game-changer'} is LIVE! Get ready to revolutionize how you work! 🔥\n\n`
        },
        instagram: {
          professional: `We're thrilled to introduce ${topic || 'our latest solution'} - a breakthrough in business automation.\n\n✨ Key Benefits:\n• Save 20+ hours weekly\n• Reduce costs by 60%\n• Scale effortlessly\n• Boost productivity 10x\n\nTransform your business today. Link in bio.\n\n`,
          casual: `New drop alert! 📢 ${topic || 'This'} is about to change everything.\n\nSwipe to see how we're making business easier, one automation at a time.\n\n`,
          excited: `THIS IS IT! 🚀 ${topic || 'The solution you\'ve been waiting for'} is HERE!\n\n💥 Game-changing features\n💥 Incredible results\n💥 Happy customers everywhere\n\nDon't miss out!\n\n`
        },
        linkedin: {
          professional: `I'm excited to share ${topic || 'an important development'} that addresses a critical challenge many businesses face today.\n\nIn our increasingly digital economy, automation isn't just an advantage—it's essential. This solution delivers:\n\n📊 Measurable ROI within 30 days\n⚡ 90% reduction in manual processes\n🎯 Enhanced accuracy and compliance\n💡 Scalable infrastructure for growth\n\nLet's connect to discuss how this can transform your operations.\n\n`,
          casual: `Just launched: ${topic || 'Something that\'ll make your work life easier'}! 🎉\n\nAfter months of development and feedback from amazing clients, we're ready to help more businesses automate their way to success.\n\nWhat problems are you solving with automation?\n\n`,
          excited: `🔥 BREAKING: ${topic || 'Revolutionary automation'} is changing the game!\n\nForget everything you know about manual processes. This is the future, and it's available NOW.\n\nWho's ready to 10x their productivity?\n\n`
        },
        facebook: {
          professional: `We're proud to announce ${topic || 'our newest innovation'} - designed to help businesses like yours thrive in the digital age.\n\nLearn more about how automation can transform your operations and drive growth.\n\n`,
          casual: `Friends, we've got something special for you! ${topic || 'Check this out'} - it's going to save you tons of time and hassle.\n\nDrop a comment if you want to know more! 👇\n\n`,
          excited: `🎊 IT'S HERE! ${topic || 'The most exciting thing we\'ve ever built'}!\n\nThis is going to blow your mind. Seriously.\n\nHit that like button if you're ready for the future! 🚀\n\n`
        }
      };

      const content = templates[platformId as keyof typeof templates]?.[tone] || 
        `Introducing ${topic || 'our latest innovation'} - transforming businesses through intelligent automation.`;

      const hashtagSets = {
        twitter: ['#Automation', '#AI', '#BusinessGrowth', '#Innovation', '#TechTrends'],
        instagram: ['#BusinessAutomation', '#AITools', '#Entrepreneur', '#SmallBusiness', '#Innovation', '#TechStartup', '#DigitalTransformation', '#Success'],
        linkedin: ['#DigitalTransformation', '#BusinessInnovation', '#AI', '#Automation', '#FutureOfWork'],
        facebook: ['#SmallBusinessLove', '#Automation', '#Innovation', '#BusinessTips']
      };

      const bestTimes = {
        twitter: '9:00 AM & 3:00 PM',
        instagram: '11:00 AM & 7:00 PM',
        linkedin: '7:30 AM & 5:30 PM',
        facebook: '1:00 PM & 8:00 PM'
      };

      return {
        platform: platform.name,
        content: content + hashtagSets[platformId as keyof typeof hashtagSets].slice(0, 3).join(' '),
        hashtags: hashtagSets[platformId as keyof typeof hashtagSets],
        bestTime: bestTimes[platformId as keyof typeof bestTimes] || '12:00 PM',
        estimatedReach: Math.floor(Math.random() * 5000) + 1000,
        engagement: Math.floor(Math.random() * 15) + 5
      };
    });

    setTimeout(() => {
      setGeneratedPosts(mockPosts);
    }, 1500);
  };

  const copyToClipboard = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const reset = () => {
    setGeneratedPosts([]);
    setTopic('');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8" />
          <div>
            <h3 className="text-xl font-bold">AI Social Media Command Center</h3>
            <p className="text-sm opacity-90">Generate optimized posts for all platforms instantly</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {generatedPosts.length === 0 ? (
          <div className="space-y-6">
            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Platforms
              </label>
              <div className="grid grid-cols-2 gap-3">
                {platforms.map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedPlatforms.includes(platform.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${platform.color} text-white`}>
                        {platform.icon}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{platform.name}</p>
                        <p className="text-xs text-gray-500">Max {platform.maxLength} chars</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Post Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Post Type
              </label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {postTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Topic Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What are you posting about?
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., New AI feature launch, Summer sale, Company milestone..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={3}
              />
            </div>

            {/* Tone Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone of Voice
              </label>
              <div className="flex gap-3">
                {(['professional', 'casual', 'excited'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-4 py-2 rounded-lg capitalize transition-all ${
                      tone === t
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generatePosts}
              disabled={!topic || selectedPlatforms.length === 0 || generating}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin">⚡</div>
                  Generating Posts...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Social Media Posts
                </>
              )}
            </button>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-gray-800 mb-1">What This Automates:</p>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Crafts platform-optimized content</li>
                    <li>• Suggests trending hashtags</li>
                    <li>• Identifies best posting times</li>
                    <li>• Maintains consistent brand voice</li>
                    <li>• Saves 3+ hours per campaign</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Generated Posts</h4>
              <button
                onClick={reset}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                Generate New →
              </button>
            </div>

            {generatedPosts.map((post, index) => {
              const platform = platforms.find(p => p.name === post.platform);
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className={`p-4 text-white ${platform?.color || 'bg-gray-600'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {platform?.icon}
                        <span className="font-semibold">{post.platform}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(post.content, index)}
                        className="p-2 hover:bg-white/20 rounded transition-colors"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">
                      {post.content}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {post.hashtags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                        >
                          <Hash className="w-3 h-3" />
                          {tag.replace('#', '')}
                        </span>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                      <div className="text-center">
                        <Clock className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                        <p className="text-xs text-gray-600">Best Time</p>
                        <p className="text-sm font-medium text-gray-900">{post.bestTime}</p>
                      </div>
                      <div className="text-center">
                        <TrendingUp className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                        <p className="text-xs text-gray-600">Est. Reach</p>
                        <p className="text-sm font-medium text-gray-900">{post.estimatedReach.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <BarChart3 className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                        <p className="text-xs text-gray-600">Engagement</p>
                        <p className="text-sm font-medium text-gray-900">{post.engagement}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-green-800">
                <strong>💡 Pro Tip:</strong> Schedule these posts at the suggested times for maximum engagement. 
                Our automation can post to all platforms simultaneously!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}