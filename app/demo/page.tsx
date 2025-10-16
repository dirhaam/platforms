export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Booqing Platform Demo
          </h1>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              🏢 Try Our Demo Business
            </h2>
            <p className="text-gray-600 mb-4">
             体验我们的演示业务主页，查看完整的功能演示。
              <br />
              Try our demo business site to see the full features in action.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="http://demo.booqing.my.id"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white shadow hover:bg-blue-700 h-10 px-4 py-2"
              >
                🚀 Launch Demo Site
              </a>
              <a
                href="http://demo.booqing.my.id/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white shadow-sm hover:bg-gray-50 h-10 px-4 py-2"
              >
                ⚙️ Admin Panel
              </a>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                📋 Demo Credentials
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Email:</span> demo@booqing.my.id
                </div>
                <div>
                  <span className="font-medium">Password:</span> demo123
                </div>
                <div>
                  <span className="font-medium">Role:</span> Business Owner
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Use these credentials to log into the admin panel
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                ✨ Features Available
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Real-time booking system</li>
                <li>• Customer management</li>
                <li>• Service scheduling</li>
                <li>• Business analytics</li>
                <li>• Booking calendar</li>
                <li>• Customer notifications</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              🏠 Want to try your own subdomain?
            </h3>
            <p className="text-blue-700 mb-4">
              Create your own business subdomain in seconds!
            </p>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white shadow hover:bg-blue-700 h-10 px-4 py-2"
            >
              🚀 Get Started Free
            </a>
          </div>

          <div className="text-center mt-8">
            <a
              href="/"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
