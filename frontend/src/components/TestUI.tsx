import React from 'react';
import { Code, Sparkles } from 'lucide-react';

const TestUI = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Code className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">✅ Code Review Agent</h1>
            <p className="text-gray-600">التجربة تعمل بنجاح!</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-800">كل شيء يعمل! 🎉</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">✅ React يعمل</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700">✅ Tailwind CSS يعمل</p>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-purple-700">✅ Lucide Icons تعمل</p>
            </div>
          </div>

          {/* Test Area */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-700 mb-3">جرب الكتابة:</h3>
            <textarea 
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="اكتب أي شيء هنا..."
            />
            <button className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-all">
              زر تجريبي
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestUI;