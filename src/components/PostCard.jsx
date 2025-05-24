import React from 'react';
import { useNavigate } from 'react-router-dom';

const PostCard = ({ post, postId }) => {
  const navigate = useNavigate();
  const { aiGeneratedUrl, originalUrl, modelUsed, caption, chatLink } = post;

  return (
    <div
      className="relative group bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-transform duration-300 hover:scale-105"
      onClick={() => navigate(`/post/${postId}`)}
    >
      {/* Image or Video */}
      <div className="relative overflow-hidden">
        {aiGeneratedUrl.includes('video') ? (
          <video
            src={aiGeneratedUrl}
            autoPlay
            loop
            muted
            className="w-full h-64 object-cover transform transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <img
            src={aiGeneratedUrl}
            alt={caption || 'Post'}
            className="w-full h-64 object-cover transform transition-transform duration-500 group-hover:scale-110"
          />
        )}
      </div>

      {/* Bottom Bar (Always Visible) */}
      <div className="p-4 flex justify-between items-center bg-gray-50">
        <span className="text-sm font-semibold text-gray-700">{modelUsed || 'Unknown Model'}</span>
        <span className="text-sm text-gray-500">@gaurav1</span>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-90 transition-opacity duration-300 flex flex-col justify-end p-4">
        <div className="text-white">
          <h3 className="text-lg font-semibold">{caption || 'Untitled'}</h3>
          <p className="text-sm">{modelUsed || 'Unknown Model'}</p>
          <p className="text-sm">@gaurav1</p>
          <div className="flex space-x-4 mt-2">
            <button className="text-white hover:text-red-400 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button className="text-white hover:text-blue-400 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-5-7 5V5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;