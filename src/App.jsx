import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@material-tailwind/react";
import { Navbar } from "@/widgets/layout";
import routes from "@/routes";
import Home from "@/pages/Home.jsx";
import PreorderPage from "@/pages/PreorderPage.jsx";

import QRScanner from "@/components/QRScanner.jsx";
import { CafeList } from "@/pages/CafeList.jsx";
import { SlotBooking } from "@/pages/SlotBooking.jsx";
import { SignIn } from '@/pages/SignIn.jsx';
import { SignUp } from '@/pages/SignUp.jsx';
import { Profile } from '@/pages/Profile.jsx';
import PreorderModal from "@/pages/PreorderModal.jsx";
import Cart from "@/pages/Cart.jsx";
import { ChatBot } from '@/components/ChatBot.jsx';
import { AdminLogin } from "@/pages/AdminLogin.jsx";
import { AdminPortal } from "@/pages/AdminPortal.jsx";
import { MenuManagement } from "@/pages/admin/MenuManagement.jsx";
import { ProtectedRoute } from "@/components/ProtectedRoute.jsx";
import CafeManagement from "@/pages/admin/CafeManagement.jsx";
import OrderManagement from "@/pages/admin/OrderManagement.jsx";
function App() {
  return (
    <>
      <ThemeProvider>
        <div className="container absolute left-2/4 z-10 mx-auto -translate-x-2/4 p-4">
          <Navbar routes={routes} />
        </div>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/qr-scanner" element={<QRScanner />} />
          <Route path="/preorderpage" element={<PreorderPage />} />
          <Route path="/preorderModal" element={<PreorderModal />} />
          <Route path="/cafes" element={<CafeList />} />
          <Route path="/book-slot/:cafeId" element={<SlotBooking />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/preorder/:restaurantId" element={<PreorderPage />} />
          <Route path="/preorderpage/:restaurantId" element={<PreorderPage />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-portal" element={<AdminPortal />} />
          <Route path="/admin/menu" element={<MenuManagement />} />
          <Route path="/admin/cafes" element={<CafeManagement />} />
          <Route path="/admin/orders" element={<OrderManagement />} />
          <Route path="/admin/orders/:filter" element={<OrderManagement />} />

          {/* Add a catch-all route for 404 */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
        <ChatBot />
      </ThemeProvider>
    </>
  );
}

export default App;