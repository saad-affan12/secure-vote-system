import { useState } from 'react'

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!message.trim()) return
    
    const userMsg = message
    setMessage('')
    setResponses(prev => [...prev, { type: 'user', text: userMsg }])
    setLoading(true)
    
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: userMsg }]
        })
      })
      const data = await res.json()
      const assistantMsg = data.choices?.[0]?.message?.content || 'Sorry, I could not process your request.'
      setResponses(prev => [...prev, { type: 'assistant', text: assistantMsg }])
    } catch (err) {
      setResponses(prev => [...prev, { type: 'assistant', text: 'Error: Could not connect to AI service.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg flex items-center justify-center text-white text-2xl z-50"
        title="AI Assistant"
      >
        💬
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-gray-800 rounded-xl shadow-2xl flex flex-col z-50 border border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-white font-semibold">AI Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {responses.length === 0 && (
              <p className="text-gray-400 text-center text-sm">Ask me anything about the voting system!</p>
            )}
            {responses.map((r, i) => (
              <div key={i} className={`p-3 rounded-lg ${r.type === 'user' ? 'bg-blue-600 ml-8' : 'bg-gray-700 mr-8'}`}>
                <p className="text-white text-sm whitespace-pre-wrap">{r.text}</p>
              </div>
            ))}
            {loading && <p className="text-gray-400 text-sm">Thinking...</p>}
          </div>

          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSend}
                disabled={loading || !message.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
