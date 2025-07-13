"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

// Top 200 most common languages
const LANGUAGES = [
  "Mandarin Chinese", "English", "Hindi", "Spanish", "French", "Standard Arabic", "Bengali", "Russian", 
  "Portuguese", "Indonesian", "Japanese", "German", "Korean", "Telugu", "Vietnamese", "Turkish", 
  "Tamil", "Italian", "Urdu", "Gujarati", "Polish", "Ukrainian", "Persian", "Malayalam", "Kannada", 
  "Oriya", "Burmese", "Thai", "Punjabi", "Bhojpuri", "Tagalog", "Yoruba", "Maithili", "Uzbek", 
  "Sindhi", "Amharic", "Fula", "Romanian", "Oromo", "Igbo", "Azerbaijani", "Awadhi", "Dutch", 
  "Kurdish", "Serbo-Croatian", "Malagasy", "Saraiki", "Nepali", "Sinhala", "Chittagonian", "Zhuang", 
  "Khmer", "Turkmen", "Assamese", "Madurese", "Somali", "Marwari", "Magahi", "Haryanvi", "Hungarian", 
  "Chhattisgarhi", "Greek", "Chewa", "Deccan", "Akan", "Kazakh", "Northern Min", "Sylheti", "Zulu", 
  "Czech", "Kinyarwanda", "Dhundhari", "Hausa", "Northern Kurdish", "Bavarian", "Sundanese", "Luyia", 
  "Ugandan", "Bashkir", "Moldovan", "Konkani", "Komi", "Finnish", "Lombard", "Mossi", "Xhosa", 
  "Belarusian", "Balochi", "Norwegian", "Hejazi Arabic", "Tunisian Arabic", "Tigrinya", "Venetian", 
  "Macedonian", "Latvian", "Tigre", "Kashmiri", "Shan", "Sunda", "Gagauz", "Tahitian", "Lao", 
  "Georgian", "Limburgish", "Serer", "Luganda", "Shona", "Tswana", "Lingala", "Javanese", "Walloon", 
  "Mongolian", "Armenian", "Hmong", "Neapolitan", "Wolof", "Maltese", "Luxembourgish", "Afrikaans", 
  "Albanian", "Hebrew", "Bosnian", "Tajik", "Sindarin", "Faroese", "Breton", "Basque", "Welsh", 
  "Yiddish", "Corsican", "Galician", "Catalan", "Irish", "Scots Gaelic", "Manx", "Cornish", 
  "Icelandic", "Estonian", "Lithuanian", "Slovene", "Slovak", "Croatian", "Serbian", "Bulgarian", 
  "Sorbian", "Rusyn", "Kashubian", "Silesian", "Moravian", "Aromanian", "Megleno-Romanian", 
  "Istro-Romanian", "Friulian", "Ladin", "Romansh", "Sardinian", "Mirandese", "Leonese", "Asturian", 
  "Extremaduran", "Fala", "Aragonese", "Occitan", "Franco-Provençal", "Walloon", "Norman", 
  "Chamorro", "Carolinian", "Palauan", "Marshallese", "Nauruan", "Kiribati", "Tuvaluan", "Fijian", 
  "Tongan", "Samoan", "Niuean", "Cook Islands Māori", "Tahitian", "Marquesan", "Mangareva", 
  "Tuamotu", "Rapa Nui", "Hawaiian", "Māori", "Tokelauan", "Rotuman", "Bislama", "Tok Pisin", 
  "Hiri Motu", "Tetum", "Indonesian", "Malay", "Javanese", "Sundanese", "Madurese", "Minangkabau", 
  "Acehnese", "Batak", "Balinese", "Sasak", "Makassarese", "Buginese", "Toraja", "Minahasan", 
  "Gorontalo", "Mongondow", "Sangir", "Talaud", "Bantik", "Ratahan", "Tondano", "Tombulu", "Tousem"
].sort()

// List of all countries
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", 
  "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", 
  "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", 
  "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", 
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", 
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti", 
  "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", 
  "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", 
  "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", 
  "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", 
  "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", 
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", 
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", 
  "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", 
  "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", 
  "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", 
  "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", 
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", 
  "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", 
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", 
  "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", 
  "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", 
  "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", 
  "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", 
  "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
].sort()

interface ProfileEditorProps {
  user: {
    id: string
    bio: string | null
    languages: string[]
    countriesVisited?: string[]
  }
}

export default function ProfileEditor({ user }: ProfileEditorProps) {
  const router = useRouter()
  const [isAddingLanguage, setIsAddingLanguage] = useState(false)
  const [isAddingCountry, setIsAddingCountry] = useState(false)
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bio, setBio] = useState(user.bio || "")
  const [originalBio, setOriginalBio] = useState(user.bio || "")
  const [newLanguage, setNewLanguage] = useState("")
  const [newCountry, setNewCountry] = useState("")
  const [filteredLanguages, setFilteredLanguages] = useState<string[]>([])
  const [filteredCountries, setFilteredCountries] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const bioHasChanged = bio !== originalBio

  const updateProfile = async (data: any) => {
    setLoading(true)
    setError("")
    
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update profile")
      }
      
      router.refresh()
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBio = async () => {
    const success = await updateProfile({ bio })
    if (success) {
      setOriginalBio(bio)
      setIsEditingBio(false)
    }
  }
  
  const handleCancelBio = () => {
    setBio(originalBio)
    setIsEditingBio(false)
    setError("")
  }

  const handleLanguageInputChange = (value: string) => {
    setNewLanguage(value)
    if (value.trim()) {
      const filtered = LANGUAGES.filter(lang => 
        lang.toLowerCase().includes(value.toLowerCase()) &&
        !user.languages.includes(lang)
      ).slice(0, 10) // Show max 10 suggestions
      setFilteredLanguages(filtered)
      setShowDropdown(true)
    } else {
      setFilteredLanguages([])
      setShowDropdown(false)
    }
  }

  const handleLanguageSelect = (language: string) => {
    setNewLanguage(language)
    setShowDropdown(false)
    setFilteredLanguages([])
  }

  const handleAddLanguage = async () => {
    if (!newLanguage.trim()) return
    
    // Check if the language is in our predefined list
    const selectedLanguage = LANGUAGES.find(lang => 
      lang.toLowerCase() === newLanguage.toLowerCase()
    )
    
    if (!selectedLanguage) {
      setError("Please select a language from the dropdown list")
      return
    }
    
    const updatedLanguages = [...user.languages, selectedLanguage]
    const success = await updateProfile({ languages: updatedLanguages })
    if (success) {
      setNewLanguage("")
      setIsAddingLanguage(false)
      setShowDropdown(false)
      setFilteredLanguages([])
    }
  }

  const handleCountryInputChange = (value: string) => {
    setNewCountry(value)
    if (value.trim()) {
      const countriesVisited = user.countriesVisited || []
      const filtered = COUNTRIES.filter(country => 
        country.toLowerCase().includes(value.toLowerCase()) &&
        !countriesVisited.includes(country)
      ).slice(0, 10) // Show max 10 suggestions
      setFilteredCountries(filtered)
      setShowCountryDropdown(true)
    } else {
      setFilteredCountries([])
      setShowCountryDropdown(false)
    }
  }

  const handleCountrySelect = (country: string) => {
    setNewCountry(country)
    setShowCountryDropdown(false)
    setFilteredCountries([])
  }

  const handleAddCountry = async () => {
    if (!newCountry.trim()) return
    
    // Check if the country is in our predefined list
    const selectedCountry = COUNTRIES.find(country => 
      country.toLowerCase() === newCountry.toLowerCase()
    )
    
    if (!selectedCountry) {
      setError("Please select a country from the dropdown list")
      return
    }
    
    const currentCountries = user.countriesVisited || []
    const updatedCountries = [...currentCountries, selectedCountry]
    const success = await updateProfile({ countriesVisited: updatedCountries })
    if (success) {
      setNewCountry("")
      setIsAddingCountry(false)
      setShowCountryDropdown(false)
      setFilteredCountries([])
    }
  }

  return (
    <>
      {/* About Section */}
      <div className="mb-6">
        <h2 className="text-lg mb-3">About</h2>
        {isEditingBio ? (
          <>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full border border-black rounded-lg p-4 mb-3 text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-black resize-none bg-tan placeholder-gray"
              placeholder="Tell other travelers about yourself!"
              maxLength={500}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveBio}
                disabled={loading}
                className="text-sm bg-tan text-black px-4 py-2 rounded-lg border border-black hover:bg-black hover:text-tan transition-colors disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleCancelBio}
                disabled={loading}
                className="text-sm bg-tan text-black px-4 py-2 rounded-lg border border-black hover:bg-black hover:text-tan transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            {bio ? (
              <p className="text-sm whitespace-pre-line mb-3">{bio}</p>
            ) : (
              <p className="text-sm text-gray mb-3">No bio yet.</p>
            )}
            <button
              onClick={() => setIsEditingBio(true)}
              className="text-sm bg-tan text-black px-4 py-2 rounded-lg border border-black hover:bg-black hover:text-tan transition-colors"
            >
              Edit
            </button>
          </>
        )}
      </div>

      {/* Languages Section */}
      <div className="mb-6">
        <h2 className="text-lg mb-2">Speaks</h2>
        <p className="text-sm text-gray italic mb-3">
          {user.languages.length > 0 
            ? user.languages.join(', ')
            : "No languages added yet"
          }
        </p>
        {isAddingLanguage ? (
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newLanguage}
                  onChange={(e) => handleLanguageInputChange(e.target.value)}
                  placeholder="Start typing a language..."
                  className="w-full px-3 py-2 border border-black rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black bg-tan placeholder-gray"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddLanguage()
                    }
                  }}
                  autoComplete="off"
                />
                {showDropdown && filteredLanguages.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-tan border border-black rounded-lg mt-1 max-h-40 overflow-y-auto z-10">
                    {filteredLanguages.map((language, index) => (
                      <button
                        key={index}
                        onClick={() => handleLanguageSelect(language)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-black hover:text-tan transition-colors border-b border-gray/20 last:border-b-0"
                      >
                        {language}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleAddLanguage}
                disabled={loading || !newLanguage.trim()}
                className="text-sm bg-tan text-black px-4 py-2 rounded-lg border border-black hover:bg-black hover:text-tan transition-colors disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add"}
              </button>
              <button
                onClick={() => {
                  setNewLanguage("")
                  setIsAddingLanguage(false)
                  setShowDropdown(false)
                  setFilteredLanguages([])
                  setError("")
                }}
                disabled={loading}
                className="text-sm bg-tan text-black px-4 py-2 rounded-lg border border-black hover:bg-black hover:text-tan transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingLanguage(true)}
            className="text-sm bg-tan text-black px-4 py-2 rounded-lg border border-black hover:bg-black hover:text-tan transition-colors"
          >
            Add language
          </button>
        )}
      </div>

      {/* Countries Visited Section */}
      <div className="mb-6">
        <h2 className="text-lg mb-2">Countries visited</h2>
        <p className="text-sm text-gray italic mb-3">
          {user.countriesVisited && user.countriesVisited.length > 0 
            ? user.countriesVisited.join(', ')
            : "No countries added yet"
          }
        </p>
        {isAddingCountry ? (
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newCountry}
                  onChange={(e) => handleCountryInputChange(e.target.value)}
                  placeholder="Start typing a country..."
                  className="w-full px-3 py-2 border border-black rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black bg-tan placeholder-gray"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCountry()
                    }
                  }}
                  autoComplete="off"
                />
                {showCountryDropdown && filteredCountries.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-tan border border-black rounded-lg mt-1 max-h-40 overflow-y-auto z-10">
                    {filteredCountries.map((country, index) => (
                      <button
                        key={index}
                        onClick={() => handleCountrySelect(country)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-black hover:text-tan transition-colors border-b border-gray/20 last:border-b-0"
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleAddCountry}
                disabled={loading || !newCountry.trim()}
                className="text-sm bg-tan text-black px-4 py-2 rounded-lg border border-black hover:bg-black hover:text-tan transition-colors disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add"}
              </button>
              <button
                onClick={() => {
                  setNewCountry("")
                  setIsAddingCountry(false)
                  setShowCountryDropdown(false)
                  setFilteredCountries([])
                  setError("")
                }}
                disabled={loading}
                className="text-sm bg-tan text-black px-4 py-2 rounded-lg border border-black hover:bg-black hover:text-tan transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCountry(true)}
            className="text-sm bg-tan text-black px-4 py-2 rounded-lg border border-black hover:bg-black hover:text-tan transition-colors"
          >
            Add country
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-tan border border-red-600 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}
    </>
  )
}