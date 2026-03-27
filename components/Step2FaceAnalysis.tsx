import React, { useCallback, useState, useEffect } from 'react';
import { SkinConditionCategory, FaceImage } from '../types';
import Button from './common/Button';
import { analyzeImage } from '../services/geminiService';
import { uploadImages } from '../services/imagesService';
import { UploadCloud, CheckCircle, X, CameraIcon, TriangleAlertIcon } from './Icons';
import CameraCapture from './CameraCapture';
import { getCategoryStyle } from '../constants';
import Card from './common/Card';

interface Step2Props {
  onNext: () => void;
  onBack: () => void;
  faceImages: FaceImage[];
  setFaceImages: (files: FaceImage[] | ((prevFiles: FaceImage[]) => FaceImage[])) => void;
  analysisResult: SkinConditionCategory[] | null;
  setAnalysisResult: (result: SkinConditionCategory[] | null) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
}

const Step2FaceAnalysis: React.FC<Step2Props> = ({
  onNext, onBack, faceImages, setFaceImages, analysisResult, setAnalysisResult, setIsLoading, isLoading,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [hoveredCondition, setHoveredCondition] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  
  const activeImage = faceImages[activeImageIndex];
  // Default user ID for image ownership on the server
  const userId = 'user123';

  const labelVisible = (isHovered: boolean) => showLabels || isHovered;

  useEffect(() => {
    // When the active image changes, reset its natural size so the onLoad handler can set the new correct aspect ratio.
    setImageNaturalSize(null);
  }, [activeImage]);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    setCountdown(60); // Reset on start

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev > 0) {
          return prev - 1;
        }
        clearInterval(timer);
        return 0;
      });
    }, 1000);

    // Cleanup function
    return () => clearInterval(timer);
  }, [isLoading]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages = files.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));
      // Update local previews
      setTimeout(() => {
        setFaceImages(prevImages => [...prevImages, ...newImages]);
        setAnalysisResult(null);
        setHoveredCondition(null);
      }, 0);
      // Kick off upload to server (S3) so they appear in bucket
      try {
        await uploadImages(files, userId);
      } catch (err) {
        console.error('Upload to server failed:', err);
        // Non-blocking for UI; analysis can still proceed with local images
      }
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFaceImages(prevImages => {
      const imageToRemove = prevImages[indexToRemove];
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      const updatedImages = prevImages.filter((_, index) => index !== indexToRemove);
      if (activeImageIndex >= updatedImages.length && updatedImages.length > 0) {
        setActiveImageIndex(updatedImages.length - 1);
      } else if (updatedImages.length === 0) {
        setActiveImageIndex(0);
      }
      return updatedImages;
    });
  };

  const handlePhotoCapture = useCallback(async (dataUrl: string) => {
    setIsCameraOpen(false);
    
    const dataURLtoFile = async (dataUrl: string, filename: string): Promise<File> => {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return new File([blob], filename, { type: 'image/jpeg' });
    };

    try {
        const file = await dataURLtoFile(dataUrl, `capture-${Date.now()}.jpg`);
        const newImage: FaceImage = {
            file,
            previewUrl: URL.createObjectURL(file)
        };
        setTimeout(() => {
            setFaceImages(prevImages => [...prevImages, newImage]);
            setAnalysisResult(null);
            setHoveredCondition(null);
        }, 0);
        // Upload captured photo so it appears in S3
        try {
          await uploadImages([file], userId);
        } catch (err) {
          console.error('Upload captured image failed:', err);
        }
    } catch (error) {
        console.error("Error converting data URL to file:", error);
        alert("Could not process the captured image.");
    }
  }, [setFaceImages, setAnalysisResult]);


  const handleAnalyze = useCallback(async () => {
    if (faceImages.length === 0) return;
    setIsLoading(true);
    setAnalysisResult(null);
    setHoveredCondition(null);
    try {
      const filesToAnalyze = faceImages.map(img => img.file);
      const result = await analyzeImage(filesToAnalyze);
      setAnalysisResult(result);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [faceImages, setAnalysisResult, setIsLoading]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && !imageNaturalSize) {
      setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    }
  };
  
  return (
    <div className="animate-fade-in-up h-full flex flex-col w-full">
        <div className="flex-grow overflow-y-auto pr-2 -mr-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
              <span className="text-brand-primary">Step 2:</span> AI Face Analysis
          </h2>
          {!analysisResult && (
            <div className="rounded-lg bg-red-50 p-4 text-[10px] sm:text-xs text-red-800 border border-red-200 mb-6 sm:mb-8 flex items-start gap-3" role="alert">
              <TriangleAlertIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                For best results, upload clear, well-lit photos of your face — including front, left, and right views. Adding multiple images will help ensure more accurate results.
              </p>
            </div>
          )}

          {analysisResult ? (
            // POST-ANALYSIS VIEW: Side-by-side
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              <div className="lg:col-span-1 flex flex-col gap-4">
                <div className="flex items-start gap-4">
                   <div className="relative flex-grow bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden min-h-[150px]">
                    {activeImage ? (
                        <div
                          className="relative w-[90%] max-h-[320px] mx-auto"
                          style={{
                            aspectRatio: imageNaturalSize
                              ? `${imageNaturalSize.width}/${imageNaturalSize.height}`
                              : '16/9',
                          }}
                        >
                            <img src={activeImage.previewUrl} alt={`Face preview ${activeImageIndex + 1}`} className="block w-full h-full object-contain" onLoad={handleImageLoad} />
                            <div className="absolute inset-0">
                                {analysisResult.flatMap(cat =>
                                    cat.conditions.flatMap(cond =>
                                        cond.boundingBoxes
                                            .filter(bbox => bbox.imageId === activeImageIndex)
                                            .map((bbox, i) => {
                                                const style = getCategoryStyle(cat.category);
                                                const isHovered = hoveredCondition === cond.name;
                                                const opacity = hoveredCondition === null ? 0.7 : (isHovered ? 1 : 0.2);
                                                const zIndex = isHovered ? 20 : 10;
                                                const transform = isHovered ? 'scale(1.03)' : 'scale(1)';

                                                return (
                                                    <div
                                                        key={`${cond.name}-${i}`}
                                                        className="absolute transition-all duration-200 ease-in-out rounded-sm"
                                                        style={{
                                                            border: `3px solid ${style.hex}`,
                                                            top: `${bbox.box.y1 * 100}%`,
                                                            left: `${bbox.box.x1 * 100}%`,
                                                            width: `${(bbox.box.x2 - bbox.box.x1) * 100}%`,
                                                            height: `${(bbox.box.y2 - bbox.box.y1) * 100}%`,
                                                            opacity: opacity,
                                                            transform: transform,
                                                            zIndex: zIndex,
                                                            boxShadow: `0 0 15px ${style.hex}${isHovered ? '80' : '00'}`
                                                        }}
                                                    >
                                                        {(labelVisible(isHovered)) && (
                                                            <span
                                                                className={`absolute -top-6 left-0 text-[10px] sm:text-xs font-semibold px-1 py-0.5 rounded whitespace-nowrap ${style.tailwind.legendBg}`}
                                                                style={{
                                                                    color: style.hex,
                                                                    borderColor: style.hex,
                                                                    borderWidth: '1px',
                                                                }}
                                                            >
                                                                {cond.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })
                                    )
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-500">No image available</p>
                    )}
                   </div>
                   <div className="flex flex-col gap-2">
                      <label htmlFor="face-image-upload-2" className="flex flex-col items-center justify-center w-12 h-12 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:bg-slate-200 hover:border-blue-400 transition-colors cursor-pointer p-0.5 text-center">
                          <UploadCloud className="w-5 h-5"/>
                          <span className="text-[9px] font-semibold mt-0.5">Upload</span>
                          <input id="face-image-upload-2" type="file" accept="image/*" multiple onChange={handleFileChange} className="sr-only" />
                      </label>
                      <button type="button" onClick={() => setIsCameraOpen(true)} className="flex flex-col items-center justify-center w-12 h-12 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:bg-slate-200 hover:border-blue-400 transition-colors cursor-pointer p-0.5 text-center">
                          <CameraIcon className="w-5 h-5"/>
                          <span className="text-[9px] font-semibold mt-0.5">Camera</span>
                      </button>
                      {faceImages.length > 0 && (
                        <div className="mt-2 grid grid-cols-1 gap-2 w-12">
                          {faceImages.map((image, index) => (
                            <div key={image.previewUrl} className="relative aspect-square">
                              <img
                                src={image.previewUrl}
                                alt={`Thumbnail ${index + 1}`}
                                onClick={() => setActiveImageIndex(index)}
                                className={`w-full h-full object-cover rounded-md shadow-sm cursor-pointer transition-all ${activeImageIndex === index ? 'ring-2 ring-blue-500 scale-105' : 'opacity-70 hover:opacity-100'}`}
                              />
                              <button
                                onClick={() => handleRemoveImage(index)}
                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 transition-transform hover:scale-110"
                                aria-label="Remove image"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                 </div>

                {/* Horizontal thumbnails grid removed; thumbnails are now shown vertically next to controls */}
              </div>
              <div className="lg:col-span-3 flex flex-col justify-center min-h-[300px]">
                <div className="animate-fade-in-up">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-green-600">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <h3>Analysis Complete!</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 text-xs text-slate-600 select-none">
                            <input type="checkbox" className="h-4 w-4" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
                            Show labels
                          </label>
                          <Button onClick={handleAnalyze} disabled={faceImages.length === 0} isLoading={isLoading} size="sm" variant="secondary" className="px-2.5 py-1 text-[10px] sm:px-3 sm:py-1.5 sm:text-[11px]">
                            Re-analyze
                          </Button>
                        </div>
                    </div>
                    <div className="max-h-[19rem] overflow-y-auto pr-2 -mr-2">
                      <p className="text-[11px] text-sky-500 mb-2">To see highlights on the image, click the problems listed below.</p>
                      {analysisResult.map((category) => {
                          const style = getCategoryStyle(category.category);
                          const Icon = style.icon;
                          return (
                              <div key={category.category} className="py-4 border-b border-slate-200 last:border-b-0">
                                  <h4 className={`font-bold text-sm sm:text-base mb-3 flex items-center gap-2 ${style.tailwind.text}`}>
                                      <Icon className={`w-5 h-5 ${style.tailwind.icon}`} />
                                      {category.category}
                                  </h4>
                                  <ul className="space-y-1.5">
                                  {category.conditions.map((condition) => (
                                      <li key={condition.name} 
                                          className={`flex justify-between items-center text-sm transition-all rounded-md p-2 -mx-2 cursor-pointer ${hoveredCondition === condition.name ? `bg-blue-50` : 'hover:bg-slate-50'}`}
                                          onMouseEnter={() => setHoveredCondition(condition.name)}
                                          onMouseLeave={() => setHoveredCondition(null)}>
                                          <div className="flex-grow pr-2">
                                              <span className="text-slate-700 font-semibold block">{condition.name}</span>
                                              <span className="text-slate-500 text-xs">{condition.location}</span>
                                          </div>
                                          <span className={`font-semibold text-right text-sm flex-shrink-0 ${style.tailwind.text}`}>{condition.confidence}%</span>
                                      </li>
                                  ))}
                                  </ul>
                              </div>
                          )
                      })}
                    </div>
                </div>
              </div>
            </div>
          ) : (
            // PRE-ANALYSIS VIEW: Stacked
            <div className="flex flex-col items-center gap-6">
              <div className="w-full max-w-lg flex flex-col gap-4">
                 <div className="flex items-start gap-4">
                   <div className="relative flex-grow bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden min-h-[320px]">
                    {activeImage ? (
                        <div
                          className="relative w-[100%] max-h-[320px] mx-auto"
                          style={{
                            aspectRatio: imageNaturalSize
                              ? `${imageNaturalSize.width}/${imageNaturalSize.height}`
                              : '16/9',
                          }}
                        >
                            <img src={activeImage.previewUrl} alt={`Face preview ${activeImageIndex + 1}`} className="block w-full h-full object-contain" onLoad={handleImageLoad} />
                            {isLoading && (
                                <div className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 rounded-lg z-10 animate-fade-in-up overflow-hidden">
                                    <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
                                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                                        <div className="absolute left-0 w-full h-1 bg-brand-primary-light/80 shadow-[0_0_20px_theme(colors.brand.primary.light)] animate-scan-line"></div>
                                    </div>
                                    <div className="relative animate-pulse-soft-blue w-16 h-16 border-2 border-brand-primary-light/50 rounded-full flex items-center justify-center">
                                        <span className="text-xl font-bold text-brand-primary-light font-mono tabular-nums">{countdown}s</span>
                                    </div>
                                    <p className="text-xs font-semibold text-white mt-3 z-10 tracking-widest">ANALYSING</p>
                                    <p className="text-[10px] text-slate-300 z-10">Please wait while our AI scans your image...</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-slate-500">Upload an image to begin</p>
                    )}
                   </div>
                   <div className="flex flex-col gap-2">
                      <label htmlFor="face-image-upload" className="flex flex-col items-center justify-center w-12 h-.tsx' h-12 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:bg-slate-200 hover:border-blue-400 transition-colors cursor-pointer p-0.5 text-center">
                          <UploadCloud className="w-5 h-5"/>
                          <span className="text-[9px] font-semibold mt-0.5">Upload</span>
                          <input id="face-image-upload" type="file" accept="image/*" multiple onChange={handleFileChange} className="sr-only" />
                      </label>
                      <button type="button" onClick={() => setIsCameraOpen(true)} className="flex flex-col items-center justify-center w-12 h-12 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:bg-slate-200 hover:border-blue-400 transition-colors cursor-pointer p-0.5 text-center">
                          <CameraIcon className="w-5 h-5"/>
                          <span className="text-[9px] font-semibold mt-0.5">Camera</span>
                      </button>
                      {faceImages.length > 0 && (
                        <div className="mt-2 grid grid-cols-1 gap-2 w-12">
                          {faceImages.map((image, index) => (
                            <div key={image.previewUrl} className="relative aspect-square">
                              <img
                                src={image.previewUrl}
                                alt={`Thumbnail ${index + 1}`}
                                onClick={() => setActiveImageIndex(index)}
                                className={`w-full h-full object-cover rounded-md shadow-sm cursor-pointer transition-all ${activeImageIndex === index ? 'ring-2 ring-blue-500 scale-105' : 'opacity-70 hover:opacity-100'}`}
                              />
                              <button
                                onClick={() => handleRemoveImage(index)}
                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 transition-transform hover:scale-110"
                                aria-label="Remove image"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                 </div>
              </div>
              <div className="w-full max-w-lg">
                <Card className="text-center md:text-left">
                    <p className="text-[13px] leading-tight text-slate-600 mb-2">Once you've uploaded your photos, we'll analyze them and highlight any areas of concern right on your images.</p>
                    <Button onClick={handleAnalyze} disabled={faceImages.length === 0 || isLoading} isLoading={isLoading} size="sm" className="w-full">
                        {isLoading ? 'Analyzing...' : 'Analyze My Skin'}
                    </Button>
                </Card>
              </div>
            </div>
          )}
        </div>
        <div className="flex-shrink-0 flex justify-between mt-8 pt-6 border-t border-slate-200">
          <Button onClick={onBack} variant="secondary" size="sm">Back</Button>
          <Button onClick={onNext} disabled={!analysisResult} size="sm">Next: Set My Goals</Button>
        </div>
        {isCameraOpen && <CameraCapture onCapture={handlePhotoCapture} onClose={() => setIsCameraOpen(false)} />}
    </div>
  );
};

export default Step2FaceAnalysis;