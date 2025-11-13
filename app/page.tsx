import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
            💖 Dating App
          </div>
          <div className="space-x-4">
            <Link
              href="/login"
              className="px-6 py-2 text-purple-600 font-semibold hover:text-purple-700"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:from-pink-600 hover:to-purple-700 transition"
            >
              Get Started
            </Link>
          </div>
        </nav>

        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Find Your Perfect Match
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Connect with amazing people, start meaningful conversations, and
            find love with our secure dating platform.
          </p>

          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-bold text-lg hover:from-pink-600 hover:to-purple-700 transition transform hover:scale-105"
            >
              Join Now - It's Free
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:bg-gray-50 transition transform hover:scale-105"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-32 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-2">Verified Profiles</h3>
            <p className="text-gray-600">
              Dual verification via email and phone ensures authentic
              connections
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold mb-2">Real-time Chat</h3>
            <p className="text-gray-600">
              Instant messaging with typing indicators and read receipts
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-4xl mb-4">❤️</div>
            <h3 className="text-xl font-bold mb-2">Smart Matching</h3>
            <p className="text-gray-600">
              Find compatible matches based on your preferences
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-32">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-bold mb-2">Sign Up</h4>
              <p className="text-sm text-gray-600">
                Create your account in minutes
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-bold mb-2">Verify</h4>
              <p className="text-sm text-gray-600">
                Confirm email and phone number
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-bold mb-2">Browse</h4>
              <p className="text-sm text-gray-600">Discover amazing matches</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h4 className="font-bold mb-2">Connect</h4>
              <p className="text-sm text-gray-600">Start chatting instantly</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-32 bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Find Love?</h2>
          <p className="text-xl mb-8">
            Join thousands of happy couples who found their match
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:bg-gray-100 transition transform hover:scale-105"
          >
            Create Your Free Account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-32">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 Dating App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
