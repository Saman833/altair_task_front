export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🎉 Railway Test Page
        </h1>
        <p className="text-gray-600 mb-4">
          If you can see this page, your Railway deployment is working!
        </p>
        <div className="bg-green-100 text-green-800 p-4 rounded-lg">
          <p className="font-medium">✅ Routing is working correctly</p>
          <p className="text-sm">Next.js is properly configured for Railway</p>
        </div>
        <a 
          href="/" 
          className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
} 