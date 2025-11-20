import { FC, useState } from 'react';
import { FaTimes, FaTelegram, FaTwitter, FaDiscord, FaUsers, FaGift, FaStar, FaRocket, FaChartLine } from 'react-icons/fa';
import { MdGroups, MdEvent, MdSupport } from 'react-icons/md';

interface CommunityJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinTelegram?: () => void;
  onFollowTwitter?: () => void;
  onJoinDiscord?: () => void;
}

export const CommunityJoinModal: FC<CommunityJoinModalProps> = ({
  isOpen,
  onClose,
  onJoinTelegram,
  onFollowTwitter,
  onJoinDiscord
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const communityPlatforms = [
    {
      id: 'telegram',
      name: 'Telegram',
      icon: <FaTelegram className="w-8 h-8 text-blue-500" />,
      description: 'Join our main community with 50,000+ active members',
      members: '50,000+',
      activity: 'Very Active',
      benefits: [
        'Daily market updates',
        'Staking tips and strategies',
        'Direct support from team',
        'Exclusive announcements'
      ],
      color: 'from-blue-500 to-cyan-500',
      action: 'Join Telegram',
      onAction: onJoinTelegram
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <FaTwitter className="w-8 h-8 text-sky-500" />,
      description: 'Follow us for the latest news and updates',
      members: '25,000+',
      activity: 'Active',
      benefits: [
        'Breaking news updates',
        'Market analysis',
        'Community highlights',
        'Live AMA sessions'
      ],
      color: 'from-sky-500 to-blue-500',
      action: 'Follow Twitter',
      onAction: onFollowTwitter
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: <FaDiscord className="w-8 h-8 text-indigo-500" />,
      description: 'Connect with developers and get technical support',
      members: '15,000+',
      activity: 'Active',
      benefits: [
        'Technical support',
        'Developer discussions',
        'Voice channels',
        'Bot integrations'
      ],
      color: 'from-indigo-500 to-purple-500',
      action: 'Join Discord',
      onAction: onJoinDiscord
    }
  ];

  const communityEvents = [
    {
      icon: <MdEvent className="w-6 h-6 text-green-500" />,
      title: 'Weekly AMAs',
      description: 'Ask questions directly to the team every Friday',
      time: 'Every Friday 3 PM UTC',
      type: 'AMA'
    },
    {
      icon: <FaGift className="w-6 h-6 text-purple-500" />,
      title: 'Community Airdrops',
      description: 'Exclusive airdrops for active community members',
      time: 'Monthly',
      type: 'Airdrop'
    },
    {
      icon: <FaChartLine className="w-6 h-6 text-orange-500" />,
      title: 'Trading Competitions',
      description: 'Compete with other members for prizes',
      time: 'Bi-weekly',
      type: 'Competition'
    },
    {
      icon: <MdSupport className="w-6 h-6 text-blue-500" />,
      title: 'Support Sessions',
      description: 'Get help with staking and platform features',
      time: 'Daily 9 AM - 9 PM UTC',
      type: 'Support'
    }
  ];

  const communityStats = [
    {
      icon: <FaUsers className="w-6 h-6 text-blue-500" />,
      title: 'Total Members',
      value: '90,000+',
      description: 'Across all platforms'
    },
    {
      icon: <FaRocket className="w-6 h-6 text-green-500" />,
      title: 'Active Stakers',
      value: '25,000+',
      description: 'Earning daily rewards'
    },
    {
      icon: <FaStar className="w-6 h-6 text-yellow-500" />,
      title: 'Community Rating',
      value: '4.9/5',
      description: 'Based on user reviews'
    }
  ];

  const handlePlatformAction = (platform: typeof communityPlatforms[0]) => {
    setSelectedPlatform(platform.id);
    platform.onAction?.();
    
    // Simulate action completion
    setTimeout(() => {
      setSelectedPlatform(null);
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-blue-200 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <MdGroups className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Join Our Community</h3>
              <p className="text-gray-600">Connect with thousands of RZC holders worldwide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {communityStats.map((stat, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="flex justify-center mb-2">
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-sm font-semibold text-gray-700">{stat.title}</div>
              <div className="text-xs text-gray-500">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Platform Selection */}
        <div className="mb-6">
          <h4 className="text-lg font-bold text-gray-800 mb-4">Choose Your Platform</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {communityPlatforms.map((platform) => (
              <div
                key={platform.id}
                className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                  selectedPlatform === platform.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => handlePlatformAction(platform)}
              >
                <div className="flex items-center gap-3 mb-3">
                  {platform.icon}
                  <div>
                    <div className="font-bold text-gray-800">{platform.name}</div>
                    <div className="text-sm text-gray-600">{platform.members} members</div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-700 mb-3">
                  {platform.description}
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-gray-500">Activity Level</div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    platform.activity === 'Very Active' 
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {platform.activity}
                  </div>
                </div>
                
                <div className="space-y-1 mb-4">
                  {platform.benefits.map((benefit, index) => (
                    <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      {benefit}
                    </div>
                  ))}
                </div>
                
                <button
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-all ${
                    selectedPlatform === platform.id
                      ? 'bg-blue-600 text-white'
                      : `bg-gradient-to-r ${platform.color} text-white hover:opacity-90`
                  }`}
                  disabled={selectedPlatform === platform.id}
                >
                  {selectedPlatform === platform.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Joining...
                    </div>
                  ) : (
                    platform.action
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Community Events */}
        <div className="mb-6">
          <h4 className="text-lg font-bold text-gray-800 mb-4">Upcoming Events</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {communityEvents.map((event, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                {event.icon}
                <div className="flex-1">
                  <div className="font-bold text-gray-800">{event.title}</div>
                  <div className="text-sm text-gray-600">{event.description}</div>
                  <div className="text-xs text-gray-500 mt-1">{event.time}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  event.type === 'AMA' ? 'bg-green-100 text-green-700' :
                  event.type === 'Airdrop' ? 'bg-purple-100 text-purple-700' :
                  event.type === 'Competition' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {event.type}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Community Guidelines */}
        <div className="bg-blue-50 rounded-xl p-4">
          <h5 className="font-bold text-blue-800 mb-2">Community Guidelines</h5>
          <div className="text-sm text-blue-700 space-y-1">
            <div>• Be respectful and helpful to other members</div>
            <div>• Share valuable insights and experiences</div>
            <div>• Follow platform-specific rules and guidelines</div>
            <div>• Report any suspicious activity to moderators</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityJoinModal;
