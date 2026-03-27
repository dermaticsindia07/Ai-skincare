
import React, { useState, useCallback } from 'react';
import { PastProduct, SkinConditionCategory, SkincareRoutine, ChatMessage, FaceImage, CartItem, RoutineStep, AlternativeProduct } from './types';
import StartPage from './components/StartPage';
import Step1PastProducts from './components/Step1PastProducts';
import Step2FaceAnalysis from './components/Step2FaceAnalysis';
import Step3Goals from './components/Step3Goals';
import DoctorReport from './components/DoctorReport';
import Report from './components/Report';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CartDrawer from './components/CartDrawer';
import ChatbotPage from './components/ChatbotPage';

const App: React.FC = () => {
  const [step, setStep] = useState<number>(1); // 1: StartPage, 2: PastProducts, 3: FaceAnalysis, 4: Goals, 5: Report, 6: DoctorReport, 7: Chatbot
  const [pastProducts, setPastProducts] = useState<PastProduct[]>([]);
  const [faceImages, setFaceImages] = useState<FaceImage[]>([]);
  const [analysisResult, setAnalysisResult] = useState<SkinConditionCategory[] | null>(null);
  const [skincareGoals, setSkincareGoals] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState<SkincareRoutine | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [routineTitle, setRoutineTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNextStep = () => setStep(prev => prev + 1);
  const handlePrevStep = () => setStep(prev => prev - 1);

  const resetState = useCallback(() => {
    faceImages.forEach(image => URL.revokeObjectURL(image.previewUrl));
    setStep(1);
    setPastProducts([]);
    setFaceImages([]);
    setAnalysisResult(null);
    setSkincareGoals([]);
    setRecommendation(null);
    setChatHistory([]);
    setRoutineTitle('');
    setIsLoading(false);
    setCart([]);
    setIsCartOpen(false);
    setIsSidebarOpen(false);
  }, [faceImages]);

  const handleAddToCart = (product: RoutineStep | AlternativeProduct) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.productId);
      if (existingItem) {
        return prevCart.map(item =>
          item.productId === product.productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const handleBulkAddToCart = (products: (RoutineStep | AlternativeProduct)[]) => {
    setCart(prevCart => {
      const newCart = [...prevCart];
      const cartMap: Map<string, CartItem> = new Map(newCart.map(item => [item.productId, item]));

      products.forEach(productToAdd => {
        const existingItem = cartMap.get(productToAdd.productId);
        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          const newItem: CartItem = { ...productToAdd, quantity: 1 };
          newCart.push(newItem);
          cartMap.set(newItem.productId, newItem);
        }
      });
      
      return newCart;
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };
  
  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <StartPage onNext={handleNextStep} />
        );
      case 2:
        return (
          <Step1PastProducts
            onNext={handleNextStep}
            pastProducts={pastProducts}
            setPastProducts={setPastProducts}
          />
        );
      case 3:
        return (
          <Step2FaceAnalysis
            onNext={handleNextStep}
            onBack={handlePrevStep}
            faceImages={faceImages}
            setFaceImages={setFaceImages}
            analysisResult={analysisResult}
            setAnalysisResult={setAnalysisResult}
            setIsLoading={setIsLoading}
            isLoading={isLoading}
          />
        );
      case 4:
        return (
          <Step3Goals
            onBack={handlePrevStep}
            analysisResult={analysisResult}
            setSkincareGoals={setSkincareGoals}
            skincareGoals={skincareGoals}
            pastProducts={pastProducts}
            setRecommendation={setRecommendation}
            setRoutineTitle={setRoutineTitle}
            setStep={setStep}
            setIsLoading={setIsLoading}
            isLoading={isLoading}
          />
        );
      case 5:
        return (
          <Report
            recommendation={recommendation}
            routineTitle={routineTitle}
            onReset={resetState}
            onBack={handlePrevStep}
            onNext={handleNextStep}
            faceImages={faceImages}
            analysisResult={analysisResult}
            skincareGoals={skincareGoals}
            onAddToCart={handleAddToCart}
            onBulkAddToCart={handleBulkAddToCart}
          />
        );
      case 6:
        return (
          <DoctorReport
            recommendation={recommendation}
            routineTitle={routineTitle}
            onReset={resetState}
            onBack={handlePrevStep}
            onNext={handleNextStep}
            faceImages={faceImages}
            analysisResult={analysisResult}
            skincareGoals={skincareGoals}
          />
        );
      case 7:
        return (
            <ChatbotPage
                analysisResult={analysisResult}
                skincareGoals={skincareGoals}
                recommendation={recommendation}
                chatHistory={chatHistory}
                setChatHistory={setChatHistory}
                onBack={handlePrevStep}
                onReset={resetState}
            />
        );
      default:
        return <p>Invalid Step</p>;
    }
  };

  const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);

  // Only lock scroll (overflow-hidden) if not on step 4 (Report) or 5 (DoctorReport)
  const isScrollableStep = step === 4 || step === 5;
  return (
    <div className={`w-full h-screen lg:grid lg:grid-cols-[350px,1fr] bg-brand-bg overflow-hidden lg:overflow-auto`}> 
       {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}
      <Sidebar 
        currentStep={step} 
        onReset={resetState} 
        onCartClick={() => setIsCartOpen(true)} 
        cartItemCount={totalCartItems}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="w-full h-full flex flex-col">
        <Header 
            onReset={resetState} 
            onCartClick={() => setIsCartOpen(true)} 
            cartItemCount={totalCartItems} 
            onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="flex-1 px-1 sm:px-2 pt-1 sm:pt-2 pb-16 sm:pb-20 min-h-0">
            <div className="bg-brand-surface rounded-2xl shadow-lifted p-2 sm:p-4 h-full flex flex-col border-t-4 border-brand-primary">
              {renderStep()}
            </div>
        </main>
      </div>
       <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onRemove={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
      />
    </div>
  );
};

export default App;
