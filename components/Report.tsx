import React, { useState, useMemo } from 'react';
import { SkincareRoutine, RoutineStep, AlternativeProduct, FaceImage, SkinConditionCategory } from '../types';
import Button from './common/Button';
import { 
    RefreshCw, SunIcon, MoonIcon, 
    ArrowLeftIcon, CheckIcon,
    ArrowRightIcon, ShoppingCartIcon
} from './Icons';

interface ReportProps {
  recommendation: SkincareRoutine | null;
  routineTitle: string;
  onReset: () => void;
  onBack: () => void;
  onNext: () => void;
  onAddToCart: (product: RoutineStep | AlternativeProduct) => void;
  onBulkAddToCart: (products: (RoutineStep | AlternativeProduct)[]) => void;
  faceImages: FaceImage[];
  analysisResult: SkinConditionCategory[] | null;
  skincareGoals: string[];
}

type UnifiedRoutineStep = RoutineStep & { usage: 'AM' | 'PM' | 'AM & PM' };

const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

const StarIcon = ({ className, isHalf = false }: { className: string, isHalf?: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <defs>
            <linearGradient id="half-star">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#d1d5db" stopOpacity="1" />
            </linearGradient>
        </defs>
        <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.116 3.986 1.24 5.853c.275 1.282-1.056 2.274-2.186 1.653l-4.945-2.737-4.944 2.737c-1.13.621-2.461-.371-2.186-1.653l1.24-5.853-4.116-3.986c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" fill={isHalf ? "url(#half-star)" : "currentColor"} />
    </svg>
);

const StarRating = ({ rating, reviews }: { rating: number, reviews: number }) => (
    <div className="flex items-center mb-1">
        {[...Array(5)].map((_, i) => (
            <StarIcon key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-amber-400' : 'text-slate-300'}`} />
        ))}
        <span className="text-xs text-slate-500 ml-2">{reviews} reviews</span>
    </div>
);

const groupProductsByIngredients = (products: (RoutineStep | AlternativeProduct)[]) => {
  const productsWithIngredients = products.filter(p => p.keyIngredients && p.keyIngredients.length > 0);
  const productsWithoutIngredients = products.filter(p => !p.keyIngredients || p.keyIngredients.length === 0);

  const adj: Record<string, string[]> = {};
  const productMap = new Map<string, RoutineStep | AlternativeProduct>();

  productsWithIngredients.forEach(p => {
    productMap.set(p.productId, p);
    adj[p.productId] = [];
  });

  for (let i = 0; i < productsWithIngredients.length; i++) {
    for (let j = i + 1; j < productsWithIngredients.length; j++) {
      const p1 = productsWithIngredients[i];
      const p2 = productsWithIngredients[j];
      
      const ingredients1 = new Set(p1.keyIngredients);
      const hasShared = p2.keyIngredients.some(ing => ingredients1.has(ing));

      if (hasShared) {
        adj[p1.productId].push(p2.productId);
        adj[p2.productId].push(p1.productId);
      }
    }
  }

  const visited = new Set<string>();
  const components: (RoutineStep | AlternativeProduct)[][] = [];

  const dfs = (productId: string, component: (RoutineStep | AlternativeProduct)[]) => {
    visited.add(productId);
    component.push(productMap.get(productId)!);

    (adj[productId] || []).forEach(neighborId => {
      if (!visited.has(neighborId)) {
        dfs(neighborId, component);
      }
    });
  };
  
  productsWithIngredients.forEach(p => {
    if (!visited.has(p.productId)) {
      const component: (RoutineStep | AlternativeProduct)[] = [];
      dfs(p.productId, component);
      components.push(component);
    }
  });

  const finalGroups = new Map<string, (RoutineStep | AlternativeProduct)[]>();

  components.forEach(component => {
    const allComponentIngredients = [...new Set(component.flatMap(p => p.keyIngredients || []))].sort();
    const groupName = allComponentIngredients.join(', ');
    finalGroups.set(groupName, component);
  });

  if (productsWithoutIngredients.length > 0) {
    finalGroups.set('General Skincare', productsWithoutIngredients);
  }
    
  return finalGroups;
};

const Report: React.FC<ReportProps> = ({ 
    recommendation, 
    routineTitle, 
    onReset, 
    onBack, 
    onNext,
    onAddToCart,
    onBulkAddToCart,
}) => {
  const [addedProducts, setAddedProducts] = useState<string[]>([]);
  const [allAdded, setAllAdded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const { unifiedRoutineSteps, uniqueStepTypes } = useMemo(() => {
    if (!recommendation) return { unifiedRoutineSteps: [], uniqueStepTypes: [] };
    
    const productMap = new Map<string, UnifiedRoutineStep>();

    recommendation.am.forEach(step => {
        productMap.set(step.productId, { ...step, usage: 'AM' });
    });

    recommendation.pm.forEach(step => {
        const existingStep = productMap.get(step.productId);
        if (existingStep) {
            existingStep.usage = 'AM & PM';
        } else {
            productMap.set(step.productId, { ...step, usage: 'PM' });
        }
    });

    const allSteps = Array.from(productMap.values());
    
    const stepOrder = ['Cleanser', 'Toner', 'Treatment', 'Serum', 'Moisturizer', 'Sunscreen'];
    const uniqueTypes = [...new Set(allSteps.map(s => s.stepType))];

    uniqueTypes.sort((a, b) => {
        const indexA = stepOrder.indexOf(a);
        const indexB = stepOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    return { unifiedRoutineSteps: allSteps, uniqueStepTypes: uniqueTypes };
  }, [recommendation]);

  const handleToggleExpand = (key: string) => {
    setExpandedGroups(prev => ({...prev, [key]: !prev[key]}));
  };

  const handleAddToCartClick = (product: RoutineStep | AlternativeProduct) => {
    onAddToCart(product);
    setAddedProducts(prev => [...prev, product.productId]);
    setTimeout(() => {
        setAddedProducts(prev => prev.filter(id => id !== product.productId));
    }, 2000);
  };
  
  const handleAddAllToCart = () => {
    if (!recommendation) return;

    const allRecommendedProducts = new Map<string, RoutineStep>();

    recommendation.am.forEach(step => {
        if (!allRecommendedProducts.has(step.productId)) {
            allRecommendedProducts.set(step.productId, step);
        }
    });

    recommendation.pm.forEach(step => {
        if (!allRecommendedProducts.has(step.productId)) {
            allRecommendedProducts.set(step.productId, step);
        }
    });

    const productsToAdd = Array.from(allRecommendedProducts.values());
    onBulkAddToCart(productsToAdd);

    setAllAdded(true);
    setTimeout(() => {
      setAllAdded(false);
    }, 2500);
  };


  if (!recommendation) {
    return (
        <div className="text-center p-8 bg-white rounded-lg shadow-xl border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">No recommendation available.</h2>
            <p className="text-slate-600">Something might have gone wrong during generation.</p>
            <Button onClick={onReset} variant="primary" size="sm" className="mt-6 gap-2">
              <RefreshCw className="w-4 h-4"/>
              Start Over
            </Button>
        </div>
    )
  }

  const ProductCard = ({ product, isPrimary = false, usage }: { product: RoutineStep | AlternativeProduct, isPrimary?: boolean, usage: UnifiedRoutineStep['usage'] }) => {
    const isAdded = addedProducts.includes(product.productId);
    const [isInfoExpanded, setIsInfoExpanded] = useState(false);
    
    return (
      <div className="bg-white rounded-xl shadow-soft border border-slate-200/80 flex flex-col h-full transition-all duration-300 hover:shadow-lifted hover:-translate-y-1 relative">
        <div className="absolute top-3 left-0 right-0 px-3 z-10 flex justify-between items-center">
            {isPrimary ? (
                <div className="bg-brand-primary text-white text-[10px] leading-tight font-bold px-2 py-1 rounded-full shadow-lg">Recommended</div>
            ) : (
                <div className="bg-orange-500 text-white text-[10px] leading-tight font-bold px-2 py-1 rounded-full shadow-lg">Alternative</div>
            )}

            {usage && (
                 <div className="flex items-center gap-1 rounded-full bg-slate-800/80 p-1 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
                    {usage.includes('AM') && <span title="Morning"><SunIcon className="h-3 w-3 text-amber-300" /></span>}
                    {usage.includes('PM') && <span title="Evening"><MoonIcon className="h-3 w-3 text-indigo-300" /></span>}
                </div>
            )}
        </div>

        {isInfoExpanded && (product as RoutineStep).purpose && (
             <div className="p-3 text-xs bg-blue-50 border-b border-blue-200 text-blue-800 rounded-t-xl animate-fade-in-up">
                <h4 className="font-bold mb-1">Why we chose this:</h4>
                <p>{(product as RoutineStep).purpose}</p>
            </div>
        )}
        
        <div className="p-4 pt-10 bg-slate-50 aspect-square flex items-center justify-center relative">
             <a href={product.productUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                <img src={product.productImageUrl} alt={product.productName} className="w-full h-full object-contain" />
            </a>
        </div>
        <div className="p-4 flex flex-col flex-grow">
            <StarRating rating={4.5} reviews={Math.floor(Math.random() * 200) + 50} />
             <div className="flex items-start gap-2 justify-between">
                <h3 className="font-bold text-sm text-brand-text-main leading-tight flex-grow mb-2">
                    <a href={product.productUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-primary transition-colors">
                        {product.productName}
                    </a>
                </h3>
                {(product as RoutineStep).purpose && (
                    <button 
                        onClick={() => setIsInfoExpanded(prev => !prev)}
                        className="text-slate-400 hover:text-brand-primary flex-shrink-0" 
                        aria-label="Product information"
                    >
                        <InfoIcon />
                    </button>
                )}
            </div>
            
            <div className="mt-auto">
                <div className="mt-2">
                    <span className="text-base font-extrabold text-brand-text-main">{product.price}</span>
                    {product.originalPrice && product.originalPrice !== product.price && (
                        <span className="text-sm text-brand-text-muted line-through ml-2">{product.originalPrice}</span>
                    )}
                </div>
                 <Button 
                    onClick={() => handleAddToCartClick(product)}
                    variant={'ghost'}
                    size="sm"
                    className={`w-full mt-3 gap-2 !font-bold ${isAdded ? '!bg-brand-primary !text-white !border-brand-primary' : '!bg-blue-50 !text-brand-primary border-2 border-blue-200 hover:!bg-blue-100 hover:!border-blue-300'}`}
                >
                    {isAdded ? <CheckIcon className="w-5 h-5"/> : null}
                    {isAdded ? 'ADDED' : 'ADD'}
                </Button>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in-up h-full flex flex-col w-full pb-4">
      <div id="report-content-wrapper" className="flex-grow overflow-y-auto">
          <div id="report-content" className="space-y-12">
              <div className="text-center">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{routineTitle}</h1>
                  <p className="text-brand-text-muted mt-2 text-base">Your personalized skincare routine.</p>
              </div>

              <div className="py-8">
                  <div className="space-y-12">
                      {uniqueStepTypes.map((stepType) => {
                          const stepsForType = unifiedRoutineSteps.filter(s => s.stepType === stepType);
                          return (
                              <div key={stepType}>
                                  {stepsForType.map((step, index) => {
                                      const allProducts = [step, ...step.alternatives];
                                      const groupedProducts = groupProductsByIngredients(allProducts);
                                      
                                      const sortedGroups = Array.from(groupedProducts.entries()).sort(([keyA, productsA], [keyB, productsB]) => {
                                        const aHasPrimary = productsA.some(p => p.productId === step.productId);
                                        const bHasPrimary = productsB.some(p => p.productId === step.productId);
                                      
                                        if (aHasPrimary && !bHasPrimary) {
                                          return -1;
                                        }
                                        if (!aHasPrimary && bHasPrimary) {
                                          return 1;
                                        }
                                        return keyA.localeCompare(keyB);
                                      });
                                      
                                      return (
                                          <div key={`step-${stepType}-${index}`}>
                                              {sortedGroups.map(([ingredientGroup, products], groupIndex) => {
                                                  const groupKey = `${stepType}-${groupIndex}`;
                                                  const isExpanded = !!expandedGroups[groupKey];
                                                  const showSeeAllButton = products.length > 2;
                                                  
                                                  const sortedProducts = [...products].sort((a, b) => {
                                                      if (a.productId === step.productId) return -1;
                                                      if (b.productId === step.productId) return 1;
                                                      return 0;
                                                  });

                                                  return (
                                                      <div key={ingredientGroup} className="mb-8 last:mb-0">
                                                          <div className={`flex justify-between items-center pb-2 border-b-2 border-slate-200 ${groupIndex > 0 ? 'mt-8' : ''}`}>
                                                              <h3 className="text-lg sm:text-xl font-bold text-slate-700">
                                                                  {groupIndex === 0
                                                                    ? step.stepType
                                                                    : (ingredientGroup && ingredientGroup !== 'General Skincare'
                                                                        ? ingredientGroup
                                                                        : step.stepType)}
                                                              </h3>
                                                              {showSeeAllButton && (
                                                                  <button 
                                                                      onClick={() => handleToggleExpand(groupKey)}
                                                                      className="text-sm font-semibold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1 lg:hidden"
                                                                      aria-expanded={isExpanded}
                                                                  >
                                                                      {isExpanded ? 'See Less' : 'See All'}
                                                                      <ArrowRightIcon className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                                                  </button>
                                                              )}
                                                          </div>

                                                          <div className={`
                                                              mt-4
                                                              lg:grid lg:grid-cols-5 lg:gap-4 lg:pb-0
                                                              ${isExpanded ? 
                                                                  'grid grid-cols-2 gap-3 sm:gap-4' : 
                                                                  'flex overflow-x-auto gap-3 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
                                                              }
                                                          `}>
                                                              {sortedProducts.map(product => {
                                                                  const isPrimary = product.productId === step.productId;
                                                                  return (
                                                                      <div key={product.productId} className={`
                                                                          snap-start
                                                                          lg:w-auto lg:flex-shrink
                                                                          ${isExpanded ? 'w-full' : 'w-[48%] sm:w-[31%] flex-shrink-0'}
                                                                      `}>
                                                                          <ProductCard product={product} isPrimary={isPrimary} usage={step.usage} />
                                                                      </div>
                                                                  );
                                                              })}
                                                          </div>
                                                      </div>
                                                  )
                                              })}
                                          </div>
                                      )
                                  })}
                              </div>
                          )
                      })}
                  </div>
              </div>
          </div>
      </div>
      
      <div className="flex-shrink-0 flex justify-center items-center flex-wrap gap-2 pt-2 border-t border-slate-200">
        <Button onClick={onBack} variant="secondary" size="sm" className="gap-2">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Goals
        </Button>
        <Button onClick={onReset} variant="secondary" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4"/>
          Start Over
        </Button>
        <Button
          onClick={handleAddAllToCart}
          variant="primary"
          size="sm"
          className="gap-2"
          disabled={allAdded}
        >
          {allAdded ? (
            <>
              <CheckIcon className="w-5 h-5" /> All Added!
            </>
          ) : (
            <>
              <ShoppingCartIcon className="w-5 h-5" /> Add All to Cart
            </>
          )}
        </Button>
        <Button onClick={onNext} variant="primary" size="sm" className="gap-2">
            Next: AI Doctor's Report
            <ArrowRightIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Report;