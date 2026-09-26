import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { NotificationProvider } from './context/NotificationContext';

import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';

// Screens
import { HomeScreen } from './screens/HomeScreen';
import { AllProductsScreen } from './screens/AllProductsScreen';
import { ProductDetailsScreen } from './screens/ProductDetailsScreen';
import { SearchScreen } from './screens/SearchScreen';
import { BudgetFinderScreen } from './screens/BudgetFinderScreen';
import { OffersScreen } from './screens/OffersScreen';
import { CartScreen } from './screens/CartScreen';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { OrderConfirmationScreen } from './screens/OrderConfirmationScreen';
import { WishlistScreen } from './screens/WishlistScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
import { MyAccountScreen } from './screens/MyAccountScreen';
import { MyOrdersScreen } from './screens/MyOrdersScreen';
import { OrderDetailsScreen } from './screens/OrderDetailsScreen';
import { SavedAddressesScreen } from './screens/SavedAddressesScreen';
import { ProfileSettingsScreen } from './screens/ProfileSettingsScreen';
import { ChangePasswordScreen } from './screens/ChangePasswordScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { AboutUsScreen } from './screens/AboutUsScreen';
import { ContactUsScreen } from './screens/ContactUsScreen';
import { LegalScreen } from './screens/LegalScreen';
import { AdminScreen } from './screens/AdminScreen';

function AppContent() {
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [routeParam, setRouteParam] = useState<string | undefined>(undefined);

  // Parse location hash or path on mount
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash) {
        const parts = hash.split('/');
        setCurrentRoute(parts[0] || 'home');
        setRouteParam(parts[1] || undefined);
      } else {
        const path = window.location.pathname.replace(/^\//, '');
        if (path) {
          const parts = path.split('/');
          setCurrentRoute(parts[0] || 'home');
          setRouteParam(parts[1] || undefined);
        } else {
          setCurrentRoute('home');
          setRouteParam(undefined);
        }
      }
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Universal navigation handler
  const handleNavigate = useCallback((route: string, param?: string) => {
    setCurrentRoute(route);
    setRouteParam(param);

    // Update hash for deep link and history support
    const newHash = param ? `#${route}/${encodeURIComponent(param)}` : `#${route}`;
    if (window.location.hash !== newHash) {
      window.history.pushState(null, '', newHash);
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Render current view
  const renderScreen = () => {
    switch (currentRoute) {
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} />;

      case 'all-products':
      case 'products':
        return <AllProductsScreen onNavigate={handleNavigate} />;

      case 'product-details':
      case 'product':
        return (
          <ProductDetailsScreen
            productIdOrSlug={routeParam || 'iphone-16-pro-max'}
            onNavigate={handleNavigate}
          />
        );

      case 'search':
        return <SearchScreen initialQuery={routeParam} onNavigate={handleNavigate} />;

      case 'budget-finder':
        return <BudgetFinderScreen onNavigate={handleNavigate} />;

      case 'offers':
      case 'discounts':
        return <OffersScreen onNavigate={handleNavigate} />;

      case 'cart':
        return <CartScreen onNavigate={handleNavigate} />;

      case 'checkout':
        return (
          <CheckoutScreen
            onNavigate={handleNavigate}
            onOrderPlaced={(orderId) => handleNavigate('order-confirmation', orderId)}
          />
        );

      case 'order-confirmation':
        return (
          <OrderConfirmationScreen
            orderId={routeParam || ''}
            onNavigate={handleNavigate}
          />
        );

      case 'wishlist':
        return <WishlistScreen onNavigate={handleNavigate} />;

      case 'login':
        return <LoginScreen onNavigate={handleNavigate} />;

      case 'register':
        return <RegisterScreen onNavigate={handleNavigate} />;

      case 'forgot-password':
        return <ForgotPasswordScreen onNavigate={handleNavigate} />;

      case 'my-account':
        return <MyAccountScreen onNavigate={handleNavigate} />;

      case 'my-orders':
        return <MyOrdersScreen onNavigate={handleNavigate} />;

      case 'order-details':
        return (
          <OrderDetailsScreen
            orderId={routeParam || ''}
            onNavigate={handleNavigate}
          />
        );

      case 'saved-addresses':
        return <SavedAddressesScreen onNavigate={handleNavigate} />;

      case 'profile-settings':
        return <ProfileSettingsScreen onNavigate={handleNavigate} />;

      case 'change-password':
        return <ChangePasswordScreen onNavigate={handleNavigate} />;

      case 'notifications':
        return <NotificationsScreen onNavigate={handleNavigate} />;

      case 'about':
      case 'about-us':
        return <AboutUsScreen onNavigate={handleNavigate} />;

      case 'help':
      case 'help-center':
      case 'help-support':
      case 'support':
      case 'contact':
      case 'contact-us':
        return <ContactUsScreen onNavigate={handleNavigate} initialCategory={routeParam} />;

      case 'terms':
        return <LegalScreen initialTab="terms" onNavigate={handleNavigate} />;

      case 'privacy':
        return <LegalScreen initialTab="privacy" onNavigate={handleNavigate} />;

      case 'cod-policy':
        return <LegalScreen initialTab="cod-policy" onNavigate={handleNavigate} />;

      case 'admin':
        return <AdminScreen />;

      default:
        return <HomeScreen onNavigate={handleNavigate} />;
    }
  };

  const isAdminRoute = currentRoute === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      {!isAdminRoute && (
        <Header currentRoute={currentRoute} onNavigate={handleNavigate} />
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full">{renderScreen()}</main>

      {/* Footer */}
      {!isAdminRoute && <Footer onNavigate={handleNavigate} />}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <NotificationProvider>
              <AppContent />
            </NotificationProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
