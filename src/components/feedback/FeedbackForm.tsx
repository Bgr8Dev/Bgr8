import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FeedbackFormData, FeedbackQuestion } from '../../types/sessions';
import { SessionsService } from '../../services/sessionsService';

interface FeedbackFormProps {
  sessionId: string;
  feedbackType: 'mentor' | 'mentee' | 'self';
  receiverUserId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const DEFAULT_QUESTIONS: Omit<FeedbackQuestion, 'questionId'>[] = [
  {
    question: "How confident do you feel about yourself or your goals?",
    response: "",
    notes: "",
    questionType: "rating"
  },
  {
    question: "What was the most valuable thing you learned from this session?",
    response: "",
    notes: "",
    questionType: "text"
  },
  {
    question: "How would you rate the overall quality of this session?",
    response: "",
    notes: "",
    questionType: "rating"
  },
  {
    question: "What could be improved for future sessions?",
    response: "",
    notes: "",
    questionType: "text"
  }
];

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  sessionId,
  feedbackType,
  receiverUserId = null,
  onSuccess,
  onCancel
}) => {
  const { currentUser } = useAuth();
  const [questions, setQuestions] = useState<FeedbackQuestion[]>(
    DEFAULT_QUESTIONS.map((q, index) => ({
      ...q,
      questionId: `Q${index + 1}`
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuestionChange = (questionId: string, field: keyof FeedbackQuestion, value: string) => {
    setQuestions(prev => 
      prev.map(q => 
        q.questionId === questionId ? { ...q, [field]: value } : q
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('User not authenticated');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const feedbackData: FeedbackFormData = {
        giverUserId: currentUser.uid,
        receiverUserId,
        feedbackType,
        questions
      };

      await SessionsService.submitFeedback(sessionId, feedbackData);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return <div>Please log in to submit feedback.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">
        Session Feedback - {feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1)}
      </h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((question) => (
          <div key={question.questionId} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {question.question}
            </label>
            
            {question.questionType === 'rating' ? (
              <select
                value={question.response}
                onChange={(e) => handleQuestionChange(question.questionId, 'response', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select rating</option>
                <option value="1">1 - Very Poor</option>
                <option value="2">2 - Poor</option>
                <option value="3">3 - Fair</option>
                <option value="4">4 - Good</option>
                <option value="5">5 - Excellent</option>
              </select>
            ) : (
              <textarea
                value={question.response}
                onChange={(e) => handleQuestionChange(question.questionId, 'response', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your response..."
                required
              />
            )}
            
            <textarea
              value={question.notes}
              onChange={(e) => handleQuestionChange(question.questionId, 'notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes (optional)"
            />
          </div>
        ))}

        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
};
