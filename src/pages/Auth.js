import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [realName, setRealName] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [answers, setAnswers] = useState({
    question1: '',
    question2: '',
    question3: '',
    question4: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const questions = [
    "Kanıtlayacak hiçbir şeyiniz ve yapmak *zorunda* olduğunuz hiçbir şey olmasaydı, varlığınız neyle meşgul olurdu?",
    "Hangi konuda hile yapıyorsun? (Senin için oyun olan, başkası için iş olan şey nedir?)",
    "Bu zahmetsiz dehanın başkalarının hangi sorununu çözer?",
    "Hangi görev enerjinizi tüketiyor? (Başkasının hediyesine ihtiyaç duyduğun alan nedir?)"
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        // Validate all answers are provided
        const allAnswered = Object.values(answers).every(answer => answer.trim())
        if (!allAnswered) {
          throw new Error('Lütfen dört soruyu da cevaplayın')
        }
        
        await signUp(email, password, realName, inviteToken, answers)
        alert('Hesap oluşturuldu! Giriş yapabilirsiniz.')
        
        // Reset form and switch to sign in
        setEmail('')
        setPassword('')
        setRealName('')
        setInviteToken('')
        setAnswers({ question1: '', question2: '', question3: '', question4: '' })
        setIsSignUp(false)
      } else {
        await signIn(email, password)
        navigate('/dashboard')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Toplumu bir makine, seni de bir dişli olarak gören devir bitti.
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Burada zayıf yönlerini düzeltmeye değil, 'Hile yapıyormuşçasına' kolay yaptığın işleri keşfetmeye geldin.
        </p>
        <div className="mt-4 text-center">
          <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-md inline-block">
            🎁 Zahmetsiz Deha Ekosistemi - Hediye Odaklı Yaklaşım
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-posta adresi
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {isSignUp && (
              <>
                <div>
                  <label htmlFor="realName" className="block text-sm font-medium text-gray-700">
                    Gerçek Adınız
                  </label>
                  <input
                    id="realName"
                    name="realName"
                    type="text"
                    required
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="inviteToken" className="block text-sm font-medium text-gray-700">
                    Referans Kodu (İsteğe bağlı)
                  </label>
                  <input
                    id="inviteToken"
                    name="inviteToken"
                    type="text"
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="İsteğe bağlı: Referans kodu girin"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Zahmetsiz Deha Keşfi</h3>
                  <p className="text-sm text-gray-600 italic">
                    "En yüksek katma değer, en kolay yapılan işten gelir. (0 Kalori Efor)"
                  </p>
                  {questions.map((question, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {index + 1}. {question}
                      </label>
                      <textarea
                        required
                        value={answers[`question${index + 1}`]}
                        onChange={(e) => setAnswers({
                          ...answers,
                          [`question${index + 1}`]: e.target.value
                        })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        rows="3"
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Yükleniyor...' : (isSignUp ? 'Hesap Oluştur' : 'Giriş Yap')}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
              >
                {isSignUp ? 'Zaten hesabınız var mı? Giriş yapın' : 'Yeni misiniz? Anonim kimliğinizi oluşturun'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Auth