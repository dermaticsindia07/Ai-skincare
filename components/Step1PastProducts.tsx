import React, { useState } from 'react';
import { PastProduct } from '../types';
import Button from './common/Button';
import { COMMON_PRODUCTS, COMMON_DURATIONS } from '../constants';
import { X, Plus, ImageIcon, CameraIcon, UploadCloud, TrashIcon } from './Icons';
import CameraCapture from './CameraCapture';
import Select from './common/Select';

interface Step1Props {
  onNext: () => void;
  pastProducts: PastProduct[];
  setPastProducts: React.Dispatch<React.SetStateAction<PastProduct[]>>;
}

const Step1PastProducts: React.FC<Step1Props> = ({ onNext, pastProducts, setPastProducts }) => {
  const [selectedCommonProduct, setSelectedCommonProduct] = useState('');
  const [customProductName, setCustomProductName] = useState('');
  const [isUsing, setIsUsing] = useState(true);
  const [duration, setDuration] = useState('');
  const [cameraForProduct, setCameraForProduct] = useState<string | null>(null);
  const [newProductImage, setNewProductImage] = useState<string | undefined>();
  const [isCameraForNewProductOpen, setIsCameraForNewProductOpen] = useState(false);

  const productNameToAdd = 
    selectedCommonProduct === 'other' 
    ? customProductName.trim() 
    : (selectedCommonProduct && selectedCommonProduct !== 'none' ? selectedCommonProduct : '');

  const handleCommonProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCommonProduct(value);
    if (value !== 'other') {
      setCustomProductName(''); 
    }
  };

  const handleAddProduct = () => {
    if (!productNameToAdd || !duration.trim()) return;

    const productToAdd: PastProduct = {
      id: new Date().toISOString() + productNameToAdd,
      name: productNameToAdd,
      isUsing,
      duration,
      image: newProductImage,
    };

    setPastProducts(prev => [productToAdd, ...prev]);
    
    // Reset form
    setSelectedCommonProduct('');
    setCustomProductName('');
    setIsUsing(true);
    setDuration('');
    setCameraForProduct(null);
    setNewProductImage(undefined);
  };
  
  const handleRemoveProduct = (id: string) => {
    setPastProducts(pastProducts.filter(p => p.id !== id));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, productId: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPastProducts(prev => prev.map(p => p.id === productId ? { ...p, image: reader.result as string } : p));
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handlePhotoCapture = (imageDataUrl: string) => {
    if (cameraForProduct) {
      setPastProducts(prev => prev.map(p => p.id === cameraForProduct ? { ...p, image: imageDataUrl } : p));
    }
    setCameraForProduct(null);
  };

  const handleNewProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

    const handleNewProductPhotoCapture = (imageDataUrl: string) => {
        setNewProductImage(imageDataUrl);
        setIsCameraForNewProductOpen(false);
    };


  const handleRemoveImage = (productId: string) => {
      setPastProducts(prev => prev.map(p => p.id === productId ? { ...p, image: undefined } : p));
  }

  return (
    <div className="animate-fade-in-up h-full flex flex-col w-full pb-4">
        <div className="flex-grow overflow-y-auto pr-2 -mr-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-brand-text-main mb-2">
              <span className="text-brand-primary">Step 1:</span> Past Product Usage
          </h2>
          <p className="text-sm sm:text-base text-brand-text-muted mb-4">Tell us about products you've used. This helps us avoid recommending things that didn't work for you.</p>

          <div className="mb-4 flex flex-col gap-4">
            <div>
              <Select
                id="common-product-select"
                label="Common Products (Select one or 'Other')"
                value={selectedCommonProduct}
                onChange={handleCommonProductSelect}
              >
                <option value="" disabled>-- Select a product --</option>
                {COMMON_PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                <option value="other">Other (Please specify)</option>
                <option value="none">None of these</option>
              </Select>
            </div>

            {selectedCommonProduct === 'other' && (
              <div className="animate-fade-in-up">
                  <input
                      type="text"
                      id="customProductName"
                      value={customProductName}
                      onChange={(e) => setCustomProductName(e.target.value)}
                      className="block w-full bg-white text-brand-text-main placeholder-slate-400 border border-slate-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-brand-primary-light focus:border-brand-primary-light transition-all text-base shadow-sm"
                      placeholder="Enter product name..."
                      autoFocus
                  />
              </div>
            )}
            
            {productNameToAdd && (
              <div className="space-y-4 animate-fade-in-up">
                <h3 className="text-base font-semibold text-brand-text-main">Set Details for "{productNameToAdd}"</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-brand-text-main mb-1.5">Are you currently using it?</label>
                      <div className="relative w-full h-11 bg-slate-200 rounded-lg p-1 flex items-center border border-slate-300">
                        <div className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white rounded-md shadow-sm transition-transform duration-300 ease-in-out ${isUsing ? 'translate-x-0' : 'translate-x-full'}`}></div>
                        <button type="button" onClick={() => setIsUsing(true)} className={`flex-1 text-center font-semibold z-10 transition-colors text-sm ${isUsing ? 'text-brand-primary' : 'text-slate-600'}`}>Yes</button>
                        <button type="button" onClick={() => setIsUsing(false)} className={`flex-1 text-center font-semibold z-10 transition-colors text-sm ${!isUsing ? 'text-brand-primary' : 'text-slate-600'}`}>No</button>
                      </div>
                    </div>
                    <Select
                      id="duration"
                      label="How long have you used it?"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      required
                    >
                      <option value="" disabled>Select duration</option>
                      {COMMON_DURATIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </Select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-brand-text-main mb-1.5">Add a Photo (Optional)</label>
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 flex-shrink-0 relative group">
                            {newProductImage ? (
                                <>
                                    <img src={newProductImage} alt="New product preview" className="w-full h-full rounded-lg object-contain" />
                                    <button onClick={() => setNewProductImage(undefined)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600" aria-label="Remove image">
                                        <X className="w-3 h-3" />
                                    </button>
                                </>
                            ) : (
                                <ImageIcon className="w-8 h-8 text-slate-400" />
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="new-product-image-upload" className="cursor-pointer">
                                <Button as="div" variant="secondary" size="sm" className="w-full gap-2 !justify-start !px-3">
                                    <UploadCloud className="w-4 h-4" /> Upload File
                                </Button>
                                <input id="new-product-image-upload" type="file" className="sr-only" accept="image/*" onChange={handleNewProductImageUpload} />
                            </label>
                            <Button onClick={() => setIsCameraForNewProductOpen(true)} variant="secondary" size="sm" className="w-full gap-2 !justify-start !px-3">
                                <CameraIcon className="w-4 h-4" /> Use Camera
                            </Button>
                        </div>
                    </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
                <Button onClick={handleAddProduct} className="gap-1.5" size="sm" disabled={!productNameToAdd || !duration.trim()}>
                    <Plus className="w-4 h-4" /> 
                    Add Product
                </Button>
            </div>
          </div>
          
          {pastProducts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-brand-text-main mb-4">Your Products:</h3>
              <ul className="space-y-3">
                {pastProducts.map(p => (
                  <li key={p.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-soft animate-fade-in-up">
                      <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 flex-shrink-0 relative group">
                        {p.image ? (
                          <>
                            <img src={p.image} alt={p.name} className="w-full h-full rounded-lg object-contain" />
                            <button onClick={() => handleRemoveImage(p.id)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600" aria-label="Remove image">
                                <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                           <div className="flex flex-col items-center gap-1">
                                <ImageIcon className="w-6 h-6 text-slate-400" />
                                <span className="text-xs text-slate-500">No Image</span>
                           </div>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm sm:text-base text-brand-text-main truncate">{p.name}</p>
                          <p className={`text-xs sm:text-sm font-medium ${p.isUsing ? 'text-green-600' : 'text-slate-500'}`}>{p.isUsing ? 'Currently using' : 'Used in past'} for {p.duration}</p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
                         <label htmlFor={`image-upload-${p.id}`} className="cursor-pointer" title="Upload Image">
                            <Button as="div" variant="secondary" size="sm" className="!p-2.5 !rounded-lg">
                              <UploadCloud className="w-5 h-5" />
                            </Button>
                            <input id={`image-upload-${p.id}`} type="file" className="sr-only" accept="image/*" onChange={(e) => handleImageUpload(e, p.id)} />
                          </label>
                          <Button onClick={() => setCameraForProduct(p.id)} variant="secondary" size="sm" className="!p-2.5 !rounded-lg" title="Take Photo">
                            <CameraIcon className="w-5 h-5" />
                          </Button>
                         <Button
                              onClick={() => handleRemoveProduct(p.id)}
                              variant="secondary"
                              size="sm"
                              className="!p-2.5 !rounded-lg !border-slate-300 !text-red-600 hover:!bg-red-50 hover:!border-red-400"
                              title="Remove Product"
                          >
                              <TrashIcon className="w-5 h-5" />
                          </Button>
                      </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex justify-between pt-2 border-t border-slate-200">
          <Button onClick={onNext} variant="secondary" size="sm">
            Skip
          </Button>
          <Button onClick={onNext} variant="primary" size="sm">
            Next: Analyze My Skin
          </Button>
        </div>
        
        {isCameraForNewProductOpen && (
            <CameraCapture
                onCapture={handleNewProductPhotoCapture}
                onClose={() => setIsCameraForNewProductOpen(false)}
            />
        )}
        {cameraForProduct && (
          <CameraCapture
              onCapture={handlePhotoCapture}
              onClose={() => setCameraForProduct(null)}
          />
        )}
    </div>
  );
};

export default Step1PastProducts;