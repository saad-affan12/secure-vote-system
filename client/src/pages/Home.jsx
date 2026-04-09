import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">🗳️ Secure Vote Flow</h1>
          <p className="text-gray-400 text-lg">A secure and transparent voting system</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-8 border border-blue-500/50">
            <div className="text-center mb-6">
              <span className="text-5xl">🗳️</span>
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-4">Voter Portal</h2>
            <p className="text-gray-400 text-center mb-6">
              Login to view elections and cast your vote
            </p>
            <div className="space-y-3">
              <Link 
                to="/login" 
                className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-center transition"
              >
                Voter Login
              </Link>
              <Link 
                to="/register" 
                className="block w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-center transition"
              >
                Register as Voter
              </Link>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-2xl p-8 border border-yellow-500/50">
            <div className="text-center mb-6">
              <span className="text-5xl">🔐</span>
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-4">Admin Portal</h2>
            <p className="text-gray-400 text-center mb-6">
              Login to manage elections and candidates
            </p>
            <Link 
              to="/admin-login" 
              className="block w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg text-center transition"
            >
              Admin Login
            </Link>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Your vote is secure and anonymous
          </p>
        </div>
      </div>
    </div>
  )
}
