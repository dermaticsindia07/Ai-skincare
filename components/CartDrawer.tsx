import React from 'react';
import { CartItem } from '../types';
import { X, Plus, MinusIcon, TrashIcon, ShoppingCartIcon } from './Icons';
import Button from './common/Button';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemove: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onRemove,
  onUpdateQuantity,
}) => {

  // Generate Shopify checkout link that pre-populates the cart
  const checkoutUrl = React.useMemo(() => {
    if (cartItems.length === 0) {
      return 'https://dermatics.in/cart'; // Default link if cart is empty
    }
    const itemsString = cartItems
      .map(item => `${item.variantId}:${item.quantity}`)
      .join(',');
    return `https://dermatics.in/cart/${itemsString}`;
  }, [cartItems]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-slate-50 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        <div className="flex flex-col h-full">
          <header className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
            <h2 id="cart-title" className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCartIcon className="w-6 h-6 text-blue-600"/>
                Shopping Cart
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="!p-2 !rounded-full">
              <X className="w-6 h-6" />
            </Button>
          </header>

          {cartItems.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
                <ShoppingCartIcon className="w-16 h-16 text-slate-300 mb-4"/>
                <h3 className="text-xl font-semibold text-slate-700">Your cart is empty</h3>
                <p className="text-slate-500 mt-1">Add products from your report to get started.</p>
            </div>
          ) : (
            <>
              <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {cartItems.map(item => (
                  <div key={item.productId} className="flex items-start gap-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <img
                      src={item.productImageUrl}
                      alt={item.productName}
                      className="w-20 h-20 object-contain rounded-md bg-white p-1 border border-slate-200 flex-shrink-0"
                    />
                    <div className="flex-grow min-w-0">
                      <p className="font-semibold text-slate-800 leading-tight line-clamp-2">
                        {item.productName}
                      </p>
                       <div className="flex items-baseline gap-2 mt-1">
                          <p className="text-sm font-bold text-slate-800">{item.price}</p>
                          {item.originalPrice && item.originalPrice !== item.price && (
                              <p className="text-xs text-slate-400 line-through">{item.originalPrice}</p>
                          )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                          className="!p-1.5 !rounded-md"
                          aria-label={`Decrease quantity of ${item.productName}`}
                        >
                          <MinusIcon className="w-4 h-4" />
                        </Button>
                        <span className="font-bold text-lg text-slate-800 w-8 text-center" aria-live="polite">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                          className="!p-1.5 !rounded-md"
                          aria-label={`Increase quantity of ${item.productName}`}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                     <div className="flex flex-col items-end justify-between self-stretch flex-shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemove(item.productId)}
                            className="!p-1 !rounded-full text-slate-400 hover:text-red-500 hover:bg-red-100"
                            aria-label={`Remove ${item.productName} from cart`}
                            >
                            <TrashIcon className="w-5 h-5" />
                        </Button>
                    </div>
                  </div>
                ))}
              </div>

              <footer className="p-4 border-t border-slate-200 bg-white space-y-4">
                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <p className="text-sm text-blue-700">This will take you to the Dermatics.in website with all your selected items ready for checkout.</p>
                </div>
                <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button size="sm" variant="primary" className="w-full">
                        Proceed to Checkout
                    </Button>
                </a>
              </footer>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;