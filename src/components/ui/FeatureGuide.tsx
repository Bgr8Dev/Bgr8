import React, { useState } from 'react';
import { FaInfoCircle, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import InfoAlert from './InfoAlert';

interface FeatureGuideProps {
  title: string;
  features: Array<{
    name: string;
    description: string;
    icon?: React.ReactNode;
  }>;
  className?: string;
}

export default function FeatureGuide({ title, features, className = '' }: FeatureGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`feature-guide ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <div className="flex items-center">
          <FaInfoCircle className="text-blue-500 mr-2" />
          <span className="font-medium text-gray-700">{title}</span>
        </div>
        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start p-2 bg-white rounded border">
              {feature.icon && (
                <div className="flex-shrink-0 mr-3 text-gray-500">
                  {feature.icon}
                </div>
              )}
              <div>
                <div className="font-medium text-sm text-gray-700">{feature.name}</div>
                <div className="text-sm text-gray-600">{feature.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
