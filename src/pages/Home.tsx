import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, TreePine, Loader2 } from 'lucide-react';
import { analyzeImage } from '../lib/gemini';
import SupportBlock from '../components/SupportBlock';

// Default tree image path
const DEFAULT_IMAGE = "/default-tree.jfif";

// Default analysis for the tree
const DEFAULT_ANALYSIS = `1. Species Identification:
- Scientific name: Quercus rubra
- Common name: Northern Red Oak
- Family: Fagaceae
- Classification: Deciduous hardwood

2. Physical Characteristics:
- Size: Large (60-75 feet tall, 45-foot spread)
- Leaf Type: Alternate, simple, 7-9 lobed with bristle tips
- Bark: Dark gray-brown, developing distinctive ridges and furrows
- Distinctive Features: Acorns with shallow caps, red-brown fall foliage
- Growth Pattern: Pyramidal when young, rounded crown at maturity

3. Growth Requirements:
- Light Needs: Full sun to partial shade
- Soil Preference: Adaptable, prefers well-drained, slightly acidic soil
- Moisture: Moderate, drought-tolerant once established
- Temperature Hardiness: USDA zones 4-8
- Growth Rate: Moderate to fast (1-2 feet per year)

4. Ecological Information:
- Lifespan: 200-400 years
- Wildlife Value: Acorns provide food for wildlife, nesting habitat for birds
- Native Range: Eastern and Central North America
- Ecosystem Benefits: Carbon sequestration, erosion control, shade
- Seasonal Changes: Brilliant red fall color, winter dormancy

5. Additional Information:
- Uses: Shade tree, timber, wildlife habitat
- Disease Resistance: Moderate, susceptible to oak wilt
- Cultural Significance: Symbol of strength and endurance
- Interesting Facts: Can produce up to 1,000 acorns in a good year
- Conservation Status: Least concern, widespread`;

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load default image and analysis without API call
    const loadDefaultContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(DEFAULT_IMAGE);
        if (!response.ok) {
          throw new Error('Failed to load default image');
        }
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setImage(base64data);
          setAnalysis(DEFAULT_ANALYSIS);
          setLoading(false);
        };
        reader.onerror = () => {
          setError('Failed to load default image');
          setLoading(false);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error('Error loading default image:', err);
        setError('Failed to load default image');
        setLoading(false);
      }
    };

    loadDefaultContent();
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('Image size should be less than 20MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImage(base64String);
      setError(null);
      handleAnalyze(base64String);
    };
    reader.onerror = () => {
      setError('Failed to read the image file. Please try again.');
    };
    reader.readAsDataURL(file);

    // Reset the file input so the same file can be selected again
    e.target.value = '';
  }, []);

  const handleAnalyze = async (imageData: string) => {
    setLoading(true);
    setError(null);
    const treePrompt = "Analyze this tree image for educational purposes and provide the following information:\n1. Species identification (scientific name, common name, family, classification)\n2. Physical characteristics (size, leaf type, bark, distinctive features)\n3. Growth requirements (light, soil, moisture, temperature, growth rate)\n4. Ecological information (lifespan, wildlife value, native range, ecosystem benefits)\n5. Additional information (uses, disease resistance, cultural significance, interesting facts)\n\nIMPORTANT: This is for educational purposes only.";
    try {
      const result = await analyzeImage(imageData, treePrompt);
      setAnalysis(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatAnalysis = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Remove any markdown-style formatting
      const cleanLine = line.replace(/[*_#`]/g, '').trim();
      if (!cleanLine) return null;

      // Format section headers (lines starting with numbers)
      if (/^\d+\./.test(cleanLine)) {
        return (
          <div key={index} className="mt-8 first:mt-0">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {cleanLine.replace(/^\d+\.\s*/, '')}
            </h3>
          </div>
        );
      }
      
      // Format list items with specific properties
      if (cleanLine.startsWith('-') && cleanLine.includes(':')) {
        const [label, ...valueParts] = cleanLine.substring(1).split(':');
        const value = valueParts.join(':').trim();
        return (
          <div key={index} className="flex gap-2 mb-3 ml-4">
            <span className="font-semibold text-gray-800 min-w-[120px]">{label.trim()}:</span>
            <span className="text-gray-700">{value}</span>
          </div>
        );
      }
      
      // Format regular list items
      if (cleanLine.startsWith('-')) {
        return (
          <div key={index} className="flex gap-2 mb-3 ml-4">
            <span className="text-gray-400">•</span>
            <span className="text-gray-700">{cleanLine.substring(1).trim()}</span>
          </div>
        );
      }

      // Regular text
      return (
        <p key={index} className="mb-3 text-gray-700">
          {cleanLine}
        </p>
      );
    }).filter(Boolean);
  };

  return (
    <div className="bg-gray-50 py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Free Tree Identifier</h1>
          <p className="text-base sm:text-lg text-gray-600">Upload a tree photo for educational identification and information</p>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-12">
          <div className="flex flex-col items-center justify-center mb-6">
            <label 
              htmlFor="image-upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer w-full sm:w-auto"
            >
              <Upload className="h-5 w-5" />
              Upload Tree Photo
              <input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleImageUpload}
              />
            </label>
            <p className="mt-2 text-sm text-gray-500">PNG, JPG or JPEG (MAX. 20MB)</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading && !image && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          )}

          {image && (
            <div className="mb-6">
              <div className="relative rounded-lg mb-4 overflow-hidden bg-gray-100">
                <img
                  src={image}
                  alt="Tree preview"
                  className="w-full h-auto max-h-[500px] object-contain mx-auto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAnalyze(image)}
                  disabled={loading}
                  className="flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TreePine className="-ml-1 mr-2 h-5 w-5" />
                      Identify Tree
                    </>
                  )}
                </button>
                <button
                  onClick={triggerFileInput}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Another Photo
                </button>
              </div>
            </div>
          )}

          {analysis && (
            <div className="bg-gray-50 rounded-lg p-6 sm:p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Tree Analysis Results</h2>
              <div className="text-gray-700">
                {formatAnalysis(analysis)}
              </div>
            </div>
          )}
        </div>

        <SupportBlock />

        <div className="prose max-w-none my-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Free Tree Identifier: Your Educational Guide to Trees</h2>
          
          <p>Welcome to our free tree identifier tool, powered by advanced artificial intelligence technology.
             This educational tool helps you learn about different tree species, their characteristics, and
             essential information about their growth patterns and ecological importance.</p>

          <h3>How Our Educational Tree Identifier Works</h3>
          <p>Our tool uses AI to analyze tree photos and provide educational information about species
             identification, growth requirements, and ecological significance. Simply upload a clear photo of a tree,
             and our AI will help you learn about its species and its role in the ecosystem.</p>

          <h3>Key Features of Our Tree Identifier</h3>
          <ul>
            <li>Educational species information</li>
            <li>Detailed physical characteristics</li>
            <li>Growth requirements and patterns</li>
            <li>Ecological importance and benefits</li>
            <li>Cultural and historical significance</li>
            <li>100% free to use</li>
          </ul>

          <h3>Perfect For Learning About:</h3>
          <ul>
            <li>Tree species identification</li>
            <li>Native and non-native tree varieties</li>
            <li>Ecological roles of different trees</li>
            <li>Seasonal changes and growth patterns</li>
            <li>Conservation and environmental importance</li>
          </ul>

          <p>Try our free tree identifier today and deepen your knowledge of the natural world!
             No registration required - just upload a photo and start learning about trees in your environment.</p>
        </div>

        <SupportBlock />
      </div>
    </div>
  );
}
