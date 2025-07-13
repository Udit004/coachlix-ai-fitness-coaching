import React from 'react';

const WelcomeCard = ({ userProfile }) => {
  const getMotivationalMessage = () => {
    if (!userProfile) return "Let's start your fitness journey!";
    
    const name = userProfile.name || 'Champion';
    const messages = [
      `Ready to level up, ${name}? 💪`,
      `Let's crush today, ${name}! 🔥`,
      `Time to shine, ${name}! ✨`
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  if (!userProfile) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-sm">
            {userProfile.name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{userProfile.name || 'User'}</h3>
          <p className="text-sm text-blue-600 mt-1">
            {getMotivationalMessage()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;